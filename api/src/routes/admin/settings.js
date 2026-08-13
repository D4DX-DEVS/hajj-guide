import { Router } from 'express';
import { z } from 'zod';
import { AppSettings, ForceUpdate } from '../../models/index.js';
import { RITUAL_TYPES, PLATFORMS } from '../../models/shared.js';
import { validate } from '../../middleware/validate.js';
import { ok, asyncHandler } from '../../utils/http.js';
import ApiError from '../../utils/ApiError.js';
import { recordAudit } from '../../services/audit.js';

const router = Router();

const localized = z
  .object({
    malayalam: z.string().trim().optional(),
    english: z.string().trim().optional(),
    arabic: z.string().trim().optional(),
  })
  .optional();

const settingsSchema = z
  .object({
    highlightedRitual: z.enum(RITUAL_TYPES).optional(),
    announcement: localized,
    announcementIsActive: z.boolean().optional(),
    banners: z
      .array(
        z.object({
          key: z.string().trim().min(1),
          title: z.object({ malayalam: z.string().trim().min(1), english: z.string().trim().optional(), arabic: z.string().trim().optional() }),
          subtitle: localized,
          imageUrl: z.string().url().optional().or(z.literal('')),
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
          label: z.object({ malayalam: z.string().trim().min(1), english: z.string().trim().optional(), arabic: z.string().trim().optional() }),
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
    privacyPolicyUrl: z.string().url().optional().or(z.literal('')),
    termsUrl: z.string().url().optional().or(z.literal('')),
  })
  .strict();

/** Accepts `1.2.3` or `1.2.3+45` — matches Flutter's pubspec version format. */
const version = z.string().regex(/^\d+\.\d+\.\d+(\+\d+)?$/, 'must look like 1.2.3 or 1.2.3+45');

const forceUpdateSchema = z.object({
  minVersion: version,
  latestVersion: version,
  storeUrl: z.string().url(),
  message: localized,
  isMandatory: z.boolean().optional(),
});

/* ----------------------------------------------------------- app settings */

router.get(
  '/settings',
  asyncHandler(async (_req, res) => ok(res, await AppSettings.getSingleton())),
);

router.put(
  '/settings',
  validate(settingsSchema),
  asyncHandler(async (req, res) => {
    const doc = await AppSettings.findOneAndUpdate(
      { singletonKey: 'default' },
      { $set: req.body, $setOnInsert: { singletonKey: 'default' } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );

    recordAudit(req, { action: 'update', collectionName: 'appSettings', docId: doc._id, diff: req.body });
    return ok(res, doc);
  }),
);

/* ----------------------------------------------------------- force update */

router.get(
  '/force-update',
  asyncHandler(async (_req, res) => ok(res, await ForceUpdate.find().sort({ platform: 1 }))),
);

router.put(
  '/force-update/:platform',
  validate(forceUpdateSchema),
  asyncHandler(async (req, res) => {
    const platform = String(req.params.platform).toLowerCase();
    if (!PLATFORMS.includes(platform)) throw ApiError.badRequest("platform must be 'android' or 'ios'");

    const doc = await ForceUpdate.findOneAndUpdate(
      { platform },
      { $set: req.body, $setOnInsert: { platform } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );

    recordAudit(req, { action: 'update', collectionName: 'forceUpdate', docId: doc._id, diff: req.body });
    return ok(res, doc);
  }),
);

export default router;
