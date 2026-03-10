import { connectToDB } from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import SocialAutomation from '@/models/SocialAutomation';
import mongoose from 'mongoose';

// Salva gli ultimi commenti processati per evitare duplicati
const processedComments = new Set();

async function sendDM(igUserId, recipientId, message, accessToken, commentId) {
  const url = `https://graph.instagram.com/v21.0/${igUserId}/messages`;
  const body = commentId 
    ? { recipient: { comment_id: commentId }, message: { text: message } }
    : { recipient: { id: recipientId }, message: { text: message } };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return await res.json();
}

function matchesKeywords(text, keywords) {
  if (!keywords || keywords.length === 0) return true;
  const lowerText = text.toLowerCase();
  return keywords.some(k => lowerText.includes(k.toLowerCase()));
}

export async function GET(req) {
  try {
    console.log('🔄 [POLLING] Controllo nuovi commenti...');
    
    await connectToDB();
    
    // Trova tutti gli account Instagram attivi
    const accounts = await SocialAccount.find({ 
      platform: 'instagram', 
      status: 'active' 
    });
    
    if (accounts.length === 0) {
      return Response.json({ status: 'no_accounts' });
    }
    
    let totalProcessed = 0;
    
    for (const account of accounts) {
      console.log(`📱 [POLLING] Check account: @${account.username}`);
      
      // Trova automazioni attive
      const automations = await SocialAutomation.find({
        accountId: account._id,
        status: 'active',
        type: { $in: ['comment_reply', 'dm_auto'] }
      });
      
      if (automations.length === 0) continue;
      
      // Ottieni ultimi 10 post
      const mediaUrl = `https://graph.instagram.com/v21.0/${account.accountId}/media?fields=id&limit=10&access_token=${account.accessToken}`;
      const mediaRes = await fetch(mediaUrl);
      const mediaData = await mediaRes.json();
      
      if (!mediaData.data) continue;
      
      // Per ogni post, controlla i commenti
      for (const media of mediaData.data) {
        const commentsUrl = `https://graph.instagram.com/v21.0/${media.id}/comments?fields=id,text,username,from,timestamp&access_token=${account.accessToken}`;
        const commentsRes = await fetch(commentsUrl);
        const commentsData = await commentsRes.json();
        
        if (!commentsData.data) continue;
        
        // Processa i commenti
        for (const comment of commentsData.data) {
          const commentKey = `${comment.id}`;
          
          // Skip se già processato
          if (processedComments.has(commentKey)) continue;
          
          console.log(`💬 [POLLING] Nuovo commento da @${comment.username}: "${comment.text}"`);
          
          // Check automazioni
          for (const auto of automations) {
            if (!matchesKeywords(comment.text, auto.trigger?.keywords)) continue;
            
            console.log(`✅ [POLLING] Match automazione: ${auto.name}`);
            
            const actionType = auto.action?.actionType || 'send_dm';
            const message = auto.action?.message;
            
            if (!message) continue;
            
            if (actionType === 'send_dm' || actionType === 'both') {
              const result = await sendDM(
                account.accountId,
                comment.from?.id,
                message,
                account.accessToken,
                comment.id
              );
              
              console.log(`📤 [POLLING] DM inviato:`, result);
              
              if (result.recipient_id || result.message_id) {
                // Aggiorna stats
                await SocialAutomation.findByIdAndUpdate(auto._id, {
                  $inc: { 'stats.triggered': 1, 'stats.successful': 1 },
                  lastTriggered: new Date()
                });
                
                totalProcessed++;
              }
            }
            
            // Segna come processato
            processedComments.add(commentKey);
            
            // Mantieni solo ultimi 1000 commenti in memoria
            if (processedComments.size > 1000) {
              const first = processedComments.values().next().value;
              processedComments.delete(first);
            }
          }
        }
      }
    }
    
    console.log(`✅ [POLLING] Completato. Processati: ${totalProcessed}`);
    
    return Response.json({ 
      status: 'ok', 
      processed: totalProcessed,
      accounts: accounts.length
    });
    
  } catch (error) {
    console.error('❌ [POLLING] Errore:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
