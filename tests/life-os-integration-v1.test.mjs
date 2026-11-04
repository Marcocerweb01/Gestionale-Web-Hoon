import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  authorizeLifeOsRequest,
  buildIncrementalFilter,
  canonicalSiteUrl,
  decodeCursor,
  encodeCursor,
  isValidProjectId,
  jsonError,
  normalizeProjectStatus,
  normalizeTaskStatus,
  parseLimit,
  serializeProjectDetail,
  serializeProjectTasks,
} from '../lib/integrations/life-os-v1.mjs';
import {
  calculateWebDesignProgress,
  isWebDesignTaskCompleted,
} from '../lib/webdesign-v2-progress.mjs';
import { createWebDesignWorkflow, rescheduleWebDesignWorkflow } from '../lib/webdesign-v2-workflow.mjs';
import { backfillProjectTaskIds, runTaskIdBackfill } from '../lib/webdesign-v2-task-backfill.mjs';

const env = { LIFE_OS_INTEGRATION_API_KEY: 'test-only-key', LIFE_OS_INTEGRATION_SCOPES: 'projects:read,tasks:read' };
const headers = (values = {}) => new Headers(values);

test('richiesta senza token restituisce 401', () => {
  assert.equal(authorizeLifeOsRequest(headers(), 'projects:read', env).status, 401);
});

test('token errato restituisce 401', () => {
  const result = authorizeLifeOsRequest(headers({ authorization: 'Bearer wrong', 'x-hoon-client': 'life-os' }), 'projects:read', env);
  assert.equal(result.status, 401);
});

test('client errato restituisce 403', () => {
  const result = authorizeLifeOsRequest(headers({ authorization: 'Bearer test-only-key', 'x-hoon-client': 'other' }), 'projects:read', env);
  assert.equal(result.status, 403);
});

test('ObjectId invalido viene rifiutato', () => assert.equal(isValidProjectId('not-an-object-id'), false));

test('progetto inesistente usa il formato 404 documentato', async () => {
  const response = jsonError(404, 'not_found', 'Progetto non trovato', 'req-1');
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: { code: 'not_found', message: 'Progetto non trovato', request_id: 'req-1' } });
});

test('normalizza gli stati di progetto e task', () => {
  assert.deepEqual(['in corso', 'in pausa', 'terminata', 'altro'].map(normalizeProjectStatus), ['in_progress', 'paused', 'completed', 'unknown']);
  assert.deepEqual(['da fare', 'in corso', 'in attesa', 'completata', 'non applicabile'].map((value) => normalizeTaskStatus(value)), ['todo', 'in_progress', 'waiting', 'completed', 'not_applicable']);
});

test('calcola la percentuale solo dai task delle fasi', () => {
  const project = { fasi: [{ tasks: [{ stato: 'completata' }, { stato: 'da fare' }] }], controlli: [{ tasks: [{ stato: 'completata' }] }] };
  assert.equal(calculateWebDesignProgress(project), 50);
});

test('non applicabile conta come completato', () => assert.equal(isWebDesignTaskCompleted({ stato: 'non applicabile' }), true));
test('progetto senza task restituisce 0%', () => assert.equal(calculateWebDesignProgress({ fasi: [] }), 0));

test('sceglie prima URL pubblico, poi dominio, poi null', () => {
  assert.equal(canonicalSiteUrl({ pubblicazione: { urlPubblico: 'https://live.invalid' }, dominio: { urlDominio: 'https://domain.invalid' } }), 'https://live.invalid');
  assert.equal(canonicalSiteUrl({ dominio: { urlDominio: 'https://domain.invalid' } }), 'https://domain.invalid');
  assert.equal(canonicalSiteUrl({}), null);
});

test('cursor distingue record con lo stesso updatedAt tramite _id', () => {
  const project = { updatedAt: new Date('2026-11-04T10:30:00.000Z'), _id: new mongoose.Types.ObjectId('690b3f580000000000000001') };
  const cursor = decodeCursor(encodeCursor(project));
  const filter = buildIncrementalFilter({ cursor });
  assert.equal(filter.$or[1].updatedAt.toISOString(), project.updatedAt.toISOString());
  assert.equal(String(filter.$or[1]._id.$gt), String(project._id));
});

test('limite massimo è 100', () => {
  assert.equal(parseLimit('100'), 100);
  assert.throws(() => parseLimit('101'), /100/);
});

test('serializzazione esclude intervista e altri campi sensibili', () => {
  const detail = serializeProjectDetail({
    _id: new mongoose.Types.ObjectId(), cliente: { _id: new mongoose.Types.ObjectId(), ragioneSociale: 'Demo' },
    stato: 'in corso', fasi: [], interview: { accessiDominio: 'segreto' }, interviewPrompt: 'segreto', createdAt: new Date(), updatedAt: new Date(),
  });
  const serialized = JSON.stringify(detail);
  assert.doesNotMatch(serialized, /accessiDominio|interviewPrompt|segreto/);
});

test('integrationTaskId è UUID, univoco e stabile durante la ripianificazione', () => {
  const workflow = createWebDesignWorkflow({ projectType: 'vetrina', operationalStart: '2026-11-02' });
  const before = workflow.fasi.flatMap((phase) => phase.tasks).map((task) => task.integrationTaskId);
  assert.equal(new Set(before).size, before.length);
  assert.ok(before.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)));
  const after = rescheduleWebDesignWorkflow({ tipoProgetto: 'vetrina', ...workflow }, '2026-11-09')
    .fasi.flatMap((phase) => phase.tasks).map((task) => task.integrationTaskId);
  assert.deepEqual(after, before);
});

test('serializer task usa i tre task_type e non inventa timestamp', () => {
  const base = { integrationTaskId: crypto.randomUUID(), nome: 'Task', stato: 'da fare' };
  const data = serializeProjectTasks({ _id: new mongoose.Types.ObjectId(), fasi: [{ nome: 'design', tasks: [{ ...base }] }], controlli: [{ tasks: [{ ...base, integrationTaskId: crypto.randomUUID() }] }], checklistPubblicazione: [{ items: [{ ...base, integrationTaskId: crypto.randomUUID() }] }] });
  assert.deepEqual(data.map((item) => item.task_type), ['phase_task', 'control_task', 'publication_checklist_item']);
  assert.ok(data.every((item) => item.created_at === null && item.updated_at === null));
});

function fakeCollection(documents) {
  let writes = 0;
  return {
    find() { return { async *[Symbol.asyncIterator]() { for (const document of structuredClone(documents)) yield document; } }; },
    async bulkWrite() { writes += 1; },
    get writes() { return writes; },
  };
}

test('backfill è idempotente e conserva gli ID presenti', () => {
  let sequence = 0;
  const project = { fasi: [{ tasks: [{ nome: 'A' }, { nome: 'B', integrationTaskId: 'existing' }] }] };
  const first = backfillProjectTaskIds(project, () => `new-${++sequence}`);
  const second = backfillProjectTaskIds(project, () => `new-${++sequence}`);
  assert.deepEqual(first, { changed: true, added: 1 });
  assert.deepEqual(second, { changed: false, added: 0 });
  assert.equal(project.fasi[0].tasks[1].integrationTaskId, 'existing');
});

test('--dry-run non esegue scritture', async () => {
  const collection = fakeCollection([{ _id: 'p1', fasi: [{ tasks: [{ nome: 'A' }] }] }]);
  const result = await runTaskIdBackfill({ collection, dryRun: true, createId: () => 'generated' });
  assert.equal(result.tasksChanged, 1);
  assert.equal(result.writes, 0);
  assert.equal(collection.writes, 0);
});
