import mongoose from 'mongoose';
import { contentSchema, localized } from './shared.js';

const schema = contentSchema({
  name: { type: localized(true), required: true },
  number: { type: String, required: true, trim: true },
  description: { type: localized(false) },
  country: { type: String, default: 'SA', trim: true, uppercase: true, index: true },
  // Free-text key into the `categories` collection (group: 'emergency-contact') rather than a fixed enum,
  // so new categories can be added from the admin panel without a code change.
  category: { type: String, trim: true, lowercase: true, default: 'other', index: true },
  iconEmoji: { type: String, trim: true },
});

schema.index({ country: 1, order: 1 });

export const EmergencyContact = mongoose.model('EmergencyContact', schema);
export default EmergencyContact;
