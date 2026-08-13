import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

const handler = (_req, res) => {
  res.status(429).json({ success: false, error: { message: 'Too many requests, slow down', status: 429 } });
};

const base = { windowMs: 60_000, standardHeaders: 'draft-7', legacyHeaders: false, handler };

export const publicLimiter = rateLimit({ ...base, limit: env.RATE_LIMIT_PUBLIC });

export const userLimiter = rateLimit({
  ...base,
  limit: env.RATE_LIMIT_USER,
  keyGenerator: (req) => req.firebase?.uid || req.ip,
});

/** 10 attempts per 15 minutes, counted per IP + email so one bad actor can't lock everyone out. */
export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
});
