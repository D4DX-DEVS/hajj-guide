import { sign, verify } from 'hono/jwt';
import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { get, findOne } from './db.js';
import { ApiError, unauthorized, unavailable, forbidden, notFound } from './util.js';

/* ------------------------------------------------------------- admin JWT */

const now = () => Math.floor(Date.now() / 1000);

export const signAccessToken = (env, admin) =>
  sign({ sub: admin.id, role: admin.role, typ: 'access', exp: now() + Number(env.ACCESS_TTL || 900) }, env.JWT_SECRET);

export const signRefreshToken = (env, admin) =>
  sign({ sub: admin.id, ver: admin.tokenVersion, typ: 'refresh', exp: now() + Number(env.REFRESH_TTL || 2592000) }, env.JWT_REFRESH_SECRET);

export async function verifyRefreshToken(env, token) {
  try {
    const payload = await verify(token, env.JWT_REFRESH_SECRET, 'HS256');
    if (payload.typ !== 'refresh') throw new Error('wrong token type');
    return payload;
  } catch {
    throw unauthorized('Invalid or expired refresh token');
  }
}

export const requireAdmin = createMiddleware(async (c, next) => {
  const header = c.req.header('authorization') || '';
  if (!header.startsWith('Bearer ')) throw unauthorized('Missing bearer token');

  let payload;
  try {
    payload = await verify(header.slice(7).trim(), c.env.JWT_SECRET, 'HS256');
  } catch {
    throw unauthorized('Invalid or expired access token');
  }
  if (payload.typ !== 'access') throw unauthorized('Wrong token type');

  const admin = await get(c.env.DB, 'adminUsers', payload.sub);
  if (!admin || !admin.isActive) throw unauthorized('Admin account is inactive');

  c.set('admin', admin);
  await next();
});

export const requireRole = (...roles) =>
  createMiddleware(async (c, next) => {
    if (!c.get('admin')) throw unauthorized();
    if (!roles.includes(c.get('admin').role)) throw forbidden('Insufficient role');
    await next();
  });

/** Admin as sent to the panel: never the hash or token version. */
export const publicAdmin = ({ passwordHash, tokenVersion, ...rest }) => rest;

/* ----------------------------------------------------- Firebase ID tokens */

const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

/** Verifies the Firebase ID token the app holds after Google / Apple sign-in. */
export async function verifyIdToken(env, token) {
  const pid = env.FIREBASE_PROJECT_ID;
  if (!pid) throw unavailable('Firebase auth is not configured on this server');
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: `https://securetoken.google.com/${pid}`, audience: pid });
    if (!payload.sub) throw new Error('no subject');
    return { uid: payload.sub, email: payload.email, name: payload.name, picture: payload.picture, firebase: payload.firebase };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.code === 'ERR_JWT_EXPIRED') throw unauthorized('Token expired');
    throw unauthorized('Invalid token');
  }
}

function bearer(c) {
  const header = c.req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw unauthorized('Missing bearer token');
  return token;
}

/** Verifies the token only — `POST /me` uses this to create the local user on first login. */
export const requireFirebase = createMiddleware(async (c, next) => {
  c.set('firebase', await verifyIdToken(c.env, bearer(c)));
  await next();
});

/** Same, then loads the local user doc. */
export const requireUser = createMiddleware(async (c, next) => {
  const firebase = await verifyIdToken(c.env, bearer(c));
  const user = await findOne(c.env.DB, 'users', [['firebaseUid', 'eq', firebase.uid], ['deletedAt', 'null']]);
  if (!user) throw notFound('No profile for this account — call POST /api/v1/me first');
  c.set('firebase', firebase);
  c.set('user', user);
  await next();
});
