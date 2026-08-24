export interface Localized {
  malayalam: string;
  english?: string;
  arabic?: string;
}

export interface ContentBase {
  id: string;
  order: number;
  isPublished: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RitualType = 'hajj' | 'umrah';
export type RitualTypeOrBoth = 'hajj' | 'umrah' | 'both';
// Free-text keys managed on the Category screen (see CategoryGroup) rather than fixed unions.
export type DuaCategory = string;
export type AudioType = 'talbiyah' | 'dua' | 'guide';
export type ContactCategory = string;
export type Platform = 'android' | 'ios';
export type AdminRole = 'superadmin' | 'editor';
export type CategoryGroup = 'dua' | 'emergency-contact' | 'ritual-step' | 'guide-topic';

export interface RitualStep extends ContentBase {
  ritualType: RitualType;
  stepNumber: number;
  category?: string | null;
  title: Localized;
  description?: Localized;
  instructions: Localized[];
  imageSource?: 'url' | 'upload';
  imageUrl?: string;
  imageStorageKey?: string;
  videoSource?: 'youtube' | 'upload';
  videoUrl?: string;
  videoFileUrl?: string;
  videoStorageKey?: string;
  hasTawafLink: boolean;
  hasSaiLink: boolean;
  duaIds: string[];
}

export interface Dua extends ContentBase {
  title: Localized;
  arabicText: string;
  transliteration?: Localized;
  meaning?: Localized;
  description?: Localized;
  category: DuaCategory;
  ritualType: RitualTypeOrBoth;
  ritualStepId: string | null;
  audioId: string | null;
}

export interface GuideTopicSession {
  sessionTitle?: Localized;
  description: Localized;
}

export interface GuideTopic extends ContentBase {
  ritualType: RitualTypeOrBoth;
  slug: string;
  category?: string | null;
  mainTitle: Localized;
  sessions: GuideTopicSession[];
  coverImageSource?: 'url' | 'upload';
  coverImage?: string;
  coverImageStorageKey?: string;
  videoSource?: 'youtube' | 'upload';
  videoUrl?: string;
  videoFileUrl?: string;
  videoStorageKey?: string;
}

export interface TawafDua extends ContentBase {
  roundNumber: string;
  label?: Localized;
  arabicText: string;
  transliteration?: Localized;
  meaning?: Localized;
  audioId: string | null;
}

export type SaiDirection = 'safa-marwa' | 'marwa-safa';

export interface SaiDua extends ContentBase {
  leg: number;
  direction: SaiDirection;
  label?: Localized;
  arabicText: string;
  transliteration?: Localized;
  meaning?: Localized;
  audioId: string | null;
}

export interface ChecklistItem {
  key: string;
  title: Localized;
  note?: Localized;
  order: number;
}

export interface ChecklistTemplate extends ContentBase {
  categoryKey: string;
  name: Localized;
  items: ChecklistItem[];
}

export interface EmergencyContact extends ContentBase {
  name: Localized;
  number: string;
  description?: Localized;
  country: string;
  category: ContactCategory;
  iconEmoji?: string;
}

export interface Category extends ContentBase {
  group: CategoryGroup;
  key: string;
  label: Localized;
}

export interface Audio extends ContentBase {
  title: Localized;
  fileUrl: string;
  storageKey?: string;
  durationSeconds: number;
  sizeBytes: number;
  type: AudioType;
  reciter?: string;
  linkedDuaId: string | null;
}

export interface Banner {
  key: string;
  title: Localized;
  subtitle?: Localized;
  imageUrl?: string;
  actionRoute?: string;
  order: number;
  isActive: boolean;
}

export interface QuickAction {
  key: string;
  label: Localized;
  iconEmoji?: string;
  route?: string;
  order: number;
  isActive: boolean;
}

export interface AppSettings {
  id: string;
  highlightedRitual: RitualType;
  announcement?: Localized;
  announcementIsActive: boolean;
  banners: Banner[];
  quickActions: QuickAction[];
  featureFlags: Record<string, boolean>;
  supportEmail?: string;
  supportPhone?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
}

export interface ForceUpdate {
  id: string;
  platform: Platform;
  minVersion: string;
  latestVersion: string;
  storeUrl: string;
  message?: Localized;
  isMandatory: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  firebaseUid: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
  provider?: string;
  language: string;
  platform?: Platform;
  appVersion?: string;
  lastSeenAt: string;
  createdAt: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  ritualType: RitualType;
  completedStepIds: string[];
  currentStepIndex: number;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  fontScale: number;
  arabicFontSize: number;
  language: string;
  notificationsEnabled: boolean;
}

export interface AuditLogEntry {
  id: string;
  adminEmail?: string;
  action: string;
  collectionName: string;
  docId?: string;
  at: string;
}

export interface DashboardData {
  users: { total: number; newThisWeek: number; activeToday: number };
  content: { key: string; label: string; published: number; drafts: number }[];
  totalDrafts: number;
  recentEdits: AuditLogEntry[];
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: ListMeta;
}

export interface ApiErrorBody {
  success: false;
  error: { message: string; status: number; details?: { path: string; message: string }[] };
}
