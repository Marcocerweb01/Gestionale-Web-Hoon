import { connectToDB } from "@/utils/database";
import Dispensa from "@/models/Dispensa";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// DELETE - Elimina tutte le dispense di una categoria (solo amministratori)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    const resolvedParams = await params;
    const { categoria } = resolvedParams;
    const nomeCategoria = decodeURIComponent(categoria);
    
    await connectToDB();
    
    const result = await Dispensa.deleteMany({ categoria: nomeCategoria });
    
    return NextResponse.json({ 
      message: `Categoria "${nomeCategoria}" eliminata con successo`,
      dispensaEliminate: result.deletedCount
    }, { status: 200 });
  } catch (error) {
    console.error("Errore eliminazione categoria dispensa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Rinomina categoria e/o aggiorna icona (solo amministratori)
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    const resolvedParams = await params;
    const { categoria } = resolvedParams;
    const nomeCategoria = decodeURIComponent(categoria);
    const body = await req.json();
    const { nuovoNome, nuovaIcona } = body;
    
    if (!nuovoNome || !nuovoNome.trim()) {
      return NextResponse.json({ error: 'Il nuovo nome è obbligatorio' }, { status: 400 });
    }
    
    await connectToDB();
    
    const updateFields = { 
      categoria: nuovoNome.trim(), 
      updatedAt: Date.now() 
    };
    
    if (nuovaIcona) {
      updateFields.icona = nuovaIcona;
    }
    
    const result = await Dispensa.updateMany(
      { categoria: nomeCategoria },
      { $set: updateFields }
    );
    
    return NextResponse.json({ 
      message: `Categoria "${nomeCategoria}" aggiornata con successo`,
      dispensaAggiornate: result.modifiedCount
    }, { status: 200 });
  } catch (error) {
    console.error("Errore aggiornamento categoria dispensa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
