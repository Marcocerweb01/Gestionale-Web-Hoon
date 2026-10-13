import CollaborazioneWebDesignV2 from '@/models/CollaborazioniWebDesignV2';
import WebDesignInterview from '@/models/WebDesignInterview';
import { connectToDB } from '@/utils/database';
import { Azienda, Collaboratore } from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPublicationChecklist } from '@/lib/webdesign-v2-publication-checklist';
import { createWebDesignWorkflow, normalizeProjectType } from '@/lib/webdesign-v2-workflow.mjs';
import { createSeoCollaborationForWebProject, findSeoAssignee } from '@/lib/seo-collaborations';
import { queueUserNotifications } from '@/lib/user-notifications';

const VALID_PROJECT_TYPES = ['vetrina', 'e-commerce', 'one-page', 'landing-page', 'blog'];

export async function POST(req) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ message: 'Non autenticato' }), { status: 401 });
    }
    if (!['amministratore', 'segretaria'].includes(session.user.role)) {
      return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
    }

    const { tipoProgetto, clienteId, webDesignerId, note, dataInizioContratto, dataFineContratto } =
      await req.json();

    if (!tipoProgetto || !clienteId || !webDesignerId || !dataInizioContratto || !dataFineContratto) {
      return new Response(JSON.stringify({ message: 'Dati mancanti' }), { status: 400 });
    }
    if (!VALID_PROJECT_TYPES.includes(tipoProgetto)) {
      return new Response(JSON.stringify({ message: 'Tipo progetto non valido' }), { status: 400 });
    }

    const [azienda, collaboratore] = await Promise.all([
      Azienda.findById(clienteId),
      Collaboratore.findById(webDesignerId),
    ]);

    if (!azienda || !collaboratore) {
      return new Response(JSON.stringify({ message: 'Azienda o collaboratore non trovati' }), {
        status: 404,
      });
    }

    // One Page, Landing Page e Blog confluiscono nella timeline Vetrina finché
    // non verranno introdotti workflow dedicati.
    const normalizedProjectType = normalizeProjectType(tipoProgetto);
    const workflow = createWebDesignWorkflow({
      projectType: normalizedProjectType,
      operationalStart: dataInizioContratto,
    });
    const seo = await findSeoAssignee();
    const nuovaCollaborazione = await CollaborazioneWebDesignV2.create({
      ...workflow,
      tipoProgetto: normalizedProjectType,
      cliente: clienteId,
      webDesigner: webDesignerId,
      aziendaRagioneSociale: azienda.ragioneSociale,
      collaboratoreNome: collaboratore.nome,
      collaboratoreCognome: collaboratore.cognome,
      checklistPubblicazione: createPublicationChecklist(),
      note: note || '',
      dataInizioContratto,
      dataFineContratto,
    });

    const nomeAutore =
      [session.user.nome, session.user.cognome].filter(Boolean).join(' ').trim() ||
      session.user.email ||
      'Utente';
    let intervistaIniziale;
    try {
      intervistaIniziale = await WebDesignInterview.create({
        collaborazione: nuovaCollaborazione._id,
        cliente: clienteId,
        webDesigner: webDesignerId,
        azienda: azienda.etichetta || azienda.ragioneSociale || azienda.nome || '',
        interview: {
          azienda: azienda.etichetta || azienda.ragioneSociale || azienda.nome || '',
          tipoSito: normalizedProjectType === 'e-commerce' ? 'E-commerce' : 'Sito vetrina',
        },
        risultatoTxt: '',
        autoreId: session.user.id || '',
        autoreNome: nomeAutore,
        autoreEmail: session.user.email || '',
        autoreRuolo: session.user.role || session.user.subrole || '',
      });
      const seoCollaboration = await createSeoCollaborationForWebProject({
        project: nuovaCollaborazione,
        sourceType: 'webdesign-v2',
        seo,
      });
      await queueUserNotifications([seo], {
        tipo: 'seo_assegnazione',
        titolo: `Nuovo servizio SEO: ${azienda.ragioneSociale}`,
        messaggio: `Ti è stato assegnato il servizio SEO collegato al nuovo progetto web di ${azienda.ragioneSociale}.`,
        link: '/',
        refId: String(seoCollaboration._id),
      }).catch((notificationError) =>
        console.error('Errore accodamento notifica SEO:', notificationError)
      );
    } catch (seoError) {
      if (intervistaIniziale?._id) {
        await WebDesignInterview.deleteOne({ _id: intervistaIniziale._id });
      }
      await CollaborazioneWebDesignV2.deleteOne({ _id: nuovaCollaborazione._id });
      throw seoError;
    }

    return new Response(
      JSON.stringify({
        ...nuovaCollaborazione.toObject(),
        interviewWorkflow: {
          id: intervistaIniziale._id,
          stato: 'da_compilare',
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Errore durante la creazione della collaborazione v2:', error);
    return new Response(JSON.stringify({ message: error.message || 'Errore interno al server' }), {
      status: 500,
    });
  }
}
