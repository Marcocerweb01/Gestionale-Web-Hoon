import ExcelJS from "exceljs";
import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();

    // Recupera tutte le collaborazioni (puoi aggiungere filtri se necessario)
    const collaborazioni = await Collaborazione.find({});

    // Crea un nuovo workbook e worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Collaborazioni");

    // Calcola il titolo con il mese e l'anno corrente in italiano
    const now = new Date();
    const italianMonths = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];
    const monthYearTitle = `${italianMonths[now.getMonth()]} ${now.getFullYear()}`;

    // Aggiungi una riga per il titolo e unisci le celle (supponiamo 7 colonne)
    const titleRow = worksheet.addRow([monthYearTitle]);
    worksheet.mergeCells(`A${titleRow.number}:G${titleRow.number}`);
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { horizontal: "center" };

    // Riga vuota per separare il titolo dalla tabella
    worksheet.addRow([]);

    // Definisci le colonne della tabella
    worksheet.columns = [
      { header: "Collaboratore", key: "collaboratore", width: 30 },
      { header: "Cliente", key: "cliente", width: 30 },
      { header: "Appuntamenti Totali", key: "appuntamentiTotali", width: 20 },
      { header: "Appuntamenti Fatti", key: "appuntamentiFatti", width: 20 },
      { header: "Post IG", key: "postIG", width: 15 },
      { header: "Post TikTok", key: "postTikTok", width: 15 },
      { header: "Post LinkedIn", key: "postLinkedIn", width: 15 },
    ];

    // Per ogni collaborazione, aggiungi una riga
    collaborazioni.forEach((collab) => {
      // Usa i campi snapshot per il collaboratore
      const collaboratore = `${collab.collaboratoreNome} ${collab.collaboratoreCognome}`.trim();
      // Per il cliente usiamo il campo aziendaRagioneSociale
      const cliente = collab.aziendaRagioneSociale || "";
      // Appuntamenti Totali e Fatti: impostiamo fatti a 0 per default
      const appuntamentiTotali = collab.numero_appuntamenti || 0;
      const appuntamentiFatti = 0;
      // Per i post, formattiamo come "fatti / totali"
      const postIG = `${collab.post_ig_fb_fatti || 0} / ${collab.post_ig_fb || 0}`;
      const postTikTok = `${collab.post_tiktok_fatti || 0} / ${collab.post_tiktok || 0}`;
      const postLinkedIn = `${collab.post_linkedin_fatti || 0} / ${collab.post_linkedin || 0}`;

      worksheet.addRow({
        collaboratore,
        cliente,
        appuntamentiTotali,
        appuntamentiFatti,
        postIG,
        postTikTok,
        postLinkedIn,
      });
    });

    // Genera il file Excel in un buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="collaborazioni.xlsx"',
      },
    });
  } catch (error) {
    console.error("Errore durante la generazione del file Excel:", error);
    return new NextResponse(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}
