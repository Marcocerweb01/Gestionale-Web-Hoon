// Script per aggiornare l'account Instagram con l'IGID (vecchio formato)
// necessario per il matching dei webhook Meta
//
// Uso: node scripts/fix-ig-account-ids.js

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const SocialAccountSchema = new mongoose.Schema({
  accountId: String,
  username: String,
  platform: String,
  accessToken: String,
  status: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { strict: false });

const SocialAccount = mongoose.model('SocialAccount', SocialAccountSchema);

async function fixIgAccountIds() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connesso al DB');

  const igAccounts = await SocialAccount.find({ platform: 'instagram', status: 'active' });
  console.log(`Trovati ${igAccounts.length} account Instagram attivi`);

  for (const account of igAccounts) {
    console.log(`\n--- @${account.username} (accountId: ${account.accountId}) ---`);
    
    if (account.metadata?.igUserId) {
      console.log(`  IGID già salvato: ${account.metadata.igUserId}`);
      continue;
    }

    // Chiedi a Instagram l'IGID (user_id nel vecchio formato)
    try {
      const res = await fetch(
        `https://graph.instagram.com/v21.0/me?fields=id,username,user_id&access_token=${account.accessToken}`
      );
      const data = await res.json();
      
      if (data.error) {
        console.log(`  ERRORE token: ${data.error.message}`);
        continue;
      }

      console.log(`  IGSID (id): ${data.id}`);
      console.log(`  IGID (user_id): ${data.user_id}`);

      if (data.user_id) {
        account.metadata = { ...account.metadata, igUserId: data.user_id };
        await account.save();
        console.log(`  ✅ Salvato igUserId: ${data.user_id}`);
      } else {
        console.log(`  ⚠️ user_id non disponibile`);
      }
    } catch (e) {
      console.log(`  ERRORE: ${e.message}`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDone!');
}

fixIgAccountIds();
