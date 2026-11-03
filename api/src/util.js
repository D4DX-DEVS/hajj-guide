import { insert } from './db.js';

/** Response envelope is `{ success, data }` — the Flutter app's parsers depend on it. */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export const badRequest = (m = 'Bad request', d) => new ApiError(400, m, d);
export const unauthorized = (m = 'Unauthorized') => new ApiError(401, m);
export const forbidden = (m = 'Forbidden') => new ApiError(403, m);
export const notFound = (m = 'Not found') => new ApiError(404, m);
export const conflict = (m = 'Conflict') => new ApiError(409, m);
export const unavailable = (m = 'Service unavailable') => new ApiError(503, m);

export const ok = (c, data, meta) => c.json(meta ? { success: true, data, meta } : { success: true, data });
export const created = (c, data) => c.json({ success: true, data }, 201);

export function pagination(query, { defaultLimit = 50, maxLimit = 200 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw badRequest('Validation failed', r.error.issues.map((i) => ({ path: i.path.join('.') || '(root)', message: i.message })));
  }
  return r.data;
}

export async function body(c, schema) {
  const data = await c.req.json().catch(() => {
    throw badRequest('Invalid JSON body');
  });
  return parse(schema, data);
}

export const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
/** Drops undefined values so a partial update never blanks a stored field. */
export const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/** Fire-and-forget audit trail; a logging failure must never fail the request. */
export function audit(c, { action, collectionName, docId, diff }) {
  const a = c.get('admin');
  c.executionCtx.waitUntil(
    insert(c.env.DB, 'auditLogs', {
      adminId: a?.id,
      adminEmail: a?.email,
      action,
      collectionName,
      docId: docId ? String(docId) : undefined,
      diff,
      ip: c.req.header('cf-connecting-ip'),
      at: new Date().toISOString(),
    }).catch((err) => console.warn('failed to write audit log', err)),
  );
}

export const clientIp = (c) => c.req.header('cf-connecting-ip') || 'unknown';

/** Uses a Workers rate-limit binding when configured; a no-op otherwise. */
export const rateLimit = (binding, keyFn = clientIp) => async (c, next) => {
  const limiter = c.env[binding];
  if (limiter) {
    const { success } = await limiter.limit({ key: await keyFn(c) });
    if (!success) throw new ApiError(429, 'Too many requests, slow down');
  }
  await next();
};
