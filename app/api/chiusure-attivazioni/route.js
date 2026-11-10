import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import ChiusuraAttivazione from "@/models/ChiusuraAttivazione";
import { Collaboratore } from "@/models/User";
import { processaEventiScaduti } from "@/lib/chiusure-attivazioni";

export const dynamic = "force-dynamic";

const authorize = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !["amministratore", "segretaria"].includes(session.user.role)) return null;
  return session;
};

const parseDate = (value) => {
  const date = new Date(`${String(value || "").slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function GET() {
  try {
    if (!(await authorize())) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    await connectToDB();
    await processaEventiScaduti();

    const eventi = await ChiusuraAttivazione.find()
      .populate("collaboratore", "nome cognome email")
      .sort({ dataEvento: 1, createdAt: -1 })
      .lean();
    return NextResponse.json(eventi);
  } catch (error) {
    console.error("Errore caricamento chiusure/attivazioni:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await authorize();
    if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    await connectToDB();

    const body = await request.json();
    const dataEvento = parseDate(body.dataEvento);
    if (!dataEvento || !["chiusura", "attivazione"].includes(body.categoria)) {
      return NextResponse.json({ error: "Categoria o data non valida" }, { status: 400 });
    }

    const payload = {
      categoria: body.categoria,
      dataEvento,
      note: String(body.note || "").trim(),
      creataDa: session.user.email || session.user.name || "",
    };

    if (body.categoria === "chiusura") {
      if (!mongoose.Types.ObjectId.isValid(body.collaborazioneId) ||
          !["social", "webdesign", "webdesign-v2", "googleads"].includes(body.collaborazioneTipo)) {
        return NextResponse.json({ error: "Seleziona una collaborazione valida" }, { status: 400 });
      }
      const duplicata = await ChiusuraAttivazione.findOne({
        categoria: "chiusura",
        collaborazioneTipo: body.collaborazioneTipo,
        collaborazioneId: body.collaborazioneId,
        stato: "programmata",
      });
      if (duplicata) return NextResponse.json({ error: "Questa collaborazione ha già una chiusura programmata" }, { status: 409 });
      Object.assign(payload, {
        collaborazioneTipo: body.collaborazioneTipo,
        collaborazioneId: body.collaborazioneId,
        collaborazioneEtichetta: String(body.collaborazioneEtichetta || "").trim(),
      });
    } else {
      if (!String(body.ragioneSociale || "").trim() || !String(body.servizio || "").trim()) {
        return NextResponse.json({ error: "Ragione sociale e servizio sono obbligatori" }, { status: 400 });
      }
      let collaboratoreNome = String(body.collaboratoreNome || "").trim();
      if (body.collaboratore && mongoose.Types.ObjectId.isValid(body.collaboratore)) {
        const collaboratore = await Collaboratore.findById(body.collaboratore).select("nome cognome").lean();
        if (collaboratore) collaboratoreNome = `${collaboratore.nome || ""} ${collaboratore.cognome || ""}`.trim();
      }
      Object.assign(payload, {
        ragioneSociale: String(body.ragioneSociale).trim(),
        referente: String(body.referente || "").trim(),
        email: String(body.email || "").trim(),
        telefono: String(body.telefono || "").trim(),
        partitaIva: String(body.partitaIva || "").trim(),
        servizio: String(body.servizio).trim(),
        importo: Math.max(0, Number(body.importo) || 0),
        periodicita: body.periodicita || "mensile",
        collaboratore: mongoose.Types.ObjectId.isValid(body.collaboratore) ? body.collaboratore : null,
        collaboratoreNome,
      });
    }

    const evento = await ChiusuraAttivazione.create(payload);
    await processaEventiScaduti();
    return NextResponse.json(evento, { status: 201 });
  } catch (error) {
    console.error("Errore salvataggio chiusura/attivazione:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
