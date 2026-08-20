import mongoose from 'mongoose';
import { contentSchema, localized, RITUAL_TYPES_WITH_BOTH } from './shared.js';

const schema = contentSchema({
  title: { type: localized(false) },
  arabicText: { type: String, trim: true },
  transliteration: { type: localized(false) },
  meaning: { type: localized(false) },
  description: { type: localized(false) },
  // Free-text key into the `categories` collection (group: 'dua') rather than a fixed enum,
  // so new categories can be added from the admin panel without a code change.
  category: { type: String, trim: true, lowercase: true, default: 'general', index: true },
  ritualType: { type: String, enum: RITUAL_TYPES_WITH_BOTH, default: 'both', index: true },
  ritualStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'RitualStep', default: null, index: true },
  audioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Audio', default: null },
});

schema.index({ category: 1, order: 1 });

export const Dua = mongoose.model('Dua', schema);
export default Dua;
