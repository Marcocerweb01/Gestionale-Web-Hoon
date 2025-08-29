const mongoose = require('mongoose');

// Connessione diretta
const MONGODB_URI = "mongodb+srv://Hoonmaster:Camaro1983!@cluster0.k1sdf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Schema per Collaborazioniwebdesign
const collaborazioniWebDesignSchema = new mongoose.Schema({
  tipoProgetto: { type: String, enum: ["Web Design", "E-commerce", "Landing Page", "Restyling", "Altro"], required: true },
  dettagliProgetto: { type: String, required: false },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  webDesigner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dataInizioContratto: { type: Date, required: false },
  dataFineContratto: { type: Date, required: false },
  budgetTotale: { type: Number, required: false },
  prezzoOrario: { type: Number, required: false },
  stato: { 
    type: String, 
    enum: ["in corso", "in pausa", "terminata"], 
    default: "in corso",
    required: true 
  },
}, { timestamps: true });

const Collaborazioniwebdesign = mongoose.models.Collaborazioniwebdesign || mongoose.model("Collaborazioniwebdesign", collaborazioniWebDesignSchema);

// Funzione di connessione al database
let isConnected = false;
const connectToDB = async () => {
  mongoose.set('strictQuery', true);
  if (isConnected) {
    console.log('MongoDB is already connected');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'gestionale_hoon',
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.log('MongoDB connection error:', error);
  }
};

async function updateStatiProgetti() {
  try {
    await connectToDB();
    console.log('Connesso al database');

    // Aggiorna tutti i progetti con stato "attiva" in "in corso"
    const result = await Collaborazioniwebdesign.updateMany(
      { stato: 'attiva' },
      { $set: { stato: 'in corso' } }
    );

    console.log(`Aggiornati ${result.modifiedCount} progetti da "attiva" a "in corso"`);

    // Verifica i progetti senza stato e impostali su "in corso"
    const resultNoStatus = await Collaborazioniwebdesign.updateMany(
      { stato: { $exists: false } },
      { $set: { stato: 'in corso' } }
    );

    console.log(`Aggiornati ${resultNoStatus.modifiedCount} progetti senza stato a "in corso"`);

    // Mostra il riepilogo degli stati
    const stati = await Collaborazioniwebdesign.aggregate([
      {
        $group: {
          _id: '$stato',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\nRiepilogo stati progetti:');
    stati.forEach(stato => {
      console.log(`- ${stato._id || 'senza stato'}: ${stato.count} progetti`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento:', error);
    process.exit(1);
  }
}

updateStatiProgetti();
