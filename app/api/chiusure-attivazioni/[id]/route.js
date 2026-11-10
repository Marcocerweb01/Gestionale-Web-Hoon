import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import ChiusuraAttivazione from "@/models/ChiusuraAttivazione";

export async function DELETE(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["amministratore", "segretaria"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "ID non valido" }, { status: 400 });
    await connectToDB();
    const evento = await ChiusuraAttivazione.findById(id);
    if (!evento) return NextResponse.json({ error: "Voce non trovata" }, { status: 404 });

    if (["completata", "attiva"].includes(evento.stato)) {
      evento.stato = "annullata";
      await evento.save();
    } else {
      await evento.deleteOne();
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
