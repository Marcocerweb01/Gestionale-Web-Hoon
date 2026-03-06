import { connectToDB } from "@/utils/database";
import FaqSuggerite from "@/models/FaqSuggerite";
import Faq from "@/models/Faq";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// DELETE - Elimina una FAQ suggerita (solo admin)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    await connectToDB();
    
    const { id } = await params;
    
    const faqSuggerita = await FaqSuggerite.findByIdAndDelete(id);
    
    if (!faqSuggerita) {
      return NextResponse.json({ error: 'FAQ suggerita non trovata' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'FAQ suggerita eliminata con successo' }, { status: 200 });
  } catch (error) {
    console.error("Errore eliminazione FAQ suggerita:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Pubblica una FAQ suggerita come FAQ ufficiale (solo admin)
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    await connectToDB();
    
    const { id } = await params;
    const body = await req.json();
    const { categoria, titolo, testo } = body;
    
    if (!categoria || !titolo || !testo) {
      return NextResponse.json({ error: 'Tutti i campi sono obbligatori' }, { status: 400 });
    }
    
    // Crea la FAQ ufficiale
    const nuovaFaq = await Faq.create({
      categoria,
      titolo,
      testo,
      ordine: 0,
    });
    
    // Elimina la FAQ suggerita
    await FaqSuggerite.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      message: 'FAQ pubblicata con successo',
      faq: nuovaFaq 
    }, { status: 201 });
  } catch (error) {
    console.error("Errore pubblicazione FAQ:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
