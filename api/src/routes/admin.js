import { Hono } from 'hono';
import { z } from 'zod';
import { contentRegistry, baseDefaults, ADMIN_ROLES, PLATFORMS, RITUAL_TYPES, locOptional, locRequired } from '../registry.js';
import { find, findOne, get, getSettings, insert, update, removeWhere, count, newId } from '../db.js';
import {
  requireAdmin,
  requireRole,
  publicAdmin,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../auth.js';
import { hashPassword, verifyPassword, needsRehash } from '../password.js';
import {
  ApiError, ok, created, body, pagination, audit, omit, notFound, badRequest, conflict, unauthorized, unavailable, rateLimit,
} from '../util.js';

const app = new Hono();
app.use('*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store');
});

const listMeta = (page, limit, total) => ({ page, limit, total, pages: Math.ceil(total / limit) || 1 });
const hideUser = (u) => omit(u, ['fcmToken']);

/* ------------------------------------------------------------------ auth */

const loginSchema = z.object({ email: z.string().email().toLowerCase(), password: z.string().min(1) });
const refreshSchema = z.object({ refreshToken: z.string().min(10) });
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, 'Password must be at least 10 characters'),
});

app.post('/auth/login', rateLimit('LOGIN_LIMITER'), async (c) => {
  const { email, password } = await body(c, loginSchema);
  const admin = await findOne(c.env.DB, 'adminUsers', [['email', 'eq', email]]);

  // Same message for unknown email and wrong password — no account enumeration.
  const valid = admin && admin.isActive && (await verifyPassword(password, admin.passwordHash));
  if (!valid) throw unauthorized('Invalid email or password');

  const patch = { lastLoginAt: new Date().toISOString() };
  if (needsRehash(admin.passwordHash)) patch.passwordHash = await hashPassword(password);
  const saved = await update(c.env.DB, 'adminUsers', admin, patch);

  return ok(c, {
    admin: publicAdmin(saved),
    accessToken: await signAccessToken(c.env, saved),
    refreshToken: await signRefreshToken(c.env, saved),
  });
});

app.post('/auth/refresh', async (c) => {
  const { refreshToken } = await body(c, refreshSchema);
  const payload = await verifyRefreshToken(c.env, refreshToken);

  const admin = await get(c.env.DB, 'adminUsers', payload.sub);
  if (!admin || !admin.isActive) throw unauthorized('Admin account is inactive');
  if (admin.tokenVersion !== payload.ver) throw unauthorized('Refresh token has been revoked');

  return ok(c, { accessToken: await signAccessToken(c.env, admin), refreshToken: await signRefreshToken(c.env, admin) });
});

// Everything below needs an admin token.
app.use('*', requireAdmin);

/** Bumps `tokenVersion`, which invalidates every refresh token for this admin. */
app.post('/auth/logout', async (c) => {
  const admin = c.get('admin');
  await update(c.env.DB, 'adminUsers', admin, { tokenVersion: (admin.tokenVersion || 0) + 1 });
  return ok(c, { loggedOut: true });
});

app.post('/auth/change-password', async (c) => {
  const admin = c.get('admin');
  const { currentPassword, newPassword } = await body(c, changePasswordSchema);
  if (!(await verifyPassword(currentPassword, admin.passwordHash))) throw unauthorized('Current password is incorrect');

  await update(c.env.DB, 'adminUsers', admin, {
    passwordHash: await hashPassword(newPassword),
    tokenVersion: (admin.tokenVersion || 0) + 1,
  });
  audit(c, { action: 'change-password', collectionName: 'adminUsers', docId: admin.id });
  return ok(c, { changed: true });
});

app.get('/me', (c) => ok(c, publicAdmin(c.get('admin'))));

/* ------------------------------------------------------------- dashboard */

app.get('/dashboard', async (c) => {
  const db = c.env.DB;
  const day = 24 * 60 * 60 * 1000;
  const weekAgo = new Date(Date.now() - 7 * day).toISOString();
  const dayAgo = new Date(Date.now() - day).toISOString();

  const { results } = await db
    .prepare('SELECT collection, is_published, COUNT(*) AS n FROM docs WHERE deleted_at IS NULL GROUP BY collection, is_published')
    .all();
  const tally = (coll, published) => results.find((r) => r.collection === coll && r.is_published === published)?.n ?? 0;

  const content = contentRegistry.map((e) => ({ key: e.key, label: e.label, published: tally(e.coll, 1), drafts: tally(e.coll, 0) }));
  const live = [['deletedAt', 'null']];

  const [total, newThisWeek, activeToday, recentEdits] = await Promise.all([
    count(db, 'users', live),
    count(db, 'users', [...live, ['createdAt', 'gte', weekAgo]]),
    count(db, 'users', [...live, ['lastSeenAt', 'gte', dayAgo]]),
    find(db, 'auditLogs', { sort: [['at', -1]], limit: 15 }),
  ]);

  return ok(c, {
    users: { total, newThisWeek, activeToday },
    content,
    totalDrafts: content.reduce((sum, e) => sum + e.drafts, 0),
    recentEdits,
  });
});

/* ---------------------------------------------------------------- admins */

const adminCreateSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().trim().min(2),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(ADMIN_ROLES).default('editor'),
});
const adminUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  role: z.enum(ADMIN_ROLES).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

// Managing admins is superadmin-only for every verb below.
app.use('/admins/*', requireRole('superadmin'));
app.use('/admins', requireRole('superadmin'));

app.get('/admins', async (c) => ok(c, (await find(c.env.DB, 'adminUsers', { sort: [['createdAt', 1]] })).map(publicAdmin)));

app.post('/admins', async (c) => {
  const { password, ...rest } = await body(c, adminCreateSchema);
  if (await findOne(c.env.DB, 'adminUsers', [['email', 'eq', rest.email]])) throw conflict('Duplicate value for email');

  const admin = await insert(c.env.DB, 'adminUsers', {
    ...rest,
    passwordHash: await hashPassword(password),
    isActive: true,
    tokenVersion: 0,
  });
  audit(c, { action: 'create', collectionName: 'adminUsers', docId: admin.id, diff: rest });
  return created(c, publicAdmin(admin));
});

app.patch('/admins/:id', async (c) => {
  const self = c.get('admin');
  const admin = await get(c.env.DB, 'adminUsers', c.req.param('id'));
  if (!admin) throw notFound('Admin not found');

  const { password, ...rest } = await body(c, adminUpdateSchema);

  // Guard against locking everyone out of the panel.
  if (admin.id === self.id) {
    if (rest.isActive === false) throw badRequest('You cannot deactivate your own account');
    if (rest.role && rest.role !== 'superadmin') throw badRequest('You cannot demote your own account');
  }

  const patch = { ...rest };
  if (password) {
    patch.passwordHash = await hashPassword(password);
    patch.tokenVersion = (admin.tokenVersion || 0) + 1;
  }
  const saved = await update(c.env.DB, 'adminUsers', admin, patch);

  audit(c, { action: 'update', collectionName: 'adminUsers', docId: admin.id, diff: rest });
  return ok(c, publicAdmin(saved));
});

app.delete('/admins/:id', async (c) => {
  const id = c.req.param('id');
  if (id === c.get('admin').id) throw badRequest('You cannot delete your own account');

  const admin = await get(c.env.DB, 'adminUsers', id);
  if (!admin) throw notFound('Admin not found');

  const remaining = await count(c.env.DB, 'adminUsers', [['role', 'eq', 'superadmin'], ['isActive', 'eq', 1], ['id', 'ne', id]]);
  if (admin.role === 'superadmin' && remaining === 0) throw badRequest('At least one active superadmin must remain');

  if (c.req.query('hard') === 'true') {
    await removeWhere(c.env.DB, 'adminUsers', [['id', 'eq', id]]);
    audit(c, { action: 'delete', collectionName: 'adminUsers', docId: id });
    return ok(c, { id, deleted: 'permanent' });
  }

  // Deactivate rather than delete, so audit-log entries keep a resolvable author.
  await update(c.env.DB, 'adminUsers', admin, { isActive: false, tokenVersion: (admin.tokenVersion || 0) + 1 });
  audit(c, { action: 'deactivate', collectionName: 'adminUsers', docId: id });
  return ok(c, { id, isActive: false });
});

/* ----------------------------------------------------------------- upload */

const UPLOAD_TYPES = {
  audio: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-m4a'],
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  videos: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'],
};
const MAX_UPLOAD = 50 * 1024 * 1024;

app.post('/upload', async (c) => {
  if (!c.env.BUCKET) throw unavailable('Object storage is not configured on this server');

  const form = await c.req.parseBody();
  const file = form.file;
  if (!(file instanceof File)) throw badRequest("Send the file in a 'file' multipart field");
  if (file.size > MAX_UPLOAD) throw new ApiError(413, 'Payload too large');

  const folder = UPLOAD_TYPES[form.folder] ? form.folder : 'images';
  if (!UPLOAD_TYPES[folder].includes(file.type)) throw badRequest(`${file.type} is not allowed in '${folder}'`);

  const ext = (file.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
  const key = `${folder}/${Date.now()}-${newId()}${ext}`;
  await c.env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
  });

  const base = c.env.R2_PUBLIC_URL ? c.env.R2_PUBLIC_URL.replace(/\/$/, '') : `${new URL(c.req.url).origin}/media`;
  audit(c, { action: 'upload', collectionName: 'media', docId: key });
  return ok(c, { key, url: `${base}/${key}`, size: file.size, mimeType: file.type });
});

app.delete('/upload', async (c) => {
  if (!c.env.BUCKET) throw unavailable('Object storage is not configured on this server');
  const key = String(c.req.query('key') || '').trim();
  if (!key) throw badRequest("Query param 'key' is required");

  await c.env.BUCKET.delete(key);
  audit(c, { action: 'delete-upload', collectionName: 'media', docId: key });
  return ok(c, { key, deleted: true });
});

/* --------------------------------------------------- settings + force update */

const optUrl = z.string().url().optional().or(z.literal(''));
const settingsSchema = z
  .object({
    highlightedRitual: z.enum(RITUAL_TYPES).optional(),
    announcement: locOptional,
    announcementIsActive: z.boolean().optional(),
    banners: z
      .array(
        z.object({
          key: z.string().trim().min(1),
          title: locRequired,
          subtitle: locOptional,
          imageUrl: optUrl,
          actionRoute: z.string().trim().optional(),
          order: z.number().int().optional(),
          isActive: z.boolean().optional(),
        }),
      )
      .optional(),
    quickActions: z
      .array(
        z.object({
          key: z.string().trim().min(1),
          label: locRequired,
          iconEmoji: z.string().trim().optional(),
          route: z.string().trim().optional(),
          order: z.number().int().optional(),
          isActive: z.boolean().optional(),
        }),
      )
      .optional(),
    featureFlags: z.record(z.boolean()).optional(),
    supportEmail: z.string().email().optional().or(z.literal('')),
    supportPhone: z.string().trim().optional(),
    privacyPolicyUrl: optUrl,
    termsUrl: optUrl,
  })
  .strict();

/** Accepts `1.2.3` or `1.2.3+45` — matches Flutter's pubspec version format. */
const version = z.string().regex(/^\d+\.\d+\.\d+(\+\d+)?$/, 'must look like 1.2.3 or 1.2.3+45');
const forceUpdateSchema = z.object({
  minVersion: version,
  latestVersion: version,
  storeUrl: z.string().url(),
  message: locOptional,
  isMandatory: z.boolean().optional(),
});

app.get('/settings', async (c) => ok(c, await getSettings(c.env.DB)));

app.put('/settings', async (c) => {
  const patch = await body(c, settingsSchema);
  const doc = await update(c.env.DB, 'appSettings', await getSettings(c.env.DB), patch);
  audit(c, { action: 'update', collectionName: 'appSettings', docId: doc.id, diff: patch });
  return ok(c, doc);
});

app.get('/force-update', async (c) => ok(c, await find(c.env.DB, 'forceUpdate', { sort: [['platform', 1]] })));

app.put('/force-update/:platform', async (c) => {
  const platform = c.req.param('platform').toLowerCase();
  if (!PLATFORMS.includes(platform)) throw badRequest("platform must be 'android' or 'ios'");

  const patch = await body(c, forceUpdateSchema);
  const existing = await get(c.env.DB, 'forceUpdate', platform);
  const doc = existing
    ? await update(c.env.DB, 'forceUpdate', existing, patch)
    : await insert(c.env.DB, 'forceUpdate', { platform, isMandatory: false, ...patch }, { id: platform });

  audit(c, { action: 'update', collectionName: 'forceUpdate', docId: doc.id, diff: patch });
  return ok(c, doc);
});

/* ----------------------------------------------------------------- users */

/** Read-only. Admins can look at pilgrims, never edit their data. */
app.get('/users', async (c) => {
  const q = c.req.query();
  const { page, limit, skip } = pagination(q);
  const where = [['deletedAt', 'null']];

  const search = String(q.search || '').trim();
  if (search) where.push(['or', [['email', 'like', search], ['displayName', 'like', search], ['firebaseUid', 'eq', search]]]);
  if (q.platform) where.push(['platform', 'eq', q.platform]);

  const [items, total] = await Promise.all([
    find(c.env.DB, 'users', { where, sort: [['createdAt', -1]], limit, offset: skip }),
    count(c.env.DB, 'users', where),
  ]);
  return ok(c, items.map(hideUser), listMeta(page, limit, total));
});

app.get('/users/:id', async (c) => {
  const db = c.env.DB;
  const user = await get(db, 'users', c.req.param('id'));
  if (!user) throw notFound('User not found');

  const mine = [['userId', 'eq', user.id]];
  const [progress, bookmarkCount, checklist, tent, preferences] = await Promise.all([
    find(db, 'userProgress', { where: mine }),
    count(db, 'userBookmarks', mine),
    findOne(db, 'userChecklist', mine),
    findOne(db, 'userTent', mine),
    findOne(db, 'userPreferences', mine),
  ]);

  return ok(c, {
    user: hideUser(user),
    progress,
    bookmarkCount,
    checkedItems: checklist?.checkedKeys?.length ?? 0,
    hasTent: Boolean(tent),
    preferences,
  });
});

/* ------------------------------------------------------- content CRUD */

const reorderSchema = z.object({ ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1) });

async function assertUnique(db, entry, doc) {
  for (const fields of entry.unique || []) {
    const where = [['deletedAt', 'null'], ['id', 'ne', doc.id ?? ''], ...fields.map((f) => [f, 'eq', doc[f] ?? null])];
    if (await findOne(db, entry.coll, where)) throw conflict(`Duplicate value for ${fields.join(', ')}`);
  }
}

/**
 * Standard admin CRUD surface for one content collection described in
 * `registry.js`: list with search + paging, soft delete, restore, reorder, audit.
 */
function crud(entry) {
  const r = new Hono();
  const { coll, schema, label } = entry;
  const updateSchema = schema.partial();

  r.get('/', async (c) => {
    const q = c.req.query();
    const { page, limit, skip } = pagination(q);
    const where = [];

    if (q.includeDeleted !== 'true') where.push(['deletedAt', 'null']);
    if (q.isPublished === 'true') where.push(['isPublished', 'eq', 1]);
    if (q.isPublished === 'false') where.push(['isPublished', 'eq', 0]);
    // Registry filters are reused so the admin list can narrow the same way the app does.
    where.push(...entry.filter(q));

    const search = String(q.search || '').trim();
    if (search && entry.searchFields.length) where.push(['or', entry.searchFields.map((f) => [f, 'like', search])]);

    const [items, total] = await Promise.all([
      find(c.env.DB, coll, { where, sort: entry.sort, limit, offset: skip }),
      count(c.env.DB, coll, where),
    ]);
    return ok(c, items, listMeta(page, limit, total));
  });

  // Registered before `/:id` so "reorder" is never read as an id.
  r.post('/reorder', async (c) => {
    const { ids } = await body(c, reorderSchema);
    const now = new Date().toISOString();
    const stmts = ids.map((id, index) =>
      c.env.DB
        .prepare("UPDATE docs SET data = json_set(data,'$.order',?), updated_at = ? WHERE collection = ? AND id = ?")
        .bind(index, now, coll, id),
    );
    const results = await c.env.DB.batch(stmts);
    const modified = results.reduce((sum, res) => sum + res.meta.changes, 0);
    audit(c, { action: 'reorder', collectionName: entry.key, diff: { ids } });
    return ok(c, { matched: modified, modified });
  });

  r.get('/:id', async (c) => {
    const doc = await get(c.env.DB, coll, c.req.param('id'));
    if (!doc) throw notFound(`${label} not found`);
    return ok(c, doc);
  });

  r.post('/', async (c) => {
    const data = await body(c, schema);
    const doc = { ...baseDefaults(), ...entry.defaults(), ...data };
    entry.check?.(doc);
    await assertUnique(c.env.DB, entry, doc);

    const saved = await insert(c.env.DB, coll, doc);
    audit(c, { action: 'create', collectionName: entry.key, docId: saved.id, diff: data });
    return created(c, saved);
  });

  r.patch('/:id', async (c) => {
    const doc = await get(c.env.DB, coll, c.req.param('id'));
    if (!doc) throw notFound(`${label} not found`);

    const patch = await body(c, updateSchema);
    const next = { ...doc, ...patch };
    entry.check?.(next);
    await assertUnique(c.env.DB, entry, next);

    const saved = await update(c.env.DB, coll, doc, patch);
    audit(c, { action: 'update', collectionName: entry.key, docId: doc.id, diff: patch });
    return ok(c, saved);
  });

  r.delete('/:id', async (c) => {
    const doc = await get(c.env.DB, coll, c.req.param('id'));
    if (!doc) throw notFound(`${label} not found`);

    if (c.req.query('hard') === 'true') {
      // Permanent. The app can no longer learn about the removal via /sync.
      await removeWhere(c.env.DB, coll, [['id', 'eq', doc.id]]);
      audit(c, { action: 'hard-delete', collectionName: entry.key, docId: doc.id });
      return ok(c, { id: doc.id, deleted: 'permanent' });
    }

    await update(c.env.DB, coll, doc, { deletedAt: new Date().toISOString(), isPublished: false });
    audit(c, { action: 'delete', collectionName: entry.key, docId: doc.id });
    return ok(c, { id: doc.id, deleted: 'soft' });
  });

  r.post('/:id/restore', async (c) => {
    const doc = await get(c.env.DB, coll, c.req.param('id'));
    if (!doc) throw notFound(`${label} not found`);

    await assertUnique(c.env.DB, entry, { ...doc, deletedAt: null });
    const saved = await update(c.env.DB, coll, doc, { deletedAt: null, isPublished: true });
    audit(c, { action: 'restore', collectionName: entry.key, docId: doc.id });
    return ok(c, saved);
  });

  return r;
}

for (const entry of contentRegistry) app.route(`/${entry.key}`, crud(entry));

export default app;
