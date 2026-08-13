import { Router } from 'express';
import { contentRegistry } from '../../content/registry.js';
import { AppSettings, ForceUpdate } from '../../models/index.js';
import { ok, asyncHandler } from '../../utils/http.js';
import ApiError from '../../utils/ApiError.js';
import { publicCache } from '../../middleware/cache.js';
import syncRouter from './sync.js';

const router = Router();

router.use(publicCache(300));

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const LIVE = { isPublished: true, deletedAt: null };

/* ------------------------------------------------------------- singletons */

router.get(
  '/settings',
  asyncHandler(async (_req, res) => ok(res, await AppSettings.getSingleton())),
);

router.get(
  '/force-update',
  asyncHandler(async (req, res) => {
    const platform = String(req.query.platform || '').toLowerCase();
    if (!['android', 'ios'].includes(platform)) {
      throw ApiError.badRequest("Query param 'platform' must be 'android' or 'ios'");
    }
    const doc = await ForceUpdate.findOne({ platform });
    if (!doc) throw ApiError.notFound(`No force-update record for ${platform}`);
    return ok(res, doc);
  }),
);

/* ------------------------------------------------ generic content endpoints */

for (const entry of contentRegistry) {
  router.get(
    `/${entry.key}`,
    asyncHandler(async (req, res) => {
      const filter = { ...LIVE, ...entry.publicFilter(req.query) };
      const docs = await entry.model.find(filter).sort(entry.sort).lean({ virtuals: true });
      return ok(res, docs.map(toJson));
    }),
  );

  router.get(
    `/${entry.key}/:idOrSlug`,
    asyncHandler(async (req, res) => {
      const { idOrSlug } = req.params;
      const hasSlug = Boolean(entry.model.schema.path('slug'));

      const filter = OBJECT_ID.test(idOrSlug)
        ? { _id: idOrSlug }
        : hasSlug
          ? { slug: idOrSlug.toLowerCase() }
          : null;

      if (!filter) throw ApiError.badRequest('Invalid id');

      const doc = await entry.model.findOne({ ...filter, ...LIVE });
      if (!doc) throw ApiError.notFound(`${entry.label} not found`);
      return ok(res, doc);
    }),
  );
}

router.use('/sync', syncRouter);

/** `.lean()` skips the schema's toJSON transform, so map `_id` -> `id` by hand. */
function toJson(doc) {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export { toJson };
export default router;
