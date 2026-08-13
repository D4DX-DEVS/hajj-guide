import { Router } from 'express';
import { z } from 'zod';
import { AdminUser } from '../../models/index.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  requireAdmin,
} from '../../middleware/auth.admin.js';
import { loginLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { ok, asyncHandler } from '../../utils/http.js';
import ApiError from '../../utils/ApiError.js';
import { recordAudit } from '../../services/audit.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const refreshSchema = z.object({ refreshToken: z.string().min(10) });

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, 'Password must be at least 10 characters'),
});

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const admin = await AdminUser.findOne({ email: req.body.email });

    // Same message for unknown email and wrong password — no account enumeration.
    const valid = admin && admin.isActive && (await admin.verifyPassword(req.body.password));
    if (!valid) throw ApiError.unauthorized('Invalid email or password');

    admin.lastLoginAt = new Date();
    await admin.save();

    return ok(res, {
      admin,
      accessToken: signAccessToken(admin),
      refreshToken: signRefreshToken(admin),
    });
  }),
);

router.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const payload = verifyRefreshToken(req.body.refreshToken);

    const admin = await AdminUser.findById(payload.sub);
    if (!admin || !admin.isActive) throw ApiError.unauthorized('Admin account is inactive');
    if (admin.tokenVersion !== payload.ver) throw ApiError.unauthorized('Refresh token has been revoked');

    return ok(res, { accessToken: signAccessToken(admin), refreshToken: signRefreshToken(admin) });
  }),
);

/** Bumps `tokenVersion`, which invalidates every refresh token for this admin. */
router.post(
  '/logout',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await AdminUser.updateOne({ _id: req.admin._id }, { $inc: { tokenVersion: 1 } });
    return ok(res, { loggedOut: true });
  }),
);

router.post(
  '/change-password',
  requireAdmin,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const admin = await AdminUser.findById(req.admin._id);
    if (!(await admin.verifyPassword(req.body.currentPassword))) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    admin.passwordHash = await AdminUser.hashPassword(req.body.newPassword);
    admin.tokenVersion += 1;
    await admin.save();

    recordAudit(req, { action: 'change-password', collectionName: 'adminUsers', docId: admin._id });
    return ok(res, { changed: true });
  }),
);

export default router;
