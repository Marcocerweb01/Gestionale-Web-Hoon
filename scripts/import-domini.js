/**
 * Script di importazione domini
 * Esegui con: node scripts/import-domini.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI non trovato nel file .env.local');
  process.exit(1);
}

const DominioSchema = new mongoose.Schema(
  {
    urlDominio: { type: String, required: true, trim: true },
    dataScadenza: { type: Date, required: true },
    webDesigner: { type: String, required: true, trim: true },
    isEsterno: { type: Boolean, default: false },
    note: { type: String, default: '' },
    alertInviato: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const domini = [
  { urlDominio: 'escaperoomviterbo.it',           dataScadenza: '2027-05-03', webDesigner: 'Marco' },
  { urlDominio: 'fmfitness.it',                   dataScadenza: '2026-09-15', webDesigner: 'Marco' },
  { urlDominio: 'hoonweb.it',                     dataScadenza: '2026-07-21', webDesigner: 'Marco' },
  { urlDominio: 'hoonwebarea.it',                 dataScadenza: '2027-01-23', webDesigner: 'Marco' },
  { urlDominio: 'ilmolinoviterbo.it',             dataScadenza: '2026-08-07', webDesigner: 'Marco' },
  { urlDominio: 'labartolomea.it',                dataScadenza: '2026-07-10', webDesigner: 'Marco' },
  { urlDominio: 'agriturismocerrosughero.it',     dataScadenza: '2026-10-10', webDesigner: 'Giulia' },
  { urlDominio: 'arkomarredi.com',                dataScadenza: '2027-05-13', webDesigner: 'Marco' },
  { urlDominio: 'aziendagricolacquarossa.it',     dataScadenza: '2026-10-28', webDesigner: 'Marco' },
  { urlDominio: 'capetownkiteschool.com',         dataScadenza: '2026-08-31', webDesigner: 'Marco' },
  { urlDominio: 'debbystore.it',                  dataScadenza: '2027-05-06', webDesigner: 'Marco' },
  { urlDominio: 'dimarcosport.it',                dataScadenza: '2026-07-17', webDesigner: 'Marco' },
  { urlDominio: 'duka-management.com',            dataScadenza: '2027-04-20', webDesigner: 'Giulia', isEsterno: true, note: 'Dominio esterno' },
  { urlDominio: 'elettronicamix.it',              dataScadenza: '2027-01-17', webDesigner: 'Marco' },
  { urlDominio: 'erboristeriashaoyang.it',        dataScadenza: '2026-11-25', webDesigner: 'Giulia' },
  { urlDominio: 'lachinesiologasara.it',          dataScadenza: '2027-03-17', webDesigner: 'Marco' },
  { urlDominio: 'lacortenepi.it',                 dataScadenza: '2027-04-08', webDesigner: 'Marco' },
  { urlDominio: 'lasostadelsuffragio.it',         dataScadenza: '2027-01-29', webDesigner: 'Marco' },
  { urlDominio: 'letermeromanedelbacucco.com',    dataScadenza: '2026-08-29', webDesigner: 'Giulia' },
  { urlDominio: 'letermeromanedelbacucco.it',     dataScadenza: '2026-08-29', webDesigner: 'Giulia' },
  { urlDominio: 'magpulsolution.it',              dataScadenza: '2026-07-11', webDesigner: 'Marco' },
  { urlDominio: 'nadiamazzocchi.it',              dataScadenza: '2026-08-07', webDesigner: 'Marco' },
  { urlDominio: 'oliochecco.it',                  dataScadenza: '2026-11-11', webDesigner: 'Marco' },
  { urlDominio: 'pathloveweb.com',                dataScadenza: '2027-04-15', webDesigner: 'Marco' },
  { urlDominio: 'piccolaformaggeriaartigiana.com',dataScadenza: '2026-12-13', webDesigner: 'Marco' },
  { urlDominio: 'sabatinisport.it',               dataScadenza: '2026-12-11', webDesigner: 'Giulia' },
  { urlDominio: 'sautoviterbo.it',                dataScadenza: '2026-06-05', webDesigner: 'Marco' },
  { urlDominio: 'tenutacasciani.com',             dataScadenza: '2026-07-22', webDesigner: 'Marco' },
  { urlDominio: 'termeromanedelbacucco.it',       dataScadenza: '2026-05-23', webDesigner: 'Giulia' },
  { urlDominio: 'traldiresort.it',                dataScadenza: '2027-04-13', webDesigner: 'Giulia' },
  { urlDominio: 'veronicacasanova.it',            dataScadenza: '2027-03-05', webDesigner: 'Marco' },
  { urlDominio: 'villakaimarrakech.com',          dataScadenza: '2026-11-25', webDesigner: 'Giulia' },
  { urlDominio: 'viterbolasergame.it',            dataScadenza: '2026-10-28', webDesigner: 'Marco' },
];

async function importa() {
  await mongoose.connect(MONGODB_URI, { dbName: 'Webarea' });
  console.log('✅ Connesso al database');

  const Dominio = mongoose.model('Dominio', DominioSchema);

  let inseriti = 0;
  let saltati = 0;

  for (const d of domini) {
    const esistente = await Dominio.findOne({ urlDominio: d.urlDominio });
    if (esistente) {
      console.log(`⏭️  Già presente: ${d.urlDominio}`);
      saltati++;
    } else {
      await Dominio.create(d);
      console.log(`✅ Inserito: ${d.urlDominio} (${d.webDesigner}) - scade ${d.dataScadenza}`);
      inseriti++;
    }
  }

  console.log(`\n🎉 Importazione completata: ${inseriti} inseriti, ${saltati} già presenti`);
  await mongoose.disconnect();
}

importa().catch(err => {
  console.error('❌ Errore:', err);
  process.exit(1);
});
