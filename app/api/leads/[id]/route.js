import { connectToDB } from "@/utils/database";
import LeadCommerciale from "@/models/LeadCommerciale";
import { NextResponse } from "next/server";

// GET - Recupera singolo lead
export async function GET(req, { params }) {
  try {
    await connectToDB();

    const { id } = params;

    const lead = await LeadCommerciale.findById(id)
      .populate('commerciale', 'nome cognome email');

    if (!lead) {
      return NextResponse.json(
        { error: "Lead non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead, { status: 200 });

  } catch (error) {
    console.error("Errore recupero lead:", error);
    return NextResponse.json(
      { error: "Errore recupero lead" },
      { status: 500 }
    );
  }
}

// PATCH - Aggiorna lead (timeline, dati, stati)
export async function PATCH(req, { params }) {
  try {
    await connectToDB();

    const { id } = params;
    const body = await req.json();

    const lead = await LeadCommerciale.findById(id);

    if (!lead) {
      return NextResponse.json(
        { error: "Lead non trovato" },
        { status: 404 }
      );
    }

    // Aggiorna dati base
    if (body.nome_attivita) lead.nome_attivita = body.nome_attivita;
    if (body.numero_telefono) lead.numero_telefono = body.numero_telefono;
    if (body.referente !== undefined) lead.referente = body.referente;
    if (body.indirizzo !== undefined) lead.indirizzo = body.indirizzo;
    if (body.citta !== undefined) lead.citta = body.citta;
    if (body.email !== undefined) lead.email = body.email;
    if (body.secondo_numero !== undefined) lead.secondo_numero = body.secondo_numero;
    if (body.nota_generale !== undefined) lead.nota_generale = body.nota_generale;

    // Aggiorna archiviazione
    if (body.archiviato !== undefined) lead.archiviato = body.archiviato;
    if (body.data_archiviazione !== undefined) lead.data_archiviazione = body.data_archiviazione;

    // Aggiorna data richiamo
    if (body.data_richiamo !== undefined) {
      lead.data_richiamo = body.data_richiamo;
    }

    // Aggiorna timeline stati con supporto per aggiornamenti multipli
    const statiTimeline = ['contatto', 'appuntamento', 'preventivo', 'contratto'];
    
    statiTimeline.forEach(stato => {
      const updateKey = `timeline.${stato}.completato`;
      const dateKey = `timeline.${stato}.data_completamento`;
      
      if (body[updateKey] !== undefined) {
        lead.timeline[stato].completato = body[updateKey];
        
        if (body[updateKey]) {
          lead.timeline[stato].data_completamento = body[dateKey] || new Date();
        } else {
          lead.timeline[stato].data_completamento = null;
        }
      }
    });

    // PRIORITÀ ASSOLUTA: Logica contratto (sovrascrive tutto)
    if (body['timeline.contratto.completato'] === true) {
      // Cambio stato automatico a "completato"
      if (lead.stato_attuale !== 'completato') {
        lead.data_cambio_stato = new Date();
      }
      lead.stato_attuale = 'completato';
    } else if (body['timeline.contratto.completato'] === false) {
      // Torna a "in_lavorazione"
      if (lead.stato_attuale !== 'in_lavorazione') {
        lead.data_cambio_stato = new Date();
      }
      lead.stato_attuale = 'in_lavorazione';
    } else if (body.stato_attuale !== undefined) {
      // Cambio stato manuale dal dropdown
      if (lead.stato_attuale !== body.stato_attuale) {
        lead.data_cambio_stato = new Date();
      }
      lead.stato_attuale = body.stato_attuale;
    }

    await lead.save();

    const leadAggiornato = await LeadCommerciale.findById(id)
      .populate('commerciale', 'nome cognome email');

    return NextResponse.json(leadAggiornato, { status: 200 });

  } catch (error) {
    console.error("Errore aggiornamento lead:", error);
    return NextResponse.json(
      { error: "Errore aggiornamento lead" },
      { status: 500 }
    );
  }
}

// DELETE - Elimina lead
export async function DELETE(req, { params }) {
  try {
    await connectToDB();

    const { id } = params;

    const lead = await LeadCommerciale.findByIdAndDelete(id);

    if (!lead) {
      return NextResponse.json(
        { error: "Lead non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Lead eliminato con successo" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Errore eliminazione lead:", error);
    return NextResponse.json(
      { error: "Errore eliminazione lead" },
      { status: 500 }
    );
  }
}
