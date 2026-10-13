import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_WEB_DESIGN_WORKFLOW_VERSION,
  WEB_DESIGN_WORKFLOW_VERSION,
  addWorkingDaysDateOnly,
  createWebDesignWorkflow,
  getOperationalStartDateOnly,
  isStandardWorkflowProject,
  isWorkflowPhaseUnlocked,
  normalizeProjectType,
  rescheduleWebDesignWorkflow,
  scheduleExistingWorkflow,
  validateDeliveryConfirmation,
} from '../lib/webdesign-v2-workflow.mjs';

const EXPECTED_VETRINA_TASKS = [
  [
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
  [
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
  [
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
];

test('crea un sito vetrina con 3 settimane, 15 attività per fase e ordine esatto', () => {
  const workflow = createWebDesignWorkflow({ projectType: 'vetrina', operationalStart: '2026-10-16' });
  assert.deepEqual(workflow.fasi.map((fase) => fase.nome), ['struttura', 'design', 'consegna']);
  assert.deepEqual(
    workflow.fasi.map((fase) => fase.tasks.map((task) => task.nome)),
    EXPECTED_VETRINA_TASKS
  );
  assert.deepEqual(workflow.fasi.map((fase) => fase.tasks.length), [15, 15, 15]);
  assert.equal(workflow.fasi.flatMap((fase) => fase.tasks).length, 45);
  assert.ok(workflow.fasi.flatMap((fase) => fase.tasks).every((task) => !task.giorno));
  assert.equal(workflow.consegna.dataPrevista.toISOString().slice(0, 10), '2026-11-05');
  assert.equal(workflow.fasi.at(-1).giornoFine, 15);
});

test('la timeline e-commerce adatta le attività senza superare le 45 checkbox', () => {
  const ecommerce = createWebDesignWorkflow({ projectType: 'e-commerce' });
  assert.deepEqual(ecommerce.fasi.map((fase) => fase.tasks.length), [15, 15, 15]);
  assert.equal(ecommerce.fasi.flatMap((fase) => fase.tasks).length, 45);
  const names = ecommerce.fasi.flatMap((fase) => fase.tasks).map((task) => task.nome).join(' ');
  for (const required of ['catalogo', 'categorie', 'shop', 'carrello', 'checkout', 'pagamenti', 'spedizioni']) {
    assert.match(names.toLowerCase(), new RegExp(required));
  }
  assert.doesNotMatch(names, /figma/i);
});

test('il nuovo workflow contiene esattamente tre controlli di fine fase', () => {
  const workflow = createWebDesignWorkflow({ projectType: 'vetrina' });
  assert.deepEqual(workflow.fasiControllo.map((control) => control.tipo), [
    'giorno-5-struttura',
    'giorno-10-design',
    'giorno-15-collaudo',
  ]);
  assert.equal(workflow.fasiControllo.length, 3);
  assert.doesNotMatch(
    workflow.fasi.flatMap((fase) => fase.tasks).map((task) => task.nome).join(' '),
    /figma/i
  );
});

test('One Page, Landing Page e Blog usano la timeline Vetrina', () => {
  assert.equal(normalizeProjectType('one-page'), 'vetrina');
  assert.equal(normalizeProjectType('landing-page'), 'vetrina');
  assert.equal(normalizeProjectType('blog'), 'vetrina');
});

test("l'intervista ricevuta mantiene l'avvio contrattuale e completa il relativo task", () => {
  const collaboration = {
    tipoProgetto: 'vetrina',
    dataInizioContratto: new Date('2026-10-19T00:00:00.000Z'),
    ...createWebDesignWorkflow({ projectType: 'vetrina', operationalStart: '2026-10-19' }),
  };
  collaboration.fasi[0].tasks[0].note = 'Dato già inserito';
  const receivedAt = new Date('2026-10-21T09:30:00.000Z');
  const scheduled = scheduleExistingWorkflow(
    collaboration,
    collaboration.dataInizioContratto,
    null,
    receivedAt
  );
  assert.equal(scheduled.dataAvvioOperativo.toISOString().slice(0, 10), '2026-10-19');
  assert.equal(scheduled.intervistaRicevutaAt.toISOString(), receivedAt.toISOString());
  assert.equal(scheduled.fasi[0].tasks[0].note, 'Dato già inserito');
  assert.equal(scheduled.fasi[0].tasks[0].stato, 'completata');
  assert.equal(scheduled['consegna.dataPrevista'].toISOString().slice(0, 10), '2026-11-06');
});

test('weekend e cambi ora Europe/Rome non entrano nei 15 giorni', () => {
  assert.equal(addWorkingDaysDateOnly('2026-03-27', 1), '2026-03-30');
  assert.equal(addWorkingDaysDateOnly('2026-10-23', 1), '2026-10-26');
  assert.equal(getOperationalStartDateOnly('2026-10-17'), '2026-10-19');
});

test("dopo l'orario configurato il giorno di avvio non conta", () => {
  const fridayAfterCutoff = '2026-10-16T16:30:00.000Z'; // 18:30 a Roma
  assert.equal(getOperationalStartDateOnly(fridayAfterCutoff, '18:00'), '2026-10-19');
  assert.equal(getOperationalStartDateOnly(fridayAfterCutoff), '2026-10-16');
});

test("l'appuntamento intermedio è facoltativo e non blocca il workflow", () => {
  const workflow = createWebDesignWorkflow({ projectType: 'vetrina' });
  const middle = workflow.appuntamenti.find((item) => item.tipo === 'intermedio');
  assert.equal(middle.stato, 'facoltativo');
  assert.equal(middle.obbligatorio, false);
});

test("l'approvazione asincrona è rappresentata separatamente dagli appuntamenti", () => {
  const workflow = createWebDesignWorkflow({ projectType: 'vetrina' });
  workflow.approvazioni[0].modalita = 'asincrona';
  workflow.approvazioni[0].stato = 'approvata';
  assert.equal(workflow.approvazioni[0].modalita, 'asincrona');
  assert.notEqual(workflow.approvazioni, workflow.appuntamenti);
});

test('un controllo non superato non sblocca la fase successiva', () => {
  const controls = createWebDesignWorkflow({ projectType: 'vetrina' }).fasiControllo;
  controls[0].completata = true;
  controls[0].esito = 'non superato';
  assert.equal(isWorkflowPhaseUnlocked('design', controls, true), false);
  controls[0].esito = 'superato';
  assert.equal(isWorkflowPhaseUnlocked('design', controls, true), false);
  controls[0].data = new Date('2026-10-23T12:00:00.000Z');
  assert.equal(isWorkflowPhaseUnlocked('design', controls, true), true);
});

test('la consegna del nuovo workflow richiede il controllo finale della terza fase', () => {
  const controls = createWebDesignWorkflow({ projectType: 'vetrina' }).fasiControllo;
  const delivery = { stato: 'consegnato', confermata: true };
  assert.equal(validateDeliveryConfirmation({ controls, delivery }).ok, false);
  const control = controls.find((item) => item.tipo === 'giorno-15-collaudo');
  control.completata = true;
  control.esito = 'superato';
  control.data = new Date('2026-11-05T12:00:00.000Z');
  assert.equal(validateDeliveryConfirmation({ controls, delivery }).ok, true);
});

test('consegna e pubblicazione restano stati indipendenti', () => {
  const workflow = createWebDesignWorkflow({ projectType: 'vetrina' });
  workflow.consegna.stato = 'consegnato';
  workflow.consegna.confermata = true;
  assert.equal(workflow.pubblicazione.stato, 'da pianificare');
  workflow.pubblicazione.stato = 'pubblicata';
  assert.equal(workflow.consegna.stato, 'consegnato');
});

test('ritardi cliente e progetti storici restano rappresentabili senza migrazione implicita', () => {
  const workflow = createWebDesignWorkflow({ projectType: 'vetrina' });
  workflow.fasi[0].tasks[0].motivoRitardo = 'attesa cliente';
  assert.equal(workflow.fasi[0].tasks[0].motivoRitardo, 'attesa cliente');
  assert.equal(isStandardWorkflowProject({ workflowVersion: null }), false);
  assert.equal(isStandardWorkflowProject({ workflowVersion: WEB_DESIGN_WORKFLOW_VERSION }), true);
  assert.equal(isStandardWorkflowProject({ workflowVersion: LEGACY_WEB_DESIGN_WORKFLOW_VERSION }), true);
});

test('spostare il giorno 1 ricalcola le previsioni senza perdere dati operativi', () => {
  const workflow = createWebDesignWorkflow({
    projectType: 'vetrina',
    operationalStart: '2026-10-19',
  });
  workflow.fasi[0].tasks[2].stato = 'completata';
  workflow.fasi[0].tasks[2].completata = true;
  workflow.fasi[0].tasks[2].note = 'Obiettivi verificati';
  workflow.fasiControllo[0].data = new Date('2026-10-23T12:00:00.000Z');
  workflow.fasiControllo[0].esito = 'superato';
  workflow.fasiControllo[0].completata = true;
  workflow.consegna.stato = 'pronta';
  workflow.consegna.note = 'Consegna concordata';

  const rescheduled = rescheduleWebDesignWorkflow(
    { tipoProgetto: 'vetrina', ...workflow },
    '2026-10-26'
  );

  assert.equal(rescheduled.dataAvvioOperativo.toISOString().slice(0, 10), '2026-10-26');
  assert.equal(rescheduled.fasi[0].dataFinePrevista.toISOString().slice(0, 10), '2026-10-30');
  assert.equal(rescheduled.fasi[2].dataFinePrevista.toISOString().slice(0, 10), '2026-11-13');
  assert.equal(rescheduled.dataFineContratto.toISOString().slice(0, 10), '2026-11-13');
  assert.equal(rescheduled.fasi[0].tasks[2].stato, 'completata');
  assert.equal(rescheduled.fasi[0].tasks[2].note, 'Obiettivi verificati');
  assert.equal(rescheduled.fasiControllo[0].data.toISOString(), '2026-10-23T12:00:00.000Z');
  assert.equal(rescheduled.fasiControllo[0].esito, 'superato');
  assert.equal(rescheduled.consegna.stato, 'pronta');
  assert.equal(rescheduled.consegna.note, 'Consegna concordata');
});
