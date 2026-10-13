import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CollaborazioneWebDesignV2 from '@/models/CollaborazioniWebDesignV2';
import WebDesignInterview from '@/models/WebDesignInterview';
import { connectToDB } from '@/utils/database';
import {
  WEB_DESIGN_WORKFLOW_VERSION,
  scheduleExistingWorkflow,
} from '@/lib/webdesign-v2-workflow.mjs';

export const dynamic = 'force-dynamic';

const isStaff = (session) =>
  session?.user?.role === 'amministratore' || session?.user?.role === 'segretaria';

const canAccessWebDesigner = (session, webDesignerId) =>
  isStaff(session) || session?.user?.id === webDesignerId?.toString();

const canAccessCollaboration = (session, collaboration) =>
  canAccessWebDesigner(session, collaboration?.webDesigner?._id || collaboration?.webDesigner);

const getAutoreNome = (user) =>
  [user?.nome, user?.cognome].filter(Boolean).join(' ').trim() || user?.email || 'Utente';

const hasReceivedInterviewContent = (interview, risultatoTxt) =>
  Boolean(
    String(risultatoTxt || '').trim() ||
      Object.entries(interview || {}).some(
        ([key, value]) =>
          !['azienda', 'tipoSito'].includes(key) &&
          (Array.isArray(value) ? value.length > 0 : Boolean(String(value || '').trim()))
      )
  );

const populateInterview = (query) =>
  query
    .populate('webDesigner', 'nome cognome email')
    .populate('cliente', 'etichetta ragioneSociale nome')
    .populate('collaborazione', 'tipoProgetto aziendaRagioneSociale webDesigner cliente stato');

export async function GET(req) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ message: 'Non autenticato' }), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const collaborationId = searchParams.get('collaborationId');
    const webDesignerId = searchParams.get('webDesignerId');

    if (collaborationId) {
      if (!mongoose.Types.ObjectId.isValid(collaborationId)) {
        return new Response(JSON.stringify({ message: 'Collaborazione non valida' }), {
          status: 400,
        });
      }

      const collaborazione = await CollaborazioneWebDesignV2.findById(collaborationId)
        .populate('cliente', 'etichetta ragioneSociale nome')
        .populate('webDesigner', 'nome cognome email')
        .lean();

      if (!collaborazione) {
        return new Response(JSON.stringify({ message: 'Collaborazione non trovata' }), {
          status: 404,
        });
      }

      if (!canAccessCollaboration(session, collaborazione)) {
        return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
      }

      const intervista = await populateInterview(
        WebDesignInterview.findOne({ collaborazione: collaborationId })
      ).lean();

      return new Response(JSON.stringify({ collaborazione, intervista }), { status: 200 });
    }

    if (webDesignerId && !mongoose.Types.ObjectId.isValid(webDesignerId)) {
      return new Response(JSON.stringify({ message: 'Web designer non valido' }), { status: 400 });
    }

    if (webDesignerId && !canAccessWebDesigner(session, webDesignerId)) {
      return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
    }

    if (!webDesignerId && session.user.role !== 'amministratore') {
      return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
    }

    const query = webDesignerId ? { webDesigner: webDesignerId } : {};
    const interviste = await populateInterview(
      WebDesignInterview.find(query).sort({ updatedAt: -1 }).limit(200)
    ).lean();

    return new Response(JSON.stringify(interviste), { status: 200 });
  } catch (error) {
    console.error('Errore durante il recupero interviste web design:', error);
    return new Response(JSON.stringify({ message: 'Errore interno al server' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ message: 'Non autenticato' }), { status: 401 });
    }

    const {
      collaborationId,
      webDesignerId,
      azienda,
      interview,
      risultatoTxt,
      followUpAnswers,
    } = await req.json();

    if (!interview || typeof risultatoTxt !== 'string') {
      return new Response(JSON.stringify({ message: 'Dati intervista mancanti' }), { status: 400 });
    }

    if (collaborationId) {
      if (!mongoose.Types.ObjectId.isValid(collaborationId)) {
        return new Response(JSON.stringify({ message: 'Collaborazione non valida' }), {
          status: 400,
        });
      }

      const collaborazione = await CollaborazioneWebDesignV2.findById(collaborationId).lean();
      if (!collaborazione) {
        return new Response(JSON.stringify({ message: 'Collaborazione non trovata' }), {
          status: 404,
        });
      }

      if (!canAccessCollaboration(session, collaborazione)) {
        return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
      }

      const existing = await WebDesignInterview.findOne({ collaborazione: collaborationId }).lean();
      const interviewChanged =
        Boolean(existing) && JSON.stringify(existing.interview || {}) !== JSON.stringify(interview);
      const answersChanged =
        Boolean(existing) &&
        Array.isArray(followUpAnswers) &&
        JSON.stringify(existing.aiFollowUpAnswers || []) !== JSON.stringify(followUpAnswers);
      const update = {
        collaborazione: collaborationId,
        cliente: collaborazione.cliente,
        webDesigner: collaborazione.webDesigner,
        azienda: azienda || interview.azienda || collaborazione.aziendaRagioneSociale || '',
        interview,
        risultatoTxt,
        autoreId: existing?.autoreId || session.user.id || '',
        autoreNome: existing?.autoreNome || getAutoreNome(session.user),
        autoreEmail: existing?.autoreEmail || session.user.email || '',
        autoreRuolo:
          existing?.autoreRuolo || session.user.role || session.user.subrole || '',
      };

      if (Array.isArray(followUpAnswers)) update.aiFollowUpAnswers = followUpAnswers;
      if (interviewChanged && existing?.aiAnalysis) update.aiInputStale = true;
      if (answersChanged && existing?.aiFinalAnalysis) update.aiFinalStale = true;

      const savedInterview = await WebDesignInterview.findOneAndUpdate(
        { collaborazione: collaborationId },
        { $set: update },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );

      let workflowStarted = false;
      if (
        collaborazione.workflowVersion === WEB_DESIGN_WORKFLOW_VERSION &&
        !collaborazione.intervistaRicevutaAt &&
        hasReceivedInterviewContent(interview, risultatoTxt)
      ) {
        const schedule = scheduleExistingWorkflow(
          collaborazione,
          collaborazione.dataInizioContratto || new Date()
        );
        await CollaborazioneWebDesignV2.updateOne(
          { _id: collaborationId, intervistaRicevutaAt: null },
          { $set: schedule }
        );
        workflowStarted = true;
      }

      return new Response(
        JSON.stringify({
          message: existing ? 'Intervista aggiornata' : 'Intervista collegata alla collaborazione',
          intervista: savedInterview,
          workflowStarted,
        }),
        { status: existing ? 200 : 201 }
      );
    }

    if (!webDesignerId || !mongoose.Types.ObjectId.isValid(webDesignerId)) {
      return new Response(JSON.stringify({ message: 'Web designer non valido' }), { status: 400 });
    }

    if (!canAccessWebDesigner(session, webDesignerId)) {
      return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
    }

    const savedInterview = await WebDesignInterview.create({
      webDesigner: webDesignerId,
      azienda: azienda || interview.azienda || '',
      interview,
      risultatoTxt,
      aiFollowUpAnswers: Array.isArray(followUpAnswers) ? followUpAnswers : [],
      autoreId: session.user.id || '',
      autoreNome: getAutoreNome(session.user),
      autoreEmail: session.user.email || '',
      autoreRuolo: session.user.role || session.user.subrole || '',
    });

    return new Response(
      JSON.stringify({ message: 'Intervista salvata', intervista: savedInterview }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Errore durante il salvataggio intervista web design:', error);
    return new Response(JSON.stringify({ message: 'Errore interno al server' }), { status: 500 });
  }
}
