import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { ZodError } from 'zod';
import publicRoutes from './routes/public.js';
import meRoutes from './routes/me.js';
import adminRoutes from './routes/admin.js';
import { ApiError } from './util.js';

const app = new Hono();

app.use('*', secureHeaders({ crossOriginResourcePolicy: 'cross-origin' }));
app.use('*', (c, next) => {
  const allowed = c.env.CORS_ORIGINS || '*';
  const list = allowed.split(',').map((s) => s.trim()).filter(Boolean);
  return cors({
    origin: (origin) => (allowed === '*' ? '*' : list.includes(origin) ? origin : null),
    credentials: true,
    exposeHeaders: ['ETag'],
  })(c, next);
});

app.get('/health', async (c) => {
  let dbUp = true;
  try {
    await c.env.DB.prepare('SELECT 1').first();
  } catch {
    dbUp = false;
  }
  return c.json(
    {
      success: dbUp,
      data: {
        status: dbUp ? 'ok' : 'degraded',
        db: dbUp ? 'connected' : 'disconnected',
        firebase: c.env.FIREBASE_PROJECT_ID ? 'configured' : 'disabled',
        storage: c.env.BUCKET ? 'configured' : 'disabled',
      },
    },
    dbUp ? 200 : 503,
  );
});

/** Uploaded files served straight from R2 (with Range support for audio/video) unless R2_PUBLIC_URL points elsewhere. */
app.get('/media/*', async (c) => {
  if (!c.env.BUCKET) return c.notFound();
  const key = decodeURIComponent(new URL(c.req.url).pathname.slice('/media/'.length));
  const obj = await c.env.BUCKET.get(key, { range: c.req.raw.headers, onlyIf: c.req.raw.headers });
  if (!obj) return c.notFound();

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('accept-ranges', 'bytes');
  if (!obj.body) return new Response(null, { status: 304, headers });

  let status = 200;
  if (obj.range && typeof obj.range.offset === 'number') {
    status = 206;
    const end = obj.range.offset + (obj.range.length ?? obj.size - obj.range.offset) - 1;
    headers.set('content-range', `bytes ${obj.range.offset}-${end}/${obj.size}`);
  }
  return new Response(obj.body, { status, headers });
});

// `/me` is mounted first so user traffic is not counted against the public limiter.
app.route('/api/v1/me', meRoutes);
app.route('/api/v1', publicRoutes);
app.route('/api/admin', adminRoutes);

app.notFound((c) => c.json({ success: false, error: { message: `Route ${c.req.method} ${new URL(c.req.url).pathname} not found`, status: 404 } }, 404));

app.onError((err, c) => {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (!(err instanceof ApiError) && !err.status) {
    console.error('unhandled error', err);
    message = 'Internal server error';
  }

  const error = { message, status };
  if (details) error.details = details;
  return c.json({ success: false, error }, status);
});

export default app;
