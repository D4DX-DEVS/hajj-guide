import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { applyJsonTransform } from './shared.js';

export const ADMIN_ROLES = ['superadmin', 'editor'];

const schema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ADMIN_ROLES, default: 'editor' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    /** Bumped on logout / password change so old refresh tokens stop working. */
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

applyJsonTransform(schema, { hide: ['passwordHash', 'tokenVersion'] });

schema.statics.hashPassword = (plain) => bcrypt.hash(plain, 12);

schema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const AdminUser = mongoose.model('AdminUser', schema);
export default AdminUser;
