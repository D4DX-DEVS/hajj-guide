import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { contentSchema, localized, RITUAL_TYPES_WITH_BOTH } from './shared.js';

/** Slug is user-facing only in the app URL — the admin form no longer asks for one. */
const generateSlug = () => `topic-${crypto.randomBytes(4).toString('hex')}`;

/** Session title is optional — a session can be just a description. `## text ##` inside a description renders bold in the app. */
const sessionSchema = new mongoose.Schema(
  {
    sessionTitle: { type: localized(false) },
    description: { type: localized(true), required: true },
  },
  { _id: false },
);

/** Replaces the lorem-ipsum placeholder in `guide_topic_detail_screen.dart`. */
const schema = contentSchema({
  ritualType: { type: String, enum: RITUAL_TYPES_WITH_BOTH, default: 'both', index: true },
  slug: { type: String, required: true, trim: true, lowercase: true, default: generateSlug },
  /** Free-text key into the `categories` collection (group 'guide-topic'), managed on the Category screen. */
  category: { type: String, trim: true, lowercase: true, default: null, index: true },
  mainTitle: { type: localized(true), required: true },
  sessions: { type: [sessionSchema], default: [] },
  coverImageSource: { type: String, enum: ['url', 'upload'], default: 'url' },
  coverImage: { type: String, trim: true },
  coverImageStorageKey: { type: String, trim: true },
  videoSource: { type: String, enum: ['youtube', 'upload'], default: 'youtube' },
  /** Full YouTube video URL (e.g. https://youtube.com/watch?v=...). Used when videoSource is 'youtube'. */
  videoUrl: { type: String, trim: true },
  /** Direct playable URL for an uploaded video file. Used when videoSource is 'upload'. */
  videoFileUrl: { type: String, trim: true },
  videoStorageKey: { type: String, trim: true },
  iconEmoji: { type: String, trim: true },
});

schema.index({ slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
schema.index({ ritualType: 1, order: 1 });

export const GuideTopic = mongoose.model('GuideTopic', schema);
export default GuideTopic;
