import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import Evento from "@/models/Evento";
import {
  eventAccess,
  isAdmin,
  populateEvent,
  serializeEvent,
  validateAdminEventPayload,
} from "@/lib/eventi";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Non autenticato" }, { status: 401 });
    if (!isAdmin(session) && session.user.role !== "collaboratore") {
      return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
    }
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const query = {};
    if (!isAdmin(session)) {
      query.$or = [{ responsabile: session.user.id }, { collaboratori: session.user.id }];
    }
    if (search) query.nome = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (from || to) {
      query.dataInizio = {};
      if (from) query.dataInizio.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) query.dataInizio.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const events = await populateEvent(Evento.find(query).sort({ dataInizio: 1 })).lean();
    return NextResponse.json(events.map((event) => serializeEvent(event, eventAccess(event, session))));
  } catch (error) {
    console.error("Errore elenco eventi:", error);
    return NextResponse.json({ message: "Errore nel recupero degli eventi" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Non autenticato" }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ message: "Solo l'amministratore può creare eventi" }, { status: 403 });
    await connectToDB();
    const payload = await validateAdminEventPayload(await req.json());
    const created = await Evento.create({ ...payload, createdBy: session.user.id, updatedBy: session.user.id });
    const event = await populateEvent(Evento.findById(created._id)).lean();
    return NextResponse.json(serializeEvent(event, "admin"), { status: 201 });
  } catch (error) {
    const validation = error.name === "ValidationError" || !/database|server/i.test(error.message);
    console.error("Errore creazione evento:", error);
    return NextResponse.json({ message: error.message || "Errore nella creazione" }, { status: validation ? 400 : 500 });
  }
}
