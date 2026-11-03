// PBKDF2 via WebCrypto: native speed on Workers (bcrypt in JS would blow the CPU limit).
// Shared with scripts/create-admin.js — keep it free of Workers-only APIs.
const ITER = 100_000;
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(await derive(password, salt, ITER))}`;
}

/** Also accepts bcrypt hashes migrated from Mongo; the login route re-hashes them to PBKDF2. */
export async function verifyPassword(password, stored) {
  if (stored.startsWith('$2')) return (await import('bcryptjs')).default.compare(password, stored);
  const [, iter, salt, hash] = stored.split('$');
  const got = new Uint8Array(await derive(password, unb64(salt), Number(iter)));
  const want = unb64(hash);
  let diff = got.length ^ want.length;
  for (let i = 0; i < got.length; i += 1) diff |= got[i] ^ want[i];
  return diff === 0;
}

export const needsRehash = (stored) => stored.startsWith('$2');
