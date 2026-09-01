# API reference

Base URL: `http://localhost:4000` in development.

Every response is `{ "success": true, "data": ... }`. List endpoints under
`/api/admin` add `"meta": { page, limit, total, pages }`. Errors are
`{ "success": false, "error": { "message", "status", "details"? } }`, for example:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "status": 400,
    "details": [{ "path": "title.malayalam", "message": "Malayalam text is required" }]
  }
}
```

---

## Health

```
GET /health
```

Returns `200` when Mongo is connected, `503` otherwise, plus whether Firebase and
object storage are configured. Use it as the platform health check.

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "db": "connected",
    "firebase": "configured",
    "storage": "configured",
    "uptimeSeconds": 4521,
    "version": "1.0.0"
  }
}
```

---

## Public — `/api/v1`

No authentication. Cacheable (`Cache-Control: public, max-age=300`) with strong
ETags, so send `If-None-Match` and expect `304`.

| Method | Path | Notes |
|---|---|---|
| GET | `/settings` | Singleton: highlighted ritual, banners, quick actions, feature flags |
| GET | `/force-update?platform=android\|ios` | Version gate; replaces Directus |
| GET | `/ritual-steps?ritualType=hajj\|umrah` | |
| GET | `/duas?ritualType=&category=&stepId=` | `ritualType` also returns `both` duas |
| GET | `/guide-topics?ritualType=` | |
| GET | `/tawaf-duas` | 7 rounds plus `start` / `end` |
| GET | `/sai-duas` | 7 legs |
| GET | `/checklist-template` | Categories, each with `items[]` |
| GET | `/emergency-contacts?country=&category=` | |
| GET | `/audio?type=talbiyah\|dua\|guide` | |
| GET | `/categories?group=` | |
| GET | `/sync?since=<iso8601>` | Incremental changes for the offline cache |

Every list endpoint also has a detail route: `GET /<collection>/<id>`.
Guide topics additionally accept a slug: `GET /guide-topics/ihram-rules`.

Only documents with `isPublished: true` and `deletedAt: null` are returned.

List responses are `{ "success": true, "data": [ <document>, ... ] }`; detail
routes return `{ "success": true, "data": <document> }`. Every document shares
`order`, `isPublished`, `deletedAt`, `createdAt`, `updatedAt` plus `id` (Mongo
`_id` as a string). The type-specific fields for each collection:

### `GET /settings`

```json
{
  "success": true,
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "highlightedRitual": "umrah",
    "announcement": { "malayalam": "...", "english": "...", "arabic": "..." },
    "announcementIsActive": true,
    "banners": [
      { "key": "welcome", "title": { "malayalam": "..." }, "imageUrl": "https://...", "actionRoute": "/guide", "order": 0, "isActive": true }
    ],
    "quickActions": [
      { "key": "duas", "label": { "malayalam": "..." }, "iconEmoji": "🤲", "route": "/duas", "order": 0, "isActive": true }
    ],
    "featureFlags": { "liveTawafCounter": true },
    "supportEmail": "support@example.com",
    "supportPhone": "+966500000000",
    "privacyPolicyUrl": "https://example.com/privacy",
    "termsUrl": "https://example.com/terms",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-08-01T00:00:00.000Z"
  }
}
```

### `GET /force-update`

```json
{
  "success": true,
  "data": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "platform": "android",
    "minVersion": "1.2.0",
    "latestVersion": "1.4.0+45",
    "storeUrl": "https://play.google.com/store/apps/details?id=...",
    "message": { "malayalam": "..." },
    "isMandatory": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-07-01T00:00:00.000Z"
  }
}
```

### `GET /ritual-steps`

```json
{
  "id": "65f...",
  "ritualType": "umrah",
  "stepNumber": 3,
  "category": "tawaf",
  "title": { "malayalam": "ത്വവാഫ്", "english": "Tawaf", "arabic": "الطواف" },
  "description": { "malayalam": "...", "english": "..." },
  "instructions": [{ "malayalam": "...", "english": "...", "description": { "malayalam": "<p>...</p>" } }],
  "iconEmoji": "🕋",
  "imageUrl": "https://...",
  "videoUrl": "https://youtube.com/...",
  "hasTawafLink": true,
  "hasSaiLink": false,
  "duaIds": ["65a..."],
  "order": 3,
  "isPublished": true,
  "deletedAt": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### `GET /duas`

```json
{
  "id": "65a...",
  "title": { "malayalam": "...", "english": "Talbiyah" },
  "arabicText": "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ",
  "transliteration": { "english": "Labbayk Allahumma Labbayk" },
  "meaning": { "malayalam": "...", "english": "..." },
  "category": "talbiyah",
  "ritualType": "both",
  "ritualStepId": "65f...",
  "audioId": "65b...",
  "order": 0,
  "isPublished": true,
  "deletedAt": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### `GET /guide-topics`

```json
{
  "id": "65c...",
  "ritualType": "umrah",
  "slug": "ihram-rules",
  "category": "ihram",
  "mainTitle": { "malayalam": "...", "english": "Ihram Rules" },
  "sessions": [{ "sessionTitle": { "english": "Before entering Ihram" }, "description": { "malayalam": "..." } }],
  "coverImage": "https://...",
  "videoUrl": "https://youtube.com/...",
  "iconEmoji": "📖",
  "order": 0,
  "isPublished": true,
  "deletedAt": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### `GET /tawaf-duas`

```json
{
  "id": "65d...",
  "roundNumber": "1",
  "label": { "malayalam": "...", "english": "Round 1" },
  "arabicText": "...",
  "transliteration": { "english": "..." },
  "meaning": { "malayalam": "..." },
  "audioId": "65b...",
  "order": 1,
  "isPublished": true,
  "deletedAt": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

`roundNumber` is one of `start`, `1`–`7`, `end`.

### `GET /sai-duas`

```json
{
  "id": "65e...",
  "leg": 1,
  "direction": "safa-to-marwah",
  "label": { "malayalam": "..." },
  "arabicText": "...",
  "transliteration": { "english": "..." },
  "meaning": { "malayalam": "..." },
  "audioId": "65b...",
  "order": 1,
  "isPublished": true,
  "deletedAt": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### `GET /checklist-template`

```json
{
  "id": "65f...",
  "categoryKey": "documents",
  "name": { "malayalam": "...", "english": "Documents" },
  "iconEmoji": "📄",
  "items": [
    { "key": "passport", "title": { "malayalam": "...", "english": "Passport" }, "note": { "english": "..." }, "iconEmoji": "🛂", "order": 0 }
  ],
  "order": 0,
  "isPublished": true,
  "deletedAt": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### `GET /emergency-contacts`

```json
{
  "id": "65g...",
  "name": { "malayalam": "...", "english": "Police" },
  "number": "999",
  "description": { "english": "..." },
  "country": "SA",
  "category": "police",
  "iconEmoji": "🚓",
  "order": 0,
  "isPublished": true,
  "deletedAt": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### `GET /audio`

```json
{
  "id": "65b...",
  "title": { "malayalam": "...", "english": "Talbiyah" },
  "fileUrl": "https://cdn.example.com/audio/talbiyah.mp3",
  "storageKey": "audio/1699999999-abcd1234.mp3",
  "durationSeconds": 42,
  "sizeBytes": 675000,
  "type": "talbiyah",
  "reciter": "...",
  "linkedDuaId": "65a...",
  "order": 0,
  "isPublished": true,
  "deletedAt": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### `GET /categories`

```json
{
  "id": "65h...",
  "group": "dua",
  "key": "talbiyah",
  "label": { "malayalam": "...", "english": "Talbiyah" },
  "order": 0,
  "isPublished": true,
  "deletedAt": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

`group` is one of `dua`, `emergency-contact`, `ritual-step`, `guide-topic`.

### `GET /sync`

```jsonc
{
  "success": true,
  "data": {
    "since": "2026-08-01T00:00:00.000Z",  // null on a full snapshot
    "now": "2026-08-11T09:14:02.113Z",    // pass this back as `since` next time
    "full": false,
    "settings": { },
    "forceUpdate": [ ],
    "changed": { "ritualSteps": [ ], "duas": [ ], "...": [ ] },
    "deleted": { "ritualSteps": ["65f..."], "...": [ ] }
  }
}
```

`changed` and `deleted` carry one key per collection — the `syncKey` from
[api/src/content/registry.js](../api/src/content/registry.js) (`ritualSteps`,
`duas`, `guideTopics`, `tawafDuas`, `saiDuas`, `checklistTemplate`,
`emergencyContacts`, `audio`, `categories`). `changed[key]` holds full documents
in the shape shown above; `deleted[key]` holds plain id strings.

Omit `since` for the first launch. A document that was **unpublished** appears in
`deleted` — otherwise stale content would live in the cache forever.

---

## User — `/api/v1/me`

Header: `Authorization: Bearer <firebase-id-token>` — the token the app already
receives from Google / Apple sign-in. `Cache-Control: no-store`. Rate limit is
per Firebase uid.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/me` | Upsert profile on login. Creates the record on first call — must run before the others |
| GET | `/api/v1/me` | |
| DELETE | `/api/v1/me` | Account deletion: wipes user data, deletes the Firebase user |
| GET / PATCH | `/api/v1/me/preferences` | theme, fontScale, arabicFontSize, language |
| GET | `/api/v1/me/progress` | Both ritual types |
| PUT | `/api/v1/me/progress/:ritualType` | |
| GET / POST | `/api/v1/me/bookmarks` | |
| DELETE | `/api/v1/me/bookmarks/:id` | Accepts the bookmark id **or** the bookmarked item id |
| GET / PUT | `/api/v1/me/checklist` | |
| GET / PUT / DELETE | `/api/v1/me/tent` | |

`DELETE` routes (`/me`, `/me/bookmarks/:id`, `/me/tent`) return `204 No Content`
— no body.

### `POST` / `GET /api/v1/me`

```json
{
  "success": true,
  "data": {
    "id": "66a...",
    "firebaseUid": "AbCdEf123...",
    "email": "pilgrim@example.com",
    "displayName": "Ahmed",
    "photoUrl": "https://...",
    "provider": "google.com",
    "language": "ml",
    "platform": "android",
    "appVersion": "1.4.0",
    "lastSeenAt": "2026-08-19T08:00:00.000Z",
    "deletedAt": null,
    "createdAt": "2026-08-01T00:00:00.000Z",
    "updatedAt": "2026-08-19T08:00:00.000Z"
  }
}
```

`fcmToken` is accepted on write but never returned in responses.

### `GET` / `PATCH /api/v1/me/preferences`

```json
{
  "success": true,
  "data": {
    "id": "66b...",
    "userId": "66a...",
    "theme": "system",
    "fontScale": 1,
    "arabicFontSize": 24,
    "language": "ml",
    "notificationsEnabled": true,
    "createdAt": "2026-08-01T00:00:00.000Z",
    "updatedAt": "2026-08-01T00:00:00.000Z"
  }
}
```

### `GET /api/v1/me/progress`

Array — one entry per ritual type the pilgrim has touched.

```json
{
  "success": true,
  "data": [
    {
      "id": "66c...",
      "userId": "66a...",
      "ritualType": "umrah",
      "completedStepIds": ["65f...", "65a..."],
      "currentStepIndex": 2,
      "createdAt": "2026-08-01T00:00:00.000Z",
      "updatedAt": "2026-08-19T08:00:00.000Z"
    }
  ]
}
```

### `PUT /api/v1/me/progress/:ritualType`

Returns the single updated document (same shape as one array entry above).

### `GET` / `POST /api/v1/me/bookmarks`

```json
{
  "success": true,
  "data": [
    {
      "id": "66d...",
      "userId": "66a...",
      "itemType": "dua",
      "itemId": "65a...",
      "createdAt": "2026-08-05T00:00:00.000Z",
      "updatedAt": "2026-08-05T00:00:00.000Z"
    }
  ]
}
```

`POST` returns `201` with a single bookmark object in `data` (not an array).

### `GET` / `PUT /api/v1/me/checklist`

```json
{
  "success": true,
  "data": {
    "id": "66e...",
    "userId": "66a...",
    "checkedKeys": ["passport", "vaccination"],
    "createdAt": "2026-08-01T00:00:00.000Z",
    "updatedAt": "2026-08-19T08:00:00.000Z"
  }
}
```

### `GET` / `PUT /api/v1/me/tent`

```json
{
  "success": true,
  "data": {
    "id": "66f...",
    "userId": "66a...",
    "lat": 21.4225,
    "lng": 39.8262,
    "accuracy": 12.5,
    "address": "Camp 4, Mina",
    "note": "Near gate B",
    "savedAt": "2026-08-19T08:00:00.000Z",
    "createdAt": "2026-08-19T08:00:00.000Z",
    "updatedAt": "2026-08-19T08:00:00.000Z"
  }
}
```

### Conflict handling

`PUT /progress/:ritualType` and `PUT /checklist` take a `mode` field:

- `merge` (**default**) — unions with what the server already holds, and takes the
  higher `currentStepIndex`. A step completed on either device stays completed,
  so reinstalling mid-trip cannot lose progress.
- `replace` — the request body becomes the new state. Required for a deliberate
  reset, and for **unticking** a checklist item: under `merge` an unticked key is
  simply absent from the payload, which the union then restores.

The app should send `merge` for background syncs and `replace` when the pilgrim
actively unticks or resets something.

```http
PUT /api/v1/me/progress/umrah
{ "completedStepIds": ["65f...", "65a..."], "currentStepIndex": 2, "mode": "merge" }
```

---

## Admin — `/api/admin`

Header: `Authorization: Bearer <admin-access-token>` (except the two auth routes).

### Auth

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | `{ email, password }` → `{ admin, accessToken, refreshToken }`. 10 attempts / 15 min |
| POST | `/auth/refresh` | `{ refreshToken }` → new pair |
| POST | `/auth/logout` | Revokes every refresh token for the account |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }` |
| GET | `/me` | The signed-in admin |

Access tokens last 15 minutes, refresh tokens 30 days (both configurable).

```json
// POST /auth/login → 200
{
  "success": true,
  "data": {
    "admin": {
      "id": "67a...",
      "email": "admin@example.com",
      "name": "Admin",
      "role": "superadmin",
      "isActive": true,
      "lastLoginAt": "2026-08-19T08:00:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-08-19T08:00:00.000Z"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

`passwordHash` and `tokenVersion` are never serialised. `/auth/refresh` returns
`{ accessToken, refreshToken }` only; `/auth/logout` returns `{ loggedOut: true }`;
`/auth/change-password` returns `{ changed: true }`; `GET /me` returns the same
admin object shown above.

### Content CRUD

Available for: `ritual-steps`, `duas`, `guide-topics`, `tawaf-duas`, `sai-duas`,
`checklist-template`, `emergency-contacts`, `audio`, `categories`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/<collection>` | `?search=&page=&limit=&isPublished=&includeDeleted=` plus the same filters as the public route |
| GET | `/api/admin/<collection>/:id` | |
| POST | `/api/admin/<collection>` | |
| PATCH | `/api/admin/<collection>/:id` | Partial update; use it to flip `isPublished` |
| DELETE | `/api/admin/<collection>/:id` | Soft delete. `?hard=true` removes it permanently |
| POST | `/api/admin/<collection>/:id/restore` | Undo a soft delete |
| POST | `/api/admin/<collection>/reorder` | `{ ids: [...] }` — array position becomes `order` |

`GET /api/admin/<collection>` returns every document (published or not) as a
paginated list — the same document shape documented under [Public](#public--apiv1)
for that collection, plus `meta`:

```json
{
  "success": true,
  "data": [ /* documents, including unpublished ones */ ],
  "meta": { "page": 1, "limit": 50, "total": 132, "pages": 3 }
}
```

`GET /:id`, `POST`, `PATCH`, `POST /:id/restore` return a single document in
`data` (no `meta`). `DELETE /:id` returns `{ "id": "...", "deleted": "soft" }`
or `{ "id": "...", "deleted": "permanent" }` (with `?hard=true`). `POST /reorder`
returns `{ "matched": 5, "modified": 5 }`.

Adding a new content type means adding one entry to
[api/src/content/registry.js](../api/src/content/registry.js); the CRUD routes,
public routes and `/sync` all pick it up.

### Settings, media, users

| Method | Path | Notes |
|---|---|---|
| GET / PUT | `/api/admin/settings` | |
| GET | `/api/admin/force-update` | Both platforms |
| PUT | `/api/admin/force-update/:platform` | |
| POST | `/api/admin/upload` | multipart `file` + `folder=audio\|images\|videos`, 50 MB cap |
| DELETE | `/api/admin/upload?key=` | |
| GET | `/api/admin/users` | Read-only, `?search=&platform=` |
| GET | `/api/admin/users/:id` | Profile plus progress / bookmark / checklist summary |
| GET | `/api/admin/dashboard` | Counts, drafts, recent edits |
| GET POST PATCH DELETE | `/api/admin/admins` | **superadmin only**; DELETE deactivates rather than removes (`?hard=true` deletes permanently); blocked on self and on the last active superadmin |

`GET` / `PUT /api/admin/settings` and `GET /api/admin/force-update` return the
same document shapes as [`GET /settings`](#get-settings) and
[`GET /force-update`](#get-force-update) above (force-update as an array here,
one entry per platform, instead of the public route's single-platform lookup).

```json
// POST /api/admin/upload → 200
{
  "success": true,
  "data": {
    "key": "audio/1699999999-abcd1234.mp3",
    "url": "https://bucket.example-cdn.com/audio/1699999999-abcd1234.mp3",
    "size": 675000,
    "mimeType": "audio/mpeg"
  }
}
```

`DELETE /api/admin/upload?key=` returns `{ "key": "...", "deleted": true }`.

```json
// GET /api/admin/users/:id → 200
{
  "success": true,
  "data": {
    "user": { /* same shape as GET /api/v1/me */ },
    "progress": [ /* same shape as GET /api/v1/me/progress */ ],
    "bookmarkCount": 7,
    "checkedItems": 12,
    "hasTent": true,
    "preferences": { /* same shape as GET /api/v1/me/preferences */ }
  }
}
```

```json
// GET /api/admin/dashboard → 200
{
  "success": true,
  "data": {
    "users": { "total": 4210, "newThisWeek": 96, "activeToday": 340 },
    "content": [
      { "key": "ritual-steps", "label": "Ritual Steps", "published": 24, "drafts": 2 }
    ],
    "totalDrafts": 9,
    "recentEdits": [
      {
        "id": "68a...",
        "adminId": "67a...",
        "adminEmail": "admin@example.com",
        "action": "update",
        "collectionName": "ritual-steps",
        "docId": "65f...",
        "diff": { "isPublished": true },
        "ip": "203.0.113.4",
        "at": "2026-08-19T07:55:00.000Z"
      }
    ]
  }
}
```

```json
// GET/POST/PATCH /api/admin/admins → 200/201
{
  "success": true,
  "data": {
    "id": "67a...",
    "email": "editor@example.com",
    "name": "Editor",
    "role": "editor",
    "isActive": true,
    "lastLoginAt": null,
    "createdAt": "2026-08-01T00:00:00.000Z",
    "updatedAt": "2026-08-01T00:00:00.000Z"
  }
}
```

`GET /` returns an array of the object above. `DELETE /:id` returns
`{ "id": "...", "isActive": false }` (deactivate) or `{ "id": "...", "deleted": "permanent" }`
(`?hard=true`).

---

## Rate limits

| Scope | Limit |
|---|---|
| Public content | 60 req/min per IP |
| User routes | 120 req/min per Firebase uid |
| Admin login | 10 attempts / 15 min per IP + email |

Configurable via `RATE_LIMIT_PUBLIC` and `RATE_LIMIT_USER`.

---

## Localised fields

```json
{ "malayalam": "ത്വവാഫ്", "english": "Tawaf", "arabic": "الطواف" }
```

`malayalam` is required, the rest are optional.
