import { connectToDB } from "@/utils/database";
import Dispensa from "@/models/Dispensa";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// DELETE - Elimina item dispensa (solo amministratori)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    await connectToDB();
    
    const dispensaEliminata = await Dispensa.findByIdAndDelete(id);
    
    if (!dispensaEliminata) {
      return NextResponse.json({ error: 'Dispensa non trovata' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Argomento eliminato con successo' }, { status: 200 });
  } catch (error) {
    console.error("Errore eliminazione dispensa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Aggiorna item dispensa (solo amministratori)
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
    
    const dispensaAggiornata = await Dispensa.findByIdAndUpdate(
      id,
      { ...body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!dispensaAggiornata) {
      return NextResponse.json({ error: 'Dispensa non trovata' }, { status: 404 });
    }
    
    return NextResponse.json(dispensaAggiornata, { status: 200 });
  } catch (error) {
    console.error("Errore aggiornamento dispensa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
