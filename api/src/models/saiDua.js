import mongoose from 'mongoose';
import { contentSchema, localized } from './shared.js';

export const SAI_DIRECTIONS = ['safa-marwa', 'marwa-safa'];

const schema = contentSchema({
  leg: { type: Number, required: true, min: 1, max: 7 },
  direction: { type: String, enum: SAI_DIRECTIONS, required: true },
  label: { type: localized(false) },
  arabicText: { type: String, required: true, trim: true },
  transliteration: { type: localized(false) },
  meaning: { type: localized(false) },
  audioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Audio', default: null },
});

schema.index({ leg: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export const SaiDua = mongoose.model('SaiDua', schema);
export default SaiDua;
