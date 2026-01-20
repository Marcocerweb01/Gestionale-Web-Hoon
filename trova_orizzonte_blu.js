// Script per trovare l'ID del cliente Orizzonte Blu
import { connectToDB } from "./utils/database.js";
import mongoose from "mongoose";

// Schema Azienda
const AziendaSchema = new mongoose.Schema({
  etichetta: String,
  ragioneSociale: String,
  piva: String,
  indirizzo: String,
  telefono: String,
  email: String,
});

const Azienda = mongoose.models.Azienda || mongoose.model("Azienda", AziendaSchema);

async function trovaOrizzonteBlu() {
  try {
    await connectToDB();
    console.log("✅ Connesso al database");

    // Cerca l'azienda
    const azienda = await Azienda.findOne({
      $or: [
        { etichetta: /orizzonte blu/i },
        { ragioneSociale: /orizzonte blu/i }
      ]
    });

    if (azienda) {
      console.log("\n🎯 TROVATO!");
      console.log("ID:", azienda._id.toString());
      console.log("Etichetta:", azienda.etichetta);
      console.log("Ragione Sociale:", azienda.ragioneSociale);
      console.log("\n📝 Aggiungi questo ID nella lista aziendeRagazzi:");
      console.log(`"${azienda._id.toString()}"`);
    } else {
      console.log("❌ Cliente 'Orizzonte Blu' non trovato");
      
      // Mostra tutte le aziende con nome simile
      console.log("\n📋 Cerco aziende con nomi simili...");
      const aziendeSimili = await Azienda.find({
        $or: [
          { etichetta: /blu/i },
          { ragioneSociale: /blu/i },
          { etichetta: /orizzonte/i },
          { ragioneSociale: /orizzonte/i }
        ]
      }).limit(10);
      
      if (aziendeSimili.length > 0) {
        console.log(`\nTrovate ${aziendeSimili.length} aziende simili:`);
        aziendeSimili.forEach(a => {
          console.log(`- ${a.etichetta || a.ragioneSociale} (ID: ${a._id})`);
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Errore:", error);
    process.exit(1);
  }
}

trovaOrizzonteBlu();
