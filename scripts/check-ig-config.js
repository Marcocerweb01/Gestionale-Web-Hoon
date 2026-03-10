/**
 * Verifica configurazione Instagram Business Account
 */

import dotenv from 'dotenv';
import { connectToDB } from '../utils/database.js';

dotenv.config({ path: '.env.local' });

async function checkIGConfig() {
  console.log('🔍 VERIFICA CONFIGURAZIONE INSTAGRAM BUSINESS\n');

  try {
    await connectToDB();
    
    const { default: SocialAccount } = await import('../models/SocialAccount.js');
    
    const account = await SocialAccount.findOne({ 
      username: 'engyhub',
      platform: 'instagram'
    });
    
    if (!account) {
      console.log('❌ Account non trovato');
      process.exit(1);
    }
    
    console.log('✅ Account trovato: @' + account.username);
    console.log('   ID: ' + account.accountId);
    console.log('');
    
    // 1. Verifica tipo account
    console.log('1️⃣ Verifica tipo account...');
    const meUrl = `https://graph.instagram.com/v21.0/${account.accountId}?fields=id,username,name,account_type,profile_picture_url&access_token=${account.accessToken}`;
    const meRes = await fetch(meUrl);
    const meData = await meRes.json();
    
    console.log('   Risposta:', JSON.stringify(meData, null, 2));
    
    if (meData.error) {
      console.log('   ❌ Errore:', meData.error.message);
      process.exit(1);
    }
    
    console.log('   ✅ Account Type:', meData.account_type || 'N/A');
    console.log('');
    
    // 2. Verifica webhook subscriptions
    console.log('2️⃣ Verifica sottoscrizioni webhook...');
    const subsUrl = `https://graph.instagram.com/v21.0/${account.accountId}/subscribed_apps?access_token=${account.accessToken}`;
    const subsRes = await fetch(subsUrl);
    const subsData = await subsRes.json();
    
    console.log('   Risposta:', JSON.stringify(subsData, null, 2));
    
    if (subsData.data && subsData.data.length > 0) {
      console.log('   ✅ Webhook sottoscritti');
      subsData.data.forEach(app => {
        console.log(`      App: ${app.id}`);
        console.log(`      Fields: ${app.subscribed_fields?.join(', ') || 'nessuno'}`);
      });
    } else {
      console.log('   ❌ Nessun webhook sottoscritto!');
    }
    console.log('');
    
    // 3. Verifica permessi app
    console.log('3️⃣ Verifica permessi Meta App...');
    const debugUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${account.accessToken}&access_token=${account.accessToken}`;
    const debugRes = await fetch(debugUrl);
    const debugData = await debugRes.json();
    
    if (debugData.data) {
      console.log('   App ID:', debugData.data.app_id);
      console.log('   Scopes:', debugData.data.scopes?.join(', ') || 'N/A');
      console.log('   Valid:', debugData.data.is_valid ? '✅ Sì' : '❌ No');
      console.log('   User ID:', debugData.data.user_id);
    }
    console.log('');
    
    // 4. Test webhook manuale
    console.log('4️⃣ Test: Ottengo i commenti recenti...');
    const mediaUrl = `https://graph.instagram.com/v21.0/${account.accountId}/media?fields=id,caption,timestamp,media_type&limit=5&access_token=${account.accessToken}`;
    const mediaRes = await fetch(mediaUrl);
    const mediaData = await mediaRes.json();
    
    if (mediaData.data && mediaData.data.length > 0) {
      console.log(`   ✅ Trovati ${mediaData.data.length} post recenti`);
      
      const firstMedia = mediaData.data[0];
      console.log(`   \n   Post più recente: ${firstMedia.id}`);
      console.log(`   Caption: ${firstMedia.caption?.substring(0, 50) || 'N/A'}...`);
      
      // Ottieni commenti del post
      const commentsUrl = `https://graph.instagram.com/v21.0/${firstMedia.id}/comments?fields=id,text,username,timestamp&access_token=${account.accessToken}`;
      const commentsRes = await fetch(commentsUrl);
      const commentsData = await commentsRes.json();
      
      if (commentsData.data && commentsData.data.length > 0) {
        console.log(`   \n   ✅ Trovati ${commentsData.data.length} commenti sul post:`);
        commentsData.data.slice(0, 3).forEach(comment => {
          console.log(`      - @${comment.username}: "${comment.text}"`);
        });
      } else {
        console.log('   ⚠️ Nessun commento su questo post');
      }
    } else {
      console.log('   ⚠️ Nessun post trovato per questo account');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 RIEPILOGO:\n');
    console.log('Se tutto sopra ha ✅:');
    console.log('- Account configurato correttamente');
    console.log('- Webhook sottoscritti');
    console.log('- Token valido');
    console.log('\nMA i webhook non arrivano per i commenti reali?');
    console.log('\n💡 POSSIBILI CAUSE:');
    console.log('1. App non pubblicata + Ritardo Meta (può impiegare fino a 15 min)');
    console.log('2. Account non è "Business Account" (deve essere convertito)');
    console.log('3. Meta ha problemi tecnici (controlla status.fb.com)');
    console.log('4. Webhook configurato su Meta App Dashboard ma eventi non selezionati');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    process.exit(0);
  }
}

checkIGConfig();
