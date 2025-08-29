import ExcelJS from "exceljs";
import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";
import Nota from "@/models/Note";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();

    // Recupera tutte le collaborazioni
    const collaborazioni = await Collaborazione.find({});

    // *** NUOVA LOGICA PER IL CALCOLO DEL MESE PRECEDENTE ***
    const now = new Date();
    
    // Calcola il mese precedente in modo semplice e affidabile
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth() - 1; // getMonth() restituisce 0-11
    
    // Se siamo a gennaio, dobbiamo andare a dicembre dell'anno precedente
    if (targetMonth < 0) {
      targetMonth = 11; // Dicembre
      targetYear = targetYear - 1;
    }
    
    // Crea le date di inizio e fine mese usando il fuso orario locale
    const firstDayOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    
    // Nome del mese in italiano
    const italianMonths = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];
    
    const monthYearTitle = `${italianMonths[targetMonth]} ${targetYear}`;
  

    // Prepara i dati da inserire: per ogni collaborazione, contiamo le note di tipo "appuntamento"
    const rowsData = await Promise.all(
      collaborazioni.map(async (collab) => {
       
        // *** QUERY MIGLIORATA PER GLI APPUNTAMENTI ***
        // Conta le note di tipo "appuntamento" per la collaborazione nel mese target
        const appuntamentiFatti = await Nota.countDocuments({
          collaborazione: collab._id,
          tipo: "appuntamento",
          data_appuntamento: { 
            $gte: firstDayOfMonth, 
            $lte: lastDayOfMonth 
          }
        });

        // Per i post formattiamo come "fatti / totali"
        const postIG = `${collab.post_ig_fb_fatti || 0} / ${collab.post_ig_fb || 0}`;
        const postTikTok = `${collab.post_tiktok_fatti || 0} / ${collab.post_tiktok || 0}`;
        const postLinkedIn = `${collab.post_linkedin_fatti || 0} / ${collab.post_linkedin || 0}`;

        // Costruisci l'oggetto da inserire come riga
        return {
          collaboratore: `${collab.collaboratoreNome} ${collab.collaboratoreCognome}`.trim(),
          cliente: collab.aziendaRagioneSociale || "",
          appuntamentiTotali: collab.numero_appuntamenti || 0,
          appuntamentiFatti,
          postIG,
          postTikTok,
          postLinkedIn,
        };
      })
    );

    // Ordina i dati in ordine alfabetico per collaboratore
    rowsData.sort((a, b) => a.collaboratore.localeCompare(b.collaboratore));

    // Crea un nuovo workbook e worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Collaborazioni");

    // Aggiungi il titolo con il mese e l'anno in alto
    const titleRow = worksheet.addRow([monthYearTitle]);
    // Supponiamo di avere 7 colonne: unisci celle da A a G
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

    // Imposta le larghezze delle colonne
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 15;

    // Aggiungi una riga per ogni collaborazione
    rowsData.forEach((row) => {
      worksheet.addRow([
        row.collaboratore,
        row.cliente,
        row.appuntamentiTotali,
        row.appuntamentiFatti,
        row.postIG,
        row.postTikTok,
        row.postLinkedIn,
      ]);
    });

    // *** LOGGING MIGLIORATO PER DEBUG ***
    console.log("=== EXPORT DATA DEBUG ===");
    console.log("Data corrente:", now.toISOString());
    console.log("Data corrente (locale):", now.toLocaleDateString('it-IT'), now.toLocaleTimeString('it-IT'));
    console.log("Target Year:", targetYear);
    console.log("Target Month (0-11):", targetMonth);
    console.log("Mese target:", monthYearTitle);
    console.log("Primo giorno del mese:", firstDayOfMonth.toISOString());
    console.log("Primo giorno (locale):", firstDayOfMonth.toLocaleDateString('it-IT'), firstDayOfMonth.toLocaleTimeString('it-IT'));
    console.log("Ultimo giorno del mese:", lastDayOfMonth.toISOString());
    console.log("Ultimo giorno (locale):", lastDayOfMonth.toLocaleDateString('it-IT'), lastDayOfMonth.toLocaleTimeString('it-IT'));
    console.log("Numero collaborazioni trovate:", collaborazioni.length);
    console.log("========================");

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
