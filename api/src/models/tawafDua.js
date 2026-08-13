import mongoose from 'mongoose';
import { contentSchema, localized } from './shared.js';

/**
 * `roundNumber` is 1-7 for the circuits, plus the two markers `start` and `end`
 * for the duas recited before the first and after the seventh round.
 */
const schema = contentSchema({
  roundNumber: { type: String, required: true, trim: true },
  label: { type: localized(false) },
  arabicText: { type: String, required: true, trim: true },
  transliteration: { type: localized(false) },
  meaning: { type: localized(false) },
  audioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Audio', default: null },
});

schema.index({ roundNumber: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export const TawafDua = mongoose.model('TawafDua', schema);
export default TawafDua;
