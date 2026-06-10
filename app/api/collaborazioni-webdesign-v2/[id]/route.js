import CollaborazioneWebDesignV2 from '@/models/CollaborazioniWebDesignV2';
import { connectToDB } from '@/utils/database';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
      if (body.dominio.dataAcquisto) {
        const dataAcquisto = new Date(body.dominio.dataAcquisto);
        const dataScadenza = new Date(dataAcquisto);
        dataScadenza.setFullYear(dataScadenza.getFullYear() + 1);
        updatePayload.dominio = {
          ...body.dominio,
          dataScadenza,
          alertInviato: false,
          novaAlertData: null,
        };
      } else {
        updatePayload.dominio = body.dominio;
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
