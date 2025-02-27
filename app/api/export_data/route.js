import ExcelJS from "exceljs";
import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();

    // Recupera tutte le collaborazioni (puoi applicare eventuali filtri)
    const collaborazioni = await Collaborazione.find({});

    // Ordina le collaborazioni in ordine alfabetico per nome del collaboratore
    collaborazioni.sort((a, b) => {
      const nameA = `${a.collaboratoreNome} ${a.collaboratoreCognome}`.toLowerCase();
      const nameB = `${b.collaboratoreNome} ${b.collaboratoreCognome}`.toLowerCase();
      return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    });

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

    // Aggiungi la riga del titolo e unisci le celle (supponiamo 7 colonne)
    const titleRow = worksheet.addRow([monthYearTitle]);
    worksheet.mergeCells(`A${titleRow.number}:G${titleRow.number}`);
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { horizontal: "center" };

    // Riga vuota per separare il titolo dalla tabella
    worksheet.addRow([]);

    // Aggiungi la riga di intestazione
    const headerRow = worksheet.addRow([
      "Collaboratore",
      "Cliente",
      "Appuntamenti Totali",
      "Appuntamenti Fatti",
      "Post IG",
      "Post TikTok",
      "Post LinkedIn",
    ]);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center" };

    // Imposta la larghezza delle colonne
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 15;

    // Aggiungi una riga per ogni collaborazione ordinata
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

      worksheet.addRow([
        collaboratore,
        cliente,
        appuntamentiTotali,
        appuntamentiFatti,
        postIG,
        postTikTok,
        postLinkedIn,
      ]);
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
    return new NextResponse(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
