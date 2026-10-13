import CollaborazioneWebDesignV2 from '@/models/CollaborazioniWebDesignV2';
import WebDesignInterview from '@/models/WebDesignInterview';
import { connectToDB } from '@/utils/database';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  isStandardWorkflowProject,
  isWorkflowPhaseUnlocked,
  rescheduleWebDesignWorkflow,
  validateDeliveryConfirmation,
} from '@/lib/webdesign-v2-workflow.mjs';

export const dynamic = 'force-dynamic';

const VALID_PROJECT_TYPES = ['vetrina', 'e-commerce'];
const isStaff = (session) =>
  session?.user?.role === 'amministratore' || session?.user?.role === 'segretaria';

const parseDateField = (value) => {
  if (value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new Response(JSON.stringify({ message: 'Non autenticato' }), { status: 401 });
    }

    const { id } = resolvedParams;

    if (!id) {
      return new Response(JSON.stringify({ message: 'ID mancante' }), { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ message: 'Web designer non valido' }), { status: 400 });
    }

    if (!isStaff(session) && session.user.id !== id) {
      return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
    }

    const collaborazioni = await CollaborazioneWebDesignV2.find({ webDesigner: id })
      .populate('cliente', 'etichetta ragioneSociale nome')
      .populate('webDesigner', 'nome cognome')
      .sort({ createdAt: -1 })
      .lean();

    const collaborationIds = collaborazioni.map((item) => item._id);
    const interviste = collaborationIds.length
      ? await WebDesignInterview.find({ collaborazione: { $in: collaborationIds } })
          .select(
            'collaborazione aiStage aiInputStale aiFinalStale aiInitialGeneratedAt aiFinalGeneratedAt aiGeneratedAt interview risultatoTxt updatedAt'
          )
          .lean()
      : [];
    const interviewByCollaboration = new Map(
      interviste.map((item) => [item.collaborazione?.toString(), item])
    );

    const result = collaborazioni.map((collaborazione) => {
      const item = interviewByCollaboration.get(collaborazione._id.toString());
      const hasContent = Boolean(
        item?.risultatoTxt ||
          Object.entries(item?.interview || {}).some(
            ([key, value]) =>
              !['azienda', 'tipoSito'].includes(key) &&
              (Array.isArray(value) ? value.length > 0 : Boolean(String(value || '').trim()))
          )
      );

      return {
        ...collaborazione,
        interviewWorkflow: item
          ? {
              id: item._id,
              stato: item.aiFinalGeneratedAt
                ? 'finale'
                : item.aiInitialGeneratedAt || item.aiGeneratedAt
                  ? 'prima_analisi'
                  : hasContent
                    ? 'in_compilazione'
                    : 'da_compilare',
              aiInputStale: Boolean(item.aiInputStale),
              aiFinalStale: Boolean(item.aiFinalStale),
              updatedAt: item.updatedAt,
            }
          : null,
      };
    });

    return new Response(JSON.stringify(result), { status: 200 });
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
    const isAdministrator = session?.user?.role === 'amministratore';

    if (!session?.user) {
      return new Response(JSON.stringify({ message: 'Non autenticato' }), { status: 401 });
    }

    if (!id) {
      return new Response(JSON.stringify({ message: 'ID collaborazione mancante' }), {
        status: 400,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ message: 'ID collaborazione non valido' }), {
        status: 400,
      });
    }

    const collaborationToUpdate = await CollaborazioneWebDesignV2.findById(id).lean();
    if (!collaborationToUpdate) {
      return new Response(JSON.stringify({ message: 'Collaborazione non trovata' }), {
        status: 404,
      });
    }
    if (
      !isStaff(session) &&
      collaborationToUpdate.webDesigner?.toString() !== session.user.id
    ) {
      return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
    }
    const standardWorkflow = isStandardWorkflowProject(collaborationToUpdate);

    const updatePayload = {};

    if (body.spostaTimeline !== undefined) {
      if (!isStaff(session)) {
        return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
      }
      if (!standardWorkflow) {
        return new Response(
          JSON.stringify({ message: 'La riprogrammazione automatica è disponibile sui nuovi workflow.' }),
          { status: 400 }
        );
      }

      const nuovaData = body.spostaTimeline?.dataAvvio;
      let rescheduled;
      try {
        rescheduled = rescheduleWebDesignWorkflow(collaborationToUpdate, nuovaData);
      } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 400 });
      }

      const actorName =
        [session.user.nome, session.user.cognome].filter(Boolean).join(' ').trim() ||
        session.user.name ||
        session.user.email ||
        'Utente';
      Object.assign(updatePayload, rescheduled, {
        modificheTimeline: [
          ...(collaborationToUpdate.modificheTimeline || []),
          {
            dataPrecedente:
              collaborationToUpdate.dataAvvioOperativo || collaborationToUpdate.dataInizioContratto,
            dataNuova: rescheduled.dataAvvioOperativo,
            dataFinePrecedente:
              collaborationToUpdate.consegna?.dataPrevista || collaborationToUpdate.dataFineContratto,
            dataFineNuova: rescheduled.consegna.dataPrevista,
            modificataIl: new Date(),
            modificataDaId: session.user.id || '',
            modificataDaNome: actorName,
            motivo: String(body.spostaTimeline?.motivo || '').trim(),
          },
        ],
      });
    }

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
      if (!isAdministrator) {
        return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
      }
      const dataInizioContratto = parseDateField(body.dataInizioContratto);
      if (dataInizioContratto === undefined) {
        return new Response(JSON.stringify({ message: 'Data inizio contratto non valida' }), {
          status: 400,
        });
      }
      if (standardWorkflow) {
        return new Response(
          JSON.stringify({ message: "Usa l'azione Sposta timeline per modificare l'avvio di questo progetto." }),
          { status: 400 }
        );
      }
      updatePayload.dataInizioContratto = dataInizioContratto;
    }
    if (body.dataFineContratto !== undefined) {
      if (!isAdministrator) {
        return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
      }
      const dataFineContratto = parseDateField(body.dataFineContratto);
      if (dataFineContratto === undefined) {
        return new Response(JSON.stringify({ message: 'Data fine contratto non valida' }), {
          status: 400,
        });
      }
      updatePayload.dataFineContratto = dataFineContratto;
    }
    if (body.fasi !== undefined) {
      const currentPhaseByName = new Map(
        (collaborationToUpdate.fasi || []).map((phase) => [phase.nome, phase])
      );
      if (
        standardWorkflow &&
        (body.fasi.length !== currentPhaseByName.size || body.fasi.some((phase) => !currentPhaseByName.has(phase.nome)))
      ) {
        return new Response(JSON.stringify({ message: 'Struttura delle fasi non valida' }), {
          status: 400,
        });
      }
      updatePayload.fasi = body.fasi.map((fase) => {
        const currentPhase = currentPhaseByName.get(fase.nome);
        const normalized = {
          ...fase,
          tasks: (fase.tasks || []).map((task) => ({
            ...task,
            completata: task.stato
              ? ['completata', 'non applicabile'].includes(task.stato)
              : Boolean(task.completata),
          })),
        };
        if (!standardWorkflow) return normalized;
        return {
          ...normalized,
          giornoInizio: currentPhase.giornoInizio,
          giornoFine: currentPhase.giornoFine,
          dataInizioPrevista: currentPhase.dataInizioPrevista,
          dataFinePrevista: currentPhase.dataFinePrevista,
          controlloTipo: currentPhase.controlloTipo,
        };
      });
    }
    if (body.controlli !== undefined) updatePayload.controlli = body.controlli;
    if (body.fasiControllo !== undefined) {
      if (!isStaff(session) && !standardWorkflow) {
        return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
      }
      const asksForException = body.fasiControllo.some((control) => {
        const current = (collaborationToUpdate.fasiControllo || []).find(
          (item) => item.tipo === control.tipo
        );
        return control.eccezioneAutorizzata && !current?.eccezioneAutorizzata;
      });
      if (asksForException && !isStaff(session)) {
        return new Response(JSON.stringify({ message: "Solo lo staff può autorizzare un'eccezione." }), {
          status: 403,
        });
      }
      if (standardWorkflow) {
        const currentControlByType = new Map(
          (collaborationToUpdate.fasiControllo || []).map((control) => [control.tipo, control])
        );
        if (
          body.fasiControllo.length !== currentControlByType.size ||
          body.fasiControllo.some((control) => !currentControlByType.has(control.tipo))
        ) {
          return new Response(JSON.stringify({ message: 'Struttura dei controlli non valida' }), {
            status: 400,
          });
        }
        updatePayload.fasiControllo = body.fasiControllo.map((control) => {
          const current = currentControlByType.get(control.tipo);
          return {
            ...control,
            giornoPrevisto: current.giornoPrevisto,
            dataPrevista: current.dataPrevista,
            condizionale: current.condizionale,
          };
        });
      } else {
        updatePayload.fasiControllo = body.fasiControllo;
      }
    }
    if (body.checklistPubblicazione !== undefined) {
      updatePayload.checklistPubblicazione = body.checklistPubblicazione;
    }

    if (body.appuntamenti !== undefined) updatePayload.appuntamenti = body.appuntamenti;
    if (body.approvazioni !== undefined) updatePayload.approvazioni = body.approvazioni;

    const nextControls = updatePayload.fasiControllo || collaborationToUpdate.fasiControllo || [];
    if (
      updatePayload.fasi &&
      standardWorkflow
    ) {
      for (const phase of updatePayload.fasi) {
        if (
          phase.nome !== 'struttura' &&
          !isWorkflowPhaseUnlocked(
            phase.nome,
            nextControls,
            Boolean(collaborationToUpdate.dataAvvioOperativo)
          )
        ) {
          const currentPhase = (collaborationToUpdate.fasi || []).find(
            (item) => item.nome === phase.nome
          );
          if (JSON.stringify(phase) !== JSON.stringify(currentPhase)) {
            return new Response(
              JSON.stringify({
                message: `La fase ${phase.nome} è bloccata finché il controllo precedente non viene superato.`,
              }),
              { status: 409 }
            );
          }
        }
      }
    }
    const nextChecklist =
      updatePayload.checklistPubblicazione || collaborationToUpdate.checklistPubblicazione || [];
    if (body.consegna !== undefined) {
      if (!standardWorkflow) {
        return new Response(JSON.stringify({ message: 'La consegna separata è disponibile sui nuovi workflow.' }), {
          status: 400,
        });
      }
      const consegna = { ...(collaborationToUpdate.consegna || {}), ...body.consegna };
      for (const key of ['dataPrevista', 'dataEffettiva']) {
        if (body.consegna[key] !== undefined) {
          const parsed = parseDateField(body.consegna[key]);
          if (parsed === undefined) {
            return new Response(JSON.stringify({ message: `Data consegna ${key} non valida` }), { status: 400 });
          }
          consegna[key] = parsed;
        }
      }
      if (consegna.confermata || consegna.stato === 'consegnato') {
        consegna.confermata = true;
        consegna.stato = 'consegnato';
        consegna.dataEffettiva = consegna.dataEffettiva || new Date();
        const validation = validateDeliveryConfirmation({ controls: nextControls, delivery: consegna });
        if (!validation.ok) {
          return new Response(JSON.stringify({ message: validation.message }), { status: 409 });
        }
      }
      updatePayload.consegna = consegna;
    }

    if (body.pubblicazione !== undefined) {
      if (!standardWorkflow) {
        return new Response(JSON.stringify({ message: 'La pubblicazione separata è disponibile sui nuovi workflow.' }), {
          status: 400,
        });
      }
      const pubblicazione = {
        ...(collaborationToUpdate.pubblicazione || {}),
        ...body.pubblicazione,
      };
      for (const key of ['dataPrevista', 'dataEffettiva']) {
        if (body.pubblicazione[key] !== undefined) {
          const parsed = parseDateField(body.pubblicazione[key]);
          if (parsed === undefined) {
            return new Response(JSON.stringify({ message: `Data pubblicazione ${key} non valida` }), { status: 400 });
          }
          pubblicazione[key] = parsed;
        }
      }
      if (pubblicazione.stato === 'pubblicata') {
        const publicationCheck = nextControls.find(
          (control) => control.tipo === 'pubblicazione-effettiva'
        );
        if (!pubblicazione.urlPubblico?.trim()) {
          return new Response(JSON.stringify({ message: 'Inserisci URL pubblico prima di registrare la pubblicazione.' }), { status: 409 });
        }
        if (
          publicationCheck &&
          (!publicationCheck.completata || !['superato', 'ok'].includes(publicationCheck.esito))
        ) {
          return new Response(JSON.stringify({ message: 'Completa il controllo pubblicazione prima di segnare il sito come pubblicato.' }), { status: 409 });
        }
        if (publicationCheck && !publicationCheck.data) {
          return new Response(JSON.stringify({ message: 'Registra la data effettiva del controllo pubblicazione.' }), { status: 409 });
        }
        const pendingRequiredChecks = nextChecklist
          .flatMap((group) => group.items || [])
          .filter(
            (item) =>
              (item.tipoControllo || 'obbligatorio') === 'obbligatorio' &&
              !item.completata &&
              item.stato !== 'non applicabile'
          );
        if (pendingRequiredChecks.length) {
          return new Response(
            JSON.stringify({
              message: `Completa i ${pendingRequiredChecks.length} controlli obbligatori di pubblicazione ancora pendenti.`,
            }),
            { status: 409 }
          );
        }
        pubblicazione.dataEffettiva = pubblicazione.dataEffettiva || new Date();
      }
      updatePayload.pubblicazione = pubblicazione;
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
        if (!isAdministrator) {
          return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
        }
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
        if (!isAdministrator) {
          return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
        }
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
      { new: true, runValidators: true }
    );

    if (!updated) {
      return new Response(JSON.stringify({ message: 'Collaborazione non trovata' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ message: 'Collaborazione v2 aggiornata con successo', collaborazione: updated }), {
      status: 200,
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento v2:", error);
    return new Response(JSON.stringify({ message: 'Errore interno al server', detail: error.message }), { status: 500 });
  }
}
