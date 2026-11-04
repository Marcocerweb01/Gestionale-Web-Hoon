import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import {
  calculateChecklistProgress,
  calculateControlsProgress,
  calculateCurrentPhase,
  calculatePhaseProgress,
  calculateWebDesignProgress,
  isWebDesignTaskCompleted,
} from '../webdesign-v2-progress.mjs';

export const LIFE_OS_SCHEMA_VERSION = '1.0';
export const LIFE_OS_CLIENT = 'life-os';
export const LIFE_OS_MAX_LIMIT = 100;
export const LIFE_OS_DEFAULT_LIMIT = 50;

const PROJECT_STATUS = {
  'in corso': 'in_progress',
  'in pausa': 'paused',
  terminata: 'completed',
};
const TASK_STATUS = {
  'da fare': 'todo',
  'in corso': 'in_progress',
  'in attesa': 'waiting',
  completata: 'completed',
  'non applicabile': 'not_applicable',
};
const CRITICALITY = { regolare: 'regular', attenzione: 'attention', critico: 'critical' };

export function normalizeProjectStatus(value) {
  return PROJECT_STATUS[value] || 'unknown';
}

export function normalizeTaskStatus(value, completed = false) {
  if (!value && completed) return 'completed';
  return TASK_STATUS[value] || 'unknown';
}

export function canonicalSiteUrl(project = {}) {
  return project.pubblicazione?.urlPubblico?.trim() || project.dominio?.urlDominio?.trim() || null;
}

export function clientName(project = {}) {
  return project.cliente?.ragioneSociale || project.cliente?.etichetta || project.cliente?.nome ||
    project.aziendaRagioneSociale || 'Progetto web';
}

export function assignee(project = {}) {
  const id = project.webDesigner?._id || project.webDesigner;
  const name = [project.webDesigner?.nome || project.collaboratoreNome, project.webDesigner?.cognome || project.collaboratoreCognome]
    .filter(Boolean).join(' ').trim();
  return id ? { id: String(id), name: name || null } : null;
}

function iso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function serializeProjectSummary(project) {
  const name = clientName(project);
  return {
    id: String(project._id),
    source: 'hoon-web',
    source_type: 'webdesign-v2',
    name: `Sito web ${name}`,
    project_type: project.tipoProgetto || null,
    status: normalizeProjectStatus(project.stato),
    progress_percent: calculateWebDesignProgress(project),
    current_phase: calculateCurrentPhase(project),
    client: project.cliente?._id || project.cliente
      ? { id: String(project.cliente?._id || project.cliente), name }
      : { id: null, name },
    assignee: assignee(project),
    site_url: canonicalSiteUrl(project),
    planned_start_at: iso(project.dataAvvioOperativo || project.dataInizioContratto),
    planned_end_at: iso(project.consegna?.dataPrevista || project.dataFineContratto),
    created_at: iso(project.createdAt),
    updated_at: iso(project.updatedAt),
    version: Number(project.__v || 0),
  };
}

export function serializeProjectDetail(project) {
  return {
    ...serializeProjectSummary(project),
    phase_progress: calculatePhaseProgress(project),
    controls_progress_percent: calculateControlsProgress(project),
    publication_checklist_progress_percent: calculateChecklistProgress(project),
    delivery: {
      status: project.consegna?.stato || null,
      planned_at: iso(project.consegna?.dataPrevista),
      completed_at: iso(project.consegna?.dataEffettiva),
      confirmed: Boolean(project.consegna?.confermata),
    },
    publication: {
      status: project.pubblicazione?.stato || null,
      planned_at: iso(project.pubblicazione?.dataPrevista),
      completed_at: iso(project.pubblicazione?.dataEffettiva),
      url: canonicalSiteUrl(project),
    },
  };
}

function serializeTask(project, task, metadata) {
  return {
    id: task.integrationTaskId || null,
    project_id: String(project._id),
    task_type: metadata.taskType,
    phase: metadata.phase || task.faseCollegata || null,
    code: task.codice || null,
    title: task.nome || null,
    description: task.descrizione || '',
    status: normalizeTaskStatus(task.stato, task.completata),
    completed: isWebDesignTaskCompleted(task),
    criticality: CRITICALITY[task.criticita] || null,
    delay_reason: task.motivoRitardo || '',
    position: metadata.position,
    working_day: task.giornoLavorativo ?? null,
    assignee: assignee(project),
    created_at: null,
    updated_at: null,
    version: 1,
  };
}

export function serializeProjectTasks(project) {
  const result = [];
  (project.fasi || []).forEach((phase) => (phase.tasks || []).forEach((task, index) => {
    result.push(serializeTask(project, task, { taskType: 'phase_task', phase: phase.nome, position: index + 1 }));
  }));
  (project.controlli || []).forEach((control) => (control.tasks || []).forEach((task, index) => {
    result.push(serializeTask(project, task, { taskType: 'control_task', phase: task.faseCollegata || null, position: index + 1 }));
  }));
  (project.checklistPubblicazione || []).forEach((group) => (group.items || []).forEach((task, index) => {
    result.push(serializeTask(project, task, { taskType: 'publication_checklist_item', phase: task.faseCollegata || null, position: index + 1 }));
  }));
  return result;
}

export function parseLimit(value) {
  if (value === null || value === undefined || value === '') return LIFE_OS_DEFAULT_LIMIT;
  if (!/^\d+$/.test(String(value))) throw new Error('limit deve essere un intero positivo');
  const limit = Number(value);
  if (limit < 1 || limit > LIFE_OS_MAX_LIMIT) throw new Error(`limit deve essere compreso tra 1 e ${LIFE_OS_MAX_LIMIT}`);
  return limit;
}

export function parseIsoDate(value, field = 'updated_since') {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || !String(value).includes('T')) throw new Error(`${field} deve essere una data ISO valida`);
  return date;
}

export function encodeCursor(project) {
  return Buffer.from(JSON.stringify({ updated_at: new Date(project.updatedAt).toISOString(), id: String(project._id) })).toString('base64url');
}

export function decodeCursor(value) {
  if (!value) return null;
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    const date = parseIsoDate(decoded.updated_at, 'cursor.updated_at');
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) throw new Error('cursor.id non valido');
    return { updatedAt: date, id: new mongoose.Types.ObjectId(decoded.id) };
  } catch {
    throw new Error('cursor non valido');
  }
}

export function buildIncrementalFilter({ updatedSince, cursor, status }) {
  const filter = {};
  if (status) {
    const reverse = Object.entries(PROJECT_STATUS).find(([, normalized]) => normalized === status)?.[0];
    if (!reverse) throw new Error('status non valido');
    filter.stato = reverse;
  }
  if (cursor) {
    filter.$or = [
      { updatedAt: { $gt: cursor.updatedAt } },
      { updatedAt: cursor.updatedAt, _id: { $gt: cursor.id } },
    ];
  } else if (updatedSince) {
    filter.updatedAt = { $gte: updatedSince };
  }
  return filter;
}

export function safeEqualSecret(actual, expected) {
  if (!actual || !expected) return false;
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function authorizeLifeOsRequest(headers, requiredScope, env = process.env) {
  const authorization = headers.get('authorization') || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!safeEqualSecret(token, env.LIFE_OS_INTEGRATION_API_KEY)) {
    return { ok: false, status: 401, code: 'unauthorized', message: 'Credenziali mancanti o non valide' };
  }
  const client = headers.get('x-hoon-client');
  if (client !== LIFE_OS_CLIENT) return { ok: false, status: 403, code: 'forbidden', message: 'Client di integrazione non autorizzato' };
  const scopes = new Set(String(env.LIFE_OS_INTEGRATION_SCOPES || 'projects:read,tasks:read').split(',').map((item) => item.trim()).filter(Boolean));
  if (!scopes.has(requiredScope)) return { ok: false, status: 403, code: 'insufficient_scope', message: 'Scope insufficiente' };
  return { ok: true };
}

export function isValidProjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

const buckets = new Map();
export function checkLifeOsRateLimit(key, now = Date.now(), max = 300, windowMs = 60_000) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= max;
}

export function requestId(headers) {
  const supplied = headers.get('x-request-id');
  return supplied && /^[A-Za-z0-9._:-]{1,100}$/.test(supplied) ? supplied : randomUUID();
}

export function jsonError(status, code, message, id) {
  return Response.json({ error: { code, message, request_id: id } }, {
    status,
    headers: { 'Cache-Control': 'private, no-store', 'X-Request-Id': id },
  });
}

export function integrationHeaders(id) {
  return { 'Cache-Control': 'private, no-store', 'X-Request-Id': id };
}
