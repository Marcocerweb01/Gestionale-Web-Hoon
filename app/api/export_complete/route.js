export const dynamic = "force-dynamic";

import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";
import { Collaboratore, Azienda } from "@/models/User";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    console.log("🚀 Inizio export completo (JSON + Excel)...");
    await connectToDB();

    // Recupera tutte le collaborazioni attive con populate
    const collaborazioni = await Collaborazione.find({ stato: "attiva" })
      .populate("collaboratore")
      .populate("azienda")
      .lean();

    // Prepara i dati per export
    const exportData = collaborazioni
      .map(c => ({
        collaboratore: `${c.collaboratore?.nome || c.collaboratoreNome || ''} ${c.collaboratore?.cognome || c.collaboratoreCognome || ''}`.trim(),
        cliente: c.azienda?.etichetta || c.aziendaRagioneSociale || 'N/A',
        appuntamenti_mensili: c.numero_appuntamenti || 0,
        appuntamenti_fatti: c.appuntamenti_fatti || 0,
        post_ig_fb_mensili: c.post_ig_fb || 0,
        post_ig_fb_fatti: c.post_ig_fb_fatti || 0,
        post_tiktok_mensili: c.post_tiktok || 0,
        post_tiktok_fatti: c.post_tiktok_fatti || 0,
        post_linkedin_mensili: c.post_linkedin || 0,
        post_linkedin_fatti: c.post_linkedin_fatti || 0,
        // Nuovi campi TOTALI (che non si azzerano mai)
        post_totali: c.post_totali || 0,
        appuntamenti_totali: c.appuntamenti_totali || 0,
        durata_contratto: c.durata_contratto || '',
        data_inizio_contratto: c.data_inizio_contratto ? new Date(c.data_inizio_contratto).toLocaleDateString('it-IT') : '',
        data_fine_contratto: c.data_fine_contratto ? new Date(c.data_fine_contratto).toLocaleDateString('it-IT') : '',
      }))
      .filter(row => row.collaboratore !== 'Hoon Web'); // Escludi Hoon Web

    // Ordina per collaboratore
    exportData.sort((a, b) => a.collaboratore.localeCompare(b.collaboratore));

    console.log(`✅ Dati preparati: ${exportData.length} collaborazioni attive`);

    // ===== GENERA JSON =====
    const jsonString = JSON.stringify(exportData, null, 2);
    const jsonBuffer = Buffer.from(jsonString, 'utf-8');

    // ===== GENERA EXCEL =====
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Collaborazioni");

    // Titolo
    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    const today = new Date();
    const currentMonthName = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
    const titleRow = worksheet.addRow([`Collaborazioni - ${currentMonthName}`]);
    worksheet.mergeCells(`A${titleRow.number}:G${titleRow.number}`);
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { horizontal: "center" };

    // Riga vuota
    worksheet.addRow([]);

    // Intestazione
    const headerRow = worksheet.addRow([
      "Collaboratore",
      "Cliente", 
      "App. Mensili",
      "App. Fatti",
      "Post IG/FB",
      "Post TikTok", 
      "Post LinkedIn",
      "POST TOTALI",
      "APP. TOTALI",
      "Durata Contratto",
      "Inizio Contratto",
      "Fine Contratto"
    ]);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center" };

    // Larghezza colonne
    worksheet.getColumn(1).width = 30; // Collaboratore
    worksheet.getColumn(2).width = 30; // Cliente
    worksheet.getColumn(3).width = 15; // App. Mensili
    worksheet.getColumn(4).width = 15; // App. Fatti
    worksheet.getColumn(5).width = 15; // Post IG/FB
    worksheet.getColumn(6).width = 15; // Post TikTok
    worksheet.getColumn(7).width = 15; // Post LinkedIn
    worksheet.getColumn(8).width = 15; // POST TOTALI
    worksheet.getColumn(9).width = 15; // APP. TOTALI
    worksheet.getColumn(10).width = 18; // Durata Contratto
    worksheet.getColumn(11).width = 16; // Inizio Contratto
    worksheet.getColumn(12).width = 16; // Fine Contratto

    // Aggiungi righe dati con formattazione condizionale
    let previousCollaboratore = null;
    
    exportData.forEach((row, index) => {
      const excelRow = worksheet.addRow([
        row.collaboratore,
        row.cliente,
        row.appuntamenti_mensili,
        row.appuntamenti_fatti,
        `${row.post_ig_fb_fatti}/${row.post_ig_fb_mensili}`,
        `${row.post_tiktok_fatti}/${row.post_tiktok_mensili}`,
        `${row.post_linkedin_fatti}/${row.post_linkedin_mensili}`,
        row.post_totali,
        row.appuntamenti_totali,
        row.durata_contratto,
        row.data_inizio_contratto,
        row.data_fine_contratto
      ]);

      // Formattazione Appuntamenti Fatti (colonna 4)
      const cellAppuntamenti = excelRow.getCell(4);
      if (row.appuntamenti_fatti >= row.appuntamenti_mensili && row.appuntamenti_mensili > 0) {
        // Verde se completati o superati
        cellAppuntamenti.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF90EE90' } // Verde chiaro
        };
      } else if (row.appuntamenti_fatti > 0) {
        // Arancione se parziali
        cellAppuntamenti.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFA500' } // Arancione
        };
      } else if (row.appuntamenti_mensili > 0) {
        // Rosso se non ne ha fatti nessuno ma dovrebbe
        cellAppuntamenti.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF6B6B' } // Rosso chiaro
        };
      }

      // Formattazione Post IG/FB (colonna 5)
      const cellIGFB = excelRow.getCell(5);
      if (row.post_ig_fb_fatti >= row.post_ig_fb_mensili && row.post_ig_fb_mensili > 0) {
        cellIGFB.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF90EE90' }
        };
      } else if (row.post_ig_fb_fatti > 0) {
        cellIGFB.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFA500' }
        };
      } else if (row.post_ig_fb_mensili > 0) {
        cellIGFB.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF6B6B' }
        };
      }

      // Formattazione Post TikTok (colonna 6)
      const cellTikTok = excelRow.getCell(6);
      if (row.post_tiktok_fatti >= row.post_tiktok_mensili && row.post_tiktok_mensili > 0) {
        cellTikTok.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF90EE90' }
        };
      } else if (row.post_tiktok_fatti > 0) {
        cellTikTok.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFA500' }
        };
      } else if (row.post_tiktok_mensili > 0) {
        cellTikTok.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF6B6B' }
        };
      }

      // Formattazione Post LinkedIn (colonna 7)
      const cellLinkedIn = excelRow.getCell(7);
      if (row.post_linkedin_fatti >= row.post_linkedin_mensili && row.post_linkedin_mensili > 0) {
        cellLinkedIn.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF90EE90' }
        };
      } else if (row.post_linkedin_fatti > 0) {
        cellLinkedIn.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFA500' }
        };
      } else if (row.post_linkedin_mensili > 0) {
        cellLinkedIn.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF6B6B' }
        };
      }

      // Formattazione colonne TOTALI (sfondo viola chiaro)
      const cellPostTotali = excelRow.getCell(8);
      const cellAppTotali = excelRow.getCell(9);
      cellPostTotali.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E0F8' } // Viola chiaro
      };
      cellAppTotali.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E0F8' } // Viola chiaro
      };
      cellPostTotali.font = { bold: true };
      cellAppTotali.font = { bold: true };

      // Aggiungi bordo spesso quando cambia collaboratore
      const nextRow = exportData[index + 1];
      if (nextRow && nextRow.collaboratore !== row.collaboratore) {
        // Bordo inferiore spesso su tutte le celle della riga
        for (let col = 1; col <= 12; col++) {
          excelRow.getCell(col).border = {
            ...excelRow.getCell(col).border,
            bottom: { style: 'thick', color: { argb: 'FF000000' } }
          };
        }
      }
    });

    console.log("💾 Generazione Excel completata");
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // ===== GENERA NOME FILE =====
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;

    // Determina quale file scaricare in base al parametro query
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'excel';

    if (format === 'json') {
      console.log("📦 Download JSON");
      return new NextResponse(jsonBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="collaborazioni_${timestamp}.json"`,
          "Cache-Control": "no-store",
        },
      });
    } else {
      console.log("📦 Download Excel");
      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="collaborazioni_${timestamp}.xlsx"`,
          'Content-Length': excelBuffer.length.toString(),
          "Cache-Control": "no-store",
        }
      });
    }

  } catch (error) {
    console.error("❌ Errore export completo:", error);
    return NextResponse.json(
      { 
        message: "Errore durante l'export", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
