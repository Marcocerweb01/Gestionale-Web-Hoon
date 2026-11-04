import ExcelJS from "exceljs";
import Collaborazione from "@/models/Collaborazioni";
import ReportChiusura from "@/models/ReportChiusura";
import { createNotifica } from "@/utils/createNotifica";
import {
  getActiveSocialCollaborationFilter,
  syncSocialCollaborationStatuses,
} from "@/utils/socialCollaborationStatus";

const MONTHS = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

function periodMetadata(tipo, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  if (tipo === "trimestrale") {
    const quarter = Math.floor(month / 3) + 1;
    return {
      periodoKey: `${year}-Q${quarter}`,
      titolo: `Report ${quarter}° trimestre ${year}`,
      periodoInizio: new Date(year, (quarter - 1) * 3, 1),
      periodoFine: new Date(year, quarter * 3, 0, 23, 59, 59, 999),
      fileNome: `report-trimestrale-${year}-Q${quarter}.xlsx`,
    };
  }
  return {
    periodoKey: `${year}-${String(month + 1).padStart(2, "0")}`,
    titolo: `Report mensile ${MONTHS[month]} ${year}`,
    periodoInizio: new Date(year, month, 1),
    periodoFine: new Date(year, month + 1, 0, 23, 59, 59, 999),
    fileNome: `report-mensile-${year}-${String(month + 1).padStart(2, "0")}.xlsx`,
  };
}

function snapshotRow(c) {
  return {
    collaborazioneId: String(c._id),
    collaboratore: `${c.collaboratore?.nome || c.collaboratoreNome || ""} ${c.collaboratore?.cognome || c.collaboratoreCognome || ""}`.trim(),
    cliente: c.azienda?.etichetta || c.aziendaRagioneSociale || "N/A",
    appuntamentiMensili: c.numero_appuntamenti || 0,
    appuntamentiMensiliFatti: c.appuntamenti_fatti || 0,
    instagramMensili: c.post_ig_fb || 0,
    instagramMensiliFatti: c.post_ig_fb_fatti || 0,
    tiktokMensili: c.post_tiktok || 0,
    tiktokMensiliFatti: c.post_tiktok_fatti || 0,
    linkedinMensili: c.post_linkedin || 0,
    linkedinMensiliFatti: c.post_linkedin_fatti || 0,
    instagramTrimTotali: c.instagram_trim_totali || 0,
    instagramTrimFatti: c.instagram_trim_fatti || 0,
    tiktokTrimTotali: c.tiktok_trim_totali || 0,
    tiktokTrimFatti: c.tiktok_trim_fatti || 0,
    linkedinTrimTotali: c.linkedin_trim_totali || 0,
    linkedinTrimFatti: c.linkedin_trim_fatti || 0,
    appuntamentiTrimTotali: c.appuntamenti_trimestrale_totali || 0,
    appuntamentiTrimFatti: c.appuntamenti_trimestrale_fatti || 0,
    postTotaliStorici: c.post_totali || 0,
    appuntamentiTotaliStorici: c.appuntamenti_totali || 0,
    esclusoResetTrimestrale: Boolean(c.escludi_reset_trimestrale),
  };
}

async function buildWorkbook(report, rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Gestionale Hoon";
  const sheet = workbook.addWorksheet(report.titolo.slice(0, 31));
  sheet.columns = [
    ["Collaboratore", "collaboratore", 28], ["Cliente", "cliente", 28],
    ["App mese fatti", "appuntamentiMensiliFatti", 15], ["App mese previsti", "appuntamentiMensili", 17],
    ["IG mese fatti", "instagramMensiliFatti", 14], ["IG mese previsti", "instagramMensili", 16],
    ["TikTok mese fatti", "tiktokMensiliFatti", 18], ["TikTok mese previsti", "tiktokMensili", 20],
    ["LinkedIn mese fatti", "linkedinMensiliFatti", 19], ["LinkedIn mese previsti", "linkedinMensili", 21],
    ["IG trim fatti", "instagramTrimFatti", 14], ["IG trim previsti", "instagramTrimTotali", 16],
    ["TikTok trim fatti", "tiktokTrimFatti", 18], ["TikTok trim previsti", "tiktokTrimTotali", 20],
    ["LinkedIn trim fatti", "linkedinTrimFatti", 19], ["LinkedIn trim previsti", "linkedinTrimTotali", 21],
    ["App trim fatti", "appuntamentiTrimFatti", 15], ["App trim previsti", "appuntamentiTrimTotali", 17],
    ["Post storici", "postTotaliStorici", 14], ["App storici", "appuntamentiTotaliStorici", 14],
    ["Escluso reset trim", "esclusoResetTrimestrale", 18],
  ].map(([header, key, width]) => ({ header, key, width }));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4338CA" } };
  rows.forEach((row) => sheet.addRow(row));
  sheet.autoFilter = { from: "A1", to: "U1" };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function generaReportChiusura(tipo, now = new Date()) {
  const meta = periodMetadata(tipo, now);
  let report = await ReportChiusura.findOne({ tipo, periodoKey: meta.periodoKey });
  if (report?.stato === "da_visionare" || report?.stato === "completato") return { report, created: false };

  report ||= await ReportChiusura.create({ tipo, ...meta, stato: "generazione" });
  await createNotifica({
    tipo: "report_chiusura",
    titolo: `Preparazione ${meta.titolo} iniziata`,
    messaggio: "Il sistema sta creando lo snapshot e il file Excel. Riceverai una seconda notifica appena sarà disponibile.",
    link: "/Report-chiusure",
    refId: `start:${tipo}:${meta.periodoKey}`,
  });

  try {
    await syncSocialCollaborationStatuses(Collaborazione);
    const collabs = await Collaborazione.find(getActiveSocialCollaborationFilter())
      .populate("collaboratore").populate("azienda").lean();
    const rows = collabs.map(snapshotRow).filter((row) => row.collaboratore !== "Hoon Web");
    const fileBuffer = await buildWorkbook(meta, rows);
    report.set({
      ...meta,
      stato: "da_visionare",
      collaborazioniSnapshot: rows,
      numeroCollaborazioni: rows.length,
      fileBuffer,
      generatoAt: new Date(),
      errore: "",
    });
    await report.save();
    await createNotifica({
      tipo: "report_chiusura",
      titolo: `${meta.titolo} pronto`,
      messaggio: `Snapshot completato: ${rows.length} collaborazioni. Il file Excel è allegato ed è disponibile nella Dashboard per la visione e l'approvazione del reset.`,
      link: "/Report-chiusure",
      refId: `ready:${tipo}:${meta.periodoKey}`,
      attachmentSnapshotId: report._id,
      attachmentFilename: meta.fileNome,
    });
    return { report, created: true };
  } catch (error) {
    report.stato = "errore";
    report.errore = error.message;
    await report.save();
    throw error;
  }
}

export function shouldGenerateClosingReports(now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isLastDay = tomorrow.getMonth() !== now.getMonth();
  return { isLastDay, isQuarterEnd: isLastDay && [2, 5, 8, 11].includes(now.getMonth()) };
}
