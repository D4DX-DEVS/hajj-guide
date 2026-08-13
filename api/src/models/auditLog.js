import mongoose from 'mongoose';
import { applyJsonTransform } from './shared.js';

const schema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', index: true },
    adminEmail: { type: String, trim: true },
    action: { type: String, required: true },
    collectionName: { type: String, required: true, index: true },
    docId: { type: String },
    diff: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    at: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false },
);

applyJsonTransform(schema);

export const AuditLog = mongoose.model('AuditLog', schema);
export default AuditLog;
