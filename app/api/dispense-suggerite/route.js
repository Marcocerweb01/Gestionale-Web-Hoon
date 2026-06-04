import { connectToDB } from "@/utils/database";
import DispensaSuggerita from "@/models/DispensaSuggerita";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Recupera tutte le dispense suggerite in attesa (solo admin)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const suggerite = await DispensaSuggerita.find({ stato: 'in_attesa' }).sort({ createdAt: -1 });

    return NextResponse.json(suggerite, { status: 200 });
  } catch (error) {
    console.error("Errore recupero dispense suggerite:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Crea una nuova dispensa suggerita (tutti gli utenti autenticati)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const body = await req.json();
    const { categoria, argomento } = body;

    if (!categoria || !categoria.trim()) {
      return NextResponse.json({ error: 'La categoria è obbligatoria' }, { status: 400 });
    }
    if (!argomento || !argomento.trim()) {
      return NextResponse.json({ error: "L'argomento è obbligatorio" }, { status: 400 });
    }

    const nuova = await DispensaSuggerita.create({
      categoria: categoria.trim(),
      argomento: argomento.trim(),
      suggeritaDa: {
        nome: session.user.name || session.user.email,
        email: session.user.email,
        userId: session.user.id || session.user.email,
      },
      stato: 'in_attesa',
    });

    return NextResponse.json(nuova, { status: 201 });
  } catch (error) {
    console.error("Errore creazione dispensa suggerita:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
