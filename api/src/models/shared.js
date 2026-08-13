import mongoose from 'mongoose';

/**
 * Localised text. Malayalam is the primary language of the app; English and
 * Arabic are optional so content can ship Malayalam-first and be filled in later.
 */
export const localized = (required = true) =>
  new mongoose.Schema(
    {
      malayalam: { type: String, required, trim: true },
      english: { type: String, trim: true },
      arabic: { type: String, trim: true },
    },
    { _id: false },
  );

/**
 * Fields every content document carries. `updatedAt` + `deletedAt` are what make
 * `GET /api/v1/sync?since=` able to send incremental changes (including removals)
 * to the offline cache in the app.
 */
export const contentFields = {
  order: { type: Number, default: 0, index: true },
  isPublished: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null, index: true },
};

/** `_id` -> `id`, drop `__v`. Keeps JSON stable for the Flutter parsers. */
export function applyJsonTransform(schema, { hide = [] } = {}) {
  const transform = (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    for (const field of hide) delete ret[field];
    return ret;
  };
  schema.set('toJSON', { virtuals: true, versionKey: false, transform });
  schema.set('toObject', { virtuals: true, versionKey: false, transform });
  return schema;
}

/** Builds a content schema with the shared fields, timestamps and JSON transform. */
export function contentSchema(definition, options = {}) {
  const schema = new mongoose.Schema({ ...definition, ...contentFields }, { timestamps: true, ...options });
  applyJsonTransform(schema);
  return schema;
}

export const RITUAL_TYPES = ['hajj', 'umrah'];
export const RITUAL_TYPES_WITH_BOTH = ['hajj', 'umrah', 'both'];
export const DUA_CATEGORIES = ['ihram', 'talbiyah', 'tawaf', 'zamzam', 'sai', 'arafah', 'mina', 'general'];
export const AUDIO_TYPES = ['talbiyah', 'dua', 'guide'];
export const CONTACT_CATEGORIES = ['police', 'ambulance', 'fire', 'hajj-mission', 'embassy', 'other'];
export const BOOKMARK_TYPES = ['dua', 'step', 'guideTopic'];
export const PLATFORMS = ['android', 'ios'];
