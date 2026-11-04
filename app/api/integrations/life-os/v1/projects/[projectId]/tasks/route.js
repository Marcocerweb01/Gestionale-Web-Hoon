import CollaborazioneWebDesignV2 from '@/models/CollaborazioniWebDesignV2';
import { prepareLifeOsRequest, handleLifeOsError } from '@/lib/integrations/life-os-v1-server';
import { LIFE_OS_SCHEMA_VERSION, isValidProjectId, jsonError, serializeProjectTasks } from '@/lib/integrations/life-os-v1.mjs';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const prepared = await prepareLifeOsRequest(req, 'tasks:read');
  if (prepared.error) return prepared.error;
  const id = prepared.requestId;
  try {
    const { projectId } = await params;
    if (!isValidProjectId(projectId)) return jsonError(400, 'invalid_request', 'projectId non valido', id);
    const project = await CollaborazioneWebDesignV2.findById(projectId)
      .select('_id fasi controlli checklistPubblicazione webDesigner collaboratoreNome collaboratoreCognome')
      .populate('webDesigner', 'nome cognome')
      .lean();
    if (!project) return jsonError(404, 'not_found', 'Progetto non trovato', id);
    return Response.json({ data: serializeProjectTasks(project), schema_version: LIFE_OS_SCHEMA_VERSION }, { headers: prepared.headers });
  } catch (error) {
    return handleLifeOsError(error, id);
  }
}
