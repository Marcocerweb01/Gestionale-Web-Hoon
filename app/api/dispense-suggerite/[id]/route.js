import { connectToDB } from "@/utils/database";
import DispensaSuggerita from "@/models/DispensaSuggerita";
import Dispensa from "@/models/Dispensa";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// DELETE - Elimina una dispensa suggerita (solo admin)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const { id } = await params;

    const suggerita = await DispensaSuggerita.findByIdAndDelete(id);

    if (!suggerita) {
      return NextResponse.json({ error: 'Dispensa suggerita non trovata' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Dispensa suggerita eliminata con successo' }, { status: 200 });
  } catch (error) {
    console.error("Errore eliminazione dispensa suggerita:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Pubblica una dispensa suggerita come argomento ufficiale (solo admin)
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const { id } = await params;
    const body = await req.json();
    const { categoria, icona, argomento } = body;

    if (!categoria || !argomento) {
      return NextResponse.json({ error: 'Tutti i campi sono obbligatori' }, { status: 400 });
    }

    // Crea l'argomento ufficiale nella dispensa
    const nuovoItem = await Dispensa.create({
      categoria,
      icona: icona || '📄',
      item: argomento,
      ordine: 0,
    });

    // Elimina la dispensa suggerita
    await DispensaSuggerita.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Argomento pubblicato con successo',
      item: nuovoItem
    }, { status: 201 });
  } catch (error) {
    console.error("Errore pubblicazione dispensa suggerita:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
