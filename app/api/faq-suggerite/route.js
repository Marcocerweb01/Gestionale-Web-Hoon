import { connectToDB } from "@/utils/database";
import FaqSuggerite from "@/models/FaqSuggerite";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Recupera tutte le FAQ suggerite (solo admin)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    await connectToDB();
    
    const faqSuggerite = await FaqSuggerite.find({ stato: 'in_attesa' }).sort({ createdAt: -1 });
    
    return NextResponse.json(faqSuggerite, { status: 200 });
  } catch (error) {
    console.error("Errore recupero FAQ suggerite:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Crea una nuova FAQ suggerita (tutti gli utenti autenticati)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    await connectToDB();
    
    const body = await req.json();
    const { domanda } = body;
    
    if (!domanda || !domanda.trim()) {
      return NextResponse.json({ error: 'La domanda è obbligatoria' }, { status: 400 });
    }
    
    const nuovaFaqSuggerita = await FaqSuggerite.create({
      domanda: domanda.trim(),
      suggeritaDa: {
        nome: session.user.name || session.user.email,
        email: session.user.email,
        userId: session.user.id || session.user.email,
      },
      stato: 'in_attesa',
    });
    
    return NextResponse.json(nuovaFaqSuggerita, { status: 201 });
  } catch (error) {
    console.error("Errore creazione FAQ suggerita:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
