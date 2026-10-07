import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import Evento from "@/models/Evento";
import DisponibilitaEvento from "@/models/DisponibilitaEvento";
import { Collaboratore } from "@/models/User";
import { isAdmin, isValidId } from "@/lib/eventi";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (!isAdmin(session) && session.user.role !== "collaboratore")) return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  await connectToDB();
  const events = await Evento.find({ dataFine: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }).select("nome tipo dataInizio dataFine giornateEvento luogo").sort({ dataInizio: 1 }).lean();
  if (!isAdmin(session)) {
    const responses = await DisponibilitaEvento.find({ collaboratore: session.user.id, evento: { $in: events.map((item) => item._id) } }).lean();
    const byEvent = new Map(responses.map((item) => [String(item.evento), item]));
    return NextResponse.json({ mode: "collaboratore", events: events.map((event) => ({ ...event, risposta: byEvent.get(String(event._id)) || null })) });
  }
  const [collaborators, responses] = await Promise.all([
    Collaboratore.find({ status: { $ne: "non_attivo" } }).select("nome cognome subRoles").sort({ nome: 1, cognome: 1 }).lean(),
    DisponibilitaEvento.find({ evento: { $in: events.map((item) => item._id) } }).lean(),
  ]);
  return NextResponse.json({ mode: "admin", events, collaborators, responses });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "collaboratore") return NextResponse.json({ message: "Solo i professionisti possono indicare la disponibilità" }, { status: 403 });
  await connectToDB();
  const { evento, stato, nota = "" } = await req.json();
  if (!isValidId(evento) || !["si", "no", "forse"].includes(stato)) return NextResponse.json({ message: "Risposta non valida" }, { status: 400 });
  if (stato === "forse" && !String(nota).trim()) return NextResponse.json({ message: "Con Forse devi inserire una nota" }, { status: 400 });
  if (!(await Evento.exists({ _id: evento }))) return NextResponse.json({ message: "Evento o shooting non trovato" }, { status: 404 });
  const response = await DisponibilitaEvento.findOneAndUpdate(
    { evento, collaboratore: session.user.id },
    { $set: { stato, nota: stato === "forse" ? String(nota).trim() : "" } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return NextResponse.json(response);
}
