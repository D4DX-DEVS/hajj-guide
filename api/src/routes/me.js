import { Hono } from 'hono';
import { z } from 'zod';
import { BOOKMARK_TYPES, RITUAL_TYPES } from '../registry.js';
import { find, findOne, insert, update, removeWhere } from '../db.js';
import { requireFirebase, requireUser } from '../auth.js';
import { ok, created, body, omit, clean, badRequest, notFound, rateLimit } from '../util.js';

const app = new Hono();
app.use('*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store');
});

/** Rate-limits per Firebase uid once authenticated; routes opt in via `limited`. */
const limited = rateLimit('USER_LIMITER', (c) => c.get('firebase')?.uid || c.req.header('cf-connecting-ip') || 'unknown');

/* ------------------------------------------------------------- validation */

const lang = z.enum(['ml', 'en', 'ar']);
const profileSchema = z.object({
  displayName: z.string().trim().max(120).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  language: lang.optional(),
  platform: z.enum(['android', 'ios']).optional(),
  appVersion: z.string().trim().max(20).optional(),
  fcmToken: z.string().trim().optional(),
});

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  fontScale: z.number().min(0.8).max(2).optional(),
  arabicFontSize: z.number().int().min(14).max(60).optional(),
  language: lang.optional(),
  notificationsEnabled: z.boolean().optional(),
});

const progressSchema = z.object({
  completedStepIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).default([]),
  currentStepIndex: z.number().int().min(0).optional(),
  /** `merge` (default) unions with what the server has; `replace` is a deliberate reset. */
  mode: z.enum(['merge', 'replace']).default('merge'),
});

const bookmarkSchema = z.object({ itemType: z.enum(BOOKMARK_TYPES), itemId: z.string().trim().min(1) });

const checklistSchema = z.object({
  checkedKeys: z.array(z.string().trim().min(1)).default([]),
  /** Unticking an item only takes effect in `replace` mode. */
  mode: z.enum(['merge', 'replace']).default('merge'),
});

const tentSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  address: z.string().trim().max(300).optional(),
  note: z.string().trim().max(300).optional(),
});

/* ---------------------------------------------------------------- helpers */

const mine = (user) => [['userId', 'eq', user.id]];
const hideUser = (u) => omit(u, ['fcmToken']);
const union = (a, b) => [...new Set([...a, ...b])];
const nowIso = () => new Date().toISOString();

const PREF_DEFAULTS = { theme: 'system', fontScale: 1, arabicFontSize: 24, language: 'ml', notificationsEnabled: true };

/** Find-or-create the per-user doc in `coll`. */
async function ensure(db, coll, user, defaults = {}) {
  return (await findOne(db, coll, mine(user))) ?? insert(db, coll, { userId: user.id, ...defaults });
}

/** Create or `$set`-merge the single per-user doc in `coll`. */
async function upsertMine(db, coll, user, patch, defaults = {}) {
  const existing = await findOne(db, coll, mine(user));
  return existing ? update(db, coll, existing, patch) : insert(db, coll, { userId: user.id, ...defaults, ...patch });
}

/* ---------------------------------------------------------------- profile */

/** Called right after Firebase sign-in. Creates the record on first login. */
app.post('/', requireFirebase, limited, async (c) => {
  const db = c.env.DB;
  const { uid, email, name, picture, firebase } = c.get('firebase');
  const input = await body(c, profileSchema);

  const set = clean({
    email: email?.toLowerCase(),
    displayName: input.displayName || name,
    photoUrl: input.photoUrl || picture,
    provider: firebase?.sign_in_provider,
    lastSeenAt: nowIso(),
    deletedAt: null,
    language: input.language,
    platform: input.platform,
    appVersion: input.appVersion,
    fcmToken: input.fcmToken,
  });

  const existing = await findOne(db, 'users', [['firebaseUid', 'eq', uid]]);
  const user = existing
    ? await update(db, 'users', existing, set)
    : await insert(db, 'users', { firebaseUid: uid, language: 'ml', ...set });

  await ensure(db, 'userPreferences', user, { ...PREF_DEFAULTS, language: user.language });
  return created(c, hideUser(user));
});

app.get('/', requireUser, limited, async (c) => {
  const user = await update(c.env.DB, 'users', c.get('user'), { lastSeenAt: nowIso() });
  return ok(c, hideUser(user));
});

/**
 * Account deletion — required by the App Store. Removes all pilgrim data; the
 * `users` row is kept as a tombstone (`deletedAt`) so an in-flight token cannot
 * silently resurrect a half-deleted profile. The Firebase account itself is NOT
 * deleted here (no service account on the Worker) — the app must call
 * `FirebaseAuth.instance.currentUser.delete()` after this returns.
 */
app.delete('/', requireUser, limited, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  await Promise.all(
    ['userProgress', 'userBookmarks', 'userChecklist', 'userTent', 'userPreferences'].map((coll) => removeWhere(db, coll, mine(user))),
  );
  await update(db, 'users', user, { deletedAt: nowIso(), email: null, displayName: null, photoUrl: null, fcmToken: null });

  return c.body(null, 204);
});

/* ------------------------------------------------------------ preferences */

app.get('/preferences', requireUser, limited, async (c) => ok(c, await ensure(c.env.DB, 'userPreferences', c.get('user'), PREF_DEFAULTS)));

app.patch('/preferences', requireUser, limited, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const patch = await body(c, preferencesSchema);

  const prefs = await upsertMine(db, 'userPreferences', user, patch, PREF_DEFAULTS);
  if (patch.language) await update(db, 'users', user, { language: patch.language });
  return ok(c, prefs);
});

/* --------------------------------------------------------------- progress */

app.get('/progress', requireUser, limited, async (c) => ok(c, await find(c.env.DB, 'userProgress', { where: mine(c.get('user')) })));

app.put('/progress/:ritualType', requireUser, limited, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const ritualType = c.req.param('ritualType');
  if (!RITUAL_TYPES.includes(ritualType)) throw badRequest("ritualType must be 'hajj' or 'umrah'");

  const { completedStepIds, currentStepIndex, mode } = await body(c, progressSchema);
  const existing = await findOne(db, 'userProgress', [...mine(user), ['ritualType', 'eq', ritualType]]);

  const next =
    mode === 'merge' && existing
      ? {
          completedStepIds: union(existing.completedStepIds, completedStepIds),
          currentStepIndex: Math.max(existing.currentStepIndex ?? 0, currentStepIndex ?? 0),
        }
      : { completedStepIds, currentStepIndex: currentStepIndex ?? 0 };

  const doc = existing
    ? await update(db, 'userProgress', existing, next)
    : await insert(db, 'userProgress', { userId: user.id, ritualType, ...next });
  return ok(c, doc);
});

/* -------------------------------------------------------------- bookmarks */

app.get('/bookmarks', requireUser, limited, async (c) =>
  ok(c, await find(c.env.DB, 'userBookmarks', { where: mine(c.get('user')), sort: [['createdAt', -1]] })),
);

app.post('/bookmarks', requireUser, limited, async (c) => {
  const user = c.get('user');
  const { itemType, itemId } = await body(c, bookmarkSchema);

  const existing = await findOne(c.env.DB, 'userBookmarks', [...mine(user), ['itemType', 'eq', itemType], ['itemId', 'eq', itemId]]);
  return created(c, existing ?? (await insert(c.env.DB, 'userBookmarks', { userId: user.id, itemType, itemId })));
});

/** `:id` is the bookmark's own id, or the bookmarked item's id — both work. */
app.delete('/bookmarks/:id', requireUser, limited, async (c) => {
  const id = c.req.param('id');
  const removed = await removeWhere(c.env.DB, 'userBookmarks', [...mine(c.get('user')), ['or', [['itemId', 'eq', id], ['id', 'eq', id]]]]);
  if (removed === 0) throw notFound('Bookmark not found');
  return c.body(null, 204);
});

/* -------------------------------------------------------------- checklist */

app.get('/checklist', requireUser, limited, async (c) => ok(c, await ensure(c.env.DB, 'userChecklist', c.get('user'), { checkedKeys: [] })));

app.put('/checklist', requireUser, limited, async (c) => {
  const user = c.get('user');
  const { checkedKeys, mode } = await body(c, checklistSchema);
  const existing = await findOne(c.env.DB, 'userChecklist', mine(user));

  const keys = mode === 'replace' || !existing ? [...new Set(checkedKeys)] : union(existing.checkedKeys, checkedKeys);
  const doc = existing
    ? await update(c.env.DB, 'userChecklist', existing, { checkedKeys: keys })
    : await insert(c.env.DB, 'userChecklist', { userId: user.id, checkedKeys: keys });
  return ok(c, doc);
});

/* ------------------------------------------------------------------- tent */

app.get('/tent', requireUser, limited, async (c) => {
  const doc = await findOne(c.env.DB, 'userTent', mine(c.get('user')));
  if (!doc) throw notFound('No tent saved');
  return ok(c, doc);
});

app.put('/tent', requireUser, limited, async (c) => {
  const patch = { ...(await body(c, tentSchema)), savedAt: nowIso() };
  return ok(c, await upsertMine(c.env.DB, 'userTent', c.get('user'), patch, { accuracy: 0 }));
});

app.delete('/tent', requireUser, limited, async (c) => {
  await removeWhere(c.env.DB, 'userTent', mine(c.get('user')));
  return c.body(null, 204);
});

export default app;
