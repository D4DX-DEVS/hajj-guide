import { verifyIdToken } from '../config/firebase.js';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/http.js';

function bearer(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

/**
 * Verifies the Firebase ID token the app already holds after Google / Apple
 * sign-in and attaches `req.firebase`. Does NOT require a local user record —
 * `POST /api/v1/me` uses this to create one on first login.
 */
export const requireFirebase = asyncHandler(async (req, _res, next) => {
  const token = bearer(req);
  if (!token) throw ApiError.unauthorized('Missing bearer token');
  req.firebase = await verifyIdToken(token);
  next();
});

/** Same as above, then loads the local `users` document into `req.user`. */
export const requireUser = asyncHandler(async (req, _res, next) => {
  const token = bearer(req);
  if (!token) throw ApiError.unauthorized('Missing bearer token');

  req.firebase = await verifyIdToken(token);
  const user = await User.findOne({ firebaseUid: req.firebase.uid, deletedAt: null });
  if (!user) throw ApiError.notFound('No profile for this account — call POST /api/v1/me first');

  req.user = user;
  next();
});
