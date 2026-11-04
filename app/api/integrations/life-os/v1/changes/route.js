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
    if (!updatedSince && !cursor) return jsonError(400, 'invalid_request', 'updated_since o cursor è obbligatorio', id);
    const records = await CollaborazioneWebDesignV2.find(buildIncrementalFilter({ updatedSince, cursor }))
      .select('_id updatedAt __v')
      .sort({ updatedAt: 1, _id: 1 })
      .limit(limit + 1)
      .lean();
    const hasMore = records.length > limit;
    const page = records.slice(0, limit);
    return Response.json({
      data: page.map((record) => ({
        entity_type: 'project', entity_id: String(record._id), change_type: 'updated',
        updated_at: new Date(record.updatedAt).toISOString(), version: Number(record.__v || 0),
      })),
      next_cursor: hasMore ? encodeCursor(page.at(-1)) : null,
      schema_version: LIFE_OS_SCHEMA_VERSION,
    }, { headers: prepared.headers });
  } catch (error) {
    if (/limit|cursor|updated_since/.test(error.message)) return jsonError(400, 'invalid_request', error.message, id);
    return handleLifeOsError(error, id);
  }
}
