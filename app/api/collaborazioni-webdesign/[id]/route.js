import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import { connectToDB } from "@/utils/database";
import mongoose from "mongoose";

const VALID_PROJECT_TYPES = ["e-commerce", "sito vetrina", "sito starter"];

const parseDateField = (value) => {
  if (value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();

    const { id } = resolvedParams;

    if (!id) {
      return new Response(JSON.stringify({ message: "ID mancante" }), { status: 400 });
    }

    // Determina se l'ID è un userId o un collaborazioneId
    const isUserId = mongoose.Types.ObjectId.isValid(id) && id.length === 24;

    if (isUserId) {
      // Recupera le collaborazioni associate al web designer (userId)
      const collaborazioni = await CollaborazioneWebDesign.find({ webDesigner: id })
        .populate("cliente", "etichetta")
        .populate("webDesigner", "nome cognome");

      if (!collaborazioni || collaborazioni.length === 0) {
        return new Response(JSON.stringify({ message: "Nessuna collaborazione trovata per questo utente" }), { status: 404 });
      }

      return new Response(JSON.stringify(collaborazioni), { status: 200 });
    } else {
      // Recupera una singola collaborazione (collaborazioneId)
      const collaborazione = await CollaborazioneWebDesign.findById(id)
        .populate("cliente", "etichetta")
        .populate("webDesigner", "nome cognome");

      if (!collaborazione) {
        return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
      }

      return new Response(JSON.stringify(collaborazione), { status: 200 });
    }
  } catch (error) {
    console.error("Errore durante il recupero:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();

    const { id } = resolvedParams; // ID della collaborazione
    const body = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ message: "ID collaborazione mancante" }), { status: 400 });
    }

    const collaborazione = await CollaborazioneWebDesign.findById(id);

    if (!collaborazione) {
      return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
    }

    // Aggiorna i campi generici (note, problemi, ecc.)
    if (body.note !== undefined) {
      collaborazione.note = body.note;
    }

    if (body.problemi !== undefined) {
      collaborazione.problemi = body.problemi;
    }

    if (body.stato !== undefined) {
      collaborazione.stato = body.stato;
    }

    if (body.tipoProgetto !== undefined) {
      if (!VALID_PROJECT_TYPES.includes(body.tipoProgetto)) {
        return new Response(JSON.stringify({ message: "Tipo progetto non valido" }), { status: 400 });
      }
      collaborazione.tipoProgetto = body.tipoProgetto;
    }

    if (body.dataInizioContratto !== undefined) {
      const dataInizioContratto = parseDateField(body.dataInizioContratto);
      if (dataInizioContratto === undefined) {
        return new Response(JSON.stringify({ message: "Data inizio contratto non valida" }), { status: 400 });
      }
      collaborazione.dataInizioContratto = dataInizioContratto;
    }

    if (body.dataFineContratto !== undefined) {
      const dataFineContratto = parseDateField(body.dataFineContratto);
      if (dataFineContratto === undefined) {
        return new Response(JSON.stringify({ message: "Data fine contratto non valida" }), { status: 400 });
      }
      collaborazione.dataFineContratto = dataFineContratto;
    }

    // Gestione dominio
    if (body.dominio !== undefined) {
      // Se viene passata una data di acquisto, calcola automaticamente la scadenza (1 anno dopo)
      if (body.dominio.dataAcquisto) {
        const dataAcquisto = parseDateField(body.dominio.dataAcquisto);
        if (dataAcquisto === undefined) {
          return new Response(JSON.stringify({ message: "Data acquisto dominio non valida" }), { status: 400 });
        }
        const dataScadenza = new Date(dataAcquisto);
        dataScadenza.setFullYear(dataScadenza.getFullYear() + 1);
        const dataScadenzaManuale = body.dominio.dataScadenza
          ? parseDateField(body.dominio.dataScadenza)
          : null;

        if (dataScadenzaManuale === undefined) {
          return new Response(JSON.stringify({ message: "Data scadenza dominio non valida" }), { status: 400 });
        }

        collaborazione.dominio = {
          ...collaborazione.dominio,
          ...body.dominio,
          dataAcquisto,
          dataScadenza: dataScadenzaManuale || dataScadenza,
          alertInviato: false, // Reset alert quando si aggiorna la data
          novaAlertData: null
        };
      } else {
        const dominio = { ...body.dominio };
        if (dominio.dataAcquisto !== undefined) {
          const dataAcquisto = parseDateField(dominio.dataAcquisto);
          if (dataAcquisto === undefined) {
            return new Response(JSON.stringify({ message: "Data acquisto dominio non valida" }), { status: 400 });
          }
          dominio.dataAcquisto = dataAcquisto;
        }
        if (dominio.dataScadenza !== undefined) {
          const dataScadenza = parseDateField(dominio.dataScadenza);
          if (dataScadenza === undefined) {
            return new Response(JSON.stringify({ message: "Data scadenza dominio non valida" }), { status: 400 });
          }
          dominio.dataScadenza = dataScadenza;
          dominio.alertInviato = false;
          dominio.novaAlertData = null;
        }
        collaborazione.dominio = {
          ...collaborazione.dominio,
          ...dominio
        };
      }
    }

    // Aggiorna i task
    if (body.tasks) {
      collaborazione.tasks = body.tasks;
    }

    // Salva le modifiche
    await collaborazione.save();

    return new Response(JSON.stringify({ message: "Collaborazione aggiornata con successo" }), { status: 200 });
  } catch (error) {
    console.error("Errore durante l'aggiornamento della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}
