import { connectToDB } from "@/utils/database";
import Faq from "@/models/Faq";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Recupera tutte le FAQ
export async function GET(req) {
  try {
    await connectToDB();
    
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');
    
    let query = {};
    if (categoria) {
      query.categoria = categoria;
    }
    
    const faqs = await Faq.find(query).sort({ categoria: 1, ordine: 1, createdAt: 1 });
    
    return NextResponse.json(faqs, { status: 200 });
  } catch (error) {
    console.error("Errore recupero FAQ:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Crea nuova FAQ (solo amministratori)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    await connectToDB();
    
    const body = await req.json();
    const { categoria, titolo, testo, ordine } = body;
    
    if (!categoria || !titolo || !testo) {
      return NextResponse.json({ error: 'Tutti i campi sono obbligatori' }, { status: 400 });
    }
    
    const nuovaFaq = await Faq.create({
      categoria,
      titolo,
      testo,
      ordine: ordine || 0,
    });
    
    return NextResponse.json(nuovaFaq, { status: 201 });
  } catch (error) {
    console.error("Errore creazione FAQ:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
