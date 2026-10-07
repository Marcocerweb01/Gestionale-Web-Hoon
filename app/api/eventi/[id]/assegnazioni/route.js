import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import Evento from "@/models/Evento";
import AssegnazioneEvento from "@/models/AssegnazioneEvento";
import { Collaboratore } from "@/models/User";
import { assignmentToJSON, eventAccess, isEventDay, isValidId } from "@/lib/eventi";

export const dynamic = "force-dynamic";

async function load(params) {
  const { id } = await params;
  if (!isValidId(id)) return { error: NextResponse.json({ message: "Evento non valido" }, { status: 400 }) };
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ message: "Non autenticato" }, { status: 401 }) };
  await connectToDB();
  const event = await Evento.findById(id).lean();
  if (!event) return { error: NextResponse.json({ message: "Evento non trovato" }, { status: 404 }) };
  const access = eventAccess(event, session);
  if (access === "none") return { error: NextResponse.json({ message: "Non autorizzato" }, { status: 403 }) };
  return { event, access, session };
}

export async function GET(req, { params }) {
  try {
    const result = await load(params);
    if (result.error) return result.error;
    const { searchParams } = new URL(req.url);
    const query = { evento: result.event._id };
    if (result.access === "collaboratore") query.collaboratore = result.session.user.id;
    else if (searchParams.get("collaboratore")) {
      if (!isValidId(searchParams.get("collaboratore"))) return NextResponse.json({ message: "Collaboratore non valido" }, { status: 400 });
      query.collaboratore = searchParams.get("collaboratore");
    }
    if (searchParams.get("data")) {
      query.dataLavoro = {
        $gte: new Date(`${searchParams.get("data")}T00:00:00.000Z`),
        $lte: new Date(`${searchParams.get("data")}T23:59:59.999Z`),
      };
    }
    const items = await AssegnazioneEvento.find(query)
      .populate("collaboratore", "nome cognome subRoles")
      .sort({ dataLavoro: 1, createdAt: 1 })
      .lean();
    return NextResponse.json(items.map(assignmentToJSON));
  } catch (error) {
    console.error("Errore elenco assegnazioni:", error);
    return NextResponse.json({ message: "Errore nel recupero delle attività" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const result = await load(params);
    if (result.error) return result.error;
    if (!['admin', 'responsabile'].includes(result.access)) return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
    const body = await req.json();
    if (!isValidId(body.collaboratore)) return NextResponse.json({ message: "Collaboratore non valido" }, { status: 400 });
    const allowed = result.event.collaboratori.some((id) => String(id) === String(body.collaboratore));
    const active = await Collaboratore.exists({ _id: body.collaboratore, status: { $ne: "non_attivo" } });
    if (!allowed || !active) return NextResponse.json({ message: "Il collaboratore non è autorizzato per questo evento" }, { status: 400 });
    const dataLavoro = new Date(`${body.dataLavoro}T12:00:00.000Z`);
    if (Number.isNaN(dataLavoro.getTime()) || !String(body.mansione || "").trim()) {
      return NextResponse.json({ message: "Data e mansione sono obbligatorie" }, { status: 400 });
    }
    if (!isEventDay(result.event, dataLavoro)) {
      return NextResponse.json({ message: "La giornata di lavoro deve essere una delle date EVENTO" }, { status: 400 });
    }
    const item = await AssegnazioneEvento.create({
      evento: result.event._id,
      collaboratore: body.collaboratore,
      dataLavoro,
      mansione: String(body.mansione).trim(),
      noteCollaboratore: String(body.noteCollaboratore || ""),
      createdBy: result.session.user.id,
      updatedBy: result.session.user.id,
    });
    await item.populate("collaboratore", "nome cognome subRoles");
    return NextResponse.json(assignmentToJSON(item), { status: 201 });
  } catch (error) {
    console.error("Errore creazione assegnazione:", error);
    return NextResponse.json({ message: "Errore nella creazione dell'attività" }, { status: 500 });
  }
}
