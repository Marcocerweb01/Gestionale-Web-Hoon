import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import SocialAutomation from '@/models/SocialAutomation';
import SocialLead from '@/models/SocialLead';
import mongoose from 'mongoose';

// POST /api/webhook/social - Riceve dati da n8n
export async function POST(req) {
  try {
    const data = await req.json();
    
    await connectToDB();
    
    const { 
      automationId, 
      platform, 
      type, 
      leadInfo, 
      interaction,
      userId 
    } = data;
    
    // Salva il lead nel database
    const lead = await SocialLead.create({
      userId: new mongoose.Types.ObjectId(userId),
      automationId: automationId ? new mongoose.Types.ObjectId(automationId) : null,
      platform,
      leadInfo,
      interaction,
      status: 'new',
      createdAt: new Date()
    });
    
    // Aggiorna statistiche automazione
    if (automationId) {
      await SocialAutomation.findByIdAndUpdate(
        automationId,
        {
          $inc: { 'stats.triggered': 1 },
          lastTriggered: new Date()
        }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      leadId: lead._id,
      message: 'Lead salvato con successo' 
    });
    
  } catch (error) {
    console.error('Errore webhook social:', error);
    return NextResponse.json(
      { error: 'Errore nel processare il webhook' },
      { status: 500 }
    );
  }
}

// GET /api/webhook/social - Verifica webhook (per Meta)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  
  // Token di verifica (deve corrispondere a quello configurato in Meta)
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'your_verify_token_here';
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
