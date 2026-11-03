#!/usr/bin/env node
/**
 * One-off export of the old MongoDB data into D1.
 *
 *   MONGO_URI=mongodb+srv://... npm run migrate-mongo -- --local     # or --remote
 *
 * Without --local/--remote it only writes .generated/migrate-mongo.sql. Re-running is safe
 * (INSERT OR REPLACE on the original ObjectId). Admin password hashes are kept — bcrypt
 * hashes are verified by the Worker and upgraded to PBKDF2 on that admin's next login.
 * Files already uploaded to DigitalOcean Spaces are NOT copied: their URLs keep working
 * until you re-upload them to R2 (see README).
 */
import { MongoClient } from 'mongodb';
import { put, emit } from './sql.js';

// D1 collection -> candidate Mongo collection names (Mongoose pluralises model names).
const MAP = {
  ritualSteps: ['ritualsteps'],
  duas: ['duas'],
  guideTopics: ['guidetopics'],
  tawafDuas: ['tawafduas'],
  saiDuas: ['saiduas'],
  checklistTemplate: ['checklisttemplates'],
  emergencyContacts: ['emergencycontacts'],
  audio: ['audios', 'audio'],
  faqs: ['faqs'],
  categories: ['categories'],
  appSettings: ['appsettings'],
  forceUpdate: ['forceupdates'],
  users: ['users'],
  userProgress: ['userprogresses'],
  userBookmarks: ['userbookmarks'],
  userChecklist: ['userchecklists'],
  userTent: ['usertents'],
  userPreferences: ['userpreferences'],
  adminUsers: ['adminusers'],
  auditLogs: ['auditlogs'],
};

/** ObjectId -> hex string, Date -> ISO string, recursively. */
function plain(v) {
  if (v === null || v === undefined) return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v.toHexString === 'function') return v.toHexString();
  if (Array.isArray(v)) return v.map(plain);
  if (v instanceof Map) return plain(Object.fromEntries(v));
  if (typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]));
  return v;
}

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('Set MONGO_URI to the old MongoDB connection string.');
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db();
  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
  const stmts = [];

  for (const [coll, candidates] of Object.entries(MAP)) {
    const name = candidates.find((n) => existing.has(n));
    if (!name) {
      console.log(`  ${coll.padEnd(20)} (no Mongo collection, skipped)`);
      continue;
    }
    const docs = await db.collection(name).find({}).toArray();
    for (const raw of docs) {
      const { _id, __v, singletonKey, ...rest } = plain(raw);
      const doc = { ...rest, id: coll === 'appSettings' ? 'default' : coll === 'forceUpdate' ? rest.platform : _id };
      if (coll === 'users' && doc.deletedAt === undefined) doc.deletedAt = null;
      stmts.push(put(coll, doc));
    }
    console.log(`  ${coll.padEnd(20)} ${docs.length}  (from ${name})`);
  }

  emit('migrate-mongo', stmts);
} finally {
  await client.close();
}
