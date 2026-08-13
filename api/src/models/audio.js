import mongoose from 'mongoose';
import { contentSchema, localized, AUDIO_TYPES } from './shared.js';

const schema = contentSchema({
  title: { type: localized(true), required: true },
  fileUrl: { type: String, required: true, trim: true },
  /** Object-storage key, kept so deleting the record can delete the object. */
  storageKey: { type: String, trim: true },
  durationSeconds: { type: Number, default: 0, min: 0 },
  sizeBytes: { type: Number, default: 0, min: 0 },
  type: { type: String, enum: AUDIO_TYPES, default: 'dua', index: true },
  reciter: { type: String, trim: true },
  linkedDuaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dua', default: null },
});

export const Audio = mongoose.model('Audio', schema);
export default Audio;
