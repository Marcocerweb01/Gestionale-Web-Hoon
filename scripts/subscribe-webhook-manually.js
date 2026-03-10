/**
 * Script per sottoscrivere manualmente l'account Instagram ai webhook
 */

import dotenv from 'dotenv';
import { connectToDB } from '../utils/database.js';

dotenv.config({ path: '.env.local' });

async function subscribeWebhook() {
  console.log('🔔 SOTTOSCRIZIONE WEBHOOK INSTAGRAM\n');

  try {
    await connectToDB();
    
    const { default: SocialAccount } = await import('../models/SocialAccount.js');
    
    // Trova l'account engyhub
    const account = await SocialAccount.findOne({ 
      username: 'engyhub',
      platform: 'instagram'
    });
    
    if (!account) {
      console.log('❌ Account @engyhub non trovato nel DB');
      process.exit(1);
    }
    
    console.log('✅ Account trovato:');
    console.log(`   Username: @${account.username}`);
    console.log(`   ID Instagram Business: ${account.accountId}`);
    console.log(`   Token presente: ${account.accessToken ? 'Sì' : 'No'}`);
    console.log('');
    
    // Sottoscrivi l'account ai webhook
    console.log('📡 Sottoscrizione webhook...');
    
    const subscribeUrl = `https://graph.instagram.com/v21.0/${account.accountId}/subscribed_apps`;
    const subscribeBody = new URLSearchParams({
      subscribed_fields: 'comments,messages,messaging_postbacks,messaging_optins,message_reactions',
      access_token: account.accessToken
    });
    
    console.log(`   URL: ${subscribeUrl}`);
    console.log(`   Fields: comments,messages,messaging_postbacks,messaging_optins,message_reactions`);
    console.log('');
    
    const subscribeRes = await fetch(subscribeUrl, {
      method: 'POST',
      body: subscribeBody
    });
    
    const subscribeData = await subscribeRes.json();
    console.log('📋 Risposta sottoscrizione:', JSON.stringify(subscribeData, null, 2));
    
    if (subscribeData.success) {
      console.log('\n✅ WEBHOOK SOTTOSCRITTO CON SUCCESSO!\n');
    } else {
      console.log('\n❌ ERRORE NELLA SOTTOSCRIZIONE');
      console.log('   Dettagli:', subscribeData);
      
      if (subscribeData.error) {
        console.log('\n💡 Possibili cause:');
        if (subscribeData.error.code === 190) {
          console.log('   - Token scaduto o non valido → Riconnetti l\'account');
        } else if (subscribeData.error.code === 200) {
          console.log('   - Permessi mancanti → Verifica i permessi nella Meta App');
        }
      }
    }
    
    // Verifica sottoscrizione
    console.log('\n🔍 Verifica sottoscrizione attuale...');
    const checkUrl = `https://graph.instagram.com/v21.0/${account.accountId}/subscribed_apps?access_token=${account.accessToken}`;
    const checkRes = await fetch(checkUrl);
    const checkData = await checkRes.json();
    
    console.log('📋 Sottoscrizioni attive:', JSON.stringify(checkData, null, 2));
    
    if (checkData.data && checkData.data.length > 0) {
      console.log('\n✅ Account correttamente sottoscritto agli eventi webhook!');
      checkData.data.forEach(app => {
        console.log(`   App ID: ${app.id}`);
        console.log(`   Fields: ${app.subscribed_fields?.join(', ') || 'nessuno'}`);
      });
    } else {
      console.log('\n❌ Account NON sottoscritto ai webhook');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    process.exit(0);
  }
}

subscribeWebhook();
