import { z } from 'zod';
import {
  RitualStep,
  Dua,
  GuideTopic,
  TawafDua,
  SaiDua,
  ChecklistTemplate,
  EmergencyContact,
  Audio,
  Category,
  CATEGORY_GROUPS,
} from '../models/index.js';
import { RITUAL_TYPES, RITUAL_TYPES_WITH_BOTH, AUDIO_TYPES } from '../models/shared.js';
import { SAI_DIRECTIONS } from '../models/saiDua.js';

/* ------------------------------------------------------------ zod helpers */

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'must be a 24-char object id');

/** Malayalam required, other languages optional. */
const locRequired = z.object({
  malayalam: z.string().trim().min(1, 'Malayalam text is required'),
  english: z.string().trim().optional(),
  arabic: z.string().trim().optional(),
});

/** Every language optional; the whole block may be omitted. */
const locOptional = z
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
  instructions: z.array(locRequired).optional(),
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
  title: locRequired,
  arabicText: z.string().trim().min(1),
  transliteration: locOptional,
  meaning: locOptional,
  category: categoryKey.optional(),
  ritualType: z.enum(RITUAL_TYPES_WITH_BOTH).optional(),
  ritualStepId: objectId.nullable().optional(),
  audioId: objectId.nullable().optional(),
});

const guideTopicSessionSchema = z.object({
  sessionTitle: locOptional,
  description: locRequired,
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
  sessions: z.array(guideTopicSessionSchema).optional(),
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
  country: z.string().trim().length(2).optional(),
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

/* --------------------------------------------------------------- registry */

/**
 * Single source of truth shared by the admin CRUD routes, the public list
 * endpoints and `GET /sync`. Adding a content type means adding one entry here.
 */
export const contentRegistry = [
  {
    key: 'ritual-steps',
    syncKey: 'ritualSteps',
    label: 'Ritual Steps',
    model: RitualStep,
    schema: ritualStepSchema,
    sort: { ritualType: 1, order: 1, stepNumber: 1 },
    publicFilter: (q) => {
      const filter = {};
      if (q.ritualType) filter.ritualType = q.ritualType;
      if (q.category) filter.category = q.category;
      return filter;
    },
    searchFields: ['title.malayalam', 'title.english'],
  },
  {
    key: 'duas',
    syncKey: 'duas',
    label: 'Duas',
    model: Dua,
    schema: duaSchema,
    sort: { order: 1, createdAt: 1 },
    publicFilter: (q) => {
      const filter = {};
      // `both` duas belong to hajj *and* umrah, so never filter them out.
      if (q.ritualType) filter.ritualType = { $in: [q.ritualType, 'both'] };
      if (q.category) filter.category = q.category;
      if (q.stepId) filter.ritualStepId = q.stepId;
      return filter;
    },
    searchFields: ['title.malayalam', 'title.english', 'arabicText'],
  },
  {
    key: 'guide-topics',
    syncKey: 'guideTopics',
    label: 'Guide Topics',
    model: GuideTopic,
    schema: guideTopicSchema,
    sort: { order: 1, createdAt: 1 },
    publicFilter: (q) => {
      const filter = {};
      if (q.ritualType) filter.ritualType = { $in: [q.ritualType, 'both'] };
      if (q.category) filter.category = q.category;
      return filter;
    },
    searchFields: ['mainTitle.malayalam', 'mainTitle.english', 'slug'],
  },
  {
    key: 'tawaf-duas',
    syncKey: 'tawafDuas',
    label: 'Tawaf Duas',
    model: TawafDua,
    schema: tawafDuaSchema,
    sort: { order: 1 },
    publicFilter: () => ({}),
    searchFields: ['roundNumber'],
  },
  {
    key: 'sai-duas',
    syncKey: 'saiDuas',
    label: "Sa'i Duas",
    model: SaiDua,
    schema: saiDuaSchema,
    sort: { leg: 1 },
    publicFilter: () => ({}),
    searchFields: [],
  },
  {
    key: 'checklist-template',
    syncKey: 'checklistTemplate',
    label: 'Checklist Template',
    model: ChecklistTemplate,
    schema: checklistTemplateSchema,
    sort: { order: 1 },
    publicFilter: () => ({}),
    searchFields: ['categoryKey', 'name.malayalam'],
  },
  {
    key: 'emergency-contacts',
    syncKey: 'emergencyContacts',
    label: 'Emergency Contacts',
    model: EmergencyContact,
    schema: emergencyContactSchema,
    sort: { order: 1 },
    publicFilter: (q) => {
      const filter = {};
      if (q.country) filter.country = q.country.toUpperCase();
      if (q.category) filter.category = q.category;
      return filter;
    },
    searchFields: ['name.malayalam', 'name.english', 'number'],
  },
  {
    key: 'audio',
    syncKey: 'audio',
    label: 'Audio Library',
    model: Audio,
    schema: audioSchema,
    sort: { order: 1, createdAt: -1 },
    publicFilter: (q) => (q.type ? { type: q.type } : {}),
    searchFields: ['title.malayalam', 'title.english', 'reciter'],
  },
  {
    key: 'categories',
    syncKey: 'categories',
    label: 'Categories',
    model: Category,
    schema: categorySchema,
    sort: { group: 1, order: 1 },
    publicFilter: (q) => (q.group ? { group: q.group } : {}),
    searchFields: ['key', 'label.malayalam', 'label.english'],
  },
];

export const registryByKey = new Map(contentRegistry.map((entry) => [entry.key, entry]));

export const getEntry = (key) => registryByKey.get(key);
