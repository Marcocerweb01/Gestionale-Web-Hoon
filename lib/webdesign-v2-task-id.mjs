export function createIntegrationTaskId() {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('crypto.randomUUID non disponibile');
  }
  return globalThis.crypto.randomUUID();
}

export function ensureIntegrationTaskId(task) {
  if (!task.integrationTaskId) task.integrationTaskId = createIntegrationTaskId();
  return task;
}
