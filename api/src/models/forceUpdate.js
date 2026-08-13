import mongoose from 'mongoose';
import { localized, applyJsonTransform, PLATFORMS } from './shared.js';

/** Migrates the app off Directus (`directus.d4dx.co`). One document per platform. */
const schema = new mongoose.Schema(
  {
    platform: { type: String, enum: PLATFORMS, required: true, unique: true },
    minVersion: { type: String, required: true, trim: true },
    latestVersion: { type: String, required: true, trim: true },
    storeUrl: { type: String, required: true, trim: true },
    message: { type: localized(false) },
    isMandatory: { type: Boolean, default: false },
  },
  { timestamps: true },
);

applyJsonTransform(schema);

export const ForceUpdate = mongoose.model('ForceUpdate', schema);
export default ForceUpdate;
