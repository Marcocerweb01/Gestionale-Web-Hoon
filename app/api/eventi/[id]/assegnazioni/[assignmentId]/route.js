import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import Evento from "@/models/Evento";
import AssegnazioneEvento from "@/models/AssegnazioneEvento";
import { Collaboratore } from "@/models/User";
import { assignmentToJSON, eventAccess, isEventDay, isValidId } from "@/lib/eventi";

async function authorize(params) {
  const { id, assignmentId } = await params;
  if (!isValidId(id) || !isValidId(assignmentId)) return { error: NextResponse.json({ message: "Identificativo non valido" }, { status: 400 }) };
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ message: "Non autenticato" }, { status: 401 }) };
  await connectToDB();
  const event = await Evento.findById(id).lean();
  if (!event) return { error: NextResponse.json({ message: "Evento non trovato" }, { status: 404 }) };
  const access = eventAccess(event, session);
  if (!['admin', 'responsabile'].includes(access)) return { error: NextResponse.json({ message: "Non autorizzato" }, { status: 403 }) };
  const assignment = await AssegnazioneEvento.findOne({ _id: assignmentId, evento: id });
  if (!assignment) return { error: NextResponse.json({ message: "Attività non trovata" }, { status: 404 }) };
  return { event, assignment, session };
}

export async function PATCH(req, { params }) {
  try {
    const result = await authorize(params);
    if (result.error) return result.error;
    const body = await req.json();
    if (!isValidId(body.collaboratore)) return NextResponse.json({ message: "Collaboratore non valido" }, { status: 400 });
    const allowed = result.event.collaboratori.some((id) => String(id) === String(body.collaboratore));
    const active = await Collaboratore.exists({ _id: body.collaboratore, status: { $ne: "non_attivo" } });
    if (!allowed || !active) return NextResponse.json({ message: "Collaboratore non autorizzato" }, { status: 400 });
    const dataLavoro = new Date(`${body.dataLavoro}T12:00:00.000Z`);
    if (Number.isNaN(dataLavoro.getTime()) || !String(body.mansione || "").trim()) return NextResponse.json({ message: "Data e mansione obbligatorie" }, { status: 400 });
    if (!isEventDay(result.event, dataLavoro)) return NextResponse.json({ message: "La giornata di lavoro deve essere una delle date EVENTO" }, { status: 400 });
    Object.assign(result.assignment, {
      collaboratore: body.collaboratore,
      dataLavoro,
      mansione: String(body.mansione).trim(),
      noteCollaboratore: String(body.noteCollaboratore || ""),
      updatedBy: result.session.user.id,
    });
    await result.assignment.save();
    await result.assignment.populate("collaboratore", "nome cognome subRoles");
    return NextResponse.json(assignmentToJSON(result.assignment));
  } catch (error) {
    console.error("Errore modifica attività:", error);
    return NextResponse.json({ message: "Errore nella modifica dell'attività" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const result = await authorize(params);
    if (result.error) return result.error;
    await result.assignment.deleteOne();
    return NextResponse.json({ message: "Attività eliminata" });
  } catch (error) {
    console.error("Errore eliminazione attività:", error);
    return NextResponse.json({ message: "Errore nell'eliminazione dell'attività" }, { status: 500 });
  }
}
