import { connectToDB } from "@/utils/database";
import Nota from "@/models/Note";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🔍 === TEST APPUNTAMENTI ===");
    
    await connectToDB();
    console.log("✅ Database connesso");

    // Test: conta tutte le note
    const tutteLeNote = await Nota.countDocuments({});
    console.log(`📊 Totale note nel database: ${tutteLeNote}`);

    // Test: conta note di tipo appuntamento
    const noteAppuntamento = await Nota.countDocuments({ tipo: "appuntamento" });
    console.log(`📅 Note di tipo 'appuntamento': ${noteAppuntamento}`);

    // Test: mostra alcuni esempi di note appuntamento
    const esempiNote = await Nota.find({ tipo: "appuntamento" })
      .limit(5)
      .lean();
    
    console.log("📋 Esempi di note appuntamento:");
    esempiNote.forEach((nota, index) => {
      console.log(`${index + 1}. Collaborazione: ${nota.collaborazione}, Data: ${nota.data_appuntamento}, Nota: ${nota.nota.substring(0, 50)}...`);
    });

    // Test: periodo mese precedente
    const today = new Date();
    
    // Calcola il mese precedente
    let previousMonth = today.getMonth() - 1;
    let previousYear = today.getFullYear();
    
    if (previousMonth < 0) {
      previousMonth = 11; // Dicembre
      previousYear = previousYear - 1;
    }
    
    const firstDayOfPreviousMonth = new Date(previousYear, previousMonth, 1);
    const lastDayOfPreviousMonth = new Date(previousYear, previousMonth + 1, 0);
    
    console.log(`📅 Periodo test mese precedente: dal ${firstDayOfPreviousMonth.toLocaleDateString()} al ${lastDayOfPreviousMonth.toLocaleDateString()}`);
    
    const noteNelMesePrecedente = await Nota.countDocuments({ 
      tipo: "appuntamento",
      data_appuntamento: {
        $gte: firstDayOfPreviousMonth,
        $lte: lastDayOfPreviousMonth
      }
    });
    
    console.log(`📊 Note appuntamento nel mese precedente: ${noteNelMesePrecedente}`);

    // Test: raggruppa per collaborazione (mese precedente)
    const pipelinePrecedente = [
      {
        $match: {
          tipo: "appuntamento",
          data_appuntamento: {
            $gte: firstDayOfPreviousMonth,
            $lte: lastDayOfPreviousMonth
          }
        }
      },
      {
        $group: {
          _id: "$collaborazione",
          count: { $sum: 1 }
        }
      }
    ];

    const raggruppamentoPrecedente = await Nota.aggregate(pipelinePrecedente);
    console.log("📊 Appuntamenti per collaborazione (mese precedente):");
    raggruppamentoPrecedente.forEach(item => {
      console.log(`   Collaborazione ${item._id}: ${item.count} appuntamenti`);
    });

    return NextResponse.json({
      totaleNote: tutteLeNote,
      noteAppuntamento: noteAppuntamento,
      noteNelMesePrecedente: noteNelMesePrecedente,
      raggruppamentoPrecedente: raggruppamentoPrecedente,
      esempi: esempiNote,
      message: "Test completato"
    });

  } catch (error) {
    console.error("❌ Errore test:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}