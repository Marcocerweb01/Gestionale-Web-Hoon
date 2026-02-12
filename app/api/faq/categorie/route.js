import { connectToDB } from "@/utils/database";
import Faq from "@/models/Faq";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// GET - Recupera tutte le categorie uniche
export async function GET() {
  try {
    await connectToDB();
    
    const categorie = await Faq.distinct('categoria');
    
    return NextResponse.json(categorie, { status: 200 });
  } catch (error) {
    console.error("Errore recupero categorie:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
