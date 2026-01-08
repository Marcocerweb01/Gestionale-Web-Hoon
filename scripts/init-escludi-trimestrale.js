const mongoose = require('mongoose');

async function init() {
  await mongoose.connect('mongodb+srv://Hoonmaster:Camaro1983!@cluster0.k1sdf.mongodb.net/Webarea?retryWrites=true&w=majority');
  console.log('Connesso al database Webarea');
  
  const db = mongoose.connection.db;
  
  // Prima imposta false per tutte le collaborazioni
  const resultFalse = await db.collection('collaboraziones').updateMany(
    {},
    { $set: { escludi_reset_trimestrale: false } }
  );
  console.log('Collaborazioni impostate a false:', resultFalse.modifiedCount);
  
  // Poi imposta true solo per quella specifica
  const resultTrue = await db.collection('collaboraziones').updateOne(
    { _id: new mongoose.Types.ObjectId('6957f379b717e375d6e4cb5d') },
    { $set: { escludi_reset_trimestrale: true } }
  );
  console.log('Collaborazione specifica impostata a true:', resultTrue.modifiedCount);
  
  // Verifica
  const excluded = await db.collection('collaboraziones').findOne(
    { _id: new mongoose.Types.ObjectId('6957f379b717e375d6e4cb5d') },
    { projection: { aziendaRagioneSociale: 1, escludi_reset_trimestrale: 1 } }
  );
  console.log('Verifica collaborazione esclusa:', excluded);
  
  // Conta quelle escluse
  const countExcluded = await db.collection('collaboraziones').countDocuments({ escludi_reset_trimestrale: true });
  console.log('Totale collaborazioni escluse:', countExcluded);
  
  await mongoose.disconnect();
  console.log('Disconnesso');
}

init().catch(console.error);
