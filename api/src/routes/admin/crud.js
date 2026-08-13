import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { ok, created, asyncHandler, pagination } from '../../utils/http.js';
import ApiError from '../../utils/ApiError.js';
import { recordAudit } from '../../services/audit.js';

const reorderSchema = z.object({
  ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1),
});

/**
 * Builds the standard admin CRUD surface for one content collection described in
 * `content/registry.js`. Every content type gets the same behaviour: list with
 * search + paging, soft delete, restore, drag-to-reorder, and an audit entry.
 */
export function crudRouter(entry) {
  const router = Router();
  const { model, schema, label, sort, searchFields } = entry;
  const updateSchema = schema.partial();

  /* ------------------------------------------------------------------ list */
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { page, limit, skip } = pagination(req.query);
      const filter = {};

      if (req.query.includeDeleted !== 'true') filter.deletedAt = null;
      if (req.query.isPublished === 'true') filter.isPublished = true;
      if (req.query.isPublished === 'false') filter.isPublished = false;

      // Registry filters are reused so the admin list can narrow the same way the app does.
      Object.assign(filter, entry.publicFilter(req.query));

      const search = String(req.query.search || '').trim();
      if (search && searchFields.length) {
        const rx = new RegExp(escapeRegex(search), 'i');
        filter.$or = searchFields.map((field) => ({ [field]: rx }));
      }

      const [items, total] = await Promise.all([
        model.find(filter).sort(sort).skip(skip).limit(limit),
        model.countDocuments(filter),
      ]);

      return ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) || 1 });
    }),
  );

  /* ------------------------------------------------------------------- get */
  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await model.findById(req.params.id);
      if (!doc) throw ApiError.notFound(`${label} not found`);
      return ok(res, doc);
    }),
  );

  /* ---------------------------------------------------------------- create */
  router.post(
    '/',
    validate(schema),
    asyncHandler(async (req, res) => {
      const doc = await model.create(req.body);
      recordAudit(req, { action: 'create', collectionName: entry.key, docId: doc._id, diff: req.body });
      return created(res, doc);
    }),
  );

  /* ---------------------------------------------------------------- update */
  router.patch(
    '/:id',
    validate(updateSchema),
    asyncHandler(async (req, res) => {
      const doc = await model.findById(req.params.id);
      if (!doc) throw ApiError.notFound(`${label} not found`);

      doc.set(req.body);
      await doc.save();

      recordAudit(req, { action: 'update', collectionName: entry.key, docId: doc._id, diff: req.body });
      return ok(res, doc);
    }),
  );

  /* ---------------------------------------------------------------- delete */
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await model.findById(req.params.id);
      if (!doc) throw ApiError.notFound(`${label} not found`);

      if (req.query.hard === 'true') {
        // Permanent. The app can no longer learn about the removal via /sync.
        await doc.deleteOne();
        recordAudit(req, { action: 'hard-delete', collectionName: entry.key, docId: doc._id });
        return ok(res, { id: String(doc._id), deleted: 'permanent' });
      }

      doc.deletedAt = new Date();
      doc.isPublished = false;
      await doc.save();

      recordAudit(req, { action: 'delete', collectionName: entry.key, docId: doc._id });
      return ok(res, { id: String(doc._id), deleted: 'soft' });
    }),
  );

  /* --------------------------------------------------------------- restore */
  router.post(
    '/:id/restore',
    asyncHandler(async (req, res) => {
      const doc = await model.findById(req.params.id);
      if (!doc) throw ApiError.notFound(`${label} not found`);

      doc.deletedAt = null;
      doc.isPublished = true;
      await doc.save();

      recordAudit(req, { action: 'restore', collectionName: entry.key, docId: doc._id });
      return ok(res, doc);
    }),
  );

  /* --------------------------------------------------------------- reorder */
  router.post(
    '/reorder',
    validate(reorderSchema),
    asyncHandler(async (req, res) => {
      const operations = req.body.ids.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
      }));

      const result = await model.bulkWrite(operations);
      recordAudit(req, { action: 'reorder', collectionName: entry.key, diff: { ids: req.body.ids } });
      return ok(res, { matched: result.matchedCount, modified: result.modifiedCount });
    }),
  );

  return router;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default crudRouter;
