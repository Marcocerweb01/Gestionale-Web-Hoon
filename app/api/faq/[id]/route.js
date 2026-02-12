import { connectToDB } from "@/utils/database";
import Faq from "@/models/Faq";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// DELETE - Elimina FAQ (solo amministratori)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    await connectToDB();
    
    const faqEliminata = await Faq.findByIdAndDelete(id);
    
    if (!faqEliminata) {
      return NextResponse.json({ error: 'FAQ non trovata' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'FAQ eliminata con successo' }, { status: 200 });
  } catch (error) {
    console.error("Errore eliminazione FAQ:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Aggiorna FAQ (solo amministratori)
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    await connectToDB();
    
    const body = await req.json();
    
    const faqAggiornata = await Faq.findByIdAndUpdate(
      id,
      { ...body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!faqAggiornata) {
      return NextResponse.json({ error: 'FAQ non trovata' }, { status: 404 });
    }
    
    return NextResponse.json(faqAggiornata, { status: 200 });
  } catch (error) {
    console.error("Errore aggiornamento FAQ:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
