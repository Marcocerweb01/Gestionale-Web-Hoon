export const WEB_DESIGN_WORKFLOW_VERSION = 'weekly-45-v2';
export const LEGACY_WEB_DESIGN_WORKFLOW_VERSION = '15-working-days-v1';
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
    descrizione: 'Intervista e analisi disponibili, sitemap e style direction definite, struttura approvata e contenuti mancanti identificati.',
  },
  {
    tipo: 'giorno-10-design',
    nome: 'Controllo fine Design e Sviluppo',
    giornoPrevisto: 10,
    descrizione: 'Reference e design definiti, homepage e pagine principali realizzate, responsive completato, approvazione e modifiche pendenti registrate.',
  },
  {
    tipo: 'giorno-15-collaudo',
    nome: 'Controllo fine Collaudo e Consegna',
    giornoPrevisto: 15,
    descrizione: 'Test completati, blocchi risolti, approvazione e collaudo registrati, consegna confermata e contenuti mancanti pianificati.',
  },
];

const COMMON_TASKS = {
  struttura: [
    'Intervista cliente completata tramite Google Moduli o gestionale.',
    'Richiesta contenuti inviata al cliente (foto, video e testi).',
    "Analisi introduttiva preparata con ChatGPT dalle risposte dell'intervista.",
    'Sitemap preparata con ChatGPT.',
    'Struttura e organizzazione delle pagine definite.',
    'Style direction preparata con ChatGPT.',
    'Analisi introduttiva verificata e completata.',
    'Sitemap verificata e completata.',
    'Style direction verificata e completata.',
    'Analisi introduttiva presentata al cliente.',
    'Sitemap presentata al cliente.',
    'Style direction presentata al cliente.',
    'Modifiche a sitemap e style direction applicate se necessarie.',
    'Conferma di accettazione della struttura ricevuta dal cliente.',
    'Cliente aggiornato e contenuti mancanti nuovamente richiesti.',
  ],
  design: [
    'Immagini di default selezionate se mancano quelle del cliente.',
    '4–5 reference grafiche per la homepage create con ChatGPT.',
    'Reference validate come immagini o siti realmente navigabili.',
    'Reference presentate e spiegate al cliente.',
    'Reference definitiva scelta dal cliente.',
    'Design scelto trasposto su Elementor.',
    'Adattamenti grafici richiesti dal cliente applicati.',
    'Homepage realizzata secondo il design approvato.',
    'Header, footer e navigazione principale realizzati.',
    'Resto delle pagine del sito creato.',
    'Foto, testi e video disponibili inseriti nel sito.',
    'Layout e sezioni adattati ai contenuti disponibili.',
    'Versione responsive delle pagine realizzata.',
    'Design completo presentato al cliente.',
    'Modifiche richieste applicate e approvazione del design ricevuta.',
  ],
  consegna: [
    'Conferma grafica finale del sito ricevuta dal cliente.',
    'Controllo delle pagine e delle sezioni realizzate completato.',
    'Contenuti presenti e mancanti verificati.',
    'Test di tutti i link e della navigazione completato.',
    'Test dei pulsanti e dei moduli di contatto completato.',
    'Test responsive su desktop, tablet e smartphone completato.',
    'Controllo grafico generale e coerenza del design completati.',
    'Controllo ortografico e revisione dei testi completati.',
    'Controlli tecnici, sicurezza e configurazioni completati.',
    'Verifiche SEO e ottimizzazione delle immagini completate.',
    'Test di velocità e performance completati.',
    'Bug individuati e correzioni completate.',
    'Collaudo finale e verifica qualità completati.',
    'Sito consegnato al cliente con o senza contenuti mancanti.',
    'Conferma di consegna registrata e contenuti mancanti pianificati.',
  ],
};

const ECOMMERCE_TASKS = {
  struttura: [
    ...COMMON_TASKS.struttura,
  ],
  design: [
    ...COMMON_TASKS.design,
  ],
  consegna: [
    ...COMMON_TASKS.consegna,
  ],
};

ECOMMERCE_TASKS.struttura[1] =
  'Richiesta contenuti inviata al cliente (foto, video, testi e catalogo prodotti).';
ECOMMERCE_TASKS.struttura[3] =
  'Sitemap e struttura del catalogo preparate con ChatGPT.';
ECOMMERCE_TASKS.struttura[4] =
  'Struttura e organizzazione di pagine, categorie, prodotti e shop definite.';
ECOMMERCE_TASKS.design[1] =
  '4–5 reference grafiche per homepage e shop create con ChatGPT.';
ECOMMERCE_TASKS.design[3] =
  'Reference di homepage e shop presentate, spiegate e scelta definitiva registrata.';
ECOMMERCE_TASKS.design[4] =
  'Design scelto trasposto su Elementor.';
ECOMMERCE_TASKS.design[5] =
  'Adattamenti grafici richiesti dal cliente applicati.';
ECOMMERCE_TASKS.design[6] =
  'Homepage, header, footer e navigazione principale realizzati.';
ECOMMERCE_TASKS.design[7] =
  'Shop e pagine prodotto realizzati.';
ECOMMERCE_TASKS.design[8] =
  'Categorie, attributi e varianti dei prodotti configurati.';
ECOMMERCE_TASKS.design[9] =
  'Foto, testi, video e dati prodotto disponibili inseriti nel sito.';
ECOMMERCE_TASKS.design[10] =
  'Carrello configurato e verificato.';
ECOMMERCE_TASKS.design[11] =
  'Checkout configurato e verificato.';
ECOMMERCE_TASKS.design[12] =
  'Metodi di pagamento e spedizioni configurati e verificati.';
ECOMMERCE_TASKS.design[13] =
  'Versione responsive di homepage, shop e pagine prodotto realizzata.';
ECOMMERCE_TASKS.design[14] =
  'Design completo presentato, modifiche applicate e approvazione ricevuta.';
ECOMMERCE_TASKS.consegna[1] =
  'Controllo delle pagine, dello shop e delle schede prodotto completato.';
ECOMMERCE_TASKS.consegna[2] =
  'Contenuti, prodotti, varianti e dati mancanti verificati.';
ECOMMERCE_TASKS.consegna[3] =
  'Test di tutti i link e della navigazione completato.';
ECOMMERCE_TASKS.consegna[4] =
  'Test dei pulsanti e dei moduli di contatto completato.';
ECOMMERCE_TASKS.consegna[6] =
  'Test del carrello completato.';
ECOMMERCE_TASKS.consegna[7] =
  'Test del checkout completato.';
ECOMMERCE_TASKS.consegna[8] =
  'Test del flusso di acquisto completato.';
ECOMMERCE_TASKS.consegna[9] =
  'Test dei pagamenti in modalità appropriata completato.';
ECOMMERCE_TASKS.consegna[10] =
  'Configurazioni di vendita e spedizioni verificate.';
ECOMMERCE_TASKS.consegna[11] =
  'Controlli tecnici, sicurezza, SEO, performance e correzioni completati.';
ECOMMERCE_TASKS.consegna[12] =
  'Collaudo finale dello shop e verifica qualità completati.';

export const normalizeProjectType = (value) =>
  value === 'e-commerce' ? 'e-commerce' : 'vetrina';

export const isStandardWorkflowProject = (project) =>
  [WEB_DESIGN_WORKFLOW_VERSION, LEGACY_WEB_DESIGN_WORKFLOW_VERSION].includes(
    project?.workflowVersion
  );

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

const createTask = (name, phase, index) => ({
  codice: `${phase}-${String(index + 1).padStart(2, '0')}`,
  giorno: '',
  giornoLavorativo: null,
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
    const definitions =
      normalizedType === 'e-commerce'
        ? ECOMMERCE_TASKS[phase.nome]
        : COMMON_TASKS[phase.nome];

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

export const scheduleExistingWorkflow = (
  collaboration,
  startValue,
  workdayEndTime = null,
  interviewReceivedAt = new Date()
) => {
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
    intervistaRicevutaAt: new Date(interviewReceivedAt),
    fasi: phases,
    fasiControllo: controls,
    'consegna.dataPrevista': fresh.consegna.dataPrevista,
  };
};

export const rescheduleWebDesignWorkflow = (collaboration, startValue) => {
  const startDateOnly = getOperationalStartDateOnly(startValue);
  if (!startDateOnly) throw new Error('Data di avvio operativo non valida');

  const fresh = createWebDesignWorkflow({
    projectType: collaboration.tipoProgetto,
    operationalStart: startDateOnly,
  });

  const phases = fresh.fasi.map((planned) => {
    const current = (collaboration.fasi || []).find((phase) => phase.nome === planned.nome);
    if (!current) return planned;
    return {
      ...current,
      giornoInizio: planned.giornoInizio,
      giornoFine: planned.giornoFine,
      dataInizioPrevista: planned.dataInizioPrevista,
      dataFinePrevista: planned.dataFinePrevista,
      controlloTipo: planned.controlloTipo,
    };
  });

  const currentControls = collaboration.fasiControllo || [];
  const controls = (currentControls.length ? currentControls : fresh.fasiControllo).map(
    (current) => {
      const planned = fresh.fasiControllo.find((control) => control.tipo === current.tipo);
      return planned
        ? {
            ...current,
            giornoPrevisto: planned.giornoPrevisto,
            dataPrevista: planned.dataPrevista,
            condizionale: planned.condizionale,
          }
        : current;
    }
  );

  return {
    dataInizioContratto: fresh.dataAvvioOperativo,
    dataAvvioOperativo: fresh.dataAvvioOperativo,
    dataFineContratto: fresh.consegna.dataPrevista,
    fasi: phases,
    fasiControllo: controls,
    consegna: {
      ...(collaboration.consegna || {}),
      dataPrevista: fresh.consegna.dataPrevista,
    },
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
  if (
    deliveryCheck &&
    (!deliveryCheck.completata ||
      !deliveryCheck.data ||
      !['superato', 'ok'].includes(deliveryCheck.esito))
  ) {
    return { ok: false, message: 'Completa il controllo consegna prima di confermare la consegna definitiva.' };
  }
  return { ok: true };
};

