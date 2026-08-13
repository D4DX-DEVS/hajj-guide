import { Router } from 'express';
import { contentRegistry } from '../../content/registry.js';
import { User, AuditLog } from '../../models/index.js';
import { ok, asyncHandler } from '../../utils/http.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const contentCounts = await Promise.all(
      contentRegistry.map(async (entry) => {
        const [published, drafts] = await Promise.all([
          entry.model.countDocuments({ isPublished: true, deletedAt: null }),
          entry.model.countDocuments({ isPublished: false, deletedAt: null }),
        ]);
        return { key: entry.key, label: entry.label, published, drafts };
      }),
    );

    const [totalUsers, newThisWeek, activeToday, recentEdits] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ deletedAt: null, createdAt: { $gte: weekAgo } }),
      User.countDocuments({ deletedAt: null, lastSeenAt: { $gte: dayAgo } }),
      AuditLog.find().sort({ at: -1 }).limit(15),
    ]);

    return ok(res, {
      users: { total: totalUsers, newThisWeek, activeToday },
      content: contentCounts,
      totalDrafts: contentCounts.reduce((sum, c) => sum + c.drafts, 0),
      recentEdits,
    });
  }),
);

export default router;
