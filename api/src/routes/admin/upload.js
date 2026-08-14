import { Router } from 'express';
import multer from 'multer';
import { uploadFile, deleteFile, storageReady } from '../../config/storage.js';
import { ok, asyncHandler } from '../../utils/http.js';
import ApiError from '../../utils/ApiError.js';
import { recordAudit } from '../../services/audit.js';

const router = Router();

const ALLOWED = {
  audio: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-m4a'],
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  videos: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'],
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
});

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!storageReady()) throw ApiError.unavailable('Object storage is not configured on this server');
    if (!req.file) throw ApiError.badRequest("Send the file in a 'file' multipart field");

    const folder = ALLOWED[req.body.folder] ? req.body.folder : 'images';
    if (!ALLOWED[folder].includes(req.file.mimetype)) {
      throw ApiError.badRequest(`${req.file.mimetype} is not allowed in '${folder}'`);
    }

    const result = await uploadFile(req.file, folder);
    recordAudit(req, { action: 'upload', collectionName: 'media', docId: result.key });
    return ok(res, result);
  }),
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const key = String(req.query.key || '').trim();
    if (!key) throw ApiError.badRequest("Query param 'key' is required");

    await deleteFile(key);
    recordAudit(req, { action: 'delete-upload', collectionName: 'media', docId: key });
    return ok(res, { key, deleted: true });
  }),
);

export default router;
