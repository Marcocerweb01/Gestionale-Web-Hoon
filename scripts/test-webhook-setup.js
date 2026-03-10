/**
 * Script di diagnostica completa per webhook Instagram
 * 
 * Verifica:
 * 1. Webhook endpoint raggiungibile
 * 2. Account nel DB e token valido
 * 3. Sottoscrizione webhook attiva
 * 4. Automazioni configurate
 */

import dotenv from 'dotenv';
import { connectToDB } from '../utils/database.js';

dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXTAUTH_URL_PRODUCTION || 'https://gestionale-web-hoon-production.up.railway.app';

async function testWebhookSetup() {
  console.log('🔍 DIAGNOSTICA WEBHOOK INSTAGRAM\n');

  try {
    // 1. Test endpoint webhook
    console.log('1️⃣ Test endpoint webhook...');
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'your_verify_token_here';
    const webhookUrl = `${BASE_URL}/api/webhook/social?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test123`;
    
    console.log(`   URL: ${webhookUrl}`);
    const webhookRes = await fetch(webhookUrl);
    const webhookText = await webhookRes.text();
    
    if (webhookText === 'test123') {
      console.log('   ✅ Webhook endpoint risponde correttamente\n');
    } else {
      console.log(`   ❌ Webhook endpoint NON risponde correttamente. Risposta: ${webhookText}\n`);
      return;
    }

    // 2. Verifica account nel DB
    console.log('2️⃣ Verifica account Instagram nel database...');
    await connectToDB();
    
    const { default: SocialAccount } = await import('../models/SocialAccount.js');
    const { default: SocialAutomation } = await import('../models/SocialAutomation.js');
    
    const accounts = await SocialAccount.find({ platform: 'instagram', status: 'active' });
    
    if (accounts.length === 0) {
      console.log('   ❌ Nessun account Instagram attivo nel DB\n');
      return;
    }
    
    console.log(`   ✅ Trovati ${accounts.length} account Instagram attivi\n`);
    
    for (const account of accounts) {
      console.log(`   📱 Account: @${account.username}`);
      console.log(`      - ID DB: ${account._id}`);
      console.log(`      - accountId (Instagram Business ID): ${account.accountId}`);
      console.log(`      - Token presente: ${account.accessToken ? '✅' : '❌'}`);
      console.log(`      - Token expires: ${account.tokenExpires || 'N/A'}`);
      
      // 3. Verifica token valido
      console.log('\n3️⃣ Verifica token Meta valido...');
      const debugUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${account.accessToken}&access_token=${account.accessToken}`;
      
      try {
        const tokenRes = await fetch(debugUrl);
        const tokenData = await tokenRes.json();
        
        if (tokenData.data?.is_valid) {
          console.log('   ✅ Token valido');
          console.log(`      - App ID: ${tokenData.data.app_id}`);
          console.log(`      - Scopes: ${tokenData.data.scopes?.join(', ') || 'N/A'}`);
          console.log(`      - Scadenza: ${tokenData.data.expires_at ? new Date(tokenData.data.expires_at * 1000).toLocaleString() : 'Long-lived'}`);
        } else {
          console.log('   ❌ Token NON valido o scaduto');
          console.log(`      Errore: ${JSON.stringify(tokenData)}`);
        }
      } catch (err) {
        console.log(`   ⚠️ Errore verifica token: ${err.message}`);
      }
      
      // 4. Verifica sottoscrizioni webhook
      console.log('\n4️⃣ Verifica sottoscrizioni webhook Instagram...');
      const subsUrl = `https://graph.facebook.com/v21.0/${account.accountId}/subscribed_apps?access_token=${account.accessToken}`;
      
      try {
        const subsRes = await fetch(subsUrl);
        const subsData = await subsRes.json();
        
        if (subsData.data && subsData.data.length > 0) {
          console.log('   ✅ Account sottoscritto ai webhook');
          subsData.data.forEach(app => {
            console.log(`      - App: ${app.id}`);
            console.log(`        Subscribed fields: ${app.subscribed_fields?.join(', ') || 'N/A'}`);
          });
        } else {
          console.log('   ❌ Account NON sottoscritto ai webhook');
          console.log('   💡 Soluzione: Vai su /Operations/SocialAutomation e clicca "Sottoscrivi webhook"');
        }
      } catch (err) {
        console.log(`   ⚠️ Errore verifica sottoscrizioni: ${err.message}`);
      }
      
      // 5. Verifica automazioni
      console.log('\n5️⃣ Verifica automazioni attive...');
      const automations = await SocialAutomation.find({
        accountId: account._id,
        status: 'active'
      });
      
      if (automations.length === 0) {
        console.log('   ⚠️ Nessuna automazione attiva per questo account');
      } else {
        console.log(`   ✅ ${automations.length} automazioni attive:`);
        automations.forEach(auto => {
          console.log(`      - "${auto.name}"`);
          console.log(`        Type: ${auto.type}`);
          console.log(`        Keywords: ${auto.trigger?.keywords?.join(', ') || 'nessuna'}`);
          console.log(`        Action: ${auto.action?.actionType} - "${auto.action?.message?.substring(0, 50)}..."`);
        });
      }
      
      console.log('\n' + '─'.repeat(80) + '\n');
    }
    
    // 6. Riepilogo finale
    console.log('\n📋 RIEPILOGO:');
    console.log('Se tutti i check sono ✅ ma i webhook non arrivano:');
    console.log('1. Verifica su Meta for Developers → Webhooks che il callback URL sia configurato');
    console.log('2. Controlla che gli eventi "comments" siano selezionati per Instagram');
    console.log('3. Testa inviando un webhook di prova da Meta Dashboard');
    console.log('4. Controlla i log su Railway per vedere se arrivano richieste\n');
    
  } catch (error) {
    console.error('❌ Errore durante la diagnostica:', error);
  } finally {
    process.exit(0);
  }
}

testWebhookSetup();
