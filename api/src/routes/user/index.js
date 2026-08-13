import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import {
  User,
  UserProgress,
  UserBookmark,
  UserChecklist,
  UserTent,
  UserPreferences,
} from '../../models/index.js';
import { RITUAL_TYPES, BOOKMARK_TYPES } from '../../models/shared.js';
import { deleteFirebaseUser } from '../../config/firebase.js';
import { requireFirebase, requireUser } from '../../middleware/auth.firebase.js';
import { userLimiter } from '../../middleware/rateLimit.js';
import { noCache } from '../../middleware/cache.js';
import { validate } from '../../middleware/validate.js';
import { ok, created, noContent, asyncHandler } from '../../utils/http.js';
import ApiError from '../../utils/ApiError.js';

const router = Router();
router.use(noCache, userLimiter);

/* ------------------------------------------------------------- validation */

const profileSchema = z.object({
  displayName: z.string().trim().max(120).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  language: z.enum(['ml', 'en', 'ar']).optional(),
  platform: z.enum(['android', 'ios']).optional(),
  appVersion: z.string().trim().max(20).optional(),
  fcmToken: z.string().trim().optional(),
});

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  fontScale: z.number().min(0.8).max(2).optional(),
  arabicFontSize: z.number().int().min(14).max(60).optional(),
  language: z.enum(['ml', 'en', 'ar']).optional(),
  notificationsEnabled: z.boolean().optional(),
});

const objectIdList = z.array(z.string().regex(/^[0-9a-fA-F]{24}$/));

const progressSchema = z.object({
  completedStepIds: objectIdList.default([]),
  currentStepIndex: z.number().int().min(0).optional(),
  /**
   * `merge` (default) unions with what the server already has, so progress made
   * on another device survives. `replace` is for a deliberate reset from the app.
   */
  mode: z.enum(['merge', 'replace']).default('merge'),
});

const bookmarkSchema = z.object({
  itemType: z.enum(BOOKMARK_TYPES),
  itemId: z.string().trim().min(1),
});

const checklistSchema = z.object({
  checkedKeys: z.array(z.string().trim().min(1)).default([]),
  /** Unticking an item only takes effect in `replace` mode — see progress note. */
  mode: z.enum(['merge', 'replace']).default('merge'),
});

const tentSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  address: z.string().trim().max(300).optional(),
  note: z.string().trim().max(300).optional(),
});

/* ---------------------------------------------------------------- profile */

/** Called right after Firebase sign-in. Creates the record on first login. */
router.post(
  '/',
  requireFirebase,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const { uid, email, name, picture, firebase } = req.firebase;

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        $set: {
          email: req.body.email || email,
          displayName: req.body.displayName || name,
          photoUrl: req.body.photoUrl || picture,
          provider: firebase?.sign_in_provider,
          lastSeenAt: new Date(),
          deletedAt: null,
          ...pick(req.body, ['language', 'platform', 'appVersion', 'fcmToken']),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await UserPreferences.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id, language: user.language } },
      { upsert: true, setDefaultsOnInsert: true },
    );

    return created(res, user);
  }),
);

router.get(
  '/',
  requireUser,
  asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.user._id }, { $set: { lastSeenAt: new Date() } });
    return ok(res, req.user);
  }),
);

/**
 * Account deletion — required by the App Store. Removes all pilgrim data and the
 * Firebase account; the `users` row is kept as a tombstone (`deletedAt`) so an
 * in-flight token cannot silently resurrect a half-deleted profile.
 */
router.delete(
  '/',
  requireUser,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Promise.all([
      UserProgress.deleteMany({ userId }),
      UserBookmark.deleteMany({ userId }),
      UserChecklist.deleteMany({ userId }),
      UserTent.deleteMany({ userId }),
      UserPreferences.deleteMany({ userId }),
    ]);

    await User.updateOne(
      { _id: userId },
      { $set: { deletedAt: new Date(), email: null, displayName: null, photoUrl: null, fcmToken: null } },
    );

    await deleteFirebaseUser(req.user.firebaseUid);

    return noContent(res);
  }),
);

/* ------------------------------------------------------------ preferences */

router.get(
  '/preferences',
  requireUser,
  asyncHandler(async (req, res) => {
    const prefs = await UserPreferences.findOneAndUpdate(
      { userId: req.user._id },
      { $setOnInsert: { userId: req.user._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return ok(res, prefs);
  }),
);

router.patch(
  '/preferences',
  requireUser,
  validate(preferencesSchema),
  asyncHandler(async (req, res) => {
    const prefs = await UserPreferences.findOneAndUpdate(
      { userId: req.user._id },
      { $set: req.body, $setOnInsert: { userId: req.user._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    if (req.body.language) await User.updateOne({ _id: req.user._id }, { $set: { language: req.body.language } });
    return ok(res, prefs);
  }),
);

/* --------------------------------------------------------------- progress */

router.get(
  '/progress',
  requireUser,
  asyncHandler(async (req, res) => ok(res, await UserProgress.find({ userId: req.user._id }))),
);

router.put(
  '/progress/:ritualType',
  requireUser,
  validate(progressSchema),
  asyncHandler(async (req, res) => {
    const { ritualType } = req.params;
    if (!RITUAL_TYPES.includes(ritualType)) throw ApiError.badRequest("ritualType must be 'hajj' or 'umrah'");

    const { completedStepIds, currentStepIndex, mode } = req.body;
    const ids = completedStepIds.map((id) => new mongoose.Types.ObjectId(id));
    const filter = { userId: req.user._id, ritualType };

    if (mode === 'replace') {
      const doc = await UserProgress.findOneAndUpdate(
        filter,
        { $set: { completedStepIds: ids, currentStepIndex: currentStepIndex ?? 0 }, $setOnInsert: filter },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
      return ok(res, doc);
    }

    const existing = await UserProgress.findOne(filter);
    const merged = existing
      ? {
          completedStepIds: unionIds(existing.completedStepIds, ids),
          currentStepIndex: Math.max(existing.currentStepIndex ?? 0, currentStepIndex ?? 0),
        }
      : { completedStepIds: ids, currentStepIndex: currentStepIndex ?? 0 };

    const doc = await UserProgress.findOneAndUpdate(
      filter,
      { $set: merged, $setOnInsert: filter },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return ok(res, doc);
  }),
);

/* -------------------------------------------------------------- bookmarks */

router.get(
  '/bookmarks',
  requireUser,
  asyncHandler(async (req, res) => ok(res, await UserBookmark.find({ userId: req.user._id }).sort({ createdAt: -1 }))),
);

router.post(
  '/bookmarks',
  requireUser,
  validate(bookmarkSchema),
  asyncHandler(async (req, res) => {
    const filter = { userId: req.user._id, itemType: req.body.itemType, itemId: req.body.itemId };
    const doc = await UserBookmark.findOneAndUpdate(
      filter,
      { $setOnInsert: filter },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return created(res, doc);
  }),
);

/** `:id` is the bookmark's own id, or the bookmarked item's id — both work. */
router.delete(
  '/bookmarks/:id',
  requireUser,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const or = [{ itemId: id }];
    if (mongoose.isValidObjectId(id)) or.push({ _id: id });

    const result = await UserBookmark.deleteMany({ userId: req.user._id, $or: or });
    if (result.deletedCount === 0) throw ApiError.notFound('Bookmark not found');
    return noContent(res);
  }),
);

/* -------------------------------------------------------------- checklist */

router.get(
  '/checklist',
  requireUser,
  asyncHandler(async (req, res) => {
    const doc = await UserChecklist.findOneAndUpdate(
      { userId: req.user._id },
      { $setOnInsert: { userId: req.user._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return ok(res, doc);
  }),
);

router.put(
  '/checklist',
  requireUser,
  validate(checklistSchema),
  asyncHandler(async (req, res) => {
    const { checkedKeys, mode } = req.body;
    const filter = { userId: req.user._id };

    const update =
      mode === 'replace'
        ? { $set: { checkedKeys: [...new Set(checkedKeys)] } }
        : { $addToSet: { checkedKeys: { $each: checkedKeys } } };

    const doc = await UserChecklist.findOneAndUpdate(
      filter,
      { ...update, $setOnInsert: filter },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return ok(res, doc);
  }),
);

/* ------------------------------------------------------------------- tent */

router.get(
  '/tent',
  requireUser,
  asyncHandler(async (req, res) => {
    const doc = await UserTent.findOne({ userId: req.user._id });
    if (!doc) throw ApiError.notFound('No tent saved');
    return ok(res, doc);
  }),
);

router.put(
  '/tent',
  requireUser,
  validate(tentSchema),
  asyncHandler(async (req, res) => {
    const filter = { userId: req.user._id };
    const doc = await UserTent.findOneAndUpdate(
      filter,
      { $set: { ...req.body, savedAt: new Date() }, $setOnInsert: filter },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return ok(res, doc);
  }),
);

router.delete(
  '/tent',
  requireUser,
  asyncHandler(async (req, res) => {
    await UserTent.deleteOne({ userId: req.user._id });
    return noContent(res);
  }),
);

/* --------------------------------------------------------------- helpers */

function pick(source, keys) {
  const out = {};
  for (const key of keys) if (source[key] !== undefined) out[key] = source[key];
  return out;
}

function unionIds(a, b) {
  const seen = new Map();
  for (const id of [...a, ...b]) seen.set(String(id), id);
  return [...seen.values()];
}

export default router;
