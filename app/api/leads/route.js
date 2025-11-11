import { connectToDB } from "@/utils/database";
import LeadCommerciale from "@/models/LeadCommerciale";
import { NextResponse } from "next/server";

// GET - Recupera tutti i lead di un commerciale
export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const commercialeId = searchParams.get('commerciale');
    const includiArchiviati = searchParams.get('archiviati') === 'true';

    if (!commercialeId) {
      return NextResponse.json(
        { error: "ID commerciale mancante" },
        { status: 400 }
      );
    }

    const filter = {
      commerciale: commercialeId,
      ...(includiArchiviati ? {} : { archiviato: false })
    };

    const leads = await LeadCommerciale.find(filter)
      .populate('commerciale', 'nome cognome email')
      .sort({ createdAt: -1 });

    return NextResponse.json(leads, { status: 200 });

  } catch (error) {
    console.error("Errore recupero leads:", error);
    return NextResponse.json(
      { error: "Errore recupero leads" },
      { status: 500 }
    );
  }
}

// POST - Crea nuovo lead
export async function POST(req) {
  try {
    await connectToDB();

    const body = await req.json();
    const {
      nome_attivita,
      numero_telefono,
      referente,
      indirizzo,
      citta,
      email,
      secondo_numero,
      commerciale,
      nota_generale
    } = body;

    // Validazione campi obbligatori
    if (!nome_attivita || !numero_telefono || !commerciale) {
      return NextResponse.json(
        { error: "Nome attività, numero di telefono e commerciale sono obbligatori" },
        { status: 400 }
      );
    }

    const nuovoLead = new LeadCommerciale({
      nome_attivita,
      numero_telefono,
      referente: referente || "",
      indirizzo: indirizzo || "",
      citta: citta || "",
      email: email || "",
      secondo_numero: secondo_numero || "",
      commerciale,
      nota_generale: nota_generale || "",
      stato_attuale: "in_lavorazione",
      data_cambio_stato: new Date(), // Data di creazione = primo stato
      timeline: {
        contatto: { completato: false, data_completamento: null },
        appuntamento: { completato: false, data_completamento: null },
        preventivo: { completato: false, data_completamento: null },
        contratto: { completato: false, data_completamento: null }
      }
    });

    await nuovoLead.save();

    const leadPopulated = await LeadCommerciale.findById(nuovoLead._id)
      .populate('commerciale', 'nome cognome email');

    return NextResponse.json(leadPopulated, { status: 201 });

  } catch (error) {
    console.error("Errore creazione lead:", error);
    return NextResponse.json(
      { error: "Errore creazione lead" },
      { status: 500 }
    );
  }
}
