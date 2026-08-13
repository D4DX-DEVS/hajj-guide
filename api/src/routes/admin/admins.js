import { Router } from 'express';
import { z } from 'zod';
import { AdminUser, ADMIN_ROLES } from '../../models/index.js';
import { requireRole } from '../../middleware/auth.admin.js';
import { validate } from '../../middleware/validate.js';
import { ok, created, asyncHandler } from '../../utils/http.js';
import ApiError from '../../utils/ApiError.js';
import { recordAudit } from '../../services/audit.js';

const router = Router();

// Managing admins is superadmin-only for every verb in this router.
router.use(requireRole('superadmin'));

const createSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().trim().min(2),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(ADMIN_ROLES).default('editor'),
});

const updateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  role: z.enum(ADMIN_ROLES).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

router.get(
  '/',
  asyncHandler(async (_req, res) => ok(res, await AdminUser.find().sort({ createdAt: 1 }))),
);

router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { password, ...rest } = req.body;
    const admin = await AdminUser.create({ ...rest, passwordHash: await AdminUser.hashPassword(password) });

    recordAudit(req, { action: 'create', collectionName: 'adminUsers', docId: admin._id, diff: rest });
    return created(res, admin);
  }),
);

router.patch(
  '/:id',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const admin = await AdminUser.findById(req.params.id);
    if (!admin) throw ApiError.notFound('Admin not found');

    const { password, ...rest } = req.body;

    // Guard against locking everyone out of the panel.
    if (String(admin._id) === String(req.admin._id)) {
      if (rest.isActive === false) throw ApiError.badRequest('You cannot deactivate your own account');
      if (rest.role && rest.role !== 'superadmin') {
        throw ApiError.badRequest('You cannot demote your own account');
      }
    }

    admin.set(rest);
    if (password) {
      admin.passwordHash = await AdminUser.hashPassword(password);
      admin.tokenVersion += 1;
    }
    await admin.save();

    recordAudit(req, { action: 'update', collectionName: 'adminUsers', docId: admin._id, diff: rest });
    return ok(res, admin);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.admin._id)) {
      throw ApiError.badRequest('You cannot delete your own account');
    }

    const admin = await AdminUser.findById(req.params.id);
    if (!admin) throw ApiError.notFound('Admin not found');

    const remaining = await AdminUser.countDocuments({ role: 'superadmin', isActive: true, _id: { $ne: admin._id } });
    if (admin.role === 'superadmin' && remaining === 0) {
      throw ApiError.badRequest('At least one active superadmin must remain');
    }

    if (req.query.hard === 'true') {
      await admin.deleteOne();
      recordAudit(req, { action: 'delete', collectionName: 'adminUsers', docId: admin._id });
      return ok(res, { id: String(admin._id), deleted: 'permanent' });
    }

    // Deactivate rather than delete, so audit-log entries keep a resolvable author.
    admin.isActive = false;
    admin.tokenVersion += 1;
    await admin.save();

    recordAudit(req, { action: 'deactivate', collectionName: 'adminUsers', docId: admin._id });
    return ok(res, { id: String(admin._id), isActive: false });
  }),
);

export default router;
