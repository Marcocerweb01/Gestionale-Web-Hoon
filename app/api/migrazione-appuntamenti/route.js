import { NextResponse } from 'next/server';
import { connectToDB } from "@/utils/database";
import NotaComm from "@/models/Note-comm";
import LeadCommerciale from "@/models/LeadCommerciale";
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    await connectToDB();
    
    const MARCO_FUSI_ID = new ObjectId("68d2a941fe5174631f799ff2");
    
    console.log("🚀 Iniziando migrazione appuntamenti per Marco Fusi...");
    
    // Trova tutti gli appuntamenti di Marco Fusi
    const appuntamenti = await NotaComm.find({ 
      autoreId: MARCO_FUSI_ID,
      mainCategoria: 'appuntamento'
    }).sort({ data: -1 });
    
    console.log(`📋 Trovati ${appuntamenti.length} appuntamenti di Marco Fusi`);
    
    let lead_creati = 0;
    let appuntamenti_analizzati = 0;
    let aziende_identificate = [];
    let errori = [];
    
    for (const appuntamento of appuntamenti) {
      try {
        appuntamenti_analizzati++;
        
        const nota = appuntamento.nota?.trim() || '';
        
        if (!nota) {
          errori.push(`Appuntamento ${appuntamento._id}: Nota vuota`);
          continue;
        }
        
        // Estrae nome azienda dal pattern "Nome Azienda - resto della nota"
        const separatorIndex = nota.indexOf(' - ');
        
        if (separatorIndex === -1) {
          errori.push(`Appuntamento ${appuntamento._id}: Pattern "Azienda - nota" non trovato nella nota: "${nota.substring(0, 50)}..."`);
          continue;
        }
        
        const nomeAzienda = nota.substring(0, separatorIndex).trim();
        const descrizioneAppuntamento = nota.substring(separatorIndex + 3).trim();
        
        if (!nomeAzienda) {
          errori.push(`Appuntamento ${appuntamento._id}: Nome azienda vuoto nella nota`);
          continue;
        }
        
        console.log(`🔍 Azienda identificata: "${nomeAzienda}" da nota: "${nota.substring(0, 100)}..."`);
        
        // Verifica se esiste già un lead per questa azienda
        const leadEsistente = await LeadCommerciale.findOne({
          nome_attivita: { $regex: new RegExp(`^${nomeAzienda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          commerciale: MARCO_FUSI_ID
        });
        
        if (leadEsistente) {
          console.log(`📝 Lead esistente trovato per "${nomeAzienda}", aggiornando appuntamento...`);
          
          // Segna appuntamento come completato se non lo è già
          if (!leadEsistente.timeline.appuntamento.completato) {
            leadEsistente.timeline.appuntamento.completato = true;
            leadEsistente.timeline.appuntamento.data_completamento = appuntamento.data_appuntamento || appuntamento.data;
          }
          
          // Aggiorna nota generale con dettagli appuntamento
          const notaAppuntamento = `APPUNTAMENTO DEL ${(appuntamento.data_appuntamento || appuntamento.data).toLocaleDateString('it-IT')} presso ${appuntamento.luogo_appuntamento || 'sede'}: ${descrizioneAppuntamento}`;
          
          if (leadEsistente.nota_generale) {
            leadEsistente.nota_generale += `\n\n${notaAppuntamento}`;
          } else {
            leadEsistente.nota_generale = notaAppuntamento;
          }
          
          await leadEsistente.save();
          
        } else {
          console.log(`✨ Creando nuovo lead per azienda: "${nomeAzienda}"`);
          
          // Crea nuovo lead dall'appuntamento
          const nuovoLead = new LeadCommerciale({
            nome_attivita: nomeAzienda,
            numero_telefono: "N/D", // Campo obbligatorio - da aggiornare manualmente
            commerciale: MARCO_FUSI_ID,
            stato_attuale: 'in_lavorazione',
            timeline: {
              contatto: { completato: true, data_completamento: appuntamento.data },
              appuntamento: { 
                completato: true, 
                data_completamento: appuntamento.data_appuntamento || appuntamento.data 
              },
              preventivo: { completato: false, data_completamento: null },
              contratto: { completato: false, data_completamento: null }
            },
            nota_generale: `LEAD MIGRATO DA APPUNTAMENTO DEL ${appuntamento.data.toLocaleDateString('it-IT')}\n\nAPPUNTAMENTO presso ${appuntamento.luogo_appuntamento || 'sede'}: ${descrizioneAppuntamento}\n\n⚠️ NUMERO TELEFONO DA VERIFICARE`
          });
          
          await nuovoLead.save();
          lead_creati++;
        }
        
        // Traccia aziende identificate
        if (!aziende_identificate.includes(nomeAzienda)) {
          aziende_identificate.push(nomeAzienda);
        }
        
      } catch (error) {
        console.error(`❌ Errore processando appuntamento ${appuntamento._id}:`, error);
        errori.push(`Appuntamento ${appuntamento._id}: ${error.message}`);
      }
    }
    
    const risultato = {
      success: true,
      message: `Migrazione appuntamenti completata! ${lead_creati} lead creati da ${appuntamenti_analizzati} appuntamenti`,
      lead_creati,
      appuntamenti_analizzati,
      aziende_identificate: aziende_identificate.length,
      aziende_trovate: aziende_identificate.slice(0, 10), // Prime 10 per non sovraccaricare
      errori: errori.slice(0, 5) // Prime 5 errori per debug
    };
    
    console.log("✅ Risultato migrazione appuntamenti:", risultato);
    
    return NextResponse.json(risultato);
    
  } catch (error) {
    console.error("💥 Errore migrazione appuntamenti:", error);
    return NextResponse.json(
      { 
        success: false,
        error: `Errore server: ${error.message}` 
      }, 
      { status: 500 }
    );
  }
}