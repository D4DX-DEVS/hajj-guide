import { Router } from 'express';
import { contentRegistry } from '../../content/registry.js';
import { requireAdmin } from '../../middleware/auth.admin.js';
import { noCache } from '../../middleware/cache.js';
import { ok } from '../../utils/http.js';
import authRouter from './auth.js';
import settingsRouter from './settings.js';
import uploadRouter from './upload.js';
import usersRouter from './users.js';
import dashboardRouter from './dashboard.js';
import adminsRouter from './admins.js';
import { crudRouter } from './crud.js';

const router = Router();
router.use(noCache);

// Login / refresh are the only unauthenticated admin routes.
router.use('/auth', authRouter);
// Pilgrim GET routes (list + detail) are public — mounted before requireAdmin.
router.use('/users', usersRouter);

router.use(requireAdmin);

router.get('/me', (req, res) => ok(res, req.admin));
router.use('/dashboard', dashboardRouter);
router.use('/admins', adminsRouter);
router.use('/upload', uploadRouter);
router.use('/', settingsRouter);

for (const entry of contentRegistry) {
  router.use(`/${entry.key}`, crudRouter(entry));
}

export default router;
