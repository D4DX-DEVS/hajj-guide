# API reference

Base URL: `http://localhost:4000` in development.

Every response is `{ "success": true, "data": ... }`. List endpoints under
`/api/admin` add `"meta": { page, limit, total, pages }`. Errors are
`{ "success": false, "error": { "message", "status", "details"? } }`.

---

## Health

```
GET /health
```

Returns `200` when Mongo is connected, `503` otherwise, plus whether Firebase and
object storage are configured. Use it as the platform health check.

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
| GET | `/sync?since=<iso8601>` | Incremental changes for the offline cache |

Every list endpoint also has a detail route: `GET /<collection>/<id>`.
Guide topics additionally accept a slug: `GET /guide-topics/ihram-rules`.

Only documents with `isPublished: true` and `deletedAt: null` are returned.

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

### Content CRUD

Available for: `ritual-steps`, `duas`, `guide-topics`, `tawaf-duas`, `sai-duas`,
`checklist-template`, `emergency-contacts`, `audio`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/<collection>` | `?search=&page=&limit=&isPublished=&includeDeleted=` plus the same filters as the public route |
| GET | `/api/admin/<collection>/:id` | |
| POST | `/api/admin/<collection>` | |
| PATCH | `/api/admin/<collection>/:id` | Partial update; use it to flip `isPublished` |
| DELETE | `/api/admin/<collection>/:id` | Soft delete. `?hard=true` removes it permanently |
| POST | `/api/admin/<collection>/:id/restore` | Undo a soft delete |
| POST | `/api/admin/<collection>/reorder` | `{ ids: [...] }` — array position becomes `order` |

Adding a new content type means adding one entry to
[api/src/content/registry.js](../api/src/content/registry.js); the CRUD routes,
public routes and `/sync` all pick it up.

### Settings, media, users

| Method | Path | Notes |
|---|---|---|
| GET / PUT | `/api/admin/settings` | |
| GET | `/api/admin/force-update` | Both platforms |
| PUT | `/api/admin/force-update/:platform` | |
| POST | `/api/admin/upload` | multipart `file` + `folder=audio\|images`, 25 MB cap |
| DELETE | `/api/admin/upload?key=` | |
| GET | `/api/admin/users` | Read-only, `?search=&platform=` |
| GET | `/api/admin/users/:id` | Profile plus progress / bookmark / checklist summary |
| GET | `/api/admin/dashboard` | Counts, drafts, recent edits |
| GET POST PATCH DELETE | `/api/admin/admins` | **superadmin only**; DELETE deactivates rather than removes |

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
