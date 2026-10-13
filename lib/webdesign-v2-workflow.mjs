export const WEB_DESIGN_WORKFLOW_VERSION = '15-working-days-v1';
export const WEB_DESIGN_TIME_ZONE = 'Europe/Rome';

export const PHASE_DEFINITIONS = [
  { nome: 'struttura', label: 'Struttura', giornoInizio: 1, giornoFine: 5, controlloTipo: 'giorno-5-struttura' },
  { nome: 'design', label: 'Design e Sviluppo', giornoInizio: 6, giornoFine: 10, controlloTipo: 'giorno-10-design' },
  { nome: 'consegna', label: 'Collaudo e Consegna', giornoInizio: 11, giornoFine: 15, controlloTipo: 'giorno-15-collaudo' },
];

export const CONTROL_DEFINITIONS = [
  {
    tipo: 'giorno-5-struttura',
    nome: 'Controllo fine Struttura',
    giornoPrevisto: 5,
    descrizione: 'Intervista analizzata, sitemap e requisiti definiti, materiali verificati e struttura approvata.',
  },
  {
    tipo: 'giorno-10-design',
    nome: 'Controllo fine Design e Sviluppo',
    giornoPrevisto: 10,
    descrizione: 'Design e pagine realizzati, responsive verificato, funzioni operative e approvazione registrata.',
  },
  {
    tipo: 'giorno-15-collaudo',
    nome: 'Collaudo finale',
    giornoPrevisto: 15,
    descrizione: 'Verifica finale distinta dalla consegna, con esito, anomalie e blocchi.',
  },
  {
    tipo: 'consegna-effettiva',
    nome: 'Controllo consegna',
    giornoPrevisto: 15,
    descrizione: 'Controllo eseguito nel momento in cui la consegna viene confermata.',
  },
  {
    tipo: 'pubblicazione-effettiva',
    nome: 'Controllo pubblicazione',
    giornoPrevisto: null,
    descrizione: 'Controllo condizionale eseguito soltanto quando il sito viene pubblicato.',
    condizionale: true,
  },
];

const COMMON_TASKS = {
  struttura: [
    [1, 'Intervista iniziale del cliente ricevuta tramite Google Moduli o gestionale'],
    [1, "Analisi delle risposte dell'intervista con ChatGPT"],
    [2, 'Definizione di obiettivi, pubblico e caratteristiche del sito'],
    [2, 'Creazione della sitemap con ChatGPT'],
    [3, 'Definizione delle pagine e delle funzionalità richieste'],
    [3, 'Richiesta di foto, video, testi e altri materiali necessari'],
    [4, 'Preparazione della direzione stilistica iniziale'],
    [4, 'Verifica della completezza delle informazioni raccolte'],
    [5, 'Approvazione della struttura, anche in forma asincrona'],
    [5, 'Test e controllo di fine fase'],
  ],
  design: [
    [6, 'Definizione e completamento della style direction'],
    [6, 'Creazione delle reference visive con ChatGPT'],
    [6, 'Selezione della direzione grafica'],
    [7, 'Realizzazione del design con Elementor o Figma'],
    [7, 'Realizzazione della homepage'],
    [8, 'Realizzazione delle pagine interne'],
    [8, 'Inserimento dei contenuti disponibili'],
    [8, 'Configurazione della navigazione e dei menu'],
    [9, 'Implementazione responsive'],
    [9, 'Configurazione delle funzionalità richieste'],
    [9, 'Configurazione tecnica di base'],
    [10, 'Verifica grafica e funzionale interna'],
    [10, 'Richiesta di approvazione del design, anche in forma asincrona'],
    [10, 'Test e controllo di fine fase'],
  ],
  consegna: [
    [11, 'Completamento delle parti mancanti'],
    [11, 'Inserimento degli ultimi contenuti disponibili'],
    [11, 'Controllo navigazione e link'],
    [12, 'Test responsive su desktop, tablet e smartphone'],
    [12, 'Test moduli e funzionalità'],
    [12, 'Verifica sicurezza e configurazioni'],
    [13, 'Controllo SEO tecnico'],
    [13, 'Ottimizzazione performance'],
    [13, 'Correzione bug'],
    [14, 'Revisione generale dei contenuti'],
    [14, 'Esecuzione dei controlli di pubblicazione applicabili alla produzione'],
    [14, 'Verifica finale interna'],
    [14, 'Preparazione della consegna'],
    [15, 'Collaudo finale'],
    [15, 'Consegna al cliente tramite azione esplicita'],
  ],
};

const ECOMMERCE_TASKS = {
  struttura: [
    [2, 'Definizione della struttura di categorie e catalogo'],
    [2, 'Raccolta delle informazioni sui prodotti'],
    [3, 'Definizione di varianti e attributi'],
    [3, 'Definizione dei requisiti di pagamento, spedizione e vendita'],
  ],
  design: [
    [7, 'Realizzazione dello shop e delle schede prodotto'],
    [8, 'Configurazione di categorie e attributi'],
    [8, 'Configurazione di carrello e checkout'],
    [9, 'Configurazione dei metodi di pagamento'],
    [9, 'Configurazione di spedizioni e imposte'],
    [9, 'Configurazione delle email transazionali'],
    [10, 'Test preliminari dei flussi di acquisto'],
  ],
  consegna: [
    [12, 'Test del carrello'],
    [12, 'Test del checkout'],
    [12, 'Test dei pagamenti in modalità appropriata'],
    [13, 'Test delle spedizioni'],
    [13, 'Test delle email ordine'],
    [14, 'Test della gestione ordini'],
    [14, 'Test di prodotti e varianti'],
  ],
};

export const normalizeProjectType = (value) =>
  value === 'e-commerce' ? 'e-commerce' : 'vetrina';

export const isStandardWorkflowProject = (project) =>
  project?.workflowVersion === WEB_DESIGN_WORKFLOW_VERSION;

export const isWorkflowPhaseUnlocked = (phaseName, controls = [], hasOperationalStart = true) => {
  if (!hasOperationalStart) return false;
  if (phaseName === 'struttura') return true;
  const requiredControl = phaseName === 'design' ? 'giorno-5-struttura' : 'giorno-10-design';
  const control = controls.find((item) => item.tipo === requiredControl);
  return Boolean(
    control?.completata &&
      control?.data &&
      ['superato', 'ok', 'con riserva'].includes(control?.esito)
  );
};

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: WEB_DESIGN_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: WEB_DESIGN_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const toDateOnly = (date) => dateFormatter.format(date);
const parseDateOnly = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};

const dateOnlyToUtc = (value) => {
  const parts = parseDateOnly(value);
  if (!parts) return null;
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
};

const shiftCalendarDays = (value, days) => {
  const date = dateOnlyToUtc(value);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const isWeekendDateOnly = (value) => {
  const date = dateOnlyToUtc(value);
  return !date || date.getUTCDay() === 0 || date.getUTCDay() === 6;
};

const normalizeToWorkingDay = (value) => {
  let cursor = value;
  while (cursor && isWeekendDateOnly(cursor)) cursor = shiftCalendarDays(cursor, 1);
  return cursor;
};

const parseCutoffMinutes = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const match = String(value).trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

export const getOperationalStartDateOnly = (value, workdayEndTime = null) => {
  if (!value) return null;
  const exactDateOnly = parseDateOnly(value) ? String(value) : null;
  const instant = exactDateOnly ? null : new Date(value);
  if (!exactDateOnly && Number.isNaN(instant?.getTime())) return null;

  let result = exactDateOnly || toDateOnly(instant);
  const cutoff = parseCutoffMinutes(workdayEndTime);
  if (instant && cutoff !== null) {
    const parts = timeFormatter.formatToParts(instant);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
    if (hour * 60 + minute >= cutoff) result = shiftCalendarDays(result, 1);
  }

  return normalizeToWorkingDay(result);
};

export const addWorkingDaysDateOnly = (startDateOnly, days) => {
  let cursor = normalizeToWorkingDay(startDateOnly);
  if (!cursor) return null;
  let remaining = Math.max(0, Number(days) || 0);
  while (remaining > 0) {
    cursor = shiftCalendarDays(cursor, 1);
    if (!isWeekendDateOnly(cursor)) remaining -= 1;
  }
  return cursor;
};

export const dateOnlyToStorageDate = (value) => dateOnlyToUtc(value);

const createTask = ([day, name], phase, index) => ({
  codice: `${phase}-${String(index + 1).padStart(2, '0')}`,
  giorno: `Giorno ${day}`,
  giornoLavorativo: day,
  nome: name,
  descrizione: '',
  stato: 'da fare',
  criticita: 'regolare',
  motivoRitardo: '',
  completata: false,
  note: '',
  appuntamentoTipo: '',
  confermaGruppo: false,
});

export const createWorkflowPhases = (projectType, operationalStart = null) => {
  const normalizedType = normalizeProjectType(projectType);
  const startDateOnly = operationalStart
    ? getOperationalStartDateOnly(operationalStart)
    : null;

  return PHASE_DEFINITIONS.map((phase) => {
    const definitions = [
      ...COMMON_TASKS[phase.nome],
      ...(normalizedType === 'e-commerce' ? ECOMMERCE_TASKS[phase.nome] : []),
    ].sort((a, b) => a[0] - b[0]);

    return {
      nome: phase.nome,
      giornoInizio: phase.giornoInizio,
      giornoFine: phase.giornoFine,
      dataInizioPrevista: startDateOnly
        ? dateOnlyToStorageDate(addWorkingDaysDateOnly(startDateOnly, phase.giornoInizio - 1))
        : null,
      dataFinePrevista: startDateOnly
        ? dateOnlyToStorageDate(addWorkingDaysDateOnly(startDateOnly, phase.giornoFine - 1))
        : null,
      controlloTipo: phase.controlloTipo,
      stato: phase.nome === 'struttura' && startDateOnly ? 'in corso' : 'da fare',
      criticita: 'regolare',
      tasks: definitions.map((task, index) => createTask(task, phase.nome, index)),
      note: '',
    };
  });
};

export const createWorkflowControls = (operationalStart = null) => {
  const startDateOnly = operationalStart
    ? getOperationalStartDateOnly(operationalStart)
    : null;

  return CONTROL_DEFINITIONS.map((control) => ({
    tipo: control.tipo,
    giornoPrevisto: control.giornoPrevisto,
    dataPrevista:
      startDateOnly && control.giornoPrevisto
        ? dateOnlyToStorageDate(addWorkingDaysDateOnly(startDateOnly, control.giornoPrevisto - 1))
        : null,
    data: null,
    stato: 'da fare',
    esito: '',
    note: '',
    spuntiMiglioramento: '',
    anomalie: '',
    problemiBloccanti: '',
    completata: false,
    checkboxCompletamento: false,
    condizionale: Boolean(control.condizionale),
    eccezioneAutorizzata: false,
    eccezioneAutorizzataDa: '',
    eccezioneMotivo: '',
    eccezioneData: null,
  }));
};

export const createWorkflowAppointments = () => [
  { tipo: 'iniziale', obbligatorio: false, stato: 'da pianificare', data: null, modalita: '', esito: '', note: '' },
  { tipo: 'intermedio', obbligatorio: false, stato: 'facoltativo', data: null, modalita: '', esito: '', note: '' },
  { tipo: 'finale', obbligatorio: false, stato: 'da pianificare', data: null, modalita: '', esito: '', note: '' },
];

export const createWorkflowApprovals = () => [
  { tipo: 'struttura', stato: 'da richiedere', modalita: '', data: null, approvatoDa: '', note: '' },
  { tipo: 'design', stato: 'da richiedere', modalita: '', data: null, approvatoDa: '', note: '' },
  { tipo: 'consegna', stato: 'da richiedere', modalita: '', data: null, approvatoDa: '', note: '' },
];

export const createWebDesignWorkflow = ({ projectType, operationalStart = null } = {}) => {
  const startDateOnly = operationalStart
    ? getOperationalStartDateOnly(operationalStart)
    : null;
  const plannedDelivery = startDateOnly
    ? dateOnlyToStorageDate(addWorkingDaysDateOnly(startDateOnly, 14))
    : null;

  return {
    workflowVersion: WEB_DESIGN_WORKFLOW_VERSION,
    workflowTimezone: WEB_DESIGN_TIME_ZONE,
    dataAvvioOperativo: startDateOnly ? dateOnlyToStorageDate(startDateOnly) : null,
    fasi: createWorkflowPhases(projectType, startDateOnly),
    fasiControllo: createWorkflowControls(startDateOnly),
    appuntamenti: createWorkflowAppointments(),
    approvazioni: createWorkflowApprovals(),
    consegna: {
      stato: 'non consegnato',
      dataPrevista: plannedDelivery,
      dataEffettiva: null,
      confermata: false,
      note: '',
    },
    pubblicazione: {
      stato: 'da pianificare',
      dataPrevista: null,
      dataEffettiva: null,
      urlPubblico: '',
      note: '',
    },
  };
};

export const scheduleExistingWorkflow = (collaboration, startValue, workdayEndTime = null) => {
  const startDateOnly = getOperationalStartDateOnly(startValue, workdayEndTime);
  if (!startDateOnly) throw new Error('Data di avvio operativo non valida');
  const fresh = createWebDesignWorkflow({
    projectType: collaboration.tipoProgetto,
    operationalStart: startDateOnly,
  });

  const phases = (collaboration.fasi || []).map((phase) => {
    const planned = fresh.fasi.find((item) => item.nome === phase.nome);
    return planned
      ? {
          ...phase,
          giornoInizio: planned.giornoInizio,
          giornoFine: planned.giornoFine,
          dataInizioPrevista: planned.dataInizioPrevista,
          dataFinePrevista: planned.dataFinePrevista,
          controlloTipo: planned.controlloTipo,
          stato: phase.nome === 'struttura' && phase.stato === 'da fare' ? 'in corso' : phase.stato,
          tasks: (phase.tasks || []).map((task, index) =>
            phase.nome === 'struttura' && index === 0
              ? { ...task, stato: 'completata', completata: true }
              : task
          ),
        }
      : phase;
  });

  const controls = (collaboration.fasiControllo || fresh.fasiControllo).map((control) => {
    const planned = fresh.fasiControllo.find((item) => item.tipo === control.tipo);
    return planned ? { ...control, dataPrevista: planned.dataPrevista } : control;
  });

  return {
    dataAvvioOperativo: fresh.dataAvvioOperativo,
    intervistaRicevutaAt: new Date(startValue),
    fasi: phases,
    fasiControllo: controls,
    'consegna.dataPrevista': fresh.consegna.dataPrevista,
  };
};

export const validateDeliveryConfirmation = ({ controls = [], delivery = {} } = {}) => {
  if (!delivery.confermata && delivery.stato !== 'consegnato') return { ok: true };
  const finalTest = controls.find((control) => control.tipo === 'giorno-15-collaudo');
  if (!finalTest?.completata || !finalTest?.data || !['superato', 'ok'].includes(finalTest?.esito)) {
    return { ok: false, message: 'Completa e supera il collaudo finale prima di confermare la consegna.' };
  }
  if (finalTest.problemiBloccanti && !finalTest.eccezioneAutorizzata) {
    return { ok: false, message: 'Sono presenti problemi bloccanti: risolvili o registra una eccezione autorizzata.' };
  }
  if (finalTest.eccezioneAutorizzata && (!finalTest.eccezioneMotivo || !finalTest.eccezioneAutorizzataDa)) {
    return { ok: false, message: "L'eccezione deve indicare motivo e responsabile autorizzante." };
  }
  const deliveryCheck = controls.find((control) => control.tipo === 'consegna-effettiva');
  if (!deliveryCheck?.completata || !deliveryCheck?.data || !['superato', 'ok'].includes(deliveryCheck?.esito)) {
    return { ok: false, message: 'Completa il controllo consegna prima di confermare la consegna definitiva.' };
  }
  return { ok: true };
};

