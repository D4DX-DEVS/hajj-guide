import mongoose from 'mongoose';
import { contentSchema, localized, RITUAL_TYPES } from './shared.js';

const schema = contentSchema({
  ritualType: { type: String, enum: RITUAL_TYPES, required: true, index: true },
  stepNumber: { type: Number, required: true },
  /** Free-text key into the `categories` collection (group 'ritual-step'), managed on the Category screen. */
  category: { type: String, trim: true, lowercase: true, default: null, index: true },
  title: { type: localized(true), required: true },
  description: { type: localized(false) },
  instructions: { type: [localized(true)], default: [] },
  iconEmoji: { type: String, trim: true },
  imageSource: { type: String, enum: ['url', 'upload'], default: 'url' },
  imageUrl: { type: String, trim: true },
  imageStorageKey: { type: String, trim: true },
  videoSource: { type: String, enum: ['youtube', 'upload'], default: 'youtube' },
  /** Full YouTube video URL (e.g. https://youtube.com/watch?v=...). Used when videoSource is 'youtube'. */
  videoUrl: { type: String, trim: true },
  /** Direct playable URL for an uploaded video file. Used when videoSource is 'upload'. */
  videoFileUrl: { type: String, trim: true },
  videoStorageKey: { type: String, trim: true },
  hasTawafLink: { type: Boolean, default: false },
  hasSaiLink: { type: Boolean, default: false },
  duaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dua' }],
});

schema.index({ ritualType: 1, order: 1 });
schema.index({ ritualType: 1, stepNumber: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export const RitualStep = mongoose.model('RitualStep', schema);
export default RitualStep;
