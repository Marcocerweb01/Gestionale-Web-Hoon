import { connectToDB } from "@/utils/database";
import Nota from "@/models/Note";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();
    
    // *** STESSA LOGICA DELL'EXPORT PER TEST ***
    const now = new Date();
    
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth() - 1;
    
    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear = targetYear - 1;
    }
    
    const firstDayOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    
    const italianMonths = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];
    
    const monthYearTitle = `${italianMonths[targetMonth]} ${targetYear}`;

    // Conta tutti gli appuntamenti nel periodo
    const appuntamentiCount = await Nota.countDocuments({
      tipo: "appuntamento",
      data_appuntamento: { 
        $gte: firstDayOfMonth, 
        $lte: lastDayOfMonth 
      }
    });

    // Prendi alcuni esempi di appuntamenti per controllo
    const sampleAppuntamenti = await Nota.find({
      tipo: "appuntamento",
      data_appuntamento: { 
        $gte: firstDayOfMonth, 
        $lte: lastDayOfMonth 
      }
    }).limit(5).select('data_appuntamento nota collaborazione');

    return NextResponse.json({
      success: true,
      debug: {
        dataCorrente: {
          iso: now.toISOString(),
          locale: now.toLocaleDateString('it-IT') + ' ' + now.toLocaleTimeString('it-IT')
        },
        meseTarget: {
          anno: targetYear,
          meseNumero: targetMonth,
          meseNome: monthYearTitle
        },
        periodo: {
          inizio: {
            iso: firstDayOfMonth.toISOString(),
            locale: firstDayOfMonth.toLocaleDateString('it-IT') + ' ' + firstDayOfMonth.toLocaleTimeString('it-IT')
          },
          fine: {
            iso: lastDayOfMonth.toISOString(),
            locale: lastDayOfMonth.toLocaleDateString('it-IT') + ' ' + lastDayOfMonth.toLocaleTimeString('it-IT')
          }
        },
        risultati: {
          totalAppuntamentiTrovati: appuntamentiCount,
          esempiAppuntamenti: sampleAppuntamenti.map(app => ({
            data: {
              iso: app.data_appuntamento.toISOString(),
              locale: app.data_appuntamento.toLocaleDateString('it-IT') + ' ' + app.data_appuntamento.toLocaleTimeString('it-IT')
            },
            nota: app.nota.substring(0, 50) + (app.nota.length > 50 ? '...' : ''),
            collaborazione: app.collaborazione
          }))
        }
      }
    });

  } catch (error) {
    console.error("Errore nel test export:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
