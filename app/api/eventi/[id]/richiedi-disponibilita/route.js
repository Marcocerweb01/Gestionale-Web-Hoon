import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import Evento from "@/models/Evento";
import { Collaboratore } from "@/models/User";
import { isAdmin, isTeamEvento, isValidId } from "@/lib/eventi";
import { queueUserNotifications } from "@/lib/user-notifications";

export async function POST(_req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
    const { id } = await params;
    if (!isValidId(id)) return NextResponse.json({ message: "Evento non valido" }, { status: 400 });

    await connectToDB();
    const event = await Evento.findById(id).lean();
    if (!event) return NextResponse.json({ message: "Evento o shooting non trovato" }, { status: 404 });

    if (event.teamConfermato === true) {
      return NextResponse.json({ message: "Il team è già confermato. Le disponibilità sono chiuse." }, { status: 409 });
    }
    const candidates = await Collaboratore.find({
      subRoles: { $in: ["smm", "fotografo", "videomaker"] },
      status: { $ne: "non_attivo" },
    }).select("nome cognome subRoles email telefono isAdmin").lean();
    const alreadyRequested = new Set((event.destinatariDisponibilita || []).map(String));
    const assigned = new Set([...(event.collaboratori || []), event.responsabile].filter(Boolean).map(String));
    const eligible = candidates.filter((person) => isTeamEvento(person) && !assigned.has(String(person._id)));
    const recipients = eligible.filter((person) => !alreadyRequested.has(String(person._id)));
    if (!recipients.length) {
      return NextResponse.json({
        message: eligible.length
          ? "La richiesta è già stata inviata a tutti i destinatari idonei."
          : "Nessun Social Media Manager, fotografo o videomaker attivo da invitare fuori dal team.",
      });
    }

    const tipo = event.tipo === "shooting" ? "shooting" : "evento";
    await queueUserNotifications(recipients, {
      tipo: `${tipo}_disponibilita`,
      titolo: `Richiesta disponibilità per ${tipo}: ${event.nome}`,
      messaggio: `Indica la tua disponibilità per “${event.nome}” nel gestionale.`,
      link: "/Eventi#disponibilita",
      refId: id,
    });
    const updated = await Evento.findOneAndUpdate({ _id: id, teamConfermato: { $ne: true } }, {
      $addToSet: { destinatariDisponibilita: { $each: recipients.map((person) => person._id) } },
    }, { new: true }).select("destinatariDisponibilita").lean();
    if (!updated) return NextResponse.json({ message: "Le disponibilità sono state chiuse." }, { status: 409 });
    return NextResponse.json({
      message: `Richiesta accodata per ${recipients.length} candidati.`,
      destinatari: updated.destinatariDisponibilita.map(String),
    });
  } catch (error) {
    console.error("Errore richiesta disponibilità:", error);
    return NextResponse.json({ message: "Impossibile inviare la richiesta. Riprova." }, { status: 500 });
  }
}
