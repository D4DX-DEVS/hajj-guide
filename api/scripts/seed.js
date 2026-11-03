#!/usr/bin/env node
/**
 * Seeds starter content into D1. Idempotent — every document gets an id derived
 * from its natural key, so re-running overwrites instead of duplicating.
 *
 *   npm run seed -- --local                # or --remote; without either, only writes .generated/seed.sql
 *   npm run seed -- --local --fresh        # deletes existing content first (never touches user data)
 *   npm run seed -- --local --draft        # seed everything unpublished
 */
import { baseDefaults, registryByKey } from '../src/registry.js';
import { put, stableId, emit } from './sql.js';
import * as data from './seed-data.js';

const args = new Set(process.argv.slice(2));
const PUBLISHED = !args.has('--draft');

const stmts = [];
const counts = {};

/** Mirrors what POST /api/admin/<key> stores: base defaults, entry defaults, then the record. */
function add(key, naturalKey, doc) {
  const entry = registryByKey.get(key);
  stmts.push(put(entry.coll, { id: stableId(`${entry.coll}:${naturalKey}`), ...baseDefaults(), ...entry.defaults(), ...doc }));
  counts[entry.coll] = (counts[entry.coll] || 0) + 1;
}

if (args.has('--fresh')) {
  console.log('--fresh: clearing existing content collections (user data untouched)');
  const colls = ['ritual-steps', 'duas', 'guide-topics', 'tawaf-duas', 'sai-duas', 'checklist-template', 'emergency-contacts'];
  stmts.push(`DELETE FROM docs WHERE collection IN (${colls.map((k) => `'${registryByKey.get(k).coll}'`).join(',')});`);
}

for (const c of data.categories) add('categories', `${c.group}:${c.key}`, { ...c, isPublished: true });

const stepKey = (s) => `${s.ritualType}:${s.stepNumber}`;
for (const s of data.ritualSteps) add('ritual-steps', stepKey(s), { ...s, isPublished: PUBLISHED });

// `_step` links a dua to the step it belongs to.
for (const { _step, ...dua } of data.duas) {
  const ritualStepId = _step ? stableId(`ritualSteps:${stepKey(_step)}`) : null;
  add('duas', dua.title.english, { ...dua, ritualStepId, isPublished: PUBLISHED });
}

for (const t of data.guideTopics) add('guide-topics', t.slug, { ...t, isPublished: PUBLISHED });
for (const d of data.tawafDuas) add('tawaf-duas', d.roundNumber, { ...d, isPublished: PUBLISHED });
for (const d of data.saiDuas) add('sai-duas', String(d.leg), { ...d, isPublished: PUBLISHED });
for (const c of data.checklistCategories) add('checklist-template', c.categoryKey, { ...c, isPublished: PUBLISHED });

for (const { isPublished, ...contact } of data.emergencyContacts) {
  add('emergency-contacts', `${contact.country}:${contact.number}`, { ...contact, isPublished: isPublished === false ? false : PUBLISHED });
}

stmts.push(put('appSettings', { id: 'default', ...data.appSettings }));
counts.appSettings = 1;
for (const u of data.forceUpdates) {
  stmts.push(put('forceUpdate', { id: u.platform, ...u }));
  counts.forceUpdate = (counts.forceUpdate || 0) + 1;
}

console.log('Seeding:');
for (const [key, value] of Object.entries(counts)) console.log(`  ${key.padEnd(20)} ${value}`);
console.log(`Status: ${PUBLISHED ? 'published' : 'draft'}. No audio is seeded — upload through the admin panel.`);

emit('seed', stmts);
