import { Hono } from 'hono';
import { etag } from 'hono/etag';
import { contentRegistry } from '../registry.js';
import { find, findOne, get, getSettings } from '../db.js';
import { ok, notFound, badRequest, rateLimit } from '../util.js';

const app = new Hono();

app.use('*', rateLimit('PUBLIC_LIMITER'), etag());
// Public content is cacheable; the ETag above answers If-None-Match with a 304.
app.use('*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
});

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const LIVE = [['isPublished', 'eq', 1], ['deletedAt', 'null']];

/* ------------------------------------------------------------- singletons */

app.get('/settings', async (c) => ok(c, await getSettings(c.env.DB)));

app.get('/force-update', async (c) => {
  const platform = String(c.req.query('platform') || '').toLowerCase();
  if (!['android', 'ios'].includes(platform)) throw badRequest("Query param 'platform' must be 'android' or 'ios'");
  const doc = await get(c.env.DB, 'forceUpdate', platform);
  if (!doc) throw notFound(`No force-update record for ${platform}`);
  return ok(c, doc);
});

/* ------------------------------------------------ generic content endpoints */

for (const entry of contentRegistry) {
  app.get(`/${entry.key}`, async (c) =>
    ok(c, await find(c.env.DB, entry.coll, { where: [...LIVE, ...entry.filter(c.req.query())], sort: entry.sort })),
  );

  app.get(`/${entry.key}/:idOrSlug`, async (c) => {
    const { idOrSlug } = c.req.param();
    const by = OBJECT_ID.test(idOrSlug) ? ['id', 'eq', idOrSlug] : entry.slug ? ['slug', 'eq', idOrSlug.toLowerCase()] : null;
    if (!by) throw badRequest('Invalid id');

    const doc = await findOne(c.env.DB, entry.coll, [by, ...LIVE]);
    if (!doc) throw notFound(`${entry.label} not found`);
    return ok(c, doc);
  });
}

/* ------------------------------------------------------------------- sync */

/**
 * `GET /api/v1/sync?since=<iso8601>` — everything that changed since the app
 * last synced. `changed` holds docs to upsert, `deleted` holds ids to drop; an
 * unpublished doc counts as deleted so stale content never lingers in the app's
 * cache. Omit `since` for a full snapshot (first launch).
 */
app.get('/sync', async (c) => {
  const { since } = c.req.query();
  let sinceIso = null;
  if (since) {
    const d = new Date(since);
    if (Number.isNaN(d.getTime())) throw badRequest("Query param 'since' must be an ISO-8601 timestamp");
    sinceIso = d.toISOString();
  }

  const db = c.env.DB;
  const window = sinceIso ? [['updatedAt', 'gt', sinceIso]] : [];
  const changed = {};
  const deleted = {};

  await Promise.all(
    contentRegistry.map(async (entry) => {
      const [live, gone] = await Promise.all([
        find(db, entry.coll, { where: [...window, ...LIVE], sort: entry.sort }),
        sinceIso
          ? find(db, entry.coll, { where: [...window, ['or', [['deletedAt', 'nnull'], ['isPublished', 'eq', 0]]]] })
          : [],
      ]);
      changed[entry.coll] = live;
      deleted[entry.coll] = gone.map((d) => d.id);
    }),
  );

  const [settings, forceUpdate] = await Promise.all([getSettings(db), find(db, 'forceUpdate', { where: window })]);

  return ok(c, { since: sinceIso, now: new Date().toISOString(), full: !sinceIso, settings, forceUpdate, changed, deleted });
});

export default app;
