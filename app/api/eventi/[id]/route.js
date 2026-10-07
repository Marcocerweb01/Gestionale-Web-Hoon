import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import Evento from "@/models/Evento";
import AssegnazioneEvento from "@/models/AssegnazioneEvento";
import DisponibilitaEvento from "@/models/DisponibilitaEvento";
import {
  eventAccess,
  isAdmin,
  isValidId,
  populateEvent,
  serializeEvent,
  validateAdminEventPayload,
  validateResponsibleEventPayload,
} from "@/lib/eventi";

export const dynamic = "force-dynamic";

async function context(params) {
  const { id } = await params;
  if (!isValidId(id)) return { error: NextResponse.json({ message: "Evento non valido" }, { status: 400 }) };
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ message: "Non autenticato" }, { status: 401 }) };
  await connectToDB();
  const event = await populateEvent(Evento.findById(id));
  if (!event) return { error: NextResponse.json({ message: "Evento non trovato" }, { status: 404 }) };
  const access = eventAccess(event, session);
  if (access === "none") return { error: NextResponse.json({ message: "Non autorizzato" }, { status: 403 }) };
  return { event, session, access };
}

export async function GET(req, { params }) {
  try {
    const result = await context(params);
    if (result.error) return result.error;
    return NextResponse.json(serializeEvent(result.event, result.access));
  } catch (error) {
    console.error("Errore dettaglio evento:", error);
    return NextResponse.json({ message: "Errore nel recupero dell'evento" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const result = await context(params);
    if (result.error) return result.error;
    if (result.access === "collaboratore") return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
    const body = await req.json();
    const updates = result.access === "admin"
      ? await validateAdminEventPayload(body)
      : validateResponsibleEventPayload({
          ...body,
          currentInizioSocial: result.event.inizioSocial,
          currentFineSocial: result.event.fineSocial,
        });
    if (result.access === "admin") {
      const retained = new Set(updates.collaboratori.map(String));
      const removed = result.event.collaboratori
        .map((item) => String(item._id || item))
        .filter((id) => !retained.has(id));
      if (removed.length) {
        const assigned = await AssegnazioneEvento.exists({ evento: result.event._id, collaboratore: { $in: removed } });
        if (assigned) return NextResponse.json({ message: "Prima di rimuovere un collaboratore elimina o riassegna le sue attività" }, { status: 400 });
      }
    }
    updates.updatedBy = result.session.user.id;
    const updated = await populateEvent(Evento.findByIdAndUpdate(result.event._id, { $set: updates }, { new: true, runValidators: true }));
    return NextResponse.json(serializeEvent(updated, result.access));
  } catch (error) {
    console.error("Errore modifica evento:", error);
    return NextResponse.json({ message: error.message || "Errore nella modifica" }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const result = await context(params);
    if (result.error) return result.error;
    if (!isAdmin(result.session)) return NextResponse.json({ message: "Solo l'amministratore può eliminare eventi" }, { status: 403 });
    await AssegnazioneEvento.deleteMany({ evento: result.event._id });
    await DisponibilitaEvento.deleteMany({ evento: result.event._id });
    await Evento.deleteOne({ _id: result.event._id });
    return NextResponse.json({ message: "Evento eliminato" });
  } catch (error) {
    console.error("Errore eliminazione evento:", error);
    return NextResponse.json({ message: "Errore nell'eliminazione" }, { status: 500 });
  }
}
