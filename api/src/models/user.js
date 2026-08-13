import mongoose from 'mongoose';
import { applyJsonTransform, PLATFORMS } from './shared.js';

const schema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    displayName: { type: String, trim: true },
    photoUrl: { type: String, trim: true },
    provider: { type: String, trim: true },
    language: { type: String, enum: ['ml', 'en', 'ar'], default: 'ml' },
    platform: { type: String, enum: PLATFORMS },
    appVersion: { type: String, trim: true },
    fcmToken: { type: String, trim: true },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

applyJsonTransform(schema, { hide: ['fcmToken'] });

export const User = mongoose.model('User', schema);
export default User;
