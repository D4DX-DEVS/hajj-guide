import { Router } from 'express';
import { contentRegistry } from '../../content/registry.js';
import { AppSettings, ForceUpdate } from '../../models/index.js';
import { ok, asyncHandler } from '../../utils/http.js';
import ApiError from '../../utils/ApiError.js';

const router = Router();

/**
 * `GET /api/v1/sync?since=<iso8601>` — everything that changed since the app
 * last synced. Powers the sqflite offline cache.
 *
 * `changed` holds documents the app should upsert; `deleted` holds ids it should
 * drop. A document that was unpublished counts as deleted from the app's point
 * of view, otherwise stale content would linger in the cache forever.
 *
 * Omit `since` for a full snapshot (first launch).
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { since } = req.query;
    let sinceDate = null;

    if (since) {
      sinceDate = new Date(since);
      if (Number.isNaN(sinceDate.getTime())) {
        throw ApiError.badRequest("Query param 'since' must be an ISO-8601 timestamp");
      }
    }

    const now = new Date();
    const window = sinceDate ? { updatedAt: { $gt: sinceDate } } : {};

    const changed = {};
    const deleted = {};

    await Promise.all(
      contentRegistry.map(async (entry) => {
        const [live, gone] = await Promise.all([
          entry.model
            .find({ ...window, isPublished: true, deletedAt: null })
            .sort(entry.sort)
            .lean(),
          sinceDate
            ? entry.model
                .find({ ...window, $or: [{ deletedAt: { $ne: null } }, { isPublished: false }] })
                .select('_id')
                .lean()
            : [],
        ]);

        changed[entry.syncKey] = live.map(({ _id, __v, ...rest }) => ({ id: String(_id), ...rest }));
        deleted[entry.syncKey] = gone.map((d) => String(d._id));
      }),
    );

    const [settings, forceUpdates] = await Promise.all([
      AppSettings.getSingleton(),
      ForceUpdate.find(window).lean(),
    ]);

    return ok(res, {
      since: sinceDate ? sinceDate.toISOString() : null,
      now: now.toISOString(),
      full: !sinceDate,
      settings,
      forceUpdate: forceUpdates.map(({ _id, __v, ...rest }) => ({ id: String(_id), ...rest })),
      changed,
      deleted,
    });
  }),
);

export default router;
