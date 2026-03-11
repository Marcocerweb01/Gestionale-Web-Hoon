/**
 * Diagnosi completa del problema webhook
 * Verifica ESATTAMENTE perché il webhook non arriva da Meta
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function diagnose() {
  console.log('🔍 DIAGNOSI WEBHOOK - Perché test funziona ma commenti no?\n');
  console.log('=' .repeat(70) + '\n');

  // 1. VERIFICA APP META
  console.log('1️⃣  CONFIGURAZIONE APP META');
  console.log('   ▶ Apri: https://developers.facebook.com/apps/1793479563907662/webhooks/');
  console.log('   ▶ Verifica che ci sia:');
  console.log('     ✓ Callback URL: https://gestionale-web-hoon-production.up.railway.app/api/webhook/social');
  console.log('     ✓ Verify Token: svvfdgddfgsdfhgdfghwe5tw45245twegg2345adTVQ3');
  console.log('     ✓ Instagram > Fields selezionati: comments, messages\n');

  // 2. VERIFICA SOTTOSCRIZIONE ACCOUNT
  console.log('2️⃣  SOTTOSCRIZIONE ACCOUNT @engyhub');
  const accountId = '26568886856060968'; // @engyhub
  
  // Prendi il token dal database
  const { connectToDB } = await import('../utils/database.js');
  await connectToDB();
  const { default: SocialAccount } = await import('../models/SocialAccount.js');
  
  const account = await SocialAccount.findOne({ username: 'engyhub' });
  if (!account) {
    console.log('   ❌ Account non trovato nel database\n');
    process.exit(1);
  }

  const token = account.accessToken;
  console.log('   Token: ' + token.substring(0, 30) + '...');

  // Verifica sottoscrizione
  const subsUrl = `https://graph.instagram.com/v21.0/${accountId}/subscribed_apps?access_token=${token}`;
  try {
    const subsRes = await fetch(subsUrl);
    const subsData = await subsRes.json();
    
    if (subsData.error) {
      console.log('   ❌ ERRORE:', subsData.error.message);
      if (subsData.error.code === 190) {
        console.log('   💀 TOKEN SCADUTO! Devi riconnettere l\'account.\n');
        process.exit(1);
      }
    } else {
      console.log('   ✅ Sottoscrizioni attive:', JSON.stringify(subsData, null, 2));
    }
  } catch (err) {
    console.log('   ❌ Errore chiamata API:', err.message);
  }
  console.log('');

  // 3. TEST ENDPOINT
  console.log('3️⃣  TEST ENDPOINT WEBHOOK');
  console.log('   ▶ Test GET (verifica):');
  const testUrl = 'https://gestionale-web-hoon-production.up.railway.app/api/webhook/social?hub.mode=subscribe&hub.verify_token=svvfdgddfgsdfhgdfghwe5tw45245twegg2345adTVQ3&hub.challenge=test123';
  
  try {
    const testRes = await fetch(testUrl);
    const testText = await testRes.text();
    console.log(`     Status: ${testRes.status} - Body: ${testText}`);
    
    if (testRes.status === 200 && testText === 'test123') {
      console.log('     ✅ Endpoint risponde correttamente\n');
    } else {
      console.log('     ❌ Endpoint NON risponde bene\n');
    }
  } catch (err) {
    console.log('     ❌ Endpoint non raggiungibile:', err.message, '\n');
  }

  // 4. TEST POST (simula webhook reale)
  console.log('4️⃣  TEST POST (simula webhook di Meta)');
  const webhookPayload = {
    object: 'instagram',
    entry: [{
      id: accountId,
      time: Date.now(),
      changes: [{
        field: 'comments',
        value: {
          id: '18431642537103756',
          text: 'info',
          from: {
            id: '17841465960948978',
            username: 'marcocerasaa_'
          },
          media: {
            id: '17938816290160632',
            media_product_type: 'FEED'
          }
        }
      }]
    }]
  };

  console.log('   Payload:', JSON.stringify(webhookPayload, null, 2));
  console.log('   ▶ Invio POST...');

  try {
    const postRes = await fetch('https://gestionale-web-hoon-production.up.railway.app/api/webhook/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });
    
    const postData = await postRes.json();
    console.log(`     Status: ${postRes.status}`);
    console.log('     Risposta:', JSON.stringify(postData, null, 2));
    
    if (postRes.status === 200) {
      console.log('     ✅ POST processato correttamente\n');
    } else {
      console.log('     ❌ POST ha errori\n');
    }
  } catch (err) {
    console.log('     ❌ Errore POST:', err.message, '\n');
  }

  // 5. VERIFICA PERMESSI TOKEN
  console.log('5️⃣  PERMESSI TOKEN');
  const debugUrl = `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`;
  
  try {
    const debugRes = await fetch(debugUrl);
    const debugData = await debugRes.json();
    
    if (debugData.data) {
      console.log('   App ID:', debugData.data.app_id);
      console.log('   Scadenza:', debugData.data.expires_at ? new Date(debugData.data.expires_at * 1000) : 'Mai (long-lived)');
      console.log('   Permessi:', debugData.data.scopes?.join(', ') || 'N/A');
      console.log('   Valido:', debugData.data.is_valid ? '✅' : '❌');
    }
  } catch (err) {
    console.log('   ❌ Errore verifica token:', err.message);
  }
  console.log('\n');

  // 6. CONCLUSIONE
  console.log('=' .repeat(70));
  console.log('📋 CHECKLIST PROBLEMI COMUNI:\n');
  console.log('❓ L\'app Meta è in DEVELOPMENT MODE?');
  console.log('   → I webhook in dev mode hanno ritardi 30-60 min e sono inaffidabili');
  console.log('   → Prova a commentare "info" su un POST NUOVO (creato oggi)\n');
  
  console.log('❓ Il webhook URL è salvato correttamente su Meta?');
  console.log('   → Vai su https://developers.facebook.com/apps/1793479563907662/webhooks/');
  console.log('   → Clicca "Edit" su Instagram e verifica l\'URL\n');
  
  console.log('❓ Hai selezionato il campo "comments" sugli eventi?');
  console.log('   → Deve essere spuntato "comments" nella configurazione webhook\n');
  
  console.log('❓ Stai commentando da un account TESTER?');
  console.log('   → L\'account deve essere aggiunto come tester nell\'app Meta\n');
  
  console.log('❓ Hai atteso abbastanza?');
  console.log('   → In dev mode può volerci fino a 1 ora per il primo webhook\n');
  
  console.log('=' .repeat(70));
  console.log('\n💡 PROSSIMI PASSI:');
  console.log('   1. Vai su Railway > Logs e cerca richieste da "instagram" o "69.171"');
  console.log('   2. Crea un NUOVO post su @engyhub (i webhook funzionano solo su post nuovi)');
  console.log('   3. Commenta "info" sul nuovo post');
  console.log('   4. Aspetta 5-10 minuti e ricontrolla i log Railway\n');
  
  process.exit(0);
}

diagnose().catch(console.error);
