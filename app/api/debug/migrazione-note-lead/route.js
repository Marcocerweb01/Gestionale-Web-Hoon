import { connectToDB } from "@/utils/database";
import NotaComm from "@/models/Note-comm";
import LeadCommerciale from "@/models/LeadCommerciale";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const commercialeId = searchParams.get('commerciale');
    const dryRun = searchParams.get('dryRun') === 'true';

    if (!commercialeId) {
      return NextResponse.json(
        { error: "ID commerciale mancante per assegnare i lead migrati" },
        { status: 400 }
      );
    }

    await connectToDB();

    console.log(`🚀 Inizio migrazione Note-comm → Lead (DryRun: ${dryRun})`);

    // Recupera tutte le note commerciali
    const noteCommerciali = await NotaComm.find()
      .populate('autoreId', 'nome cognome email')
      .sort({ data: 1 }); // Dal più vecchio al più recente

    console.log(`📊 Trovate ${noteCommerciali.length} note commerciali`);

    // Raggruppa note per azienda/telefono
    const gruppiAziende = {};
    
    noteCommerciali.forEach(nota => {
      const nomeAzienda = estraiNomeAzienda(nota);
      const chiave = generaChiaveGruppo(nota, nomeAzienda);
      
      if (!gruppiAziende[chiave]) {
        gruppiAziende[chiave] = {
          nomeAzienda,
          numeroTelefono: nota.numeroTelefono || '',
          referente: nota.referente || '',
          indirizzo: nota.indirizzo || '',
          email: '', // Non presente in Note-comm
          note: [],
          primaData: nota.data,
          ultimaData: nota.data
        };
      }
      
      // Aggiungi nota al gruppo
      gruppiAziende[chiave].note.push(nota);
      
      // Aggiorna date min/max
      if (nota.data < gruppiAziende[chiave].primaData) {
        gruppiAziende[chiave].primaData = nota.data;
      }
      if (nota.data > gruppiAziende[chiave].ultimaData) {
        gruppiAziende[chiave].ultimaData = nota.data;
      }
      
      // Aggiorna dati se più completi
      if (!gruppiAziende[chiave].numeroTelefono && nota.numeroTelefono) {
        gruppiAziende[chiave].numeroTelefono = nota.numeroTelefono;
      }
      if (!gruppiAziende[chiave].referente && nota.referente) {
        gruppiAziende[chiave].referente = nota.referente;
      }
      if (!gruppiAziende[chiave].indirizzo && nota.indirizzo) {
        gruppiAziende[chiave].indirizzo = nota.indirizzo;
      }
    });

    const gruppi = Object.values(gruppiAziende);
    console.log(`📋 Raggruppate in ${gruppi.length} aziende uniche`);

    const risultati = {
      note_analizzate: noteCommerciali.length,
      aziende_raggruppate: gruppi.length,
      lead_creati: 0,
      errori: [],
      dettagli: []
    };

    // Migrazione
    for (const gruppo of gruppi) {
      try {
        // Verifica se Lead già esistente
        const leadEsistente = await LeadCommerciale.findOne({
          $or: [
            { numero_telefono: gruppo.numeroTelefono },
            { nome_attivita: gruppo.nomeAzienda }
          ].filter(condition => Object.values(condition)[0]) // Rimuovi condizioni vuote
        });

        if (leadEsistente && !dryRun) {
          console.log(`⚠️ Lead già esistente per ${gruppo.nomeAzienda}`);
          risultati.dettagli.push({
            azienda: gruppo.nomeAzienda,
            status: 'esistente',
            lead_id: leadEsistente._id
          });
          continue;
        }

        // Determina stato del lead basato sulle note
        const statoTimeline = determinaStatoTimeline(gruppo.note);
        const statoAttuale = determinaStatoAttuale(gruppo.note);
        
        // Aggrega tutte le note in una nota generale
        const notaGenerale = gruppo.note.map((nota, index) => 
          `[${nota.data.toLocaleDateString()}] ${nota.mainCategoria.toUpperCase()}: ${nota.nota}`
        ).join('\n\n');

        if (!dryRun) {
          // Crea nuovo Lead
          const nuovoLead = new LeadCommerciale({
            nome_attivita: gruppo.nomeAzienda,
            numero_telefono: gruppo.numeroTelefono || 'N/A',
            referente: gruppo.referente || '',
            indirizzo: gruppo.indirizzo || '',
            email: '',
            commerciale: commercialeId,
            nota_generale: notaGenerale,
            stato_attuale: statoAttuale,
            data_cambio_stato: gruppo.ultimaData,
            timeline: statoTimeline,
            createdAt: gruppo.primaData,
            updatedAt: gruppo.ultimaData
          });

          await nuovoLead.save();
          risultati.lead_creati++;
          
          console.log(`✅ Lead creato: ${gruppo.nomeAzienda} (${gruppo.note.length} note migrate)`);
          
          risultati.dettagli.push({
            azienda: gruppo.nomeAzienda,
            status: 'creato',
            lead_id: nuovoLead._id,
            note_migrate: gruppo.note.length,
            timeline: statoTimeline
          });
        } else {
          // Dry run - solo simula
          risultati.lead_creati++;
          risultati.dettagli.push({
            azienda: gruppo.nomeAzienda,
            status: 'simulato',
            note_da_migrare: gruppo.note.length,
            timeline_simulata: statoTimeline,
            stato_finale: statoAttuale
          });
        }

      } catch (error) {
        console.error(`❌ Errore migrazione ${gruppo.nomeAzienda}:`, error);
        risultati.errori.push({
          azienda: gruppo.nomeAzienda,
          errore: error.message
        });
      }
    }

    console.log(`🎉 Migrazione completata: ${risultati.lead_creati} Lead ${dryRun ? 'simulati' : 'creati'}`);

    return NextResponse.json({
      ...risultati,
      dry_run: dryRun,
      message: dryRun 
        ? `Simulazione completata: ${risultati.lead_creati} Lead verrebbero creati`
        : `Migrazione completata: ${risultati.lead_creati} Lead creati`
    });

  } catch (error) {
    console.error("❌ Errore migrazione:", error);
    return NextResponse.json(
      { error: "Errore migrazione", details: error.message },
      { status: 500 }
    );
  }
}

// GET - Info sulla migrazione
export async function GET() {
  try {
    await connectToDB();

    const noteCount = await NotaComm.countDocuments();
    const leadsCount = await LeadCommerciale.countDocuments();
    const noteContatto = await NotaComm.countDocuments({ mainCategoria: 'contatto' });
    const noteAppuntamento = await NotaComm.countDocuments({ mainCategoria: 'appuntamento' });

    return NextResponse.json({
      note_commerciali_esistenti: noteCount,
      leads_esistenti: leadsCount,
      breakdown: {
        note_contatto: noteContatto,
        note_appuntamento: noteAppuntamento
      },
      info: {
        dry_run: "Usa POST con parametro ?dryRun=true per simulare la migrazione",
        migrazione: "Usa POST con parametro ?commerciale=ID per avviare la migrazione",
        estrazione: "Le aziende vengono estratte da: nomeAzienda > referente > parsing nota"
      }
    });

  } catch (error) {
    console.error("Errore:", error);
    return NextResponse.json(
      { error: "Errore recupero info" },
      { status: 500 }
    );
  }
}

// === FUNZIONI UTILITY ===

/**
 * Estrae il nome dell'azienda con logica intelligente
 * GESTISCE CASO SPECIALE: note appuntamento senza nomeAzienda
 */
function estraiNomeAzienda(nota) {
  // CASO SPECIALE: Note di tipo "appuntamento" spesso hanno nomeAzienda vuoto
  if (nota.mainCategoria === 'appuntamento') {
    
    // 1. Prova parsing dalla nota (PRIORITÀ ALTA per appuntamenti)
    if (nota.nota && nota.nota.trim()) {
      const nomeFromNota = estraiAziendaDaNota(nota.nota);
      if (nomeFromNota) {
        return pulisciNomeAzienda(nomeFromNota);
      }
    }
    
    // 2. Se presente, usa nomeAzienda
    if (nota.nomeAzienda && nota.nomeAzienda.trim()) {
      return pulisciNomeAzienda(nota.nomeAzienda.trim());
    }
    
    // 3. Referente se sembra un nome azienda
    if (nota.referente && nota.referente.trim()) {
      const referente = nota.referente.trim();
      if (sembraNomeAzienda(referente)) {
        return pulisciNomeAzienda(referente);
      }
    }
    
    // 4. Fallback per appuntamenti: usa un ID con data
    const dataStr = nota.data ? nota.data.toISOString().split('T')[0] : 'NoDate';
    return `Appuntamento_${dataStr}_${nota._id?.toString().slice(-4) || 'XXXX'}`;
  }

  // CASO NORMALE: Note di tipo "contatto"
  
  // 1. Prima priorità: campo nomeAzienda
  if (nota.nomeAzienda && nota.nomeAzienda.trim()) {
    return pulisciNomeAzienda(nota.nomeAzienda.trim());
  }

  // 2. Seconda priorità: parsing da nota
  if (nota.nota && nota.nota.trim()) {
    const nomeFromNota = estraiAziendaDaNota(nota.nota);
    if (nomeFromNota) {
      return pulisciNomeAzienda(nomeFromNota);
    }
  }

  // 3. Terza priorità: referente se aziendale
  if (nota.referente && nota.referente.trim()) {
    const referente = nota.referente.trim();
    if (sembraNomeAzienda(referente)) {
      return pulisciNomeAzienda(referente);
    }
  }

  // 4. Fallback generico
  return nota.referente?.trim() || `Contatto_${nota._id?.toString().slice(-6) || 'Unknown'}`;
}

function pulisciNomeAzienda(nome) {
  return nome
    .replace(/[^\w\s\.\-&]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sembraNomeAzienda(testo) {
  const paroleAziendali = [
    'srl', 'spa', 'snc', 'sas', 'società', 'azienda', 'company', 'co',
    'group', 'studio', 'associati', 'service', 'consulting', 'tech', 'digital'
  ];
  
  const testoLower = testo.toLowerCase();
  return paroleAziendali.some(parola => testoLower.includes(parola));
}

function estraiAziendaDaNota(nota) {
  // Pattern specifici per appuntamenti
  const patternsAppuntamento = [
    /appuntamento\s+(?:con|presso|da|per|di)\s+([A-Z][A-Za-z\s&\.\-]{2,40}?)(?:\s+(?:alle|per|il|in|presso)|\.|,|$)/gi,
    /(?:incontro|meeting|riunione)\s+(?:con|presso|da|per)\s+([A-Z][A-Za-z\s&\.\-]{2,40}?)(?:\s+(?:alle|per|il|in|presso)|\.|,|$)/gi,
    /visita\s+(?:a|presso|da)\s+([A-Z][A-Za-z\s&\.\-]{2,40}?)(?:\s+(?:alle|per|il|in|presso)|\.|,|$)/gi,
    /(?:cliente|azienda|ditta|società)[:\s]+([A-Z][A-Za-z\s&\.\-]{2,40}?)(?:\s+(?:alle|per|il|in|presso)|\.|,|$)/gi,
    /(?:chiamata|telefonata)\s+(?:con|a|da)\s+([A-Z][A-Za-z\s&\.\-]{2,40}?)(?:\s+(?:alle|per|il|in|presso)|\.|,|$)/gi
  ];

  // Pattern generici
  const patternsGenerici = [
    /([A-Z][A-Za-z\s&\.\-]+?)(?:\s+(?:srl|spa|snc|sas|società|azienda|group|studio))/gi,
    /^([A-Z][A-Za-z\s&\.\-]{3,30}?)(?:\s+(?:ha|è|sarà|dice|chiede|vuole))/gm
  ];

  const patterns = [...patternsAppuntamento, ...patternsGenerici];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    
    const match = pattern.exec(nota);
    if (match && match[1]) {
      let nomeEstratto = match[1].trim();
      
      if (nomeEstratto.length > 2 && !sembraPersona(nomeEstratto)) {
        nomeEstratto = nomeEstratto.replace(/\s+(?:alle|per|il|in|presso|oggi|domani|lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)$/gi, '');
        
        if (nomeEstratto.length > 2) {
          return nomeEstratto.trim();
        }
      }
    }
  }

  return null;
}

function sembraPersona(testo) {
  const nomiComuni = [
    'mario', 'luigi', 'giuseppe', 'francesco', 'antonio', 'giovanni', 'roberto', 'paolo', 'marco', 'franco',
    'maria', 'anna', 'francesca', 'laura', 'paola', 'giulia', 'federica', 'sara', 'alessandra', 'elena'
  ];
  
  const parole = testo.toLowerCase().split(' ');
  return nomiComuni.some(nome => parole.includes(nome)) && !sembraNomeAzienda(testo);
}

/**
 * Genera chiave unica per raggruppare note della stessa azienda
 * GESTISCE CASO APPUNTAMENTI: Se non trova identificativo univoco, crea gruppo separato
 */
function generaChiaveGruppo(nota, nomeAzienda) {
  // 1. PRIORITÀ TELEFONO: Se presente, raggruppa per telefono
  if (nota.numeroTelefono && nota.numeroTelefono.trim()) {
    const telPulito = nota.numeroTelefono.replace(/\D/g, '');
    if (telPulito.length > 6) { // Numero valido
      return `tel_${telPulito}`;
    }
  }
  
  // 2. NOME AZIENDA: Se estratto con successo e non sembra generato
  if (nomeAzienda && !nomeAzienda.includes('Appuntamento_') && !nomeAzienda.includes('Contatto_')) {
    const nomeNormalizzato = nomeAzienda.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50); // Limita lunghezza
      
    return `nome_${nomeNormalizzato}`;
  }
  
  // 3. FALLBACK: Crea gruppo individuale per note non identificabili
  // Questo evita di accorpare erroneamente note di aziende diverse
  return `individuale_${nota._id?.toString() || Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Determina lo stato della timeline basato sulle note
 */
function determinaStatoTimeline(note) {
  const timeline = {
    contatto: { completato: false, data_completamento: null },
    appuntamento: { completato: false, data_completamento: null },
    preventivo: { completato: false, data_completamento: null },
    contratto: { completato: false, data_completamento: null }
  };

  // Segna come completato se ci sono note di quel tipo
  const noteContatto = note.filter(n => n.mainCategoria === 'contatto');
  const noteAppuntamento = note.filter(n => n.mainCategoria === 'appuntamento');

  if (noteContatto.length > 0) {
    timeline.contatto.completato = true;
    timeline.contatto.data_completamento = noteContatto[0].data;
  }

  if (noteAppuntamento.length > 0) {
    timeline.appuntamento.completato = true;
    timeline.appuntamento.data_completamento = noteAppuntamento[0].data;
  }

  return timeline;
}

/**
 * Determina lo stato attuale del lead basato sulle note
 */
function determinaStatoAttuale(note) {
  const hasContatto = note.some(n => n.mainCategoria === 'contatto');
  const hasAppuntamento = note.some(n => n.mainCategoria === 'appuntamento');

  if (hasAppuntamento) {
    return 'in_lavorazione'; // Ha avuto appuntamenti
  } else if (hasContatto) {
    return 'in_lavorazione'; // Ha avuto contatti
  }

  return 'nuovo'; // Fallback
}