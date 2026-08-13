import admin from 'firebase-admin';
import env from './env.js';
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';

let app = null;

function init() {
  if (app || !env.firebaseEnabled) return app;

  let credentials;
  try {
    const json = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
    credentials = JSON.parse(json);
  } catch {
    logger.error('FIREBASE_SERVICE_ACCOUNT is not valid base64-encoded JSON — user routes disabled');
    return null;
  }

  app = admin.initializeApp({ credential: admin.credential.cert(credentials) });
  logger.info({ projectId: credentials.project_id }, 'firebase-admin initialised');
  return app;
}

init();

export const firebaseReady = () => Boolean(app);

/**
 * Verifies a Firebase ID token issued to the mobile app (Google / Apple sign-in).
 * Throws ApiError so the error middleware renders a normal envelope.
 */
export async function verifyIdToken(idToken) {
  if (!app) {
    throw ApiError.unavailable('Firebase auth is not configured on this server');
  }
  try {
    return await admin.auth().verifyIdToken(idToken, true);
  } catch (err) {
    if (err.code === 'auth/id-token-expired') throw ApiError.unauthorized('Token expired');
    if (err.code === 'auth/id-token-revoked') throw ApiError.unauthorized('Token revoked');
    throw ApiError.unauthorized('Invalid token');
  }
}

/** Used by account deletion so the Firebase user goes away with our records. */
export async function deleteFirebaseUser(uid) {
  if (!app) return;
  try {
    await admin.auth().deleteUser(uid);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
  }
}

export default { firebaseReady, verifyIdToken, deleteFirebaseUser };
