import { connectToDB } from "@/utils/database";
import NotaComm from "@/models/Note-comm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();

    // Recupera tutte le note commerciali
    const noteCommerciali = await NotaComm.find()
      .populate('autoreId', 'nome cognome email')
      .sort({ data: -1 });

    console.log(`📊 Analizzando ${noteCommerciali.length} note commerciali...`);

    const analisi = {
      totale_note: noteCommerciali.length,
      note_contatto: 0,
      note_appuntamento: 0,
      aziende_trovate: new Set(),
      problemi_estrazione: {
        appuntamenti_senza_azienda: 0,
        appuntamenti_con_parsing: 0,
        contatti_senza_azienda: 0,
        nomi_generati: 0
      },
      campi_analisi: {
        nomeAzienda_presente: 0,
        nomeAzienda_vuoto: 0,
        referente_presente: 0,
        numeroTelefono_presente: 0,
        indirizzo_presente: 0
      },
      esempi_estrazione: []
    };

    noteCommerciali.forEach((nota, index) => {
      // Conteggi per categoria
      if (nota.mainCategoria === 'contatto') {
        analisi.note_contatto++;
      } else if (nota.mainCategoria === 'appuntamento') {
        analisi.note_appuntamento++;
      }

      // Analisi campi per estrazione nome azienda
      if (nota.nomeAzienda && nota.nomeAzienda.trim()) {
        analisi.campi_analisi.nomeAzienda_presente++;
        analisi.aziende_trovate.add(nota.nomeAzienda.trim());
      } else {
        analisi.campi_analisi.nomeAzienda_vuoto++;
      }

      if (nota.referente && nota.referente.trim()) {
        analisi.campi_analisi.referente_presente++;
      }

      if (nota.numeroTelefono && nota.numeroTelefono.trim()) {
        analisi.campi_analisi.numeroTelefono_presente++;
      }

      if (nota.indirizzo && nota.indirizzo.trim()) {
        analisi.campi_analisi.indirizzo_presente++;
      }

      // Esempi per primi 10 record
      if (index < 10) {
        const nomeEstratto = estraiNomeAzienda(nota);
        
        // Tracking problemi estrazione
        if (nota.mainCategoria === 'appuntamento') {
          if (!nota.nomeAzienda || !nota.nomeAzienda.trim()) {
            analisi.problemi_estrazione.appuntamenti_senza_azienda++;
            
            if (nomeEstratto && !nomeEstratto.includes('Appuntamento_')) {
              analisi.problemi_estrazione.appuntamenti_con_parsing++;
            }
          }
        } else if (nota.mainCategoria === 'contatto') {
          if (!nota.nomeAzienda || !nota.nomeAzienda.trim()) {
            analisi.problemi_estrazione.contatti_senza_azienda++;
          }
        }
        
        if (nomeEstratto && (nomeEstratto.includes('Appuntamento_') || nomeEstratto.includes('Contatto_'))) {
          analisi.problemi_estrazione.nomi_generati++;
        }
        
        analisi.esempi_estrazione.push({
          id: nota._id,
          categoria: nota.mainCategoria,
          nomeAzienda_originale: nota.nomeAzienda || 'N/A',
          referente_originale: nota.referente || 'N/A',
          numeroTelefono: nota.numeroTelefono || 'N/A',
          nome_estratto: nomeEstratto,
          metodo_estrazione: determinaMetodoEstrazione(nota, nomeEstratto),
          nota_breve: (nota.nota || '').substring(0, 50) + '...',
          data: nota.data,
          autore: nota.autore || 'N/A'
        });
      }
    });

    // Converti Set in Array per il response
    analisi.aziende_uniche = Array.from(analisi.aziende_trovate).sort();
    analisi.numero_aziende_uniche = analisi.aziende_uniche.length;
    delete analisi.aziende_trovate; // Rimuovi il Set dal response

    console.log(`✅ Trovate ${analisi.numero_aziende_uniche} aziende uniche`);
    console.log(`📋 Primi 5: ${analisi.aziende_uniche.slice(0, 5).join(', ')}`);

    return NextResponse.json(analisi);

  } catch (error) {
    console.error("❌ Errore estrazione aziende:", error);
    return NextResponse.json(
      { error: "Errore estrazione aziende", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Funzione intelligente per estrarre il nome dell'azienda
 * GESTISCE CASO SPECIALE: note appuntamento senza nomeAzienda
 * Priorità: nomeAzienda > parsing da nota > referente > fallback
 */
function estraiNomeAzienda(nota) {
  // CASO SPECIALE: Note di tipo "appuntamento" spesso hanno nomeAzienda vuoto
  // Per queste, priorità al parsing della nota
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
    
    // 4. Fallback per appuntamenti
    return `Appuntamento_${nota.data ? nota.data.toISOString().split('T')[0] : 'NoDate'}`;
  }

  // CASO NORMALE: Note di tipo "contatto" (hanno nomeAzienda obbligatorio)
  
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

  // 3. Terza priorità: referente (se sembra un nome di azienda)
  if (nota.referente && nota.referente.trim()) {
    const referente = nota.referente.trim();
    if (sembraNomeAzienda(referente)) {
      return pulisciNomeAzienda(referente);
    }
  }

  // 4. Fallback generico
  return nota.referente?.trim() || `Contatto_${nota._id?.toString().slice(-6) || 'Unknown'}`;
}

/**
 * Pulisce il nome dell'azienda da caratteri indesiderati
 */
function pulisciNomeAzienda(nome) {
  return nome
    .replace(/[^\w\s\.\-&]/gi, '') // Rimuovi caratteri speciali eccetto . - &
    .replace(/\s+/g, ' ') // Normalizza spazi
    .trim();
}

/**
 * Determina se una stringa sembra un nome di azienda
 */
function sembraNomeAzienda(testo) {
  const paroleAziendali = [
    'srl', 'spa', 'snc', 'sas', 'società', 'azienda', 'company', 'co',
    'group', 'gruppp', 'holding', 'studio', 'associati', 'partners',
    'service', 'consulting', 'solutions', 'tech', 'digital'
  ];
  
  const testoLower = testo.toLowerCase();
  return paroleAziendali.some(parola => testoLower.includes(parola));
}

/**
 * Tenta di estrarre nome azienda dal contenuto della nota
 * VERSIONE POTENZIATA per gestire appuntamenti
 */
function estraiAziendaDaNota(nota) {
  // Pattern più specifici per appuntamenti
  const patternsAppuntamento = [
    // "appuntamento con [AZIENDA]", "appuntamento presso [AZIENDA]"
    /appuntamento\s+(?:con|presso|da|per|di)\s+([A-Z][A-Za-z\s&\.\-]{2,40}?)(?:\s+(?:alle|per|il|in|presso)|\.|,|$)/gi,
    
    // "incontro con [AZIENDA]", "meeting con [AZIENDA]"  
    /(?:incontro|meeting|riunione)\s+(?:con|presso|da|per)\s+([A-Z][A-Za-z\s&\.\-]{2,40}?)(?:\s+(?:alle|per|il|in|presso)|\.|,|$)/gi,
    
    // "visita a [AZIENDA]", "visita presso [AZIENDA]"
    /visita\s+(?:a|presso|da)\s+([A-Z][A-Za-z\s&\.\-]{2,40}?)(?:\s+(?:alle|per|il|in|presso)|\.|,|$)/gi,
    
    // Pattern con ":" - "Cliente: [AZIENDA]", "Azienda: [AZIENDA]"
    /(?:cliente|azienda|ditta|società)[:\s]+([A-Z][A-Za-z\s&\.\-]{2,40}?)(?:\s+(?:alle|per|il|in|presso)|\.|,|$)/gi,
    
    // Chiamata pattern
    /(?:chiamata|telefonata)\s+(?:con|a|da)\s+([A-Z][A-Za-z\s&\.\-]{2,40}?)(?:\s+(?:alle|per|il|in|presso)|\.|,|$)/gi
  ];

  // Pattern generici (fallback)
  const patternsGenerici = [
    // Nome proprio seguito da SRL, SPA, etc.
    /([A-Z][A-Za-z\s&\.\-]+?)(?:\s+(?:srl|spa|snc|sas|società|azienda|group|studio))/gi,
    
    // Pattern generici di inizio frase
    /^([A-Z][A-Za-z\s&\.\-]{3,30}?)(?:\s+(?:ha|è|sarà|dice|chiede|vuole))/gm
  ];

  const patterns = [...patternsAppuntamento, ...patternsGenerici];

  for (const pattern of patterns) {
    // Reset regex lastIndex per sicurezza
    pattern.lastIndex = 0;
    
    const match = pattern.exec(nota);
    if (match && match[1]) {
      let nomeEstratto = match[1].trim();
      
      // Filtra risultati troppo corti o che sembrano nomi di persona
      if (nomeEstratto.length > 2 && !sembraPersona(nomeEstratto)) {
        // Rimuovi parole comuni alla fine
        nomeEstratto = nomeEstratto.replace(/\s+(?:alle|per|il|in|presso|oggi|domani|lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)$/gi, '');
        
        if (nomeEstratto.length > 2) {
          return nomeEstratto.trim();
        }
      }
    }
  }

  return null;
}

/**
 * Determina se il testo sembra più un nome di persona che un'azienda
 */
function sembraPersona(testo) {
  const nomiComuni = [
    'mario', 'luigi', 'giuseppe', 'francesco', 'antonio', 'giovanni', 'roberto', 'paolo', 'marco', 'franco',
    'maria', 'anna', 'francesca', 'laura', 'paola', 'giulia', 'federica', 'sara', 'alessandra', 'elena'
  ];
  
  const parole = testo.toLowerCase().split(' ');
  
  // Se contiene nomi comuni italiani, probabilmente è una persona
  return nomiComuni.some(nome => parole.includes(nome)) && 
         !sembraNomeAzienda(testo); // Ma non ha indicatori aziendali
}

/**
 * Determina come è stato estratto il nome dell'azienda
 */
function determinaMetodoEstrazione(nota, nomeEstratto) {
  if (!nomeEstratto) return 'fallimento';
  
  if (nomeEstratto.includes('Appuntamento_') || nomeEstratto.includes('Contatto_')) {
    return 'fallback_generato';
  }
  
  if (nota.nomeAzienda && nota.nomeAzienda.trim() === nomeEstratto) {
    return 'campo_nomeAzienda';
  }
  
  if (nota.referente && pulisciNomeAzienda(nota.referente) === nomeEstratto) {
    return 'campo_referente';
  }
  
  if (nota.nota && nota.nota.includes(nomeEstratto)) {
    return 'parsing_nota';
  }
  
  return 'metodo_sconosciuto';
}