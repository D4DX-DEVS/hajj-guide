# Hajj & Umrah Guide — Backend

MERN backend that owns the app's **content (CMS)** and **user data**, replacing the
old API, the Directus force-update record, and the content hardcoded into the
Flutter app.

Implementation of [BACKEND_PLAN.md](BACKEND_PLAN.md), phases P0–P3.

```
hajj-guide-backend/
  api/          Node 20 + Express 4 + MongoDB (this repo)
  admin/        React + Vite CMS (not built yet)
  docs/         API reference
```

## Quick start

```bash
cd api
npm install
cp .env.example .env          # then set MONGO_URI and the two JWT secrets
npm run seed                  # starter content, Malayalam + English
npm run create-admin -- --email you@example.com --name "You"
npm run dev
```

`GET http://localhost:4000/health` should answer `{"success":true,...}`.

Generate the JWT secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## What exists

| Area | Status |
|---|---|
| Public content API (`/api/v1/*`) | Done — 8 collections + settings + force-update |
| Offline sync (`/api/v1/sync?since=`) | Done — incremental changes and deletions |
| App-user auth (Firebase ID token) | Done — needs `FIREBASE_SERVICE_ACCOUNT` |
| User data (progress, bookmarks, checklist, tent, preferences) | Done, with cross-device merge |
| Account deletion | Done — App Store requirement |
| Admin auth (JWT + refresh, bcrypt) | Done |
| Admin CRUD for every content type | Done — list, search, soft delete, restore, reorder |
| Media upload to Spaces | Done — needs `SPACES_*` |
| Audit log, rate limits, ETags | Done |
| React admin panel | **Not built** — the API is ready for it |
| Push notifications, group activity | Out of scope (P5+) |

## Environment

Everything is validated by zod at boot ([api/src/config/env.js](api/src/config/env.js)) —
a missing or malformed variable fails the process with a readable message instead
of a runtime surprise.

Firebase and Spaces are optional. Without them the server still boots; the routes
that need them return `503` with an explanatory message.

## Notes

- **Response envelope** is `{ success, data }` everywhere, because the existing
  Flutter parsers depend on it. Errors are `{ success: false, error: { message, status } }`.
- **Malayalam is required** on every localised field; English and Arabic are optional.
- **Soft delete** — content is never hard-deleted by default, so `/sync` can tell
  the app to drop it from the offline cache. `DELETE ...?hard=true` overrides.
- **Checklist item keys are stable identifiers.** `userChecklist.checkedKeys`
  references them; renaming a key unticks that item for every pilgrim.

See [docs/api.md](docs/api.md) for the endpoint reference.
