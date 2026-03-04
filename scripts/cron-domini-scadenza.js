/**
 * Script Cron per Controllo Scadenza Domini
 * 
 * Questo script controlla i domini in scadenza e invia alert automatici.
 * 
 * UTILIZZO:
 * 1. Locale: node scripts/cron-domini-scadenza.js
 * 2. Cron Job: Aggiungi a crontab o scheduler
 *    Esempio: 0 9 * * * node /path/to/scripts/cron-domini-scadenza.js
 *    (Esegue ogni giorno alle 9:00)
 * 3. Vercel Cron: Aggiungi route in vercel.json
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Carica variabili d'ambiente
dotenv.config({ path: '.env.local' });

// Connessione al database
const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connesso al database MongoDB');
  } catch (error) {
    console.error('❌ Errore connessione database:', error);
    process.exit(1);
  }
};

// Schema Collaborazione Web Design (deve corrispondere al modello)
const CollaborazioneWebDesignSchema = new mongoose.Schema(
  {
    tipoProgetto: String,
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Azienda" },
    webDesigner: { type: mongoose.Schema.Types.ObjectId, ref: "Collaboratore" },
    aziendaRagioneSociale: String,
    collaboratoreNome: String,
    collaboratoreCognome: String,
    tasks: Array,
    note: String,
    problemi: String,
    stato: String,
    dataInizioContratto: Date,
    dataFineContratto: Date,
    dominio: {
      dataAcquisto: Date,
      dataScadenza: Date,
      urlDominio: String,
      alertInviato: Boolean,
      novaAlertData: Date
    },
  },
  { timestamps: true }
);

// Schema User per trovare amministratori
const CollaboratoreSchema = new mongoose.Schema({
  nome: String,
  cognome: String,
  email: String,
  password: String,
  partitaIva: String,
  subRole: String,
  status: String,
});

const CollaborazioneWebDesign = mongoose.models.CollaborazioneWebDesign || 
  mongoose.model("CollaborazioneWebDesign", CollaborazioneWebDesignSchema);

const Collaboratore = mongoose.models.Collaboratore || 
  mongoose.model("Collaboratore", CollaboratoreSchema);

// Funzione principale
async function controlloDominiInScadenza() {
  console.log('\n🔍 Inizio controllo domini in scadenza...');
  console.log(`📅 Data controllo: ${new Date().toLocaleString('it-IT')}\n`);

  try {
    await connectToDB();

    const oggi = new Date();
    const trenitaGiorniDaOggi = new Date();
    trenitaGiorniDaOggi.setDate(oggi.getDate() + 30);

    // Trova collaborazioni con domini in scadenza che non hanno ancora ricevuto alert
    const collaborazioniInScadenza = await CollaborazioneWebDesign.find({
      'dominio.dataScadenza': {
        $gte: oggi,
        $lte: trenitaGiorniDaOggi
      },
      'dominio.alertInviato': { $ne: true }
    })
      .populate("cliente", "etichetta email ragioneSociale")
      .populate("webDesigner", "nome cognome email");

    if (collaborazioniInScadenza.length === 0) {
      console.log('✅ Nessun dominio in scadenza da notificare');
      await mongoose.connection.close();
      return;
    }

    console.log(`⚠️  Trovati ${collaborazioniInScadenza.length} domini in scadenza\n`);

    // Recupera amministratori
    const amministratori = await Collaboratore.find({ 
      subRole: { $exists: false } // Gli admin non hanno subRole
    }).select('email nome cognome');

    console.log(`👥 Amministratori trovati: ${amministratori.length}\n`);

    // Processa ogni collaborazione
    for (const collab of collaborazioniInScadenza) {
      const dataScadenza = new Date(collab.dominio.dataScadenza);
      const giorniMancanti = Math.ceil((dataScadenza - oggi) / (1000 * 60 * 60 * 24));

      console.log(`\n📋 DOMINIO IN SCADENZA:`);
      console.log(`   Cliente: ${collab.cliente.etichetta}`);
      console.log(`   Dominio: ${collab.dominio.urlDominio || 'Non specificato'}`);
      console.log(`   Web Designer: ${collab.webDesigner.nome} ${collab.webDesigner.cognome}`);
      console.log(`   Data scadenza: ${dataScadenza.toLocaleDateString('it-IT')}`);
      console.log(`   Giorni mancanti: ${giorniMancanti}`);

      // Lista destinatari
      const destinatari = [];

      // Email web designer
      if (collab.webDesigner.email) {
        destinatari.push({
          tipo: 'Web Designer',
          email: collab.webDesigner.email,
          nome: `${collab.webDesigner.nome} ${collab.webDesigner.cognome}`
        });
      }

      // Email amministratori
      amministratori.forEach(admin => {
        if (admin.email) {
          destinatari.push({
            tipo: 'Amministratore',
            email: admin.email,
            nome: admin.nome ? `${admin.nome} ${admin.cognome}` : 'Amministratore'
          });
        }
      });

      console.log(`   📧 Destinatari notifica (${destinatari.length}):`);
      destinatari.forEach(dest => {
        console.log(`      - ${dest.tipo}: ${dest.nome} (${dest.email})`);
      });

      // TODO: Integra qui l'invio effettivo delle email
      // Opzioni:
      // 1. Nodemailer
      // 2. SendGrid
      // 3. Webhook N8N
      // 4. Resend
      // 
      // Esempio con webhook N8N:
      // await fetch('https://n8n.tuodominio.com/webhook/alert-dominio', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     cliente: collab.cliente.etichetta,
      //     dominio: collab.dominio.urlDominio,
      //     dataScadenza: dataScadenza.toISOString(),
      //     giorniMancanti,
      //     destinatari
      //   })
      // });

      // Segna come notificato
      collab.dominio.alertInviato = true;
      collab.dominio.novaAlertData = oggi;
      await collab.save();

      console.log(`   ✅ Alert segnato come inviato`);
    }

    console.log(`\n\n✅ Processo completato! ${collaborazioniInScadenza.length} alert elaborati.\n`);
    
    await mongoose.connection.close();
    console.log('🔌 Connessione database chiusa');
    
  } catch (error) {
    console.error('\n❌ Errore durante il controllo:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Esegui lo script
controlloDominiInScadenza();
