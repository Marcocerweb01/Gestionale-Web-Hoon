import { connectToDB } from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import SocialAutomation from '@/models/SocialAutomation';
import mongoose from 'mongoose';

// Salva gli ultimi commenti processati per evitare duplicati
const processedComments = new Set();

async function sendDM(platform, igUserId, recipientId, message, accessToken, commentId) {
  if (platform === 'instagram') {
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
  } else {
    // Facebook page
    const url = `https://graph.facebook.com/v21.0/${igUserId}/messages`;
    const body = {
      recipient: { id: recipientId },
      message: { text: message },
      access_token: accessToken,
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  }
}

async function replyToComment(platform, commentId, message, accessToken) {
  let url, headers, body;
  if (platform === 'instagram') {
    url = `https://graph.instagram.com/v21.0/${commentId}/replies`;
    body = { message };
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
  } else {
    url = `https://graph.facebook.com/v21.0/${commentId}/comments`;
    body = { message, access_token: accessToken };
    headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
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
    
    // Trova tutti gli account attivi (Instagram e Facebook)
    const accounts = await SocialAccount.find({ 
      status: 'active' 
    });
    
    if (accounts.length === 0) {
      return Response.json({ status: 'no_accounts' });
    }
    
    let totalProcessed = 0;
    
    for (const account of accounts) {
      console.log(`📱 [POLLING] Check account: @${account.username} (${account.platform}, accountId: ${account.accountId})`);
      
      // Trova automazioni attive
      const automations = await SocialAutomation.find({
        accountId: account._id,
        status: 'active',
        type: { $in: ['comment_reply', 'dm_auto'] }
      });
      
      if (automations.length === 0) {
        console.log(`⏭️ [POLLING] Nessuna automazione attiva per @${account.username}, skip`);
        continue;
      }
      console.log(`📊 [POLLING] ${automations.length} automazioni attive per @${account.username}`);
      
      // Ottieni ultimi 10 post
      let mediaUrl;
      if (account.platform === 'instagram') {
        mediaUrl = `https://graph.instagram.com/v21.0/${account.accountId}/media?fields=id&limit=10&access_token=${account.accessToken}`;
      } else {
        mediaUrl = `https://graph.facebook.com/v21.0/${account.accountId}/feed?fields=id&limit=10&access_token=${account.accessToken}`;
      }
      const mediaRes = await fetch(mediaUrl);
      const mediaData = await mediaRes.json();
      
      if (!mediaData.data) {
        console.log(`⚠️ [POLLING] Nessun media per @${account.username}:`, JSON.stringify(mediaData).substring(0, 300));
        continue;
      }
      console.log(`📸 [POLLING] Trovati ${mediaData.data.length} post per @${account.username}`);
      
      // Per ogni post, controlla i commenti
      for (const media of mediaData.data) {
        let commentsUrl;
        if (account.platform === 'instagram') {
          commentsUrl = `https://graph.instagram.com/v21.0/${media.id}/comments?fields=id,text,username,timestamp&access_token=${account.accessToken}`;
        } else {
          commentsUrl = `https://graph.facebook.com/v21.0/${media.id}/comments?fields=id,message,from,created_time&access_token=${account.accessToken}`;
        }
        const commentsRes = await fetch(commentsUrl);
        const commentsData = await commentsRes.json();
        
        if (!commentsData.data) {
          if (commentsData.error) {
            console.log(`❌ [POLLING] Errore commenti per media ${media.id}:`, commentsData.error.message);
          }
          continue;
        }
        
        if (commentsData.data.length > 0) {
          console.log(`💬 [POLLING] ${commentsData.data.length} commenti su media ${media.id}`);
        }
        
        // Processa i commenti
        for (const comment of commentsData.data) {
          const commentKey = `${comment.id}`;
          
          // Skip se già processato
          if (processedComments.has(commentKey)) continue;
          
          // Facebook usa "message" invece di "text"
          const commentText = comment.text || comment.message || '';
          const commentUsername = comment.username || comment.from?.name || 'unknown';
          
          console.log(`💬 [POLLING] Nuovo commento da @${commentUsername}: "${commentText}"`);
          
          // Check automazioni
          for (const auto of automations) {
            if (!matchesKeywords(commentText, auto.trigger?.keywords)) continue;
            
            console.log(`✅ [POLLING] Match automazione: ${auto.name}`);
            
            const actionType = auto.action?.actionType || 'send_dm';
            const message = auto.action?.message;
            
            if (!message) continue;
            
            let actionSuccess = false;

            if (actionType === 'reply_comment' || actionType === 'both') {
              const replyResult = await replyToComment(
                account.platform,
                comment.id,
                message,
                account.accessToken
              );
              console.log(`📝 [POLLING] Reply commento:`, replyResult);
              if (!replyResult.error) actionSuccess = true;
            }
            
            if (actionType === 'send_dm' || actionType === 'both') {
              const result = await sendDM(
                account.platform,
                account.accountId,
                comment.from?.id,
                message,
                account.accessToken,
                comment.id
              );
              
              console.log(`📤 [POLLING] DM inviato:`, result);
              
              if (result.recipient_id || result.message_id || !result.error) {
                actionSuccess = true;
              }
            }

            // Aggiorna stats
            await SocialAutomation.findByIdAndUpdate(auto._id, {
              $inc: {
                'stats.triggered': 1,
                ...(actionSuccess ? { 'stats.successful': 1 } : { 'stats.failed': 1 }),
              },
              lastTriggered: new Date()
            });
            
            if (actionSuccess) totalProcessed++;
            
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
