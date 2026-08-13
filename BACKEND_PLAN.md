# Backend Plan — Hajj & Umrah Guide (MERN)

Date: 2026-08-11
Scope decided with client: **new MERN backend from scratch** (old API source inaccessible), owning **content (CMS) + user data**, with an **admin panel** to enter data.

---

## 1. Why a backend is needed (evidence from the app)

| App area | Today | Needs backend |
|---|---|---|
| Ritual steps | Remote (old API) + `lib/data/demo_rituals.dart` fallback | Yes — re-host |
| Duas | Remote (old API) + `lib/data/demo_duas.dart` fallback | Yes — re-host |
| App settings (`highlightedRitual`) | Remote (old API) | Yes — re-host |
| Force update | Directus (`directus.d4dx.co`) | Yes — consolidate |
| Guide topic content | **Lorem ipsum placeholder** (`guide_topic_detail_screen.dart`) | Yes — real content |
| Tawaf round duas | Hardcoded (`lib/features/tawaf/data/tawaf_duas.dart`) | Yes |
| Sa'i duas / leg text | Hardcoded in models | Yes |
| Trip checklist | Hardcoded (`trip_checklist_item.dart`), progress in prefs | Yes (template + progress) |
| SOS emergency contacts | Hardcoded (`kSaudiEmergencyContacts`) | Yes |
| Audio (Talbiyah etc.) | Endpoint existed, app never used it | Yes |
| Ritual progress, bookmarks, checklist ticks, my-tent, font/theme/language | `SharedPreferences` only, device-local | Yes — user sync |
| Auth | Firebase (Google/Apple), no server record of users | Yes — user records |
| Group activity | `kSampleGroupMembers` sample data | Out of scope now (phase later) |
| Prayer times | Local `adhan` calc | No — stays offline |

**Seeding decision (revised):** there is no reachable legacy API to dump, so the
new database is seeded from hand-written starter content
([api/scripts/seed-data.js](api/scripts/seed-data.js)) and edited from there
through the admin panel.

---

## 2. Stack

- **Runtime:** Node 20 LTS, Express 4, ES modules
- **DB:** MongoDB Atlas + Mongoose 8
- **Validation:** zod (request bodies + env)
- **App-user auth:** `firebase-admin` — verify the Firebase ID token the app already gets from Google/Apple sign-in. No second password system for pilgrims.
- **Admin auth:** email + password (bcrypt) — short-lived JWT access token + refresh token, separate `adminUsers` collection
- **Media:** DigitalOcean Spaces (S3-compatible) via `multer` + AWS SDK v3 — audio files, step/guide images
- **Hardening:** helmet, cors allowlist, express-rate-limit, pino logging, centralised error handler
- **Admin panel:** React 18 + Vite + TypeScript, React Router, TanStack Query, react-hook-form + zod, Tailwind
- **Deploy:** API on DigitalOcean App Platform; Admin as a static site (same platform); DB on Atlas; media on Spaces

### Repo layout

```
hajj-guide-backend/
  api/
    src/
      config/          env.js, db.js, firebase.js, storage.js
      models/          ritualStep.js, dua.js, guideTopic.js, ...
      content/         registry.js  (single source of truth per content type)
      routes/
        public/        content routes (no auth)
        user/          user-data routes (firebase token)
        admin/         CRUD routes (admin JWT)
      middleware/      auth.firebase.js, auth.admin.js, validate.js, error.js
      services/        audit.js
      utils/
      app.js  server.js
    scripts/           seed.js, seed-data.js, create-admin.js
  admin/               React + Vite CMS
  docs/                api.md
```

Two apps in one repo (simple monorepo, no workspace tooling needed).

---

## 3. Data model

### Content collections

All localised text uses a shared shape `{ malayalam, english?, arabic? }` — Malayalam is required, others optional (matches the "Malayalam first, other languages later" requirement in the spec doc).

- **ritualSteps** — `ritualType` (`hajj`|`umrah`), `stepNumber`, `title`, `description`, `instructions[]`, `iconEmoji`, `imageUrl`, `videoUrl` (YouTube ID), `hasTawafLink`, `hasSaiLink`, `duaIds[]`, `isPublished`, `order`
- **duas** — `title`, `arabicText`, `transliteration`, `meaning` (localised), `category` (ihram/talbiyah/tawaf/zamzam/sai/arafah/mina/general), `ritualType` (`hajj`|`umrah`|`both`), `ritualStepId`, `audioId`, `order`, `isPublished`
- **guideTopics** — replaces the lorem-ipsum screen: `ritualType`, `slug`, `mainTitle`, `sessions[]` (`sessionTitle` optional, `description` required, both localised — `## text ##` in a description renders bold), `order`, `coverImage`, `isPublished`
- **tawafDuas** — `roundNumber` (1-7, plus `start`/`end` markers), `arabicText`, `transliteration`, `meaning`, `audioId`
- **saiDuas** — `leg` (1-7), `direction` (safa-marwa / marwa-safa), same text fields
- **checklistTemplates** — `category` (localised name, order) with `items[]` (`key`, `title`, `iconEmoji`, `order`). Item `key` must stay stable — user tick state references it
- **emergencyContacts** — `name` (localised), `number`, `country`, `category` (police/ambulance/hajj-mission/embassy), `iconEmoji`, `order`
- **audio** — `title`, `fileUrl`, `durationSeconds`, `type` (talbiyah/dua/guide), `linkedDuaId`
- **appSettings** — single document: `highlightedRitual`, home banners, quick-action tiles, feature flags, announcement text
- **forceUpdate** — per platform (`android`/`ios`): `minVersion`, `latestVersion`, `storeUrl`, `message` (localised), `isMandatory` — migrates the app off Directus

Every content doc carries `createdAt`, `updatedAt`, `isPublished`, `deletedAt` (soft delete) so the sync endpoint can send incremental changes.

### User collections

- **users** — `firebaseUid` (unique index), `email`, `displayName`, `photoUrl`, `provider`, `language`, `platform`, `appVersion`, `fcmToken`, `lastSeenAt`
- **userProgress** — `userId`, `ritualType`, `completedStepIds[]`, `currentStepIndex`, `updatedAt`
- **userBookmarks** — `userId`, `itemType` (dua/step/guideTopic), `itemId`, `createdAt`
- **userChecklist** — `userId`, `checkedKeys[]`
- **userTent** — `userId`, `lat`, `lng`, `accuracy`, `address`, `savedAt`
- **userPreferences** — `userId`, `theme`, `fontScale`, `arabicFontSize`, `language`
- **userSessions** *(optional, phase 4)* — completed tawaf/sa'i sessions for stats

### Admin collections

- **adminUsers** — `email`, `passwordHash`, `name`, `role` (`superadmin`|`editor`), `isActive`
- **auditLogs** — `adminId`, `action`, `collection`, `docId`, `diff`, `at`

---

## 4. API surface

Version everything under `/api/v1`.

### Public (no auth, cacheable)

```
GET /api/v1/settings
GET /api/v1/force-update?platform=android|ios
GET /api/v1/ritual-steps?ritualType=hajj|umrah
GET /api/v1/ritual-steps/:id
GET /api/v1/duas?ritualType=&category=&stepId=
GET /api/v1/duas/:id
GET /api/v1/guide-topics?ritualType=
GET /api/v1/guide-topics/:slug
GET /api/v1/tawaf-duas
GET /api/v1/sai-duas
GET /api/v1/checklist-template
GET /api/v1/emergency-contacts
GET /api/v1/audio
GET /api/v1/sync?since=<iso8601>     // all content changed since timestamp
```

Response envelope stays `{ success, data }` so existing Flutter parsers keep working. `ETag` + `If-None-Match` on every GET; `/sync` powers offline-first caching (spec requires offline access).

### User (header `Authorization: Bearer <firebase-id-token>`)

```
POST   /api/v1/me                    // upsert profile on login, returns user
GET    /api/v1/me
PATCH  /api/v1/me/preferences
GET    /api/v1/me/progress
PUT    /api/v1/me/progress/:ritualType
GET    /api/v1/me/bookmarks
POST   /api/v1/me/bookmarks
DELETE /api/v1/me/bookmarks/:id
GET    /api/v1/me/checklist
PUT    /api/v1/me/checklist
GET    /api/v1/me/tent
PUT    /api/v1/me/tent
DELETE /api/v1/me                    // account deletion (App Store requirement)
```

Conflict rule: last-write-wins by `updatedAt`, except progress/bookmarks/checklist which **merge by union** (a step completed on either device stays completed). Prevents losing progress when a pilgrim reinstalls mid-trip. A `mode: "replace"` field is available for deliberate resets and for unticking checklist items, which a pure union cannot express.

### Admin (header `Authorization: Bearer <admin-jwt>`)

```
POST   /api/admin/auth/login | refresh | logout
GET    /api/admin/me
CRUD   /api/admin/<collection>        // all content collections
POST   /api/admin/upload              // audio + images to Spaces
GET    /api/admin/users               // read-only list, search, stats
GET    /api/admin/dashboard           // counts: users, published items, recent edits
POST   /api/admin/admins              // superadmin only
```

---

## 5. Admin panel screens

1. **Login**
2. **Dashboard** — user count, signups this week, content counts, unpublished drafts
3. **Ritual Steps** — list by hajj/umrah, drag-to-reorder, form with Malayalam/English/Arabic tabs, YouTube ID field, `hasTawafLink` toggle, linked duas picker
4. **Duas** — table with category/ritual filters, Arabic RTL input, audio attach
5. **Guide Topics** — rich-text editor per chapter (this replaces the placeholder screen)
6. **Tawaf Duas / Sa'i Duas** — fixed-row editors (7 rounds / 7 legs)
7. **Checklist Template** — categories + items, reorder, stable-key warning on edit
8. **Emergency Contacts** — simple CRUD
9. **Audio Library** — upload, preview, link to dua
10. **App Settings** — highlighted ritual, banners, feature flags
11. **Force Update** — per-platform version gate
12. **Users** — read-only list/search, per-user progress view
13. **Admins** — superadmin only

Every content form has a **Publish / Draft** switch and a preview of the Malayalam rendering.

---

## 6. Flutter-side changes

Keep the existing pattern — `ApiConstants` to repository to provider to UI, with demo data as first paint. No UI rewrites.

1. Point `_baseUrl` at the new API; drop `_directusUrl` once force-update moves over.
2. `ApiClient`: add `post`/`put`/`delete`, an auth-header hook that attaches the Firebase ID token, and ETag handling.
3. New repositories: `GuideTopicRepository`, `TawafDuaRepository`, `SaiDuaRepository`, `ChecklistRepository`, `EmergencyContactRepository`, `AudioRepository`, `SettingsRepository`, `UserSyncRepository`.
4. New `SyncService` + sqflite cache (sqflite is already a dependency): on launch call `/sync?since=`, write to local tables, providers read local-first. Gives real offline support instead of hardcoded fallback.
5. `AuthProvider`: after Firebase sign-in, `POST /api/v1/me`; on sign-out, keep local data but stop syncing.
6. Existing prefs-backed providers (`RitualProvider`, `BookmarkProvider`, `TripChecklistProvider`, `MyTentProvider`, settings providers) gain a push-to-server call after each local write, debounced ~2 s.
7. Keep `demo_duas.dart` / `demo_rituals.dart` as the cold-start fallback.

---

## 7. Environments & ops

- `dev` (local Mongo or Atlas free tier) and `prod` (Atlas paid, DO App Platform)
- Secrets via platform env vars: `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FIREBASE_SERVICE_ACCOUNT` (base64 JSON), `SPACES_KEY/SECRET/BUCKET/REGION`, `CORS_ORIGINS`
- Atlas daily backups + a weekly `mongodump` to Spaces
- `/health` endpoint for platform health checks
- Rate limits: 60 req/min per IP public, 120 req/min per user, 10 login attempts per 15 min

---

## 8. Phases

| Phase | Work | Status |
|---|---|---|
| **P0 — Scaffold** | Repo, Express app, Mongo connection, health check, error handler, admin auth + `create-admin` script | Done |
| **P1 — Core content parity** | Models + public GETs + admin CRUD for ritualSteps, duas, settings, forceUpdate; seed data | Done (API); admin screens pending |
| **P2 — New content** | guideTopics (kills lorem ipsum), tawafDuas, saiDuas, checklistTemplate, emergencyContacts, audio + Spaces upload | Done (API); admin screens and Flutter repositories pending |
| **P3 — User data** | firebase-admin token middleware, users + progress/bookmarks/checklist/tent/preferences, merge rules, account deletion | Done (API); admin Users screen done; Flutter sync wiring pending |
| **P4 — Offline & hardening** | `/sync?since=`, ETags, rate limits, audit log — done. sqflite cache layer in app, backups — pending | Partial |
| **P5 — Admin panel** | React + Vite CMS, 13 screens | Not started |

**Deliberately out of scope now:** group activity / live location sharing, push notifications & announcements, multi-language beyond ml/en/ar fields, analytics dashboards. All fit the model above as later additions.

---

## 9. Open questions

1. ~~Old API host — any chance of DB credentials or an Atlas handover?~~ **Resolved:** no legacy API; seeded from new starter content.
2. Hosting account — reuse the existing DigitalOcean org, or a fresh one?
3. Who writes the guide-topic content, and in which format? The body field takes markdown, so headings and lists are supported.
4. Should signed-out users still get content? (Assumed yes — content endpoints are public.)
5. Audio files — do they exist already, or are they to be recorded? Nothing is seeded until they do.
