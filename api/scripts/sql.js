// Helpers for the scripts that load data into D1 by generating a .sql file and
// handing it to `wrangler d1 execute`.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { putStmt } from '../src/db.js';

const lit = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};

// Stand-in for a D1 binding that renders the statement as SQL text instead of running it.
const sqlDb = {
  prepare: (sql) => ({
    bind: (...p) => {
      let i = 0;
      return { text: `${sql.replace(/\?/g, () => lit(p[i++]))};` };
    },
  }),
};

export const put = (coll, doc) => putStmt(sqlDb, coll, doc).text;

/** Same 24-hex shape as a Mongo ObjectId, but stable so re-running a seed overwrites instead of duplicating. */
export const stableId = (key) => createHash('sha1').update(key).digest('hex').slice(0, 24);

export const DB_NAME = 'hajj-guide';

/** Writes `.generated/<name>.sql`; runs it against D1 when `--local` or `--remote` is passed. */
export function emit(name, statements, argv = process.argv.slice(2)) {
  mkdirSync('.generated', { recursive: true });
  const file = `.generated/${name}.sql`;
  writeFileSync(file, `${statements.join('\n')}\n`);

  const target = argv.includes('--remote') ? '--remote' : argv.includes('--local') ? '--local' : null;
  if (!target) {
    console.log(`\nWrote ${file}. Load it with:\n  npx wrangler d1 execute ${DB_NAME} --local --file=${file}\n  npx wrangler d1 execute ${DB_NAME} --remote --file=${file}`);
    return;
  }
  execFileSync('npx', ['wrangler', 'd1', 'execute', DB_NAME, target, `--file=${file}`], { stdio: 'inherit', shell: process.platform === 'win32' });
}
