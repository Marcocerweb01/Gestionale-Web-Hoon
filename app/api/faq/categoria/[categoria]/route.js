import { connectToDB } from "@/utils/database";
import Faq from "@/models/Faq";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// DELETE - Elimina tutte le FAQ di una categoria (solo amministratori)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    const resolvedParams = await params;
    const { categoria } = resolvedParams;
    
    await connectToDB();
    
    // Conta quante FAQ verranno eliminate
    const count = await Faq.countDocuments({ categoria });
    
    // Elimina tutte le FAQ della categoria
    const result = await Faq.deleteMany({ categoria });
    
    return NextResponse.json({ 
      message: `Categoria "${categoria}" eliminata con successo`,
      faqEliminate: result.deletedCount
    }, { status: 200 });
  } catch (error) {
    console.error("Errore eliminazione categoria:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Rinomina categoria (solo amministratori)
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    const resolvedParams = await params;
    const { categoria } = resolvedParams;
    const body = await req.json();
    const { nuovoNome } = body;
    
    if (!nuovoNome || !nuovoNome.trim()) {
      return NextResponse.json({ error: 'Il nuovo nome è obbligatorio' }, { status: 400 });
    }
    
    await connectToDB();
    
    // Aggiorna tutte le FAQ con la vecchia categoria
    const result = await Faq.updateMany(
      { categoria },
      { $set: { categoria: nuovoNome.trim(), updatedAt: Date.now() } }
    );
    
    return NextResponse.json({ 
      message: `Categoria "${categoria}" rinominata in "${nuovoNome}"`,
      faqAggiornate: result.modifiedCount
    }, { status: 200 });
  } catch (error) {
    console.error("Errore rinomina categoria:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
