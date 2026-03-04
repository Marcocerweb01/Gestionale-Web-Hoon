/**
 * Script per Testare Sistema Gestione Domini
 * 
 * UTILIZZO:
 * node scripts/test-gestione-domini.js
 * 
 * Questo script:
 * 1. Mostra tutte le collaborazioni web design esistenti
 * 2. Permette di aggiungere dati di dominio a una collaborazione esistente
 * 3. Mostra lo stato dei domini
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const readline = require('readline');

// Carica variabili d'ambiente
dotenv.config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connessione al database
const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connesso al database MongoDB\n');
  } catch (error) {
    console.error('❌ Errore connessione database:', error);
    process.exit(1);
  }
};

// Schema Collaborazione Web Design
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

const CollaborazioneWebDesign = mongoose.models.CollaborazioneWebDesign || 
  mongoose.model("CollaborazioneWebDesign", CollaborazioneWebDesignSchema);

// Funzione per mostrare collaborazioni
async function mostraCollaborazioni() {
  console.log('📋 COLLABORAZIONI WEB DESIGN:\n');
  
  const collaborazioni = await CollaborazioneWebDesign.find({})
    .populate("cliente", "etichetta ragioneSociale")
    .populate("webDesigner", "nome cognome email");

  if (collaborazioni.length === 0) {
    console.log('⚠️  Nessuna collaborazione web design trovata nel database.\n');
    console.log('💡 TIP: Crea prima una collaborazione web design tramite l\'interfaccia web.\n');
    return [];
  }

  collaborazioni.forEach((collab, index) => {
    console.log(`${index + 1}. Cliente: ${collab.cliente?.etichetta || 'N/A'}`);
    console.log(`   Web Designer: ${collab.webDesigner?.nome} ${collab.webDesigner?.cognome}`);
    console.log(`   Stato: ${collab.stato || 'in corso'}`);
    
    if (collab.dominio?.urlDominio) {
      console.log(`   🌐 Dominio: ${collab.dominio.urlDominio}`);
      console.log(`   📅 Acquisto: ${collab.dominio.dataAcquisto ? new Date(collab.dominio.dataAcquisto).toLocaleDateString('it-IT') : 'N/A'}`);
      console.log(`   📅 Scadenza: ${collab.dominio.dataScadenza ? new Date(collab.dominio.dataScadenza).toLocaleDateString('it-IT') : 'N/A'}`);
      
      if (collab.dominio.dataScadenza) {
        const oggi = new Date();
        const scadenza = new Date(collab.dominio.dataScadenza);
        const giorniMancanti = Math.ceil((scadenza - oggi) / (1000 * 60 * 60 * 24));
        
        if (giorniMancanti < 0) {
          console.log(`   🚨 SCADUTO da ${Math.abs(giorniMancanti)} giorni!`);
        } else if (giorniMancanti <= 30) {
          console.log(`   ⚠️  IN SCADENZA tra ${giorniMancanti} giorni`);
        } else {
          console.log(`   ✅ OK (${giorniMancanti} giorni alla scadenza)`);
        }
      }
    } else {
      console.log(`   ℹ️  Nessun dominio configurato`);
    }
    console.log('');
  });

  return collaborazioni;
}

// Funzione per aggiungere dominio di test
async function aggiungiDominioTest(collaborazione) {
  return new Promise((resolve) => {
    console.log(`\n📝 Aggiungo dominio per: ${collaborazione.cliente?.etichetta}\n`);
    
    rl.question('URL Dominio (es: www.esempio.it): ', (urlDominio) => {
      rl.question('Giorni alla scadenza (es: 25 per dominio in scadenza): ', async (giorni) => {
        const giorniNum = parseInt(giorni) || 365;
        
        // Calcola date
        const oggi = new Date();
        const dataAcquisto = new Date(oggi);
        dataAcquisto.setDate(oggi.getDate() - (365 - giorniNum)); // Data acquisto "365-giorni" fa
        
        const dataScadenza = new Date(dataAcquisto);
        dataScadenza.setFullYear(dataScadenza.getFullYear() + 1);
        
        // Aggiorna collaborazione
        collaborazione.dominio = {
          urlDominio: urlDominio || 'www.test-dominio.it',
          dataAcquisto: dataAcquisto,
          dataScadenza: dataScadenza,
          alertInviato: false,
          novaAlertData: null
        };
        
        await collaborazione.save();
        
        console.log('\n✅ Dominio aggiunto con successo!');
        console.log(`   URL: ${collaborazione.dominio.urlDominio}`);
        console.log(`   Acquisto: ${dataAcquisto.toLocaleDateString('it-IT')}`);
        console.log(`   Scadenza: ${dataScadenza.toLocaleDateString('it-IT')}`);
        console.log(`   Giorni mancanti: ${giorniNum}\n`);
        
        resolve();
      });
    });
  });
}

// Menu principale
async function menuPrincipale() {
  console.log('\n=================================');
  console.log('🌐 TEST GESTIONE DOMINI');
  console.log('=================================\n');
  
  const collaborazioni = await mostraCollaborazioni();
  
  if (collaborazioni.length === 0) {
    console.log('👉 Crea prima delle collaborazioni web design tramite l\'interfaccia web:');
    console.log('   http://localhost:3000/Lista_webdesigner\n');
    await mongoose.connection.close();
    rl.close();
    return;
  }
  
  console.log('\n📌 OPZIONI:');
  console.log('1. Aggiungi/Modifica dominio a una collaborazione');
  console.log('2. Crea dominio di test IN SCADENZA (25 giorni)');
  console.log('3. Crea dominio di test SCADUTO (-5 giorni)');
  console.log('4. Mostra riepilogo domini');
  console.log('5. Test API /api/domini/scadenze');
  console.log('0. Esci\n');
  
  rl.question('Scegli opzione: ', async (scelta) => {
    switch(scelta) {
      case '1':
        rl.question('\nNumero collaborazione: ', async (num) => {
          const index = parseInt(num) - 1;
          if (index >= 0 && index < collaborazioni.length) {
            await aggiungiDominioTest(collaborazioni[index]);
            await menuPrincipale();
          } else {
            console.log('❌ Numero non valido');
            await menuPrincipale();
          }
        });
        break;
        
      case '2':
        if (collaborazioni.length > 0) {
          const collab = collaborazioni[0];
          const oggi = new Date();
          const dataAcquisto = new Date(oggi);
          dataAcquisto.setDate(oggi.getDate() - 340); // 340 giorni fa (scadenza tra 25 giorni)
          
          const dataScadenza = new Date(dataAcquisto);
          dataScadenza.setFullYear(dataScadenza.getFullYear() + 1);
          
          collab.dominio = {
            urlDominio: 'www.dominio-in-scadenza.it',
            dataAcquisto: dataAcquisto,
            dataScadenza: dataScadenza,
            alertInviato: false,
            novaAlertData: null
          };
          
          await collab.save();
          console.log('\n✅ Dominio IN SCADENZA creato per: ' + collab.cliente?.etichetta);
          console.log(`   Scade tra 25 giorni (${dataScadenza.toLocaleDateString('it-IT')})\n`);
        }
        await menuPrincipale();
        break;
        
      case '3':
        if (collaborazioni.length > 0) {
          const collab = collaborazioni[0];
          const oggi = new Date();
          const dataAcquisto = new Date(oggi);
          dataAcquisto.setDate(oggi.getDate() - 370); // 370 giorni fa (scaduto 5 giorni fa)
          
          const dataScadenza = new Date(dataAcquisto);
          dataScadenza.setFullYear(dataScadenza.getFullYear() + 1);
          
          collab.dominio = {
            urlDominio: 'www.dominio-scaduto.it',
            dataAcquisto: dataAcquisto,
            dataScadenza: dataScadenza,
            alertInviato: false,
            novaAlertData: null
          };
          
          await collab.save();
          console.log('\n✅ Dominio SCADUTO creato per: ' + collab.cliente?.etichetta);
          console.log(`   Scaduto 5 giorni fa (${dataScadenza.toLocaleDateString('it-IT')})\n`);
        }
        await menuPrincipale();
        break;
        
      case '4':
        await mostraCollaborazioni();
        await menuPrincipale();
        break;
        
      case '5':
        console.log('\n🔍 Test API in corso...\n');
        console.log('GET http://localhost:3000/api/domini/scadenze');
        console.log('GET http://localhost:3000/api/domini/scadenze?onlyExpiring=true');
        console.log('\n💡 Apri questi URL nel browser o usa:');
        console.log('   curl http://localhost:3000/api/domini/scadenze\n');
        await menuPrincipale();
        break;
        
      case '0':
        console.log('\n👋 Chiusura...\n');
        await mongoose.connection.close();
        rl.close();
        break;
        
      default:
        console.log('❌ Opzione non valida');
        await menuPrincipale();
    }
  });
}

// Avvio script
async function main() {
  await connectToDB();
  await menuPrincipale();
}

main().catch(console.error);
