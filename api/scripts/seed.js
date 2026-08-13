#!/usr/bin/env node
/**
 * Seeds starter content. Idempotent — every document is upserted on its natural
 * key, so re-running updates instead of duplicating.
 *
 *   npm run seed
 *   npm run seed -- --fresh     # deletes existing content first (never touches user data)
 *   npm run seed -- --draft     # seed everything unpublished
 */
import { connectDb, disconnectDb } from '../src/config/db.js';
import {
  RitualStep,
  Dua,
  GuideTopic,
  TawafDua,
  SaiDua,
  ChecklistTemplate,
  EmergencyContact,
  Category,
  AppSettings,
  ForceUpdate,
} from '../src/models/index.js';
import * as data from './seed-data.js';

const args = new Set(process.argv.slice(2));
const FRESH = args.has('--fresh');
const PUBLISHED = !args.has('--draft');

const counts = {};

async function upsert(model, filter, doc, name) {
  // `doc` already carries the same values as `filter` (it's the seed record the
  // filter was derived from), so a separate $setOnInsert would touch the same
  // path twice and Mongo rejects the update with a conflict error.
  await model.findOneAndUpdate(filter, { $set: doc }, { upsert: true, setDefaultsOnInsert: true, runValidators: true });
  counts[name] = (counts[name] || 0) + 1;
}

async function main() {
  await connectDb();

  if (FRESH) {
    console.log('--fresh: clearing existing content collections (user data untouched)');
    await Promise.all(
      [RitualStep, Dua, GuideTopic, TawafDua, SaiDua, ChecklistTemplate, EmergencyContact].map((m) => m.deleteMany({})),
    );
  }

  /* categories ------------------------------------------------------------ */
  for (const category of data.categories) {
    await upsert(Category, { group: category.group, key: category.key }, { ...category, isPublished: true }, 'categories');
  }

  /* ritual steps -------------------------------------------------------- */
  for (const step of data.ritualSteps) {
    await upsert(
      RitualStep,
      { ritualType: step.ritualType, stepNumber: step.stepNumber },
      { ...step, isPublished: PUBLISHED },
      'ritualSteps',
    );
  }

  /* duas — `_step` links a dua to the step it belongs to ----------------- */
  for (const { _step, ...dua } of data.duas) {
    let ritualStepId = null;
    if (_step) {
      const step = await RitualStep.findOne(_step).select('_id').lean();
      ritualStepId = step?._id ?? null;
    }
    await upsert(
      Dua,
      { 'title.english': dua.title.english },
      { ...dua, ritualStepId, isPublished: PUBLISHED },
      'duas',
    );
  }

  /* guide topics -------------------------------------------------------- */
  for (const topic of data.guideTopics) {
    await upsert(GuideTopic, { slug: topic.slug }, { ...topic, isPublished: PUBLISHED }, 'guideTopics');
  }

  /* tawaf + sai --------------------------------------------------------- */
  for (const dua of data.tawafDuas) {
    await upsert(TawafDua, { roundNumber: dua.roundNumber }, { ...dua, isPublished: PUBLISHED }, 'tawafDuas');
  }
  for (const dua of data.saiDuas) {
    await upsert(SaiDua, { leg: dua.leg }, { ...dua, isPublished: PUBLISHED }, 'saiDuas');
  }

  /* checklist ----------------------------------------------------------- */
  for (const category of data.checklistCategories) {
    await upsert(
      ChecklistTemplate,
      { categoryKey: category.categoryKey },
      { ...category, isPublished: PUBLISHED },
      'checklistCategories',
    );
  }

  /* emergency contacts -------------------------------------------------- */
  for (const contact of data.emergencyContacts) {
    const { isPublished, ...rest } = contact;
    await upsert(
      EmergencyContact,
      { number: contact.number, country: contact.country },
      { ...rest, isPublished: isPublished === false ? false : PUBLISHED },
      'emergencyContacts',
    );
  }

  /* singletons ---------------------------------------------------------- */
  await AppSettings.findOneAndUpdate(
    { singletonKey: 'default' },
    { $set: data.appSettings, $setOnInsert: { singletonKey: 'default' } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  counts.appSettings = 1;

  for (const update of data.forceUpdates) {
    await upsert(ForceUpdate, { platform: update.platform }, update, 'forceUpdate');
  }

  console.log('\nSeeded:');
  for (const [key, value] of Object.entries(counts)) console.log(`  ${key.padEnd(20)} ${value}`);
  console.log(`\nStatus: ${PUBLISHED ? 'published' : 'draft'}.`);
  console.log('No audio was seeded — upload files through the admin panel, then link them to duas.');

  await disconnectDb();
}

main().catch(async (err) => {
  console.error(`\nSeed failed: ${err.message}`);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
