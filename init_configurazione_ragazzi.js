// Script per inizializzare la configurazione ragazzi nel database
import { connectToDB } from "./utils/database.js";
import ConfigurazioneRagazzi from "./models/ConfigurazioneRagazzi.js";

async function inizializzaConfigurazioneRagazzi() {
  try {
    await connectToDB();
    console.log("✅ Connesso al database");

    // Verifica se esiste già una configurazione
    const configEsistente = await ConfigurazioneRagazzi.findOne();
    
    if (configEsistente) {
      console.log("⚠️ Configurazione già esistente");
      console.log("Aziende configurate:", configEsistente.aziende_ragazzi.length);
      return;
    }

    // Lista attuale hardcoded
    const aziendeDefault = [
      "678e0791ad7388a65515a6ae",
      "679c9fdb986246f7c66dda68",
      "678e06efad7388a65515a6a5",
      "678e0697ad7388a65515a69f",
      "678e019cad7388a65515a668",
      "678e0769ad7388a65515a6ab"  // Orizzonte Blu
    ];

    // Crea la configurazione
    const nuovaConfig = await ConfigurazioneRagazzi.create({
      aziende_ragazzi: aziendeDefault
    });

    console.log("✅ Configurazione creata con successo!");
    console.log(`📊 ${aziendeDefault.length} aziende importate nella configurazione`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Errore:", error);
    process.exit(1);
  }
}

inizializzaConfigurazioneRagazzi();
