import { connectToDB } from '@/utils/database';
import {
  authorizeLifeOsRequest,
  checkLifeOsRateLimit,
  integrationHeaders,
  jsonError,
  requestId,
} from '@/lib/integrations/life-os-v1.mjs';

export async function prepareLifeOsRequest(req, scope) {
  const id = requestId(req.headers);
  const auth = authorizeLifeOsRequest(req.headers, scope);
  if (!auth.ok) return { error: jsonError(auth.status, auth.code, auth.message, id) };

  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkLifeOsRateLimit(`${forwarded}:${scope}`)) {
    return { error: jsonError(429, 'rate_limited', 'Troppe richieste', id) };
  }

  console.info(`[life-os-v1] request_id=${id} method=${req.method} path=${new URL(req.url).pathname}`);
  await connectToDB();
  return { requestId: id, headers: integrationHeaders(id) };
}

export function handleLifeOsError(error, id) {
  if (error?.name === 'ValidationError') return jsonError(400, 'invalid_request', error.message, id);
  console.error(`[life-os-v1] request_id=${id} error=${error?.message || 'unknown'}`);
  return jsonError(500, 'internal_error', 'Errore interno del server', id);
}
