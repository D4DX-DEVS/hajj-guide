import mongoose from 'mongoose';
import { contentSchema, localized } from './shared.js';

/** Which content field a category value belongs to. Add a group here when a new content type gets manageable categories. */
export const CATEGORY_GROUPS = ['dua', 'emergency-contact', 'ritual-step', 'guide-topic'];

const schema = contentSchema({
  group: { type: String, enum: CATEGORY_GROUPS, required: true, index: true },
  key: { type: String, required: true, trim: true, lowercase: true },
  label: { type: localized(true), required: true },
});

schema.index({ group: 1, key: 1 }, { unique: true });
schema.index({ group: 1, order: 1 });

export const Category = mongoose.model('Category', schema);
export default Category;
