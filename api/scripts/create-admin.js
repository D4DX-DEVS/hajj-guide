#!/usr/bin/env node
/**
 * Creates (or replaces) an admin panel account in D1.
 *
 *   npm run create-admin -- --local  --email you@example.com --name "Your Name" --password "at-least-10-chars" --role superadmin
 *   npm run create-admin -- --remote --email you@example.com ...
 *
 * Omit --password to be prompted for it instead of leaving it in shell history.
 * Only the PBKDF2 hash is written to disk (.generated/create-admin.sql), never the password.
 */
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { hashPassword } from '../src/password.js';
import { ADMIN_ROLES } from '../src/registry.js';
import { put, stableId, emit } from './sql.js';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[argv[i].slice(2)] = next;
      i += 1;
    } else {
      args[argv[i].slice(2)] = true;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const rl = readline.createInterface({ input: stdin, output: stdout });
const ask = async (q) => (await rl.question(q)).trim();

try {
  const email = String(args.email || (await ask('Email: '))).toLowerCase();
  const name = args.name || (await ask('Name: '));
  const password = args.password || (await ask('Password (min 10 chars): '));
  const role = args.role || 'superadmin';

  if (password.length < 10) throw new Error('Password must be at least 10 characters');
  if (!ADMIN_ROLES.includes(role)) throw new Error(`role must be one of ${ADMIN_ROLES.join(', ')}`);

  const emailLit = `'${email.replace(/'/g, "''")}'`;
  emit('create-admin', [
    // Replace any existing admin with this email (e.g. one migrated from Mongo); tokenVersion differs so old sessions die.
    `DELETE FROM docs WHERE collection = 'adminUsers' AND json_extract(data,'$.email') = ${emailLit};`,
    put('adminUsers', {
      id: stableId(`admin:${email}`),
      email,
      name,
      role,
      isActive: true,
      passwordHash: await hashPassword(password),
      tokenVersion: Math.floor(Date.now() / 1000),
    }),
  ]);
  console.log(`\nAdmin ${email} (${role}) ${args.local || args.remote ? 'saved.' : 'SQL generated — run it to save.'}`);
} catch (err) {
  console.error(`\nFailed: ${err.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
}
