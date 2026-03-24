import { connectToDB } from "@/utils/database";
import Dispensa from "@/models/Dispensa";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Recupera tutte le dispense
export async function GET(req) {
  try {
    await connectToDB();
    
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');
    
    let query = {};
    if (categoria) {
      query.categoria = categoria;
    }
    
    const dispense = await Dispensa.find(query).sort({ categoria: 1, ordine: 1, createdAt: 1 });
    
    return NextResponse.json(dispense, { status: 200 });
  } catch (error) {
    console.error("Errore recupero dispense:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Crea nuovo item dispensa (solo amministratori)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    await connectToDB();
    
    const body = await req.json();
    const { categoria, icona, item, ordine } = body;
    
    if (!categoria || !item) {
      return NextResponse.json({ error: 'Categoria e argomento sono obbligatori' }, { status: 400 });
    }
    
    const nuovaDispensa = await Dispensa.create({
      categoria,
      icona: icona || '📄',
      item,
      ordine: ordine || 0,
    });
    
    return NextResponse.json(nuovaDispensa, { status: 201 });
  } catch (error) {
    console.error("Errore creazione dispensa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
