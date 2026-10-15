'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Palette,
  Rocket,
  ShoppingCart,
  Square,
  Store,
} from 'lucide-react';
import { createPublicationChecklist } from '@/lib/webdesign-v2-publication-checklist';
import {
  WEB_DESIGN_WORKFLOW_VERSION,
  isWorkflowPhaseUnlocked,
} from '@/lib/webdesign-v2-workflow.mjs';

const PHASE_META = {
  struttura: { label: 'Struttura', period: 'Giorni 1-5', Icon: Building2 },
  design: { label: 'Design e Sviluppo', period: 'Giorni 6-10', Icon: Palette },
  consegna: { label: 'Collaudo e Consegna', period: 'Giorni 11-15', Icon: Rocket },
};

const CONTROL_META = {
  'giorno-5-struttura': ['Controllo fine Struttura', 'Giorno 5'],
  'giorno-10-design': ['Controllo fine Design e Sviluppo', 'Giorno 10'],
  'giorno-15-collaudo': ['Collaudo finale', 'Giorno 15'],
  'consegna-effettiva': ['Controllo consegna', 'Alla consegna'],
  'pubblicazione-effettiva': ['Controllo pubblicazione', 'Alla pubblicazione'],
};

const WEEKLY_CONTROL_META = {
  'giorno-5-struttura': ['Controllo fine Struttura', 'Fine settimana 1'],
  'giorno-10-design': ['Controllo fine Design e Sviluppo', 'Fine settimana 2'],
  'giorno-15-collaudo': ['Controllo fine Collaudo e Consegna', 'Fine settimana 3'],
};

const NEXT_PHASE_BY_CONTROL = {
  'giorno-5-struttura': 'design',
  'giorno-10-design': 'consegna',
};

const TASK_STATES = ['da fare', 'in corso', 'in attesa', 'completata', 'non applicabile'];
const CONTROL_RESULTS = ['', 'superato', 'non superato', 'con riserva', 'non applicabile'];
const PUBLICATION_STATES = [
  'non prevista',
  'da pianificare',
  'programmata',
  'in corso',
  'pubblicata',
  'bloccata',
];

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(value))
    : 'Da pianificare';

const dateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');
const isDone = (task) =>
  task.stato ? ['completata', 'non applicabile'].includes(task.stato) : Boolean(task.completata);

const progressOf = (tasks = []) => {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter(isDone).length / tasks.length) * 100);
};

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400';

export default function WebDesignV2StandardWorkflow({ initialProject, userId, isStaff }) {
  const [project, setProject] = useState(initialProject);
  const [open, setOpen] = useState(false);
  const [openPhases, setOpenPhases] = useState({ struttura: true });
  const [openChecklist, setOpenChecklist] = useState(false);
  const [message, setMessage] = useState('');
  const [messageScope, setMessageScope] = useState('global');
  const [saving, setSaving] = useState(false);
  const [newStartDate, setNewStartDate] = useState(
    dateInput(initialProject.dataAvvioOperativo || initialProject.dataInizioContratto)
  );
  const [rescheduleReason, setRescheduleReason] = useState('');
  const requestQueueRef = useRef(Promise.resolve());
  const editVersionRef = useRef(0);
  const pendingRequestsRef = useRef(0);

  const fasi = project.fasi || [];
  const controls = project.fasiControllo || [];
  const isWeeklyWorkflow = project.workflowVersion === WEB_DESIGN_WORKFLOW_VERSION;
  const checklist = project.checklistPubblicazione?.length
    ? project.checklistPubblicazione
    : createPublicationChecklist();
  const allTasks = fasi.flatMap((phase) => phase.tasks || []);
  const projectProgress = progressOf(allTasks);
  const nextTask = fasi
    .filter((phase) =>
      isWorkflowPhaseUnlocked(
        phase.nome,
        controls,
        Boolean(project.dataAvvioOperativo)
      )
    )
    .flatMap((phase) => phase.tasks || [])
    .filter((task) => !isDone(task))
    .sort((a, b) => (a.giornoLavorativo || 99) - (b.giornoLavorativo || 99))[0];

  const checklistProgress = useMemo(() => {
    const items = checklist.flatMap((group) => group.items || []);
    return { done: items.filter(isDone).length, total: items.length, pct: progressOf(items) };
  }, [checklist]);

  useEffect(() => {
    setNewStartDate(dateInput(project.dataAvvioOperativo || project.dataInizioContratto));
  }, [project.dataAvvioOperativo, project.dataInizioContratto]);

  const patch = (payload, optimisticProject, scope = 'global') => {
    const previous = project;
    const editVersion = ++editVersionRef.current;
    if (optimisticProject) setProject(optimisticProject);
    pendingRequestsRef.current += 1;
    setSaving(true);
    setMessage('');
    setMessageScope(scope);

    const run = async () => {
      try {
        const response = await fetch(`/api/collaborazioni-webdesign-v2/${project._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Aggiornamento non riuscito');
        if (data.collaborazione && editVersion === editVersionRef.current) {
          setProject((current) => ({
            ...current,
            ...data.collaborazione,
            cliente: current.cliente,
            webDesigner: current.webDesigner,
            interviewWorkflow: current.interviewWorkflow,
          }));
        }
        if (editVersion === editVersionRef.current) {
          setMessage('Salvato');
          setMessageScope(scope);
        }
      } catch (error) {
        if (editVersion === editVersionRef.current) setProject(previous);
        setMessage(error.message);
        setMessageScope(scope);
      } finally {
        pendingRequestsRef.current -= 1;
        setSaving(pendingRequestsRef.current > 0);
      }
    };

    requestQueueRef.current = requestQueueRef.current.then(run, run);
    return requestQueueRef.current;
  };

  const setDraftProject = (nextProject) => {
    editVersionRef.current += 1;
    setProject(nextProject);
    setMessage('');
  };

  const updateArrayItem = (field, index, changes, saveNow = true) => {
    const nextArray = (project[field] || []).map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...changes } : item
    );
    const next = { ...project, [field]: nextArray };
    if (saveNow) patch({ [field]: nextArray }, next);
    else setDraftProject(next);
  };

  const updateTask = (phaseIndex, taskIndex, changes, saveNow = true) => {
    const nextFasi = fasi.map((phase, currentPhaseIndex) => {
      if (phaseIndex !== currentPhaseIndex) return phase;
      return {
        ...phase,
        tasks: phase.tasks.map((task, currentTaskIndex) => {
          if (currentTaskIndex !== taskIndex) return task;
          const nextTaskValue = { ...task, ...changes };
          if (changes.stato !== undefined) {
            nextTaskValue.completata = ['completata', 'non applicabile'].includes(changes.stato);
          }
          return nextTaskValue;
        }),
      };
    });
    const next = { ...project, fasi: nextFasi };
    if (saveNow) patch({ fasi: nextFasi }, next);
    else setDraftProject(next);
  };

  const updateControl = (controlIndex, changes, saveNow = true) => {
    const nextControls = controls.map((control, index) =>
      controlIndex === index ? { ...control, ...changes } : control
    );
    const next = { ...project, fasiControllo: nextControls };
    if (saveNow) patch({ fasiControllo: nextControls }, next, `control-${controlIndex}`);
    else setDraftProject(next);
  };

  const updateChecklist = (groupIndex, itemIndex, changes) => {
    const nextChecklist = checklist.map((group, currentGroupIndex) => {
      if (groupIndex !== currentGroupIndex) return group;
      return {
        ...group,
        items: group.items.map((item, currentItemIndex) => {
          if (itemIndex !== currentItemIndex) return item;
          const updated = { ...item, ...changes };
          if (changes.stato !== undefined) {
            updated.completata = ['completata', 'non applicabile'].includes(changes.stato);
          }
          return updated;
        }),
      };
    });
    patch(
      { checklistPubblicazione: nextChecklist },
      { ...project, checklistPubblicazione: nextChecklist }
    );
  };

  const phaseUnlocked = (phaseName) => {
    return isWorkflowPhaseUnlocked(
      phaseName,
      controls,
      Boolean(project.dataAvvioOperativo)
    );
  };

  const delivery = project.consegna || {
    stato: 'non consegnato',
    confermata: false,
    dataPrevista: null,
    dataEffettiva: null,
    note: '',
  };
  const publication = project.pubblicazione || {
    stato: 'da pianificare',
    dataPrevista: null,
    dataEffettiva: null,
    urlPubblico: '',
    note: '',
  };
  const currentStartDate = dateInput(project.dataAvvioOperativo || project.dataInizioContratto);
  const latestTimelineChange = project.modificheTimeline?.at(-1);
  const productionStatus = !delivery.confermata
    ? 'In lavorazione'
    : publication.stato === 'pubblicata'
      ? 'Consegnato e pubblicato'
      : publication.stato === 'programmata'
        ? 'Consegnato, pubblicazione programmata'
        : 'Consegnato, non pubblicato';

  const handleReschedule = async () => {
    if (!newStartDate || newStartDate === currentStartDate || saving) return;
    const confirmed = window.confirm(
      `Spostare l'avvio al ${formatDate(`${newStartDate}T12:00:00.000Z`)}? ` +
        'Tutte le date previste fino alla consegna verranno ricalcolate.'
    );
    if (!confirmed) return;
    await patch(
      { spostaTimeline: { dataAvvio: newStartDate, motivo: rescheduleReason } },
      undefined,
      'schedule'
    );
    setRescheduleReason('');
  };

  const renderControl = (control, controlIndex, weekly = false) => {
    const metadata = weekly ? WEEKLY_CONTROL_META : CONTROL_META;
    const [label, timing] = metadata[control.tipo] || CONTROL_META[control.tipo] || [control.tipo, ''];

    if (weekly) {
      const selectOutcome = (esito) => {
        const changes = {
          esito,
          completata: true,
          checkboxCompletamento: true,
          stato: 'completato',
          data: control.data || new Date().toISOString(),
        };
        const needsExplanation = esito === 'non superato' && !control.note?.trim();
        updateControl(controlIndex, changes, !needsExplanation);
        const nextPhase = NEXT_PHASE_BY_CONTROL[control.tipo];
        if (esito === 'superato' && nextPhase) {
          setOpenPhases((current) => ({ ...current, [nextPhase]: true }));
        }
      };

      return (
        <div key={control.tipo} className="rounded-lg border border-sky-100 bg-white p-4">
          <div className="mb-3">
            <h5 className="font-bold text-gray-900">{label}</h5>
            <p className="text-xs text-sky-700">
              {timing} · con esito positivo si sblocca lo step successivo
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={control.esito === 'superato'}
              onClick={() => selectOutcome('superato')}
              className={`rounded-lg border px-4 py-3 text-sm font-bold transition ${
                control.esito === 'superato'
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400'
              }`}
            >
              Esito positivo
            </button>
            <button
              type="button"
              aria-pressed={control.esito === 'non superato'}
              onClick={() => selectOutcome('non superato')}
              className={`rounded-lg border px-4 py-3 text-sm font-bold transition ${
                control.esito === 'non superato'
                  ? 'border-red-600 bg-red-600 text-white'
                  : 'border-red-200 bg-red-50 text-red-800 hover:border-red-400'
              }`}
            >
              Esito negativo
            </button>
          </div>
          {control.esito === 'non superato' && (
            <label className="mt-3 block text-xs font-bold text-red-800">
              Spiegazione obbligatoria
              <textarea
                aria-label={`Spiegazione esito negativo — ${label}`}
                required
                value={control.note || ''}
                onChange={(event) => updateControl(controlIndex, { note: event.target.value }, false)}
                onBlur={(event) => {
                  if (event.target.value.trim()) {
                    updateControl(controlIndex, { note: event.target.value });
                  }
                }}
                className={`${inputClass} mt-1 border-red-200 focus:border-red-400 focus:ring-red-100`}
                rows={3}
                placeholder="Spiega perché il controllo ha avuto esito negativo"
              />
              {!control.note?.trim() && (
                <span className="mt-1 block font-medium">Inserisci la spiegazione per salvare l’esito.</span>
              )}
            </label>
          )}
          {control.esito === 'superato' && (
            <p className="mt-3 text-sm font-semibold text-emerald-700">
              Controllo superato. Lo step successivo è ora disponibile.
            </p>
          )}
          {messageScope === `control-${controlIndex}` && message && !saving && (
            <p className={message === 'Salvato' ? 'mt-2 text-sm font-medium text-emerald-700' : 'mt-2 text-sm font-semibold text-red-700'}>{message}</p>
          )}
        </div>
      );
    }

    return (
      <div key={control.tipo} className="rounded-lg border border-sky-100 bg-white p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h5 className="font-bold text-gray-900">{label}</h5>
            <p className="text-xs text-sky-700">{timing} · previsto {formatDate(control.dataPrevista)}</p>
          </div>
          <button
            type="button"
            aria-label={`${control.completata ? 'Riapri' : 'Completa'} controllo: ${label}`}
            onClick={() => updateControl(controlIndex, {
              completata: !control.completata,
              checkboxCompletamento: !control.completata,
              stato: !control.completata ? 'completato' : 'da fare',
            })}
            className={control.completata ? 'text-emerald-500' : 'text-gray-300'}
          >
            {control.completata ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-bold text-gray-600">Data effettiva
            <input type="date" value={dateInput(control.data)} onChange={(event) => updateControl(controlIndex, { data: event.target.value || null })} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-xs font-bold text-gray-600">Esito
            <select value={control.esito || ''} onChange={(event) => updateControl(controlIndex, { esito: event.target.value })} className={`${inputClass} mt-1`}>
              {CONTROL_RESULTS.map((value) => <option key={value} value={value}>{value || 'Da valutare'}</option>)}
            </select>
          </label>
        </div>
        {['note', 'spuntiMiglioramento', 'anomalie', 'problemiBloccanti'].map((field) => (
          <textarea
            key={field}
            aria-label={`${field === 'note' ? 'Note' : field === 'spuntiMiglioramento' ? 'Spunti di miglioramento' : field === 'anomalie' ? 'Anomalie' : 'Problemi bloccanti'} — ${label}`}
            value={control[field] || ''}
            onChange={(event) => updateControl(controlIndex, { [field]: event.target.value }, false)}
            onBlur={(event) => updateControl(controlIndex, { [field]: event.target.value })}
            className={`${inputClass} mt-2`}
            rows={2}
            placeholder={field === 'note' ? 'Note' : field === 'spuntiMiglioramento' ? 'Spunti di miglioramento' : field === 'anomalie' ? 'Eventuali anomalie' : 'Problemi bloccanti'}
          />
        ))}
        {control.tipo === 'giorno-15-collaudo' && isStaff && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <label className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <input type="checkbox" checked={Boolean(control.eccezioneAutorizzata)} onChange={(event) => updateControl(controlIndex, { eccezioneAutorizzata: event.target.checked })} />
              Eccezione autorizzata e tracciata
            </label>
            {control.eccezioneAutorizzata && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input aria-label="Responsabile che autorizza l'eccezione" value={control.eccezioneAutorizzataDa || ''} onChange={(event) => updateControl(controlIndex, { eccezioneAutorizzataDa: event.target.value }, false)} onBlur={(event) => updateControl(controlIndex, { eccezioneAutorizzataDa: event.target.value })} className={inputClass} placeholder="Autorizzata da" />
                <input aria-label="Motivo dell'eccezione" value={control.eccezioneMotivo || ''} onChange={(event) => updateControl(controlIndex, { eccezioneMotivo: event.target.value }, false)} onBlur={(event) => updateControl(controlIndex, { eccezioneMotivo: event.target.value })} className={inputClass} placeholder="Motivo" />
              </div>
            )}
          </div>
        )}
        {messageScope === `control-${controlIndex}` && message && !saving && (
          <p className={message === 'Salvato' ? 'mt-2 text-sm font-medium text-emerald-700' : 'mt-2 text-sm font-semibold text-red-700'}>{message}</p>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`workflow-${project._id}`}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 bg-gradient-to-r from-violet-50 to-purple-50 p-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          {project.tipoProgetto === 'e-commerce' ? (
            <ShoppingCart className="h-6 w-6 text-orange-600" aria-hidden="true" />
          ) : (
            <Store className="h-6 w-6 text-blue-600" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-gray-900">
              {project.cliente?.etichetta || project.aziendaRagioneSociale}
            </h3>
            <p className="text-xs text-gray-600">
              {isWeeklyWorkflow ? '3 settimane · 45 attività' : 'Workflow 15 giorni'} · avvio operativo {formatDate(project.dataAvvioOperativo)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`hidden rounded-full px-3 py-1 text-xs font-bold sm:inline ${delivery.confermata ? 'bg-amber-100 text-amber-800' : 'bg-violet-100 text-violet-800'}`}>
            {productionStatus}
          </span>
          <span className="text-sm font-bold text-violet-700">{projectProgress}%</span>
        </div>
      </button>

      {open && (
        <div id={`workflow-${project._id}`} className="space-y-6 p-5">
          <div aria-live="polite" className="min-h-5 text-sm">
            {saving && <span className="font-medium text-violet-700">Salvataggio in corso…</span>}
            {!saving && messageScope === 'global' && message && (
              <span className={message === 'Salvato' ? 'font-medium text-emerald-700' : 'font-semibold text-red-700'}>
                {message}
              </span>
            )}
          </div>
          {isStaff && project.dataAvvioOperativo && (
            <section className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div className="max-w-xl">
                  <h4 className="font-bold text-violet-950">Sposta timeline</h4>
                  <p className="text-sm text-violet-800">
                    Ricalcola tutte le date previste delle fasi, dei controlli e della consegna.
                    Stati, note, appuntamenti, pubblicazione e date effettive non cambiano.
                  </p>
                </div>
                <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(150px,0.7fr)_minmax(220px,1.3fr)_auto]">
                  <label className="text-xs font-bold text-violet-900">
                    Nuovo giorno 1
                    <input
                      type="date"
                      value={newStartDate}
                      onChange={(event) => setNewStartDate(event.target.value)}
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                  <label className="text-xs font-bold text-violet-900">
                    Motivo (facoltativo)
                    <input
                      value={rescheduleReason}
                      onChange={(event) => setRescheduleReason(event.target.value)}
                      className={`${inputClass} mt-1`}
                      placeholder="Es. avvio contratto posticipato"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!newStartDate || newStartDate === currentStartDate || saving}
                    onClick={handleReschedule}
                    className="self-end rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Ricalcola date
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-violet-800">
                <span>Avvio attuale: <strong>{formatDate(project.dataAvvioOperativo)}</strong></span>
                <span>Consegna prevista: <strong>{formatDate(delivery.dataPrevista)}</strong></span>
                {latestTimelineChange && (
                  <span>
                    Ultimo spostamento: {formatDate(latestTimelineChange.dataPrecedente)} →{' '}
                    {formatDate(latestTimelineChange.dataNuova)}
                    {latestTimelineChange.modificataDaNome
                      ? ` · ${latestTimelineChange.modificataDaNome}`
                      : ''}
                  </span>
                )}
              </div>
              {messageScope === 'schedule' && message && !saving && (
                <p className={message === 'Salvato' ? 'mt-2 text-sm font-medium text-emerald-700' : 'mt-2 text-sm font-semibold text-red-700'}>
                  {message === 'Salvato' ? 'Timeline riprogrammata' : message}
                </p>
              )}
            </section>
          )}
          {!project.dataAvvioOperativo ? (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center">
              <div>
                <h4 className="font-bold text-orange-950">Data di avvio non disponibile</h4>
                <p className="text-sm text-orange-800">
                  Verifica la data di avvio della collaborazione. L'intervista non modifica la timeline contrattuale.
                </p>
              </div>
              <Link
                href={`/Lista_clienti_webdesigner/${userId}/interview/${project._id}`}
                className="rounded-lg bg-orange-600 px-4 py-2 text-center text-sm font-bold text-white"
              >
                Apri intervista
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Prossima attività</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {nextTask
                    ? `${nextTask.giorno ? `${nextTask.giorno}: ` : ''}${nextTask.nome}`
                    : 'Tutte le attività risultano completate'}
                </p>
              </div>
              <Link
                href={`/Lista_clienti_webdesigner/${userId}/interview/${project._id}`}
                className="flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-800"
              >
                Intervista e analisi IA
              </Link>
            </div>
          )}

          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Avanzamento produzione</h4>
                <p className="text-sm text-gray-500">Spunta ogni attività quando è stata completata.</p>
              </div>
              <span className="text-sm font-bold text-violet-700">{projectProgress}%</span>
            </div>

            <div className="space-y-3">
              {fasi.map((phase, phaseIndex) => {
                const meta = PHASE_META[phase.nome] || PHASE_META.struttura;
                const phaseProgress = progressOf(phase.tasks || []);
                const unlocked = phaseUnlocked(phase.nome);
                const isPhaseOpen = Boolean(openPhases[phase.nome]);
                const PhaseIcon = meta.Icon;
                const phaseControlIndex = controls.findIndex(
                  (control) => control.tipo === phase.controlloTipo
                );
                const phaseControl = controls[phaseControlIndex];
                return (
                  <div key={phase.nome} className="overflow-hidden rounded-xl border border-gray-200">
                    <button
                      type="button"
                      aria-expanded={isPhaseOpen}
                      aria-controls={`phase-${project._id}-${phase.nome}`}
                      onClick={() =>
                        setOpenPhases((current) => ({ ...current, [phase.nome]: !current[phase.nome] }))
                      }
                      className="flex w-full items-center justify-between gap-3 bg-gray-50 p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <PhaseIcon className="h-5 w-5 text-violet-600" aria-hidden="true" />
                        <div>
                          <h5 className="font-bold text-gray-900">{meta.label}</h5>
                          <p className="text-xs text-gray-500">
                            {isWeeklyWorkflow ? `Settimana ${phaseIndex + 1}` : meta.period} · {formatDate(phase.dataInizioPrevista)} – {formatDate(phase.dataFinePrevista)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!unlocked && <span className="text-xs font-bold text-amber-700">Bloccata</span>}
                        <span className="text-sm font-bold text-gray-700">{phaseProgress}%</span>
                        <ChevronDown className={`h-5 w-5 transition ${isPhaseOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {isPhaseOpen && (
                      <div id={`phase-${project._id}-${phase.nome}`} className="space-y-4 p-4">
                        <div className="space-y-2">
                          {(phase.tasks || []).map((task, taskIndex) => (
                            <label
                              key={task.codice || `${phase.nome}-${taskIndex}`}
                              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                                isDone(task)
                                  ? 'border-emerald-100 bg-emerald-50'
                                  : 'border-gray-100 bg-gray-50'
                              } ${unlocked ? 'cursor-pointer hover:border-violet-200' : 'cursor-not-allowed opacity-60'}`}
                            >
                              <input
                                type="checkbox"
                                checked={isDone(task)}
                                disabled={!unlocked}
                                onChange={() =>
                                  updateTask(phaseIndex, taskIndex, {
                                    stato: isDone(task) ? 'da fare' : 'completata',
                                  })
                                }
                                className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {task.giorno && (
                                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-600">{task.giorno}</span>
                                  )}
                                  <span className={`text-sm font-semibold ${isDone(task) ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                    {task.nome}
                                  </span>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                        {isWeeklyWorkflow && phaseControl && (
                          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-sky-800">
                              Controllo obbligatorio di fine fase
                            </p>
                            {renderControl(phaseControl, phaseControlIndex, true)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {!isWeeklyWorkflow && (
            <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <h4 className="text-lg font-bold text-gray-900">Controlli obbligatori</h4>
              <p className="mb-4 text-sm text-gray-600">
                I controlli storici restano separati per preservare il workflow originale.
              </p>
              <div className="grid gap-3 lg:grid-cols-2">
                {controls.map((control, controlIndex) => renderControl(control, controlIndex))}
              </div>
            </section>
          )}

          {!isWeeklyWorkflow && (
            <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-bold text-gray-900">Appuntamenti</h4>
              <p className="mb-3 text-sm text-gray-500">Tre momenti distinti; quello intermedio è facoltativo.</p>
              <div className="space-y-3">
                {(project.appuntamenti || []).map((appointment, index) => (
                  <div key={appointment.tipo} className="rounded-lg bg-gray-50 p-3">
                    <p className="mb-2 text-sm font-bold capitalize text-gray-800">{appointment.tipo}</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <select aria-label={`Stato appuntamento ${appointment.tipo}`} value={appointment.stato || ''} onChange={(event) => updateArrayItem('appuntamenti', index, { stato: event.target.value })} className={inputClass}>
                        {['da pianificare', 'programmato', 'effettuato', 'saltato', 'facoltativo'].map((value) => <option key={value}>{value}</option>)}
                      </select>
                      <input aria-label={`Data appuntamento ${appointment.tipo}`} type="date" value={dateInput(appointment.data)} onChange={(event) => updateArrayItem('appuntamenti', index, { data: event.target.value || null })} className={inputClass} />
                      <select aria-label={`Modalità appuntamento ${appointment.tipo}`} value={appointment.modalita || ''} onChange={(event) => updateArrayItem('appuntamenti', index, { modalita: event.target.value })} className={inputClass}>
                        {['', 'presenza', 'videocall', 'telefono', 'altro'].map((value) => <option key={value} value={value}>{value || 'Modalità'}</option>)}
                      </select>
                    </div>
                    <textarea aria-label={`Note appuntamento ${appointment.tipo}`} value={appointment.note || ''} onChange={(event) => updateArrayItem('appuntamenti', index, { note: event.target.value }, false)} onBlur={(event) => updateArrayItem('appuntamenti', index, { note: event.target.value })} className={`${inputClass} mt-2`} rows={2} placeholder="Note appuntamento" />
                    <input aria-label={`Esito appuntamento ${appointment.tipo}`} value={appointment.esito || ''} onChange={(event) => updateArrayItem('appuntamenti', index, { esito: event.target.value }, false)} onBlur={(event) => updateArrayItem('appuntamenti', index, { esito: event.target.value })} className={`${inputClass} mt-2`} placeholder="Esito appuntamento" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-bold text-gray-900">Approvazioni</h4>
              <p className="mb-3 text-sm text-gray-500">Sono separate dagli appuntamenti e possono essere asincrone.</p>
              <div className="space-y-3">
                {(project.approvazioni || []).map((approval, index) => (
                  <div key={approval.tipo} className="rounded-lg bg-gray-50 p-3">
                    <p className="mb-2 text-sm font-bold capitalize text-gray-800">{approval.tipo}</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <select aria-label={`Stato approvazione ${approval.tipo}`} value={approval.stato || ''} onChange={(event) => updateArrayItem('approvazioni', index, { stato: event.target.value })} className={inputClass}>
                        {['da richiedere', 'richiesta', 'approvata', 'respinta', 'non applicabile'].map((value) => <option key={value}>{value}</option>)}
                      </select>
                      <select aria-label={`Modalità approvazione ${approval.tipo}`} value={approval.modalita || ''} onChange={(event) => updateArrayItem('approvazioni', index, { modalita: event.target.value })} className={inputClass}>
                        {['', 'asincrona', 'presenza', 'videocall', 'altro'].map((value) => <option key={value} value={value}>{value || 'Modalità'}</option>)}
                      </select>
                      <input aria-label={`Data approvazione ${approval.tipo}`} type="date" value={dateInput(approval.data)} onChange={(event) => updateArrayItem('approvazioni', index, { data: event.target.value || null })} className={inputClass} />
                    </div>
                    <input aria-label={`Soggetto approvazione ${approval.tipo}`} value={approval.approvatoDa || ''} onChange={(event) => updateArrayItem('approvazioni', index, { approvatoDa: event.target.value }, false)} onBlur={(event) => updateArrayItem('approvazioni', index, { approvatoDa: event.target.value })} className={`${inputClass} mt-2`} placeholder="Approvato da / riferimento messaggio" />
                    <textarea aria-label={`Note approvazione ${approval.tipo}`} value={approval.note || ''} onChange={(event) => updateArrayItem('approvazioni', index, { note: event.target.value }, false)} onBlur={(event) => updateArrayItem('approvazioni', index, { note: event.target.value })} className={`${inputClass} mt-2`} rows={2} placeholder="Note approvazione" />
                  </div>
                ))}
              </div>
            </div>
            </section>
          )}

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h4 className="text-lg font-bold text-emerald-950">Stato consegna</h4>
              <p className="mb-3 text-sm text-emerald-800">Scadenza prevista: {formatDate(delivery.dataPrevista)}</p>
              {delivery.dataEffettiva && <p className="mb-3 text-sm font-semibold text-emerald-900">Data effettiva: {formatDate(delivery.dataEffettiva)}</p>}
              {delivery.confermata ? (
                <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-800">
                  Consegnato
                </div>
              ) : (
                <select aria-label="Stato preparazione consegna" value={delivery.stato || 'non consegnato'} onChange={(event) => patch({ consegna: { stato: event.target.value } }, { ...project, consegna: { ...delivery, stato: event.target.value } }, 'delivery')} className={inputClass}>
                  {['non consegnato', 'pronta', 'bloccata'].map((value) => <option key={value}>{value}</option>)}
                </select>
              )}
              <textarea aria-label="Note consegna" value={delivery.note || ''} onChange={(event) => setDraftProject({ ...project, consegna: { ...delivery, note: event.target.value } })} onBlur={(event) => patch({ consegna: { note: event.target.value } }, project, 'delivery')} className={`${inputClass} mt-2`} rows={2} placeholder="Note consegna" />
              {messageScope === 'delivery' && message && !saving && (
                <p className={message === 'Salvato' ? 'mt-2 text-sm font-medium text-emerald-800' : 'mt-2 text-sm font-semibold text-red-700'}>{message}</p>
              )}
              <button type="button" disabled={delivery.confermata || saving} onClick={() => patch({ consegna: { stato: 'consegnato', confermata: true } }, { ...project, consegna: { ...delivery, stato: 'consegnato', confermata: true } }, 'delivery')} className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">
                {delivery.confermata ? `Consegnato il ${formatDate(delivery.dataEffettiva)}` : 'Conferma consegna definitiva'}
              </button>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <h4 className="text-lg font-bold text-indigo-950">Stato pubblicazione</h4>
              <p className="mb-3 text-sm text-indigo-800">Indipendente dalla consegna e gestibile anche in seguito.</p>
              {publication.dataEffettiva && <p className="mb-3 text-sm font-semibold text-indigo-900">Pubblicato il {formatDate(publication.dataEffettiva)}</p>}
              <select aria-label="Stato pubblicazione" disabled={publication.stato === 'pubblicata'} value={publication.stato || 'da pianificare'} onChange={(event) => patch({ pubblicazione: { stato: event.target.value } }, { ...project, pubblicazione: { ...publication, stato: event.target.value } }, 'publication')} className={inputClass}>
                {PUBLICATION_STATES.map((value) => (
                  <option key={value} disabled={value === 'pubblicata' && publication.stato !== 'pubblicata'}>
                    {value}
                  </option>
                ))}
              </select>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input aria-label="Data prevista pubblicazione" type="date" value={dateInput(publication.dataPrevista)} onChange={(event) => patch({ pubblicazione: { dataPrevista: event.target.value || null } }, { ...project, pubblicazione: { ...publication, dataPrevista: event.target.value || null } }, 'publication')} className={inputClass} />
                <input aria-label="URL pubblico del sito" value={publication.urlPubblico || ''} onChange={(event) => setDraftProject({ ...project, pubblicazione: { ...publication, urlPubblico: event.target.value } })} onBlur={(event) => patch({ pubblicazione: { urlPubblico: event.target.value } }, project, 'publication')} className={inputClass} placeholder="https://sito.it" />
              </div>
              <textarea aria-label="Note pubblicazione" value={publication.note || ''} onChange={(event) => setDraftProject({ ...project, pubblicazione: { ...publication, note: event.target.value } })} onBlur={(event) => patch({ pubblicazione: { note: event.target.value } }, project, 'publication')} className={`${inputClass} mt-2`} rows={2} placeholder="Note pubblicazione" />
              <button
                type="button"
                disabled={publication.stato === 'pubblicata' || !publication.urlPubblico?.trim() || saving}
                onClick={() => patch(
                  { pubblicazione: { stato: 'pubblicata', urlPubblico: publication.urlPubblico } },
                  { ...project, pubblicazione: { ...publication, stato: 'pubblicata' } },
                  'publication'
                )}
                className="mt-3 w-full rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publication.stato === 'pubblicata' ? 'Sito pubblicato' : 'Segna come pubblicato'}
              </button>
              {messageScope === 'publication' && message && !saving && (
                <p className={message === 'Salvato' ? 'mt-2 text-sm font-medium text-indigo-800' : 'mt-2 text-sm font-semibold text-red-700'}>{message}</p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-emerald-200">
            <button type="button" aria-expanded={openChecklist} aria-controls={`publication-checklist-${project._id}`} onClick={() => setOpenChecklist((value) => !value)} className="flex w-full items-center justify-between bg-emerald-50 p-4 text-left">
              <div>
                <h4 className="font-bold text-gray-900">Checklist pubblicazione — 29 controlli</h4>
                <p className="text-sm text-gray-600">{checklistProgress.done}/{checklistProgress.total} completati o non applicabili. Non blocca la consegna.</p>
              </div>
              <ChevronDown className={`h-5 w-5 transition ${openChecklist ? 'rotate-180' : ''}`} />
            </button>
            {openChecklist && (
              <div id={`publication-checklist-${project._id}`} className="space-y-4 p-4">
                {checklist.map((group, groupIndex) => (
                  <div key={group.categoria}>
                    <h5 className="mb-2 text-sm font-bold text-gray-800">{group.categoria}</h5>
                    <div className="space-y-2">
                      {group.items.map((item, itemIndex) => (
                        <div key={item.nome} className="grid items-start gap-2 rounded-lg bg-gray-50 p-3 md:grid-cols-[1fr_170px_170px]">
                          <div>
                            <p className={`text-sm font-semibold ${isDone(item) ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.nome}</p>
                            <p className="text-xs text-gray-500">{item.descrizione}</p>
                          </div>
                          <select aria-label={`Tipo controllo: ${item.nome}`} value={item.tipoControllo || 'obbligatorio'} onChange={(event) => updateChecklist(groupIndex, itemIndex, { tipoControllo: event.target.value })} className={inputClass}>
                            {['obbligatorio', 'condizionale', 'non applicabile'].map((value) => <option key={value}>{value}</option>)}
                          </select>
                          <select aria-label={`Stato controllo: ${item.nome}`} value={item.stato || (item.completata ? 'completata' : 'da fare')} onChange={(event) => updateChecklist(groupIndex, itemIndex, { stato: event.target.value })} className={inputClass}>
                            {TASK_STATES.map((value) => <option key={value}>{value}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex items-center justify-end text-xs">
            <span className="text-gray-400">Fuso orario Europe/Rome · weekend esclusi</span>
          </div>
        </div>
      )}
    </div>
  );
}
