import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import ChiusuraAttivazione from "@/models/ChiusuraAttivazione";
import { Collaboratore } from "@/models/User";

const authorize = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !["amministratore", "segretaria"].includes(session.user.role)) return null;
  return session;
};

const parseDate = (value) => {
  const date = new Date(`${String(value || "").slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function PUT(request, { params }) {
  try {
    if (!(await authorize())) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "ID non valido" }, { status: 400 });
    await connectToDB();

    const evento = await ChiusuraAttivazione.findById(id);
    if (!evento) return NextResponse.json({ error: "Voce non trovata" }, { status: 404 });
    const body = await request.json();
    const dataEvento = parseDate(body.dataEvento);
    if (!dataEvento) return NextResponse.json({ error: "Data non valida" }, { status: 400 });

    evento.dataEvento = dataEvento;
    evento.note = String(body.note || "").trim();

    if (evento.categoria === "chiusura") {
      if (!mongoose.Types.ObjectId.isValid(body.collaborazioneId) ||
          !["social", "webdesign", "webdesign-v2", "googleads"].includes(body.collaborazioneTipo)) {
        return NextResponse.json({ error: "Seleziona una collaborazione valida" }, { status: 400 });
      }
      const duplicata = await ChiusuraAttivazione.exists({
        _id: { $ne: evento._id },
        categoria: "chiusura",
        collaborazioneTipo: body.collaborazioneTipo,
        collaborazioneId: body.collaborazioneId,
        stato: "programmata",
      });
      if (duplicata) return NextResponse.json({ error: "Questa collaborazione ha già una chiusura programmata" }, { status: 409 });
      evento.collaborazioneTipo = body.collaborazioneTipo;
      evento.collaborazioneId = body.collaborazioneId;
      evento.collaborazioneEtichetta = String(body.collaborazioneEtichetta || "").trim();
    } else {
      if (!String(body.ragioneSociale || "").trim() || !String(body.servizio || "").trim()) {
        return NextResponse.json({ error: "Ragione sociale e servizio sono obbligatori" }, { status: 400 });
      }
      let collaboratoreNome = String(body.collaboratoreNome || "").trim();
      if (body.collaboratore && mongoose.Types.ObjectId.isValid(body.collaboratore)) {
        const collaboratore = await Collaboratore.findById(body.collaboratore).select("nome cognome").lean();
        if (collaboratore) collaboratoreNome = `${collaboratore.nome || ""} ${collaboratore.cognome || ""}`.trim();
      }
      evento.ragioneSociale = String(body.ragioneSociale).trim();
      evento.referente = String(body.referente || "").trim();
      evento.email = String(body.email || "").trim();
      evento.telefono = String(body.telefono || "").trim();
      evento.partitaIva = String(body.partitaIva || "").trim();
      evento.servizio = String(body.servizio).trim();
      evento.importo = String(body.importo || "").trim();
      evento.periodicita = body.periodicita || "mensile";
      evento.collaboratore = mongoose.Types.ObjectId.isValid(body.collaboratore) ? body.collaboratore : null;
      evento.collaboratoreNome = collaboratoreNome;
    }

    await evento.save();
    return NextResponse.json(evento);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    if (!(await authorize())) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
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
