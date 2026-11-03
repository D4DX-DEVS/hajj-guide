# Hajj & Umrah Guide — Backend

Backend that owns the app's **content (CMS)** and **user data**, replacing the
old API, the Directus force-update record, and the content hardcoded into the
Flutter app. Runs on **Cloudflare**: the API is a Worker (Hono) with **D1** as the
database and **R2** for uploaded audio/images/video; the admin panel is served by the same Worker as static assets.

Implementation of [BACKEND_PLAN.md](BACKEND_PLAN.md), phases P0–P3 (the plan's Express/Mongo/Spaces
stack was replaced by Workers/D1/R2).

```
api/          Cloudflare Worker (Hono) + D1 migrations + data scripts
admin/        React + Vite CMS (served by the API Worker)
docs/         API reference
```

## Local development

```bash
cd api
npm install
cp .dev.vars.example .dev.vars        # JWT secrets for local dev
npm run db:migrate:local
npm run seed -- --local               # starter content, Malayalam + English
npm run create-admin -- --local --email you@example.com --name "You"
npm run dev                           # http://localhost:8787
```

`GET /health` should answer `{"success":true,...}`. Generate real secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Deploy to Cloudflare

One-time setup (needs `npx wrangler login`):

```bash
cd api
npx wrangler d1 create hajj-guide            # copy the database_id into wrangler.toml
npx wrangler r2 bucket create hajj-guide-media
npx wrangler secret put JWT_SECRET           # >= 32 random chars
npx wrangler secret put JWT_REFRESH_SECRET
# edit wrangler.toml [vars]: CORS_ORIGINS (admin panel URL), FIREBASE_PROJECT_ID, optionally R2_PUBLIC_URL
npm run db:migrate:remote
npm run seed -- --remote                     # optional starter content
npm run create-admin -- --remote --email you@example.com --name "You"
npm run deploy                               # prints https://hajj-guide-api.<account>.workers.dev
```

Admin panel — served by the same Worker at `/` (one link). Rebuild it with an empty `VITE_API_URL` (same origin), then redeploy the API:

```bash
cd admin && npm install && VITE_API_URL= npm run build
cd ../api && npm run deploy
```

Point the Flutter app at the Worker URL. `CORS_ORIGINS` is only needed for the local admin dev server (`http://localhost:5173`).

### Moving the old MongoDB data

```bash
cd api
MONGO_URI="mongodb+srv://..." npm run migrate-mongo -- --remote
```

Copies every collection (content, users, user data, admins, audit log) into D1 keeping the original ids.
Files already on DigitalOcean Spaces are not copied; their stored URLs keep working until you re-upload
them through the admin panel (R2) and update the records.

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
| Media upload to R2 | Done |
| Audit log, rate limits, ETags | Done |
| React admin panel | **Not built** — the API is ready for it |
| Push notifications, group activity | Out of scope (P5+) |

## Environment

Configured in [api/wrangler.toml](api/wrangler.toml) (`[vars]`, bindings) plus two secrets
(`JWT_SECRET`, `JWT_REFRESH_SECRET`; `api/.dev.vars` locally).

- **D1** (`DB`): one `docs` table holding every collection as JSON — see [api/migrations](api/migrations).
- **R2** (`BUCKET`): uploads. Served by the Worker at `/media/*` (Range-capable) unless `R2_PUBLIC_URL` points at a public bucket / custom domain.
- **Firebase**: only `FIREBASE_PROJECT_ID` is needed — ID tokens are verified against Google's public keys. Empty means `/api/v1/me/*` returns `503`.
- **Rate limits**: Workers rate-limit bindings (`PUBLIC_LIMITER`, `USER_LIMITER`, `LOGIN_LIMITER`).

## Notes

- **Response envelope** is `{ success, data }` everywhere, because the existing
  Flutter parsers depend on it. Errors are `{ success: false, error: { message, status } }`.
- **Malayalam is required** on every localised field; English and Arabic are optional.
- **Soft delete** — content is never hard-deleted by default, so `/sync` can tell
  the app to drop it from the offline cache. `DELETE ...?hard=true` overrides.
- **Checklist item keys are stable identifiers.** `userChecklist.checkedKeys`
  references them; renaming a key unticks that item for every pilgrim.

See [docs/api.md](docs/api.md) for the endpoint reference.
