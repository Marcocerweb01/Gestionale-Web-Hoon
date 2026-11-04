import { createIntegrationTaskId } from './webdesign-v2-task-id.mjs';

export function backfillProjectTaskIds(project, createId = createIntegrationTaskId) {
  let added = 0;
  const visit = (tasks = []) => tasks.forEach((task) => {
    if (!task.integrationTaskId) {
      task.integrationTaskId = createId();
      added += 1;
    }
  });
  (project.fasi || []).forEach((phase) => visit(phase.tasks));
  (project.controlli || []).forEach((control) => visit(control.tasks));
  (project.checklistPubblicazione || []).forEach((group) => visit(group.items));
  return { changed: added > 0, added };
}

export async function runTaskIdBackfill({ collection, dryRun = true, createId = createIntegrationTaskId }) {
  const cursor = collection.find({}, { projection: { fasi: 1, controlli: 1, checklistPubblicazione: 1 } });
  let projectsScanned = 0;
  let projectsChanged = 0;
  let tasksChanged = 0;
  const operations = [];
  for await (const project of cursor) {
    projectsScanned += 1;
    const result = backfillProjectTaskIds(project, createId);
    if (!result.changed) continue;
    projectsChanged += 1;
    tasksChanged += result.added;
    operations.push({
      updateOne: {
        filter: { _id: project._id },
        update: { $set: {
          fasi: project.fasi || [],
          controlli: project.controlli || [],
          checklistPubblicazione: project.checklistPubblicazione || [],
        } },
      },
    });
  }
  if (!dryRun && operations.length) await collection.bulkWrite(operations, { ordered: false });
  return { dryRun, projectsScanned, projectsChanged, tasksChanged, writes: dryRun ? 0 : operations.length };
}
