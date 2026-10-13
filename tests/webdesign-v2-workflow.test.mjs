import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEB_DESIGN_WORKFLOW_VERSION,
  addWorkingDaysDateOnly,
  createWebDesignWorkflow,
  getOperationalStartDateOnly,
  isStandardWorkflowProject,
  isWorkflowPhaseUnlocked,
  normalizeProjectType,
  scheduleExistingWorkflow,
  validateDeliveryConfirmation,
} from '../lib/webdesign-v2-workflow.mjs';

test('crea un sito vetrina in 3 fasi e 15 giorni lavorativi', () => {
  const workflow = createWebDesignWorkflow({ projectType: 'vetrina', operationalStart: '2026-10-16' });
  assert.deepEqual(workflow.fasi.map((fase) => fase.nome), ['struttura', 'design', 'consegna']);
  assert.equal(workflow.consegna.dataPrevista.toISOString().slice(0, 10), '2026-11-05');
  assert.equal(workflow.fasi.at(-1).giornoFine, 15);
});

test('la timeline e-commerce contiene le attività aggiuntive', () => {
  const showcase = createWebDesignWorkflow({ projectType: 'vetrina' });
  const ecommerce = createWebDesignWorkflow({ projectType: 'e-commerce' });
  assert.ok(ecommerce.fasi[0].tasks.length > showcase.fasi[0].tasks.length);
  assert.ok(ecommerce.fasi[1].tasks.some((task) => task.nome.includes('checkout')));
  assert.ok(ecommerce.fasi[2].tasks.some((task) => task.nome.includes('pagamenti')));
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

test('la consegna richiede collaudo e controllo consegna distinti', () => {
  const controls = createWebDesignWorkflow({ projectType: 'vetrina' }).fasiControllo;
  const delivery = { stato: 'consegnato', confermata: true };
  assert.equal(validateDeliveryConfirmation({ controls, delivery }).ok, false);
  for (const tipo of ['giorno-15-collaudo', 'consegna-effettiva']) {
    const control = controls.find((item) => item.tipo === tipo);
    control.completata = true;
    control.esito = 'superato';
    control.data = new Date('2026-11-05T12:00:00.000Z');
  }
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
});
