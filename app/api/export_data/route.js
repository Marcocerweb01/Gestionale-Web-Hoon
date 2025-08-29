import ExcelJS from "exceljs";
import { connectToDB } from "@/utils/database";
import SnapshotCollaborazioni from "@/models/SnapshotCollaborazioni";
import { getCurrentMonth, getPreviousMonth, getSnapshot, markSnapshotAsExported, updateSnapshot, createSnapshotForMonth, getMonthName } from "@/utils/snapshotManager";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectToDB();

    // Ottieni parametri dalla query string
    const { searchParams } = new URL(req.url);
    const manualMonth = searchParams.get('month'); // 0-11
    const manualYear = searchParams.get('year');
    
    let targetMonth;
    
    if (manualMonth !== null && manualYear !== null) {
      // *** MODALITÀ MANUALE: usa mese e anno specificati ***
      const monthNum = parseInt(manualMonth);
      const yearNum = parseInt(manualYear);
      
      targetMonth = {
        mese: monthNum,
        anno: yearNum,
        meseNome: getMonthName(monthNum, yearNum)
      };
      
      console.log(`Export MANUALE per: ${targetMonth.meseNome}`);
    } else {
      // *** MODALITÀ AUTOMATICA: sempre mese corrente se non specificato ***
      const currentMonth = getCurrentMonth();
      targetMonth = currentMonth;
      
      console.log(`Export AUTOMATICO - Mese corrente: ${targetMonth.meseNome}`);
    }
    
    // Prova a recuperare lo snapshot del mese target
    let snapshot = await getSnapshot(targetMonth.mese, targetMonth.anno);
    
    // Se non esiste lo snapshot, crealo
    if (!snapshot) {
      console.log(`Snapshot per ${targetMonth.meseNome} non trovato, creazione in corso...`);
      
      // Per qualsiasi mese, prova a creare lo snapshot
      try {
        snapshot = await createSnapshotForMonth(targetMonth.mese, targetMonth.anno);
      } catch (createError) {
        console.error(`Errore nella creazione dello snapshot: ${createError.message}`);
        // Se fallisce la creazione specifica, prova con updateSnapshot normale se è il mese corrente
        const currentMonth = getCurrentMonth();
        if (targetMonth.mese === currentMonth.mese && targetMonth.anno === currentMonth.anno) {
          console.log("Tentativo con updateSnapshot per il mese corrente...");
          snapshot = await updateSnapshot();
        }
      }
      
      if (!snapshot) {
        console.log(`Impossibile creare snapshot per ${targetMonth.meseNome}`);
        return new NextResponse(`Nessun dato disponibile per ${targetMonth.meseNome}`, { status: 404 });
      }
    }

    console.log(`Snapshot trovato: ${snapshot.collaborazioni_snapshot.length} collaborazioni per ${targetMonth.meseNome}`);

    if (!snapshot.collaborazioni_snapshot || snapshot.collaborazioni_snapshot.length === 0) {
      console.log("Nessuna collaborazione trovata nello snapshot");
      return new NextResponse(`Nessun dato disponibile per ${targetMonth.meseNome}`, { status: 404 });
    }

    // Prepara i dati per Excel dallo snapshot
    const rowsData = snapshot.collaborazioni_snapshot.map(collab => ({
      collaboratore: collab.collaboratore,
      cliente: collab.cliente,
      appuntamentiTotali: collab.appuntamenti_totali,
      appuntamentiFatti: collab.appuntamenti_fatti,
      postIG: collab.post_ig_fb,
      postTikTok: collab.post_tiktok,
      postLinkedIn: collab.post_linkedin,
    }));

    // Ordina i dati in ordine alfabetico per collaboratore
    rowsData.sort((a, b) => a.collaboratore.localeCompare(b.collaboratore));

    // Crea un nuovo workbook e worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Collaborazioni");

    // Aggiungi il titolo con il mese e l'anno in alto
    const titleRow = worksheet.addRow([snapshot.meseNome]);
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
    console.log("=== EXPORT DATA DEBUG (SNAPSHOT) ===");
    console.log("Mese esportato:", snapshot.meseNome);
    console.log("Snapshot ID:", snapshot._id);
    console.log("Data creazione snapshot:", snapshot.data_creazione);
    console.log("Ultimo aggiornamento:", snapshot.data_ultimo_aggiornamento);
    console.log("Numero collaborazioni nello snapshot:", snapshot.collaborazioni_snapshot.length);
    console.log("====================================");

    // Genera il file Excel in un buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // *** MARCA LO SNAPSHOT COME ESPORTATO SOLO PER MESI COMPLETATI ***
    const currentMonth = getCurrentMonth();
    const isCurrentMonth = (targetMonth.mese === currentMonth.mese && targetMonth.anno === currentMonth.anno);
    
    if (!isCurrentMonth) {
      // Solo per mesi passati, marca come esportato
      await markSnapshotAsExported(targetMonth.mese, targetMonth.anno);
      console.log(`Snapshot per ${snapshot.meseNome} marcato come esportato`);
    } else {
      console.log(`Mese corrente (${snapshot.meseNome}) - non marcato come esportato`);
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="collaborazioni_${snapshot.meseNome.replace(' ', '_')}.xlsx"`,
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
