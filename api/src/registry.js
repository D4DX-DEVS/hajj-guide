import { z } from 'zod';
import { rand } from './db.js';
import { badRequest } from './util.js';

export const RITUAL_TYPES = ['hajj', 'umrah'];
export const RITUAL_TYPES_WITH_BOTH = ['hajj', 'umrah', 'both'];
export const AUDIO_TYPES = ['talbiyah', 'dua', 'guide'];
export const BOOKMARK_TYPES = ['dua', 'step', 'guideTopic'];
export const PLATFORMS = ['android', 'ios'];
export const ADMIN_ROLES = ['superadmin', 'editor'];
export const SAI_DIRECTIONS = ['safa-marwa', 'marwa-safa'];
/** Which content field a category value belongs to. */
export const CATEGORY_GROUPS = ['dua', 'emergency-contact', 'ritual-step', 'guide-topic'];

/* ------------------------------------------------------------ zod helpers */

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'must be a 24-char object id');

/** Malayalam required, other languages optional. */
export const locRequired = z.object({
  malayalam: z.string().trim().min(1, 'Malayalam text is required'),
  english: z.string().trim().optional(),
  arabic: z.string().trim().optional(),
});

/** Every language optional; the whole block may be omitted. */
export const locOptional = z
  .object({
    malayalam: z.string().trim().optional(),
    english: z.string().trim().optional(),
    arabic: z.string().trim().optional(),
  })
  .optional();

const contentBase = {
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
};

/** Lowercase kebab/snake key — matches how `categories.key` values are stored. */
const categoryKey = z.string().trim().toLowerCase().regex(/^[a-z0-9_-]+$/, 'must be lowercase letters, numbers, hyphens or underscores');

/** Same as `categoryKey`, but tolerates the empty string an unset dropdown submits and stores it as unset. */
const optionalCategoryKey = categoryKey.optional().or(z.literal('')).transform((v) => (v ? v : undefined));

/* ------------------------------------------------------- content schemas */

const ritualStepSchema = z.object({
  ...contentBase,
  ritualType: z.enum(RITUAL_TYPES),
  stepNumber: z.number().int().min(1),
  category: optionalCategoryKey,
  title: locRequired,
  description: locOptional,
  instructions: z.array(locRequired.extend({ description: locOptional })).optional(),
  iconEmoji: z.string().trim().optional(),
  imageSource: z.enum(['url', 'upload']).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  imageStorageKey: z.string().trim().optional(),
  videoSource: z.enum(['youtube', 'upload']).optional(),
  videoUrl: z.string().trim().url().optional().or(z.literal('')),
  videoFileUrl: z.string().url().optional().or(z.literal('')),
  videoStorageKey: z.string().trim().optional(),
  hasTawafLink: z.boolean().optional(),
  hasSaiLink: z.boolean().optional(),
  duaIds: z.array(objectId).optional(),
});

const duaSchema = z.object({
  ...contentBase,
  title: locOptional,
  arabicText: z.string().trim().optional(),
  transliteration: locOptional,
  meaning: locOptional,
  description: locOptional,
  category: categoryKey.optional(),
  ritualType: z.enum(RITUAL_TYPES_WITH_BOTH).optional(),
  ritualStepId: objectId.nullable().optional(),
  audioId: objectId.nullable().optional(),
});

const guideTopicSchema = z.object({
  ...contentBase,
  ritualType: z.enum(RITUAL_TYPES_WITH_BOTH).optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case')
    .optional(),
  category: optionalCategoryKey,
  mainTitle: locRequired,
  sessions: z.array(z.object({ sessionTitle: locOptional, description: locRequired })).optional(),
  coverImageSource: z.enum(['url', 'upload']).optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  coverImageStorageKey: z.string().trim().optional(),
  videoSource: z.enum(['youtube', 'upload']).optional(),
  videoUrl: z.string().trim().url().optional().or(z.literal('')),
  videoFileUrl: z.string().url().optional().or(z.literal('')),
  videoStorageKey: z.string().trim().optional(),
  iconEmoji: z.string().trim().optional(),
});

const tawafDuaSchema = z.object({
  ...contentBase,
  roundNumber: z.enum(['start', '1', '2', '3', '4', '5', '6', '7', 'end']),
  label: locOptional,
  arabicText: z.string().trim().min(1),
  transliteration: locOptional,
  meaning: locOptional,
  audioId: objectId.nullable().optional(),
});

const saiDuaSchema = z.object({
  ...contentBase,
  leg: z.number().int().min(1).max(7),
  direction: z.enum(SAI_DIRECTIONS),
  label: locOptional,
  arabicText: z.string().trim().min(1),
  transliteration: locOptional,
  meaning: locOptional,
  audioId: objectId.nullable().optional(),
});

const checklistTemplateSchema = z.object({
  ...contentBase,
  categoryKey: z
    .string()
    .trim()
    .regex(/^[a-z0-9_-]+$/, 'categoryKey must be lowercase kebab/snake case')
    .optional(),
  name: locRequired,
  iconEmoji: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        key: z
          .string()
          .trim()
          .regex(/^[a-z0-9_-]+$/, 'item key must be lowercase kebab/snake case'),
        title: locRequired,
        note: locOptional,
        iconEmoji: z.string().trim().optional(),
        order: z.number().int().optional(),
      }),
    )
    .optional(),
});

const emergencyContactSchema = z.object({
  ...contentBase,
  name: locRequired,
  number: z.string().trim().min(2),
  description: locOptional,
  country: z.string().trim().length(2).toUpperCase().optional(),
  category: categoryKey.optional(),
  iconEmoji: z.string().trim().optional(),
});

const categorySchema = z.object({
  ...contentBase,
  group: z.enum(CATEGORY_GROUPS),
  key: categoryKey,
  label: locRequired,
});

const audioSchema = z.object({
  ...contentBase,
  title: locRequired,
  fileUrl: z.string().url(),
  storageKey: z.string().trim().optional(),
  durationSeconds: z.number().min(0).optional(),
  sizeBytes: z.number().min(0).optional(),
  type: z.enum(AUDIO_TYPES).optional(),
  reciter: z.string().trim().optional(),
  linkedDuaId: objectId.nullable().optional(),
});

const faqSchema = z.object({
  ...contentBase,
  title: locRequired,
  description: locOptional,
});

/* --------------------------------------------------------------- registry */

const eq = (q, field, as = field) => (q[field] ? [[as, 'eq', q[field]]] : []);
const withBoth = (q) => (q.ritualType ? [['ritualType', 'in', [q.ritualType, 'both']]] : []);

/**
 * Single source of truth shared by the admin CRUD routes, the public list
 * endpoints and `GET /sync`. Adding a content type means adding one entry here.
 *
 * - `key`      URL segment
 * - `coll`     D1 collection name (also the `/sync` key)
 * - `sort`     [[field, 1|-1]]
 * - `filter`   query params -> conditions (see db.js)
 * - `defaults` values a new doc gets when the body omits them
 * - `unique`   field sets that must be unique among non-deleted docs
 */
export const contentRegistry = [
  {
    key: 'ritual-steps',
    coll: 'ritualSteps',
    label: 'Ritual Steps',
    schema: ritualStepSchema,
    sort: [['ritualType', 1], ['order', 1], ['stepNumber', 1]],
    filter: (q) => [...eq(q, 'ritualType'), ...eq(q, 'category')],
    defaults: () => ({ category: null, instructions: [], imageSource: 'url', videoSource: 'youtube', hasTawafLink: false, hasSaiLink: false }),
    unique: [['ritualType', 'stepNumber']],
    searchFields: ['title.malayalam', 'title.english'],
  },
  {
    key: 'duas',
    coll: 'duas',
    label: 'Duas',
    schema: duaSchema,
    sort: [['order', 1], ['createdAt', 1]],
    // `both` duas belong to hajj *and* umrah, so never filter them out.
    filter: (q) => [...withBoth(q), ...eq(q, 'category'), ...eq(q, 'stepId', 'ritualStepId')],
    defaults: () => ({ category: 'general', ritualType: 'both', ritualStepId: null, audioId: null }),
    searchFields: ['title.malayalam', 'title.english', 'arabicText'],
  },
  {
    key: 'guide-topics',
    coll: 'guideTopics',
    label: 'Guide Topics',
    schema: guideTopicSchema,
    slug: true,
    sort: [['order', 1], ['createdAt', 1]],
    filter: (q) => [...withBoth(q), ...eq(q, 'category')],
    defaults: () => ({
      ritualType: 'both',
      slug: `topic-${rand(4)}`,
      category: null,
      sessions: [],
      coverImageSource: 'url',
      videoSource: 'youtube',
    }),
    unique: [['slug']],
    searchFields: ['mainTitle.malayalam', 'mainTitle.english', 'slug'],
  },
  {
    key: 'tawaf-duas',
    coll: 'tawafDuas',
    label: 'Tawaf Duas',
    schema: tawafDuaSchema,
    sort: [['order', 1]],
    filter: () => [],
    defaults: () => ({ audioId: null }),
    unique: [['roundNumber']],
    searchFields: ['roundNumber'],
  },
  {
    key: 'sai-duas',
    coll: 'saiDuas',
    label: "Sa'i Duas",
    schema: saiDuaSchema,
    sort: [['leg', 1]],
    filter: () => [],
    defaults: () => ({ audioId: null }),
    unique: [['leg']],
    searchFields: [],
  },
  {
    key: 'checklist-template',
    coll: 'checklistTemplate',
    label: 'Checklist Template',
    schema: checklistTemplateSchema,
    sort: [['order', 1]],
    filter: () => [],
    defaults: () => ({ categoryKey: `category-${rand(4)}`, items: [] }),
    unique: [['categoryKey']],
    check: (doc) => {
      const keys = (doc.items || []).map((i) => i.key);
      if (new Set(keys).size !== keys.length) throw badRequest('Checklist item keys must be unique within a category');
    },
    searchFields: ['categoryKey', 'name.malayalam'],
  },
  {
    key: 'emergency-contacts',
    coll: 'emergencyContacts',
    label: 'Emergency Contacts',
    schema: emergencyContactSchema,
    sort: [['order', 1]],
    filter: (q) => [...(q.country ? [['country', 'eq', q.country.toUpperCase()]] : []), ...eq(q, 'category')],
    defaults: () => ({ country: 'SA', category: 'other' }),
    searchFields: ['name.malayalam', 'name.english', 'number'],
  },
  {
    key: 'audio',
    coll: 'audio',
    label: 'Audio Library',
    schema: audioSchema,
    sort: [['order', 1], ['createdAt', -1]],
    filter: (q) => eq(q, 'type'),
    defaults: () => ({ durationSeconds: 0, sizeBytes: 0, type: 'dua', linkedDuaId: null }),
    searchFields: ['title.malayalam', 'title.english', 'reciter'],
  },
  {
    key: 'faqs',
    coll: 'faqs',
    label: 'FAQ',
    schema: faqSchema,
    sort: [['order', 1], ['createdAt', 1]],
    filter: () => [],
    defaults: () => ({}),
    searchFields: ['title.malayalam', 'title.english'],
  },
  {
    key: 'categories',
    coll: 'categories',
    label: 'Categories',
    schema: categorySchema,
    sort: [['group', 1], ['order', 1]],
    filter: (q) => eq(q, 'group'),
    defaults: () => ({}),
    unique: [['group', 'key']],
    searchFields: ['key', 'label.malayalam', 'label.english'],
  },
];

export const registryByKey = new Map(contentRegistry.map((entry) => [entry.key, entry]));

/** Fields every new content doc starts with, before the entry's own defaults and the request body. */
export const baseDefaults = () => ({ order: 0, isPublished: false, deletedAt: null });
