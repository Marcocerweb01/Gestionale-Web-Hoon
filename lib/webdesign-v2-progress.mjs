import { isWorkflowPhaseUnlocked } from './webdesign-v2-workflow.mjs';

export function isWebDesignTaskCompleted(task = {}) {
  return task.stato === 'completata' ||
    task.stato === 'non applicabile' ||
    (!task.stato && task.completata === true);
}

export function calculateTaskCollectionProgress(tasks = []) {
  if (!tasks.length) return 0;
  const completedTasks = tasks.filter(isWebDesignTaskCompleted).length;
  return Math.round((completedTasks / tasks.length) * 100);
}

export function calculateWebDesignProgress(project = {}) {
  const tasks = (project.fasi || []).flatMap((fase) => fase.tasks || []);
  return calculateTaskCollectionProgress(tasks);
}

export function calculatePhaseProgress(project = {}) {
  return (project.fasi || []).map((fase) => ({
    phase: fase.nome,
    progress_percent: calculateTaskCollectionProgress(fase.tasks || []),
  }));
}

export function calculateControlsProgress(project = {}) {
  const controls = project.fasiControllo || [];
  if (!controls.length) return 0;
  return Math.round((controls.filter((control) => control.completata).length / controls.length) * 100);
}

export function calculateChecklistProgress(project = {}) {
  const items = (project.checklistPubblicazione || []).flatMap((group) => group.items || []);
  return calculateTaskCollectionProgress(items);
}

export function calculateCurrentPhase(project = {}) {
  const phases = project.fasi || [];
  if (!phases.length) return null;

  const progress = phases.map((phase) => calculateTaskCollectionProgress(phase.tasks || []));
  if (progress.every((value) => value === 100)) return 'completed';

  const controls = project.fasiControllo || [];
  const hasOperationalStart = Boolean(project.dataAvvioOperativo || project.dataInizioContratto);
  const firstUnlockedIncomplete = phases.find((phase, index) =>
    progress[index] < 100 && isWorkflowPhaseUnlocked(phase.nome, controls, hasOperationalStart)
  );
  if (firstUnlockedIncomplete) return firstUnlockedIncomplete.nome;

  return phases.find((phase, index) => progress[index] < 100)?.nome || 'completed';
}
