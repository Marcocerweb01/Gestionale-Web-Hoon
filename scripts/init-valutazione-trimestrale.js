// Script per inizializzare le valutazioni trimestrali
// Esegui con: node scripts/init-valutazione-trimestrale.js

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// Assicurati di usare il database Webarea
const getDbUri = () => {
  if (MONGODB_URI.includes('?')) {
    // Se c'è già una query string, aggiungi il database prima
    const [base, query] = MONGODB_URI.split('?');
    // Rimuovi eventuali /test o altri database e usa Webarea
    const cleanBase = base.replace(/\/[^\/]*$/, '');
    return `${cleanBase}/Webarea?${query}`;
  }
  return `${MONGODB_URI}/Webarea`;
};

// Schema semplificato per lo script
const CollaborazioneSchema = new mongoose.Schema({
  post_ig_fb: Number,
  post_ig_fb_fatti: Number,
  post_tiktok: Number,
  post_tiktok_fatti: Number,
  post_linkedin: Number,
  post_linkedin_fatti: Number,
  numero_appuntamenti: Number,
  appuntamenti_fatti: Number,
  valutazione_trimestrale_fatti: Number,
  valutazione_trimestrale_totali: Number,
  appuntamenti_trimestrale_fatti: Number,
  appuntamenti_trimestrale_totali: Number,
}, { timestamps: true, collection: 'collaboraziones' });

const Collaborazione = mongoose.model('CollaborazioneInit', CollaborazioneSchema);

async function initValutazioneTrimestrale() {
  try {
    console.log('🔌 Connessione al database...');
    const dbUri = getDbUri();
    console.log('Database: Webarea');
    await mongoose.connect(dbUri);
    console.log('✅ Connesso al database:', mongoose.connection.name);

    // Usa direttamente la collection
    const db = mongoose.connection.db;
    
    // Conta documenti in ogni collection
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  ${col.name}: ${count} documenti`);
    }
    
    const collection = db.collection('collaboraziones');
    
    // Recupera tutte le collaborazioni
    const collaborazioni = await collection.find({}).toArray();
    console.log(`\n📊 Trovate ${collaborazioni.length} collaborazioni`);

    let updated = 0;
    
    for (const collab of collaborazioni) {
      // Fatti = somma di tutti i tipi di post fatti attuali
      const postFatti = (collab.post_ig_fb_fatti || 0) + (collab.post_tiktok_fatti || 0) + (collab.post_linkedin_fatti || 0);
      // Totali = somma di tutti i tipi di post previsti
      const postTotali = (collab.post_ig_fb || 0) + (collab.post_tiktok || 0) + (collab.post_linkedin || 0);
      
      // Appuntamenti - fatti restano quelli attuali, totali sono quelli mensili previsti
      const appuntamentiFatti = collab.appuntamenti_fatti || 0;
      const appuntamentiTotali = collab.numero_appuntamenti || 0;

      // Aggiorna la collaborazione
      await collection.updateOne(
        { _id: collab._id },
        {
          $set: {
            valutazione_trimestrale_fatti: postFatti,
            valutazione_trimestrale_totali: postTotali,
            appuntamenti_trimestrale_fatti: appuntamentiFatti,
            appuntamenti_trimestrale_totali: appuntamentiTotali,
          }
        }
      );
      
      updated++;
      console.log(`  ✓ ${collab.aziendaRagioneSociale || collab._id}: post=${postFatti}/${postTotali}, app=${appuntamentiFatti}/${appuntamentiTotali}`);
    }

    console.log(`\n🎉 Inizializzazione completata!`);
    console.log(`   Collaborazioni aggiornate: ${updated}`);
    
    // Verifica che i dati siano stati scritti
    console.log('\n📋 Verifica dati salvati (primi 3):');
    const verify = await collection.find({}).limit(3).toArray();
    for (const v of verify) {
      console.log(`  ${v.aziendaRagioneSociale}: post=${v.valutazione_trimestrale_fatti}/${v.valutazione_trimestrale_totali}, app=${v.appuntamenti_trimestrale_fatti}/${v.appuntamenti_trimestrale_totali}`);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnesso dal database');
  }
}

initValutazioneTrimestrale();
