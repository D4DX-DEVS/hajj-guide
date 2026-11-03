/**
 * Document store on D1. Every collection lives in the single `docs` table; the
 * JSON body is in `data`. Field names passed to `col()` come from code, never
 * from request input, so interpolating them into SQL is safe.
 */
const COLS = { id: 'id', isPublished: 'is_published', deletedAt: 'deleted_at', updatedAt: 'updated_at', createdAt: 'created_at' };
export const col = (f) => COLS[f] ?? `json_extract(data,'$.${f}')`;

export const rand = (bytes) => [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
/** 24 hex chars, same shape as the Mongo ObjectIds the app and admin panel already pass around. */
export const newId = () => rand(12);

const bind = (v) => (typeof v === 'boolean' ? Number(v) : v);

/** A condition is [field, op, value] — ops: eq ne in gt gte like null nnull — or ['or', conds]. */
function cond([f, op, v]) {
  if (f === 'or') {
    const parts = op.map(cond);
    return [`(${parts.map((p) => p[0]).join(' OR ')})`, parts.flatMap((p) => p[1])];
  }
  switch (op) {
    case 'eq': return v === null ? [`${col(f)} IS NULL`, []] : [`${col(f)} = ?`, [v]];
    case 'ne': return [`${col(f)} != ?`, [v]];
    case 'in': return [`${col(f)} IN (${v.map(() => '?').join(',')})`, v];
    case 'gt': return [`${col(f)} > ?`, [v]];
    case 'gte': return [`${col(f)} >= ?`, [v]];
    case 'like': return [`${col(f)} LIKE ? ESCAPE '\\'`, [`%${String(v).replace(/[\\%_]/g, '\\$&')}%`]];
    case 'null': return [`${col(f)} IS NULL`, []];
    case 'nnull': return [`${col(f)} IS NOT NULL`, []];
    default: throw new Error(`unknown op ${op}`);
  }
}

function build(coll, where = []) {
  const parts = where.map(cond);
  return {
    sql: ['collection = ?', ...parts.map((p) => p[0])].join(' AND '),
    params: [coll, ...parts.flatMap((p) => p[1])].map(bind),
  };
}

const toDoc = (r) => ({ id: r.id, ...JSON.parse(r.data), createdAt: r.created_at, updatedAt: r.updated_at });

export async function find(db, coll, { where = [], sort = [], limit, offset = 0 } = {}) {
  const w = build(coll, where);
  const order = [...sort.map(([f, d]) => `${col(f)} ${d < 0 ? 'DESC' : 'ASC'}`), 'id'].join(', ');
  const paging = limit ? ' LIMIT ? OFFSET ?' : '';
  const { results } = await db
    .prepare(`SELECT * FROM docs WHERE ${w.sql} ORDER BY ${order}${paging}`)
    .bind(...w.params, ...(limit ? [limit, offset] : []))
    .all();
  return results.map(toDoc);
}

export async function findOne(db, coll, where) {
  return (await find(db, coll, { where, limit: 1 }))[0] ?? null;
}

export const get = (db, coll, id) => findOne(db, coll, [['id', 'eq', id]]);

export async function count(db, coll, where = []) {
  const w = build(coll, where);
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM docs WHERE ${w.sql}`).bind(...w.params).first();
  return row.n;
}

/** INSERT OR REPLACE for a full doc (`id` required). */
export function putStmt(db, coll, doc, verb = 'INSERT OR REPLACE') {
  const now = new Date().toISOString();
  const { id, createdAt, updatedAt, ...data } = doc;
  return db
    .prepare(`${verb} INTO docs (collection,id,data,is_published,deleted_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`)
    .bind(coll, id, JSON.stringify(data), data.isPublished ? 1 : 0, data.deletedAt ?? null, createdAt ?? now, updatedAt ?? now);
}

export async function insert(db, coll, doc, { id = newId(), ignore = false } = {}) {
  const now = new Date().toISOString();
  const full = { ...doc, id, createdAt: now, updatedAt: now };
  await putStmt(db, coll, full, ignore ? 'INSERT OR IGNORE' : 'INSERT OR REPLACE').run();
  return ignore ? get(db, coll, id) : full;
}

/** Shallow-merges `patch` into the stored doc (Mongo `$set` semantics). */
export async function update(db, coll, doc, patch) {
  const next = { ...doc, ...patch, updatedAt: new Date().toISOString() };
  await putStmt(db, coll, next).run();
  return next;
}

export async function removeWhere(db, coll, where) {
  const w = build(coll, where);
  const res = await db.prepare(`DELETE FROM docs WHERE ${w.sql}`).bind(...w.params).run();
  return res.meta.changes;
}

/** Lazily creates the singleton settings doc. */
export async function getSettings(db) {
  return (
    (await get(db, 'appSettings', 'default')) ??
    insert(
      db,
      'appSettings',
      { highlightedRitual: 'umrah', announcementIsActive: false, banners: [], quickActions: [], featureFlags: {} },
      { id: 'default', ignore: true },
    )
  );
}
