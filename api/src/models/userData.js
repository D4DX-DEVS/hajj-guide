import mongoose from 'mongoose';
import { applyJsonTransform, RITUAL_TYPES, BOOKMARK_TYPES } from './shared.js';

const userRef = { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true };

/* ------------------------------------------------------------------ progress */
const progressSchema = new mongoose.Schema(
  {
    userId: userRef,
    ritualType: { type: String, enum: RITUAL_TYPES, required: true },
    completedStepIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RitualStep' }],
    currentStepIndex: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);
progressSchema.index({ userId: 1, ritualType: 1 }, { unique: true });
applyJsonTransform(progressSchema);

/* ----------------------------------------------------------------- bookmarks */
const bookmarkSchema = new mongoose.Schema(
  {
    userId: userRef,
    itemType: { type: String, enum: BOOKMARK_TYPES, required: true },
    itemId: { type: String, required: true },
  },
  { timestamps: true },
);
bookmarkSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });
applyJsonTransform(bookmarkSchema);

/* ----------------------------------------------------------------- checklist */
const checklistSchema = new mongoose.Schema(
  {
    userId: { ...userRef, unique: true },
    /** References `checklistTemplate.items[].key`. */
    checkedKeys: [{ type: String }],
  },
  { timestamps: true },
);
applyJsonTransform(checklistSchema);

/* ---------------------------------------------------------------------- tent */
const tentSchema = new mongoose.Schema(
  {
    userId: { ...userRef, unique: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    accuracy: { type: Number, default: 0 },
    address: { type: String, trim: true },
    note: { type: String, trim: true },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
applyJsonTransform(tentSchema);

/* --------------------------------------------------------------- preferences */
const preferencesSchema = new mongoose.Schema(
  {
    userId: { ...userRef, unique: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    fontScale: { type: Number, default: 1, min: 0.8, max: 2 },
    arabicFontSize: { type: Number, default: 24, min: 14, max: 60 },
    language: { type: String, enum: ['ml', 'en', 'ar'], default: 'ml' },
    notificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);
applyJsonTransform(preferencesSchema);

export const UserProgress = mongoose.model('UserProgress', progressSchema);
export const UserBookmark = mongoose.model('UserBookmark', bookmarkSchema);
export const UserChecklist = mongoose.model('UserChecklist', checklistSchema);
export const UserTent = mongoose.model('UserTent', tentSchema);
export const UserPreferences = mongoose.model('UserPreferences', preferencesSchema);
