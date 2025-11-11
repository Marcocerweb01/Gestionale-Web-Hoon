import { connectToDB } from "@/utils/database";
import NotaComm from "@/models/Note-comm";
import LeadCommerciale from "@/models/LeadCommerciale";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();

    const marcoFusiId = "68d2a941fe5174631f799ff2";
    console.log(`🔍 === ANALISI NOTE COMMERCIALI MARCO FUSI ===`);

    // Recupera tutte le note di Marco Fusi
    const noteMarcoFusi = await NotaComm.find({ autoreId: marcoFusiId })
      .populate('autoreId', 'nome cognome email')
      .sort({ data: -1 });

    console.log(`📊 Trovate ${noteMarcoFusi.length} note di Marco Fusi`);

    // Dividi per categoria
    const noteContatto = noteMarcoFusi.filter(n => n.mainCategoria === 'contatto');
    const noteAppuntamento = noteMarcoFusi.filter(n => n.mainCategoria === 'appuntamento');

    console.log(`📋 Note contatto: ${noteContatto.length}`);
    console.log(`📅 Note appuntamento: ${noteAppuntamento.length}`);

    // Analisi note contatto (hanno nomeAzienda obbligatorio)
    const analisiContatto = noteContatto.map(nota => ({
      id: nota._id,
      data: nota.data,
      nomeAzienda: nota.nomeAzienda,
      numeroTelefono: nota.numeroTelefono,
      referente: nota.referente,
      indirizzo: nota.indirizzo,
      email: nota.email || 'N/A',
      comeArrivato: nota.comeArrivato,
      tipoContatto: nota.tipoContatto,
      nota: nota.nota.substring(0, 100) + '...'
    }));

    // Analisi note appuntamento (spesso senza nomeAzienda)
    const analisiAppuntamento = noteAppuntamento.map(nota => ({
      id: nota._id,
      data: nota.data,
      data_appuntamento: nota.data_appuntamento,
      luogo_appuntamento: nota.luogo_appuntamento,
      nomeAzienda: nota.nomeAzienda || 'N/A',
      nota: nota.nota.substring(0, 100) + '...',
      nome_estratto_da_nota: estraiNomeDaNota(nota.nota)
    }));

    // Raggruppa note contatto per azienda/telefono
    const aziendeUniche = new Map();

    noteContatto.forEach(nota => {
      const chiave = nota.numeroTelefono || nota.nomeAzienda;
      
      if (!aziendeUniche.has(chiave)) {
        aziendeUniche.set(chiave, {
          nomeAzienda: nota.nomeAzienda,
          numeroTelefono: nota.numeroTelefono,
          referente: nota.referente,
          indirizzo: nota.indirizzo,
          email: nota.email || '',
          note: []
        });
      }
      
      aziendeUniche.get(chiave).note.push(nota);
    });

    const gruppiAziende = Array.from(aziendeUniche.values());

    console.log(`🏢 Aziende uniche identificate: ${gruppiAziende.length}`);

    return NextResponse.json({
      totale_note: noteMarcoFusi.length,
      breakdown: {
        note_contatto: noteContatto.length,
        note_appuntamento: noteAppuntamento.length,
        aziende_uniche_da_contatti: gruppiAziende.length
      },
      note_contatto_dettaglio: analisiContatto,
      note_appuntamento_dettaglio: analisiAppuntamento,
      aziende_raggruppate: gruppiAziende.map(gruppo => ({
        nomeAzienda: gruppo.nomeAzienda,
        numeroTelefono: gruppo.numeroTelefono,
        referente: gruppo.referente,
        numero_note: gruppo.note.length,
        prima_data: Math.min(...gruppo.note.map(n => n.data)),
        ultima_data: Math.max(...gruppo.note.map(n => n.data))
      })),
      info: {
        commerciale_id: marcoFusiId,
        commerciale_nome: "Marco Fusi", 
        note_di: noteMarcoFusi[0]?.autore || 'Marco Fusi',
        spiegazione: "I Lead verranno assegnati a Marco Fusi come commerciale responsabile",
        prossimo_passo: "Usa POST per migrare le note di tipo 'contatto' a Lead"
      }
    });

  } catch (error) {
    console.error("❌ Errore analisi Marco Fusi:", error);
    return NextResponse.json(
      { error: "Errore analisi", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await connectToDB();

    const marcoFusiId = "68d2a941fe5174631f799ff2";
    console.log(`🚀 === MIGRAZIONE NOTE CONTATTO → LEAD ===`);

    // Recupera solo le note di tipo "contatto" di Marco Fusi
    const noteContatto = await NotaComm.find({ 
      autoreId: marcoFusiId,
      mainCategoria: 'contatto'
    }).sort({ data: 1 });

    console.log(`📋 Migrando ${noteContatto.length} note contatto...`);

    // Raggruppa per azienda/telefono
    const aziendeMap = new Map();

    noteContatto.forEach(nota => {
      const chiave = nota.numeroTelefono || nota.nomeAzienda.toLowerCase().replace(/\s+/g, '_');
      
      if (!aziendeMap.has(chiave)) {
        aziendeMap.set(chiave, {
          nomeAzienda: nota.nomeAzienda,
          numeroTelefono: nota.numeroTelefono || '',
          referente: nota.referente || '',
          indirizzo: nota.indirizzo || '',
          email: nota.email || '',
          note: [],
          primaData: nota.data,
          ultimaData: nota.data
        });
      }
      
      const gruppo = aziendeMap.get(chiave);
      gruppo.note.push(nota);
      
      if (nota.data < gruppo.primaData) gruppo.primaData = nota.data;
      if (nota.data > gruppo.ultimaData) gruppo.ultimaData = nota.data;
    });

    const gruppiAziende = Array.from(aziendeMap.values());
    console.log(`🏢 ${gruppiAziende.length} aziende uniche da migrare`);

    const risultati = {
      note_analizzate: noteContatto.length,
      aziende_identificate: gruppiAziende.length,
      lead_creati: 0,
      errori: [],
      dettagli: []
    };

    // Migrazione
    for (const gruppo of gruppiAziende) {
      try {
        // Verifica se Lead già esistente
        const leadEsistente = await LeadCommerciale.findOne({
          $or: [
            { numero_telefono: gruppo.numeroTelefono },
            { nome_attivita: gruppo.nomeAzienda }
          ].filter(condition => Object.values(condition)[0])
        });

        if (leadEsistente) {
          console.log(`⚠️ Lead già esistente: ${gruppo.nomeAzienda}`);
          risultati.dettagli.push({
            azienda: gruppo.nomeAzienda,
            status: 'gia_esistente',
            lead_id: leadEsistente._id
          });
          continue;
        }

        // Aggrega tutte le note in una nota generale
        const notaGenerale = gruppo.note.map((nota, index) => 
          `[${nota.data.toLocaleDateString()}] CONTATTO (${nota.tipoContatto}): ${nota.nota}`
        ).join('\n\n');

        // Crea nuovo Lead
        const nuovoLead = new LeadCommerciale({
          nome_attivita: gruppo.nomeAzienda,
          numero_telefono: gruppo.numeroTelefono || 'N/A',
          referente: gruppo.referente,
          indirizzo: gruppo.indirizzo,
          email: gruppo.email,
          commerciale: marcoFusiId, // Marco Fusi come commerciale responsabile
          nota_generale: notaGenerale,
          stato_attuale: 'in_lavorazione', // Ha avuto contatti
          data_cambio_stato: gruppo.ultimaData,
          timeline: {
            contatto: { 
              completato: true, 
              data_completamento: gruppo.primaData 
            },
            appuntamento: { completato: false, data_completamento: null },
            preventivo: { completato: false, data_completamento: null },
            contratto: { completato: false, data_completamento: null }
          },
          createdAt: gruppo.primaData,
          updatedAt: gruppo.ultimaData
        });

        await nuovoLead.save();
        risultati.lead_creati++;
        
        console.log(`✅ Lead creato: ${gruppo.nomeAzienda} (${gruppo.note.length} note)`);
        
        risultati.dettagli.push({
          azienda: gruppo.nomeAzienda,
          status: 'creato',
          lead_id: nuovoLead._id,
          note_migrate: gruppo.note.length,
          telefono: gruppo.numeroTelefono
        });

      } catch (error) {
        console.error(`❌ Errore migrazione ${gruppo.nomeAzienda}:`, error);
        risultati.errori.push({
          azienda: gruppo.nomeAzienda,
          errore: error.message
        });
      }
    }

    console.log(`🎉 Migrazione completata: ${risultati.lead_creati} Lead creati`);

    return NextResponse.json({
      ...risultati,
      message: `✅ Migrazione completata! ${risultati.lead_creati} Lead creati dalle note di contatto di Marco Fusi`
    });

  } catch (error) {
    console.error("❌ Errore migrazione:", error);
    return NextResponse.json(
      { error: "Errore migrazione", details: error.message },
      { status: 500 }
    );
  }
}

// Funzione helper per estrarre nome da nota appuntamento
function estraiNomeDaNota(nota) {
  if (!nota) return null;
  
  const patterns = [
    /appuntamento\s+(?:con|presso)\s+([A-Z][A-Za-z\s&\.\-]{3,30})/i,
    /incontro\s+(?:con|presso)\s+([A-Z][A-Za-z\s&\.\-]{3,30})/i,
    /visita\s+(?:a|presso)\s+([A-Z][A-Za-z\s&\.\-]{3,30})/i
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(nota);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}