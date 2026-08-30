# Vodafone Pay CMS

Headless CMS for vodafonepaycomtr — [Payload CMS](https://payloadcms.com) 3.87, PostgreSQL, S3-compatible
(MinIO) media storage. Runs as its own service, independent of the main site.

**Full architecture, RBAC model, collection reference and current project state:
[`../docs/PROJECT-OVERVIEW.md`](../docs/PROJECT-OVERVIEW.md).** This file only covers running
the CMS locally — it's deliberately kept short so it doesn't drift out of sync with that doc the
way an earlier version of this README did (it described a 9-collection, no-approval-workflow,
hardcoded-fallback system that hasn't been true for a long time).

## Running locally (Docker)

From the repo root:

```bash
docker compose -p vodafonepaycomtr up -d --build app cms
```

This brings up `postgres` and `minio` automatically as dependencies.

- CMS admin: http://localhost:3010/admin
- Site: http://localhost:3000
- MinIO console: http://localhost:9001 (login: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` from `.env`)

Test users (4 CMS roles): `../docs/TEST-USERS.MD` — never committed with real passwords outside
this repo's own copy.

## Branding

Admin UI uses Vodafone red (`#E60000`) as the accent color (`src/styles/custom.css`, overriding
Payload's `--theme-success-*` ramp) and the Vodafone Pay logo (`public/admin-logo.svg`,
`src/components/AdminLogo.tsx` / `AdminIcon.tsx`).
