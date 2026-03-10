import dotenv from 'dotenv';
import { connectToDB } from '../utils/database.js';

dotenv.config({ path: '.env.local' });

async function listAllAccounts() {
  console.log('📋 TUTTI GLI ACCOUNT SOCIAL NEL DATABASE\n');

  try {
    await connectToDB();
    
    const { default: SocialAccount } = await import('../models/SocialAccount.js');
    
    const accounts = await SocialAccount.find({}).sort({ createdAt: -1 });
    
    console.log(`Totale account: ${accounts.length}\n`);
    
    accounts.forEach((account, i) => {
      console.log(`${i + 1}. @${account.username} (${account.platform})`);
      console.log(`   - ID DB: ${account._id}`);
      console.log(`   - accountId: ${account.accountId}`);
      console.log(`   - Status: ${account.status}`);
      console.log(`   - Token: ${account.accessToken?.substring(0, 20)}...`);
      console.log(`   - Token scadenza: ${account.tokenExpires || 'N/A'}`);
      console.log(`   - Creato: ${account.createdAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    process.exit(0);
  }
}

listAllAccounts();
