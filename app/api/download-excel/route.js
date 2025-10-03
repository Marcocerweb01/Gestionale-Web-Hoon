import ExcelJS from "exceljs";
import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";
import Nota from "@/models/Note";
import { Collaboratore } from "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("🚀 === INIZIO DOWNLOAD EXCEL ===");
  
  try {
    console.log("🔌 Connessione al database...");
    await connectToDB();
    console.log("✅ Connesso al database");

    // Recupera tutte le collaborazioni con i dati popolati
    console.log("📊 Recupero collaborazioni...");
    const collaborazioni = await Collaborazione.find({})
      .populate({
        path: 'collaboratore',
        select: 'nome cognome email status'
      })
      .populate({
        path: 'azienda', 
        select: 'ragioneSociale'
      })
      .lean();

    console.log(`📈 Trovate ${collaborazioni.length} collaborazioni`);

    // Conta gli appuntamenti fatti per ogni collaborazione (nel mese precedente)
    console.log("📅 Conteggio appuntamenti fatti...");
    const today = new Date();
    
    // Calcola il mese precedente
    let previousMonth = today.getMonth() - 1;
    let previousYear = today.getFullYear();
    
    if (previousMonth < 0) {
      previousMonth = 11; // Dicembre
      previousYear = previousYear - 1;
    }
    
    const firstDayOfPreviousMonth = new Date(previousYear, previousMonth, 1);
    const lastDayOfPreviousMonth = new Date(previousYear, previousMonth + 1, 0); // Ultimo giorno del mese precedente
    
    console.log(`📅 Periodo conteggio: dal ${firstDayOfPreviousMonth.toLocaleDateString()} al ${lastDayOfPreviousMonth.toLocaleDateString()}`);
    
    const appuntamentiFattiMap = new Map();
    
    for (const collab of collaborazioni) {
      try {
        const count = await Nota.countDocuments({ 
          collaborazione: collab._id, 
          tipo: "appuntamento", 
          data_appuntamento: {
            $gte: firstDayOfPreviousMonth,
            $lte: lastDayOfPreviousMonth
          }  
        });
        appuntamentiFattiMap.set(collab._id.toString(), count);
        if (count > 0) {
          console.log(`📊 Collaborazione ${collab.aziendaRagioneSociale}: ${count} appuntamenti fatti`);
        }
      } catch (error) {
        console.error(`Errore conteggio appuntamenti per collaborazione ${collab._id}:`, error);
        appuntamentiFattiMap.set(collab._id.toString(), 0);
      }
    }
    
    console.log(`📊 Appuntamenti fatti calcolati per ${appuntamentiFattiMap.size} collaborazioni`);

    // Creazione del file Excel
    console.log("📝 Creazione file Excel...");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Collaborazioni");

    // Aggiungi il titolo con il mese precedente
    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    
    const previousMonthName = `${monthNames[previousMonth]} ${previousYear}`;
    const titleRow = worksheet.addRow([`Collaborazioni - ${previousMonthName}`]);
    worksheet.mergeCells(`A${titleRow.number}:G${titleRow.number}`);
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { horizontal: "center" };

    // Riga vuota per separare il titolo dalla tabella
    worksheet.addRow([]);

    // Aggiungi la riga di intestazione (ESATTAMENTE come export_data)
    const headerRow = worksheet.addRow([
      "Collaboratore",
      "Cliente", 
      "Appuntamenti Totali",
      "Appuntamenti Fatti",
      "Post IG",
      "Post TikTok", 
      "Post LinkedIn"
    ]);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center" };

    // Imposta le larghezze delle colonne
    worksheet.getColumn(1).width = 30; // Collaboratore
    worksheet.getColumn(2).width = 30; // Cliente
    worksheet.getColumn(3).width = 20; // Appuntamenti Totali
    worksheet.getColumn(4).width = 20; // Appuntamenti Fatti
    worksheet.getColumn(5).width = 15; // Post IG
    worksheet.getColumn(6).width = 15; // Post TikTok
    worksheet.getColumn(7).width = 15; // Post LinkedIn

    // Prepara i dati per Excel
    const rowsData = collaborazioni
      .filter(collab => collab.collaboratore) // Solo collaborazioni con collaboratore
      .map(collab => {
        const appuntamentiFatti = appuntamentiFattiMap.get(collab._id.toString()) || 0;
        
        return {
          collaboratore: `${collab.collaboratore.nome} ${collab.collaboratore.cognome}`,
          cliente: collab.aziendaRagioneSociale || "",
          appuntamentiTotali: collab.numero_appuntamenti || 0,
          appuntamentiFatti: appuntamentiFatti,
          postIG: `${collab.post_ig_fb_fatti || 0}/${collab.post_ig_fb || 0}`,
          postTikTok: `${collab.post_tiktok_fatti || 0}/${collab.post_tiktok || 0}`,
          postLinkedIn: `${collab.post_linkedin_fatti || 0}/${collab.post_linkedin || 0}`
        };
      });

    // Ordina i dati in ordine alfabetico per collaboratore
    rowsData.sort((a, b) => a.collaboratore.localeCompare(b.collaboratore));

    // Aggiungi una riga per ogni collaborazione
    rowsData.forEach((row) => {
      worksheet.addRow([
        row.collaboratore,
        row.cliente,
        row.appuntamentiTotali,
        row.appuntamentiFatti,
        row.postIG,
        row.postTikTok,
        row.postLinkedIn
      ]);
    });

    console.log("💾 Generazione buffer Excel...");
    const buffer = await workbook.xlsx.writeBuffer();
    
    console.log("✅ File Excel generato con successo");

    // Crea la risposta con il file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="collaborazioni_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error("💥 === ERRORE CRITICO DOWNLOAD ===");
    console.error("Errore durante la generazione del file Excel:", error);
    console.error("Stack trace:", error.stack);
    
    return NextResponse.json(
      { 
        message: "Errore interno al server", 
        error: error.message,
        details: error.stack
      }, 
      { status: 500 }
    );
  }
}