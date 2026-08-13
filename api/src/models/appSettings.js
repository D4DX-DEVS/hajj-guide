import mongoose from 'mongoose';
import { localized, applyJsonTransform, RITUAL_TYPES } from './shared.js';

const bannerSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    title: { type: localized(true), required: true },
    subtitle: { type: localized(false) },
    imageUrl: { type: String, trim: true },
    actionRoute: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const quickActionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: localized(true), required: true },
    iconEmoji: { type: String, trim: true },
    route: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

/**
 * Singleton document — `singletonKey` is fixed so upserts always hit the same row.
 */
const schema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'default', unique: true, immutable: true },
    highlightedRitual: { type: String, enum: RITUAL_TYPES, default: 'umrah' },
    announcement: { type: localized(false) },
    announcementIsActive: { type: Boolean, default: false },
    banners: { type: [bannerSchema], default: [] },
    quickActions: { type: [quickActionSchema], default: [] },
    featureFlags: { type: Map, of: Boolean, default: () => new Map() },
    supportEmail: { type: String, trim: true },
    supportPhone: { type: String, trim: true },
    privacyPolicyUrl: { type: String, trim: true },
    termsUrl: { type: String, trim: true },
  },
  { timestamps: true },
);

applyJsonTransform(schema);

schema.statics.getSingleton = async function getSingleton() {
  return this.findOneAndUpdate(
    { singletonKey: 'default' },
    { $setOnInsert: { singletonKey: 'default' } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

export const AppSettings = mongoose.model('AppSettings', schema);
export default AppSettings;
