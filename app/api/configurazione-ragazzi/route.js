import { connectToDB } from "@/utils/database";
import ConfigurazioneRagazzi from "@/models/ConfigurazioneRagazzi";
import { Azienda } from "@/models/User";

// GET - Recupera la configurazione attuale
export async function GET() {
  try {
    await connectToDB();

    const aziendeDefault = [
      "678e0791ad7388a65515a6ae",
      "679c9fdb986246f7c66dda68",
      "678e06efad7388a65515a6a5",
      "678e0697ad7388a65515a69f",
      "678e019cad7388a65515a668",
      "678e0769ad7388a65515a6ab"  // Orizzonte Blu
    ];

    // Recupera la configurazione (ne esiste solo una)
    let config = await ConfigurazioneRagazzi.findOne();
    
    // Se non esiste o è vuota, creala/aggiornala con i dati di default
    if (!config) {
      console.log("📝 Creazione configurazione con dati di default...");
      config = await ConfigurazioneRagazzi.create({ aziende_ragazzi: aziendeDefault });
      console.log(`✅ Configurazione creata con ${aziendeDefault.length} aziende`);
    } else if (!config.aziende_ragazzi || config.aziende_ragazzi.length === 0) {
      console.log("📝 Configurazione vuota, aggiungo dati di default...");
      config.aziende_ragazzi = aziendeDefault;
      await config.save();
      console.log(`✅ Configurazione aggiornata con ${aziendeDefault.length} aziende`);
    }

    // Popola le aziende con i loro dettagli
    await config.populate('aziende_ragazzi', 'etichetta ragioneSociale');
    
    console.log(`📊 Configurazione caricata: ${config.aziende_ragazzi?.length || 0} aziende ragazzi`);

    // Recupera anche tutte le aziende disponibili
    const tutteAziende = await Azienda.find().select('etichetta ragioneSociale').sort({ etichetta: 1 });
    
    console.log(`📋 Trovate ${tutteAziende.length} aziende totali`);

    return new Response(
      JSON.stringify({
        aziende_ragazzi: config.aziende_ragazzi || [],
        tutte_aziende: tutteAziende
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Errore GET configurazione ragazzi:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}

// POST - Aggiorna la configurazione
export async function POST(req) {
  try {
    await connectToDB();
    
    const { aziende_ragazzi } = await req.json();

    // Recupera o crea la configurazione
    let config = await ConfigurazioneRagazzi.findOne();
    
    if (!config) {
      config = new ConfigurazioneRagazzi({ aziende_ragazzi });
    } else {
      config.aziende_ragazzi = aziende_ragazzi;
    }

    await config.save();
    await config.populate('aziende_ragazzi', 'etichetta ragioneSociale');

    return new Response(
      JSON.stringify({
        message: "Configurazione aggiornata con successo",
        aziende_ragazzi: config.aziende_ragazzi
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore POST configurazione ragazzi:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
