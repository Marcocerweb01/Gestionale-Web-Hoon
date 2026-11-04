import CollaborazioneWebDesignV2 from '@/models/CollaborazioniWebDesignV2';
import { prepareLifeOsRequest, handleLifeOsError } from '@/lib/integrations/life-os-v1-server';
import {
  LIFE_OS_SCHEMA_VERSION,
  buildIncrementalFilter,
  decodeCursor,
  encodeCursor,
  jsonError,
  parseIsoDate,
  parseLimit,
  serializeProjectSummary,
} from '@/lib/integrations/life-os-v1.mjs';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const prepared = await prepareLifeOsRequest(req, 'projects:read');
  if (prepared.error) return prepared.error;
  const id = prepared.requestId;
  try {
    const url = new URL(req.url);
    const limit = parseLimit(url.searchParams.get('limit'));
    const cursor = decodeCursor(url.searchParams.get('cursor'));
    const updatedSince = parseIsoDate(url.searchParams.get('updated_since'));
    const status = url.searchParams.get('status');
    const filter = buildIncrementalFilter({ updatedSince, cursor, status });
    const records = await CollaborazioneWebDesignV2.find(filter)
      .select('-interview -interviewPrompt')
      .populate('cliente', 'ragioneSociale etichetta nome')
      .populate('webDesigner', 'nome cognome')
      .sort({ updatedAt: 1, _id: 1 })
      .limit(limit + 1)
      .lean();
    const hasMore = records.length > limit;
    const page = records.slice(0, limit);
    return Response.json({
      data: page.map(serializeProjectSummary),
      next_cursor: hasMore ? encodeCursor(page.at(-1)) : null,
      schema_version: LIFE_OS_SCHEMA_VERSION,
    }, { headers: prepared.headers });
  } catch (error) {
    if (/limit|cursor|updated_since|status/.test(error.message)) return jsonError(400, 'invalid_request', error.message, id);
    return handleLifeOsError(error, id);
  }
}
