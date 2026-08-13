import { Router } from 'express';
import {
  User,
  UserProgress,
  UserBookmark,
  UserChecklist,
  UserTent,
  UserPreferences,
} from '../../models/index.js';
import { ok, asyncHandler, pagination } from '../../utils/http.js';
import ApiError from '../../utils/ApiError.js';

const router = Router();

/** Read-only. Admins can look at pilgrims, never edit their data. */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const filter = { deletedAt: null };

    const search = String(req.query.search || '').trim();
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ email: rx }, { displayName: rx }, { firebaseUid: search }];
    }
    if (req.query.platform) filter.platform = req.query.platform;

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) || 1 });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound('User not found');

    const [progress, bookmarks, checklist, tent, preferences] = await Promise.all([
      UserProgress.find({ userId: user._id }),
      UserBookmark.countDocuments({ userId: user._id }),
      UserChecklist.findOne({ userId: user._id }),
      UserTent.findOne({ userId: user._id }),
      UserPreferences.findOne({ userId: user._id }),
    ]);

    return ok(res, {
      user,
      progress,
      bookmarkCount: bookmarks,
      checkedItems: checklist?.checkedKeys?.length ?? 0,
      hasTent: Boolean(tent),
      preferences,
    });
  }),
);

export default router;
