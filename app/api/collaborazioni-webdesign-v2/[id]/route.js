import CollaborazioneWebDesignV2 from '@/models/CollaborazioniWebDesignV2';
import { connectToDB } from '@/utils/database';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const VALID_PROJECT_TYPES = ['vetrina', 'e-commerce'];

const parseDateField = (value) => {
  if (value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();

    const { id } = resolvedParams;

    if (!id) {
      return new Response(JSON.stringify({ message: 'ID mancante' }), { status: 400 });
    }

    const isValidId = mongoose.Types.ObjectId.isValid(id);

    if (isValidId) {
      const collaborazioni = await CollaborazioneWebDesignV2.find({ webDesigner: id })
        .populate('cliente', 'etichetta')
        .populate('webDesigner', 'nome cognome');

      if (!collaborazioni || collaborazioni.length === 0) {
        return new Response(JSON.stringify([]), { status: 200 });
      }

      return new Response(JSON.stringify(collaborazioni), { status: 200 });
    } else {
      const collaborazione = await CollaborazioneWebDesignV2.findById(id)
        .populate('cliente', 'etichetta')
        .populate('webDesigner', 'nome cognome');

      if (!collaborazione) {
        return new Response(JSON.stringify({ message: 'Collaborazione non trovata' }), {
          status: 404,
        });
      }

      return new Response(JSON.stringify(collaborazione), { status: 200 });
    }
  } catch (error) {
    console.error('Errore durante il recupero v2:', error);
    return new Response(JSON.stringify({ message: 'Errore interno al server' }), { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();

    const { id } = resolvedParams;
    const body = await req.json();
    const session = await getServerSession(authOptions);

    if (!id) {
      return new Response(JSON.stringify({ message: 'ID collaborazione mancante' }), {
        status: 400,
      });
    }

    const updatePayload = {};

    if (body.note !== undefined) updatePayload.note = body.note;
    if (body.stato !== undefined) updatePayload.stato = body.stato;
    if (body.tipoProgetto !== undefined) {
      if (!VALID_PROJECT_TYPES.includes(body.tipoProgetto)) {
        return new Response(JSON.stringify({ message: 'Tipo progetto non valido' }), {
          status: 400,
        });
      }
      updatePayload.tipoProgetto = body.tipoProgetto;
    }
    if (body.dataInizioContratto !== undefined) {
      const dataInizioContratto = parseDateField(body.dataInizioContratto);
      if (dataInizioContratto === undefined) {
        return new Response(JSON.stringify({ message: 'Data inizio contratto non valida' }), {
          status: 400,
        });
      }
      updatePayload.dataInizioContratto = dataInizioContratto;
    }
    if (body.dataFineContratto !== undefined) {
      const dataFineContratto = parseDateField(body.dataFineContratto);
      if (dataFineContratto === undefined) {
        return new Response(JSON.stringify({ message: 'Data fine contratto non valida' }), {
          status: 400,
        });
      }
      updatePayload.dataFineContratto = dataFineContratto;
    }
    if (body.fasi !== undefined) updatePayload.fasi = body.fasi;
    if (body.controlli !== undefined) updatePayload.controlli = body.controlli;
    if (body.fasiControllo !== undefined) {
      if (!session || (session.user.role !== 'amministratore' && session.user.role !== 'segretaria')) {
        return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
      }
      updatePayload.fasiControllo = body.fasiControllo;
    }
    if (body.checklistPubblicazione !== undefined) {
      updatePayload.checklistPubblicazione = body.checklistPubblicazione;
    }

    if (body.interview !== undefined) {
      updatePayload.interview = body.interview;
    }

    if (body.interviewPrompt !== undefined) {
      updatePayload.interviewPrompt = body.interviewPrompt;
    }

    if (body.dominio !== undefined) {
      const dominio = { ...body.dominio };
      let resetAlert = false;

      if (dominio.dataAcquisto !== undefined) {
        const dataAcquisto = parseDateField(dominio.dataAcquisto);
        if (dataAcquisto === undefined) {
          return new Response(JSON.stringify({ message: 'Data acquisto dominio non valida' }), {
            status: 400,
          });
        }
        dominio.dataAcquisto = dataAcquisto;
        resetAlert = true;

        if (dominio.dataScadenza === undefined && dataAcquisto) {
          const dataScadenza = new Date(dataAcquisto);
          dataScadenza.setFullYear(dataScadenza.getFullYear() + 1);
          dominio.dataScadenza = dataScadenza;
        }
      }

      if (dominio.dataScadenza !== undefined) {
        const dataScadenza = parseDateField(dominio.dataScadenza);
        if (dataScadenza === undefined) {
          return new Response(JSON.stringify({ message: 'Data scadenza dominio non valida' }), {
            status: 400,
          });
        }
        dominio.dataScadenza = dataScadenza;
        resetAlert = true;
      }

      Object.entries(dominio).forEach(([key, value]) => {
        updatePayload[`dominio.${key}`] = value;
      });

      if (resetAlert) {
        updatePayload['dominio.alertInviato'] = false;
        updatePayload['dominio.novaAlertData'] = null;
      }
    }

    const updated = await CollaborazioneWebDesignV2.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: false }
    );

    if (!updated) {
      return new Response(JSON.stringify({ message: 'Collaborazione non trovata' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ message: 'Collaborazione v2 aggiornata con successo' }), {
      status: 200,
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento v2:", error);
    return new Response(JSON.stringify({ message: 'Errore interno al server', detail: error.message }), { status: 500 });
  }
}
