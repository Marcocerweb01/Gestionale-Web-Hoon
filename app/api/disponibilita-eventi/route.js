import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import Evento from "@/models/Evento";
import DisponibilitaEvento from "@/models/DisponibilitaEvento";
import { Collaboratore } from "@/models/User";
import { isAdmin, isValidId } from "@/lib/eventi";

export const dynamic = "force-dynamic";

const STATUSES = ["si", "no", "forse"];

const dateKey = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const expandDateRange = (startValue, endValue = startValue) => {
  const start = new Date(startValue);
  const end = new Date(endValue || startValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
  const dates = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 12));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 12));
  while (cursor <= last && dates.length < 366) {
    dates.push(dateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

const eventDayKeys = (event) => {
  const source = event.giornateEvento?.length
    ? event.giornateEvento.map(dateKey)
    : expandDateRange(event.dataInizio, event.dataFine);
  return [...new Set(source.filter(Boolean))].sort();
};

const serializeResponse = (response, event) => {
  if (!response) return null;
  const eventDays = eventDayKeys(event);
  const savedAnswers = response.risposteGiornaliere?.length
    ? response.risposteGiornaliere
    : eventDays.map((data) => ({ data, stato: response.stato, nota: response.nota || "" }));
  const answersByDate = new Map(savedAnswers.map((answer) => [dateKey(answer.data), answer]));
  return {
    ...response,
    risposteGiornaliere: eventDays
      .map((data) => answersByDate.get(data))
      .filter(Boolean)
      .map((answer) => ({
        data: dateKey(answer.data),
        stato: answer.stato,
        nota: answer.stato === "forse" ? String(answer.nota || "") : "",
      })),
  };
};

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (!isAdmin(session) && session.user.role !== "collaboratore")) return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  await connectToDB();
  const query = { dataFine: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } };
  const eventId = new URL(req.url).searchParams.get("evento");
  if (eventId && isAdmin(session)) {
    if (!isValidId(eventId)) return NextResponse.json({ message: "Evento non valido" }, { status: 400 });
    delete query.dataFine;
    query._id = eventId;
  }
  if (!isAdmin(session)) {
    query.teamConfermato = { $ne: true };
    query.$or = [
      { disponibilitaSuInvito: { $ne: true } },
      { destinatariDisponibilita: session.user.id },
    ];
  }
  const events = await Evento.find(query)
    .select(`nome tipo dataInizio dataFine giornateEvento orariGiornate luogo${isAdmin(session) ? " disponibilitaSuInvito destinatariDisponibilita teamConfermato" : " disponibilitaVisionataDa"}`)
    .sort({ dataInizio: 1 }).lean();
  if (!isAdmin(session)) {
    const responses = await DisponibilitaEvento.find({ collaboratore: session.user.id, evento: { $in: events.map((item) => item._id) } }).lean();
    const byEvent = new Map(responses.map((item) => [String(item.evento), item]));
    const personalEvents = events.map(({ disponibilitaVisionataDa, ...event }) => ({
      ...event,
      visionata: Boolean(disponibilitaVisionataDa?.some((id) => String(id) === String(session.user.id))),
      risposta: serializeResponse(byEvent.get(String(event._id)), event),
    }));
    if (new URL(req.url).searchParams.get("riepilogo") === "1") {
      const nuove = personalEvents.filter((event) => {
        if (event.visionata) return false;
        const answered = new Set(event.risposta?.risposteGiornaliere.map(({ data }) => data));
        return eventDayKeys(event).some((day) => !answered.has(day));
      }).length;
      return NextResponse.json({ nuove });
    }
    return NextResponse.json({ mode: "collaboratore", events: personalEvents });
  }
  const [collaborators, responses] = await Promise.all([
    Collaboratore.find({ status: { $ne: "non_attivo" } }).select("nome cognome subRoles").sort({ nome: 1, cognome: 1 }).lean(),
    DisponibilitaEvento.find({ evento: { $in: events.map((item) => item._id) } }).lean(),
  ]);
  const eventsById = new Map(events.map((event) => [String(event._id), event]));
  return NextResponse.json({
    mode: "admin",
    events,
    collaborators,
    responses: responses.map((response) => serializeResponse(response, eventsById.get(String(response.evento)))),
  });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "collaboratore") return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  const { evento } = (await req.json().catch(() => null)) || {};
  if (typeof evento !== "string" || !isValidId(evento)) return NextResponse.json({ message: "Evento non valido" }, { status: 400 });

  await connectToDB();
  const result = await Evento.updateOne({
    _id: evento,
    teamConfermato: { $ne: true },
    $or: [{ disponibilitaSuInvito: { $ne: true } }, { destinatariDisponibilita: session.user.id }],
  }, { $addToSet: { disponibilitaVisionataDa: session.user.id } });
  if (!result.matchedCount) return NextResponse.json({ message: "Richiesta non disponibile" }, { status: 404 });
  return NextResponse.json({ visionata: true });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "collaboratore") return NextResponse.json({ message: "Solo i professionisti possono indicare la disponibilità" }, { status: 403 });
  await connectToDB();
  const { evento, risposteGiornaliere } = await req.json();
  if (!isValidId(evento) || !Array.isArray(risposteGiornaliere)) return NextResponse.json({ message: "Risposte non valide" }, { status: 400 });
  const event = await Evento.findById(evento).select("dataInizio dataFine giornateEvento disponibilitaSuInvito destinatariDisponibilita teamConfermato").lean();
  if (!event) return NextResponse.json({ message: "Evento o shooting non trovato" }, { status: 404 });

  if (event.teamConfermato === true) {
    return NextResponse.json({ message: "Le disponibilità sono chiuse. Il team è stato confermato." }, { status: 409 });
  }

  if (event.disponibilitaSuInvito && !event.destinatariDisponibilita?.some((id) => String(id) === String(session.user.id))) {
    return NextResponse.json({ message: "Non hai ricevuto una richiesta per questo evento" }, { status: 403 });
  }

  const requiredDays = eventDayKeys(event);
  const receivedDays = risposteGiornaliere.map((answer) => dateKey(answer?.data));
  if (
    receivedDays.some((day) => !day)
    || new Set(receivedDays).size !== receivedDays.length
    || receivedDays.length !== requiredDays.length
    || requiredDays.some((day) => !receivedDays.includes(day))
  ) return NextResponse.json({ message: "Indica la disponibilità per tutte le date dell’evento" }, { status: 400 });

  const normalizedAnswers = risposteGiornaliere
    .map((answer) => ({
      data: dateKey(answer.data),
      stato: String(answer.stato || ""),
      nota: String(answer.nota || "").trim(),
    }))
    .sort((a, b) => a.data.localeCompare(b.data));
  if (normalizedAnswers.some((answer) => !STATUSES.includes(answer.stato))) {
    return NextResponse.json({ message: "Ogni data deve avere una risposta: Sì, No o Forse" }, { status: 400 });
  }
  if (normalizedAnswers.some((answer) => answer.stato === "forse" && !answer.nota)) {
    return NextResponse.json({ message: "Con Forse devi spiegare il motivo per ogni data" }, { status: 400 });
  }

  const uniqueStatuses = [...new Set(normalizedAnswers.map((answer) => answer.stato))];
  const aggregateStatus = uniqueStatuses.length === 1 ? uniqueStatuses[0] : "forse";
  const response = await DisponibilitaEvento.findOneAndUpdate(
    { evento, collaboratore: session.user.id },
    {
      $set: {
        stato: aggregateStatus,
        nota: "",
        risposteGiornaliere: normalizedAnswers.map((answer) => ({
          ...answer,
          nota: answer.stato === "forse" ? answer.nota : "",
        })),
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
  return NextResponse.json(serializeResponse(response, event));
}
