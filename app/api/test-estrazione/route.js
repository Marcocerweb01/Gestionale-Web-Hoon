import { connectToDB } from "@/utils/database";
import NotaComm from "@/models/Note-comm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🔍 === DEBUG ESTRAZIONE AZIENDE INIZIATO ===");
    
    await connectToDB();
    console.log("✅ Connesso al database");

    const count = await NotaComm.countDocuments();
    console.log(`📊 Totale note commerciali: ${count}`);

    if (count === 0) {
      return NextResponse.json({
        message: "Nessuna nota commerciale trovata",
        totale: 0
      });
    }

    // Prendi solo 5 note per test rapido
    const noteTest = await NotaComm.find()
      .limit(5)
      .populate('autoreId', 'nome cognome email');

    console.log(`📋 Analizzando ${noteTest.length} note di test...`);

    const risultati = noteTest.map((nota, index) => {
      console.log(`\n--- Nota ${index + 1} ---`);
      console.log(`Categoria: ${nota.mainCategoria}`);
      console.log(`Nome Azienda originale: "${nota.nomeAzienda || 'N/A'}"`);
      console.log(`Referente: "${nota.referente || 'N/A'}"`);
      console.log(`Nota: "${(nota.nota || '').substring(0, 100)}..."`);
      
      const nomeEstratto = estraiNomeAziendaBase(nota);
      console.log(`🎯 Nome estratto: "${nomeEstratto}"`);
      
      return {
        id: nota._id,
        categoria: nota.mainCategoria,
        nomeAzienda_originale: nota.nomeAzienda || 'N/A',
        referente: nota.referente || 'N/A',
        nota_breve: (nota.nota || '').substring(0, 50) + '...',
        nome_estratto: nomeEstratto,
        data: nota.data
      };
    });

    console.log("🎉 === ANALISI COMPLETATA ===");

    return NextResponse.json({
      totale_note: count,
      note_analizzate: noteTest.length,
      risultati: risultati,
      message: "Test estrazione aziende completato"
    });

  } catch (error) {
    console.error("❌ Errore estrazione:", error);
    return NextResponse.json(
      { 
        error: "Errore estrazione", 
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

// Versione semplificata per test
function estraiNomeAziendaBase(nota) {
  // 1. Campo nomeAzienda
  if (nota.nomeAzienda && nota.nomeAzienda.trim()) {
    return nota.nomeAzienda.trim();
  }

  // 2. Per appuntamenti, cerca nella nota
  if (nota.mainCategoria === 'appuntamento' && nota.nota) {
    const match = /(?:appuntamento|incontro)\s+(?:con|presso)\s+([A-Z][A-Za-z\s&\.\-]{3,30})/i.exec(nota.nota);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // 3. Referente se sembra azienda
  if (nota.referente && nota.referente.includes('srl') || nota.referente.includes('spa')) {
    return nota.referente.trim();
  }

  // 4. Fallback
  return `${nota.mainCategoria}_${nota._id.toString().slice(-4)}`;
}