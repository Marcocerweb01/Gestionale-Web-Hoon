import Fatturazione from "@/models/Fatturazione";
import { Collaboratore } from "@/models/User";
import { connectToDB } from "@/utils/database";

export async function POST(req) {
  try {
    await connectToDB();

    // Ottieni il mese da generare (opzionale, altrimenti usa il mese corrente)
    const body = await req.json().catch(() => ({}));
    const { mese } = body;

    // Se non viene passato un mese, usa il mese corrente
    const now = new Date();
    const meseTarget = mese || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`Generazione fatture per il mese: ${meseTarget}`);

    // Recupera TUTTI i collaboratori come fa l'API lista_collaboratori
    const tuttiCollaboratori = await Collaboratore
      .find()
      .read('primary')
      .lean()
      .exec();

    console.log(`📊 Trovati ${tuttiCollaboratori.length} collaboratori totali nel database`);

    // Filtra solo quelli che NON sono esplicitamente "non_attivo"
    const collaboratoriAttivi = tuttiCollaboratori.filter(c => 
      c.status !== "non_attivo"
    );

    console.log(`✅ ${collaboratoriAttivi.length} collaboratori sono attivi (non hanno status "non_attivo")`);

    if (collaboratoriAttivi.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "Nessun collaboratore attivo trovato",
          fatture_create: 0,
          fatture_esistenti: 0
        }), 
        { status: 200 }
      );
    }

    const fattureCreate = [];
    const fattureEsistenti = [];
    const errori = [];

    // Crea una fattura per ogni collaboratore attivo
    for (const collaboratore of collaboratoriAttivi) {
      try {
        // Verifica se esiste già una fattura per questo collaboratore in questo mese
        const fatturaEsistente = await Fatturazione.findOne({
          collaboratore: collaboratore._id,
          mese: meseTarget
        });

        if (fatturaEsistente) {
          console.log(`Fattura già esistente per ${collaboratore.nome} ${collaboratore.cognome} - mese ${meseTarget}`);
          fattureEsistenti.push({
            collaboratore: `${collaboratore.nome} ${collaboratore.cognome}`,
            mese: meseTarget
          });
          continue;
        }

        // Crea la nuova fattura
        const nuovaFattura = new Fatturazione({
          data: new Date(),
          mese: meseTarget,
          collaboratore: collaboratore._id,
          totale: null,
          statoCollaboratore: "non emessa",
          statoAmministratore: "non pagata",
        });

        await nuovaFattura.save();
        
        fattureCreate.push({
          collaboratore: `${collaboratore.nome} ${collaboratore.cognome}`,
          mese: meseTarget
        });

        console.log(`✅ Fattura creata per ${collaboratore.nome} ${collaboratore.cognome}`);
      } catch (error) {
        console.error(`Errore creazione fattura per ${collaboratore.nome} ${collaboratore.cognome}:`, error);
        errori.push({
          collaboratore: `${collaboratore.nome} ${collaboratore.cognome}`,
          errore: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Generazione fatture completata",
        mese: meseTarget,
        fatture_create: fattureCreate.length,
        fatture_esistenti: fattureEsistenti.length,
        errori: errori.length,
        dettaglio: {
          create: fattureCreate,
          esistenti: fattureEsistenti,
          errori: errori
        }
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Errore durante la generazione delle fatture:", error);
    return new Response(
      JSON.stringify({ 
        message: "Errore interno al server",
        error: error.message 
      }),
      { status: 500 }
    );
  }
}
