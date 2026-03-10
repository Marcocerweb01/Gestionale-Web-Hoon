/**
 * Verifica sottoscrizione esatta agli eventi webhook per account Instagram
 */

import dotenv from 'dotenv';
import { connectToDB } from '../utils/database.js';

dotenv.config({ path: '.env.local' });

async function verifyWebhookSubscription() {
  console.log('🔍 VERIFICA SOTTOSCRIZIONE WEBHOOK DETTAGLIATA\n');

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
    
    console.log('✅ Account: @' + account.username);
    console.log('   ID Instagram: ' + account.accountId);
    console.log('   Token: ' + account.accessToken.substring(0, 30) + '...\n');
    
    // 1. Verifica sottoscrizioni correnti
    console.log('1️⃣ Sottoscrizioni webhook correnti:');
    console.log('   URL: https://graph.instagram.com/v21.0/' + account.accountId + '/subscribed_apps\n');
    
    const subsUrl = `https://graph.instagram.com/v21.0/${account.accountId}/subscribed_apps?access_token=${account.accessToken}`;
    const subsRes = await fetch(subsUrl);
    const subsData = await subsRes.json();
    
    console.log('   Risposta completa:', JSON.stringify(subsData, null, 2));
    
    if (subsData.error) {
      console.log('\n❌ ERRORE:', subsData.error.message);
      console.log('   Codice:', subsData.error.code);
      console.log('   Tipo:', subsData.error.type);
      
      if (subsData.error.code === 190) {
        console.log('\n💡 Token scaduto! Riconnetti l\'account.');
      } else if (subsData.error.code === 100) {
        console.log('\n💡 Permessi insufficienti o account non valido.');
      }
      process.exit(1);
    }
    
    if (!subsData.data || subsData.data.length === 0) {
      console.log('\n❌ PROBLEMA TROVATO: Account NON sottoscritto a nessuna app!');
      console.log('\n💡 SOLUZIONE: Esegui la sottoscrizione manuale...\n');
      
      // Prova a sottoscrivere ora
      console.log('2️⃣ Tento di sottoscrivere adesso...');
      const subscribeUrl = `https://graph.instagram.com/v21.0/${account.accountId}/subscribed_apps`;
      const subscribeBody = new URLSearchParams({
        subscribed_fields: 'comments,messages,messaging_postbacks,messaging_optins,message_reactions',
        access_token: account.accessToken
      });
      
      const subscribeRes = await fetch(subscribeUrl, {
        method: 'POST',
        body: subscribeBody
      });
      
      const subscribeData = await subscribeRes.json();
      console.log('   Risposta:', JSON.stringify(subscribeData, null, 2));
      
      if (subscribeData.success) {
        console.log('\n✅ SOTTOSCRIZIONE RIUSCITA!');
        console.log('\n⏰ IMPORTANTE: Aspetta 10-15 minuti prima di testare.');
        console.log('   Meta ha bisogno di tempo per attivare i webhook.\n');
      } else {
        console.log('\n❌ Sottoscrizione fallita:', subscribeData);
      }
      
    } else {
      console.log('\n✅ Account SOTTOSCRITTO agli eventi webhook!');
      subsData.data.forEach(app => {
        console.log('\n   📱 App sottoscritta:');
        console.log('      App ID:', app.id);
        console.log('      Eventi:', app.subscribed_fields?.join(', ') || 'nessuno');
        
        if (!app.subscribed_fields || !app.subscribed_fields.includes('comments')) {
          console.log('\n   ⚠️ ATTENZIONE: "comments" NON è negli eventi sottoscritti!');
          console.log('   Gli eventi sottoscritti sono:', app.subscribed_fields);
          console.log('\n   💡 Devi aggiungere "comments" alla sottoscrizione.');
        }
      });
    }
    
    // 3. Test API per vedere se possiamo leggere i commenti
    console.log('\n\n3️⃣ Test: Verifica se posso leggere i commenti via API...');
    const mediaUrl = `https://graph.instagram.com/v21.0/${account.accountId}/media?fields=id,caption,comments_count&limit=1&access_token=${account.accessToken}`;
    const mediaRes = await fetch(mediaUrl);
    const mediaData = await mediaRes.json();
    
    if (mediaData.data && mediaData.data.length > 0) {
      const post = mediaData.data[0];
      console.log('   ✅ Posso leggere i post');
      console.log('      Post ID:', post.id);
      console.log('      Caption:', post.caption?.substring(0, 50) || 'N/A');
      console.log('      Commenti:', post.comments_count || 0);
      
      // Prova a leggere i commenti
      const commentsUrl = `https://graph.instagram.com/v21.0/${post.id}/comments?access_token=${account.accessToken}`;
      const commentsRes = await fetch(commentsUrl);
      const commentsData = await commentsRes.json();
      
      if (commentsData.data) {
        console.log('   ✅ Posso leggere i commenti via API');
        console.log('      Commenti trovati:', commentsData.data.length);
        
        if (commentsData.data.length > 0) {
          console.log('\n      Esempio ultimo commento:');
          const lastComment = commentsData.data[0];
          console.log('         Testo:', lastComment.text);
          console.log('         Username:', lastComment.username);
        }
      } else {
        console.log('   ⚠️ Non posso leggere i commenti:', commentsData.error?.message);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 DIAGNOSI FINALE:\n');
    console.log('Se vedi "Account NON sottoscritto" sopra → Devi sottoscrivere');
    console.log('Se vedi "comments NON è negli eventi sottoscritti" → Devi aggiungere "comments"');
    console.log('Se tutto è ✅ ma i webhook non arrivano → Aspetta 15-30 minuti (ritardo Meta)\n');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    process.exit(0);
  }
}

verifyWebhookSubscription();
