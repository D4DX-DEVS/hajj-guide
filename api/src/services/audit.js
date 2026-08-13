import { AuditLog } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Fire-and-forget audit trail. A logging failure must never fail the request
 * that triggered it, so errors are swallowed after being logged.
 */
export function recordAudit(req, { action, collectionName, docId, diff }) {
  const entry = {
    adminId: req.admin?._id,
    adminEmail: req.admin?.email,
    action,
    collectionName,
    docId: docId ? String(docId) : undefined,
    diff,
    ip: req.ip,
  };

  AuditLog.create(entry).catch((err) => logger.warn({ err, entry }, 'failed to write audit log'));
}

export default recordAudit;
