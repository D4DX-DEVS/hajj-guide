import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { AdminUser } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/http.js';

export function signAccessToken(admin) {
  return jwt.sign({ sub: String(admin._id), role: admin.role, typ: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  });
}

export function signRefreshToken(admin) {
  return jwt.sign({ sub: String(admin._id), ver: admin.tokenVersion, typ: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  });
}

export function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (payload.typ !== 'refresh') throw new Error('wrong token type');
    return payload;
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
}

export const requireAdmin = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw ApiError.unauthorized('Missing bearer token');

  let payload;
  try {
    payload = jwt.verify(header.slice(7).trim(), env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
  if (payload.typ !== 'access') throw ApiError.unauthorized('Wrong token type');

  const admin = await AdminUser.findById(payload.sub);
  if (!admin || !admin.isActive) throw ApiError.unauthorized('Admin account is inactive');

  req.admin = admin;
  next();
});

/** Route guard for superadmin-only actions (managing other admins). */
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.admin) return next(ApiError.unauthorized());
    if (!roles.includes(req.admin.role)) return next(ApiError.forbidden('Insufficient role'));
    return next();
  };
