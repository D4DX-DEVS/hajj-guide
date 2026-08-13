#!/usr/bin/env node
/**
 * Creates (or updates) an admin panel account.
 *
 *   npm run create-admin -- --email you@example.com --name "Your Name" --password "at-least-10-chars" --role superadmin
 *
 * Omit --password to be prompted for it instead of leaving it in shell history.
 */
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { AdminUser } from '../src/models/adminUser.js';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

async function ask(rl, question, { required = true } = {}) {
  for (;;) {
    const answer = (await rl.question(question)).trim();
    if (answer || !required) return answer;
    console.log('  Required.');
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    const email = (args.email || (await ask(rl, 'Email: '))).toLowerCase();
    const name = args.name || (await ask(rl, 'Name: '));
    const password = args.password || (await ask(rl, 'Password (min 10 chars): '));
    const role = args.role || 'superadmin';

    if (password.length < 10) throw new Error('Password must be at least 10 characters');
    if (!['superadmin', 'editor'].includes(role)) throw new Error("role must be 'superadmin' or 'editor'");

    await connectDb();

    const existing = await AdminUser.findOne({ email });
    if (existing) {
      existing.name = name;
      existing.role = role;
      existing.isActive = true;
      existing.passwordHash = await AdminUser.hashPassword(password);
      existing.tokenVersion += 1;
      await existing.save();
      console.log(`\nUpdated existing admin ${email} (${role}). Old sessions were revoked.`);
    } else {
      await AdminUser.create({
        email,
        name,
        role,
        passwordHash: await AdminUser.hashPassword(password),
      });
      console.log(`\nCreated admin ${email} (${role}).`);
    }
  } finally {
    rl.close();
    await disconnectDb().catch(() => {});
  }
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}`);
  process.exit(1);
});
