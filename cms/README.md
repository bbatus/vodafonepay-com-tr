# Vodafone Pay CMS

Headless CMS for vodafonepaycomtr — [Payload CMS](https://payloadcms.com) 3, PostgreSQL, S3-compatible
(MinIO) media storage. Runs as its own service, independent of the main site.

## Running locally (Docker)

From the repo root:

```bash
cp .env.example .env
docker compose up -d postgres minio minio-init cms app
```

- CMS admin: http://localhost:3010/admin (create the first user on initial run)
- Site: http://localhost:3000
- MinIO console: http://localhost:9001 (login: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` from `.env`)

## Seeding real content

The site's current hardcoded Campaigns and FAQ content can be loaded into the CMS for testing:

```bash
cd cms
CMS_URL=http://localhost:3010 \
CMS_ADMIN_EMAIL=<the email you used for the first user> \
CMS_ADMIN_PASSWORD=<its password> \
node scripts/seed-via-api.mjs
```

(The `payload run` CLI's built-in seed runner hits a CJS/ESM interop bug in its env loader
on current Node — this script talks to the CMS over its own REST API instead, which is why
the CMS must already be running with a first user created.)

## How the site picks up changes

- The site fetches Campaigns/FAQ server-side with `next: { tags: [...], revalidate: 3600 }` —
  content updates within an hour even if nothing else happens.
- Each collection with `afterChange`/`afterDelete` hooks (`Campaigns`, `FaqItems`, ...) pings
  the site's `/api/revalidate` webhook on save, so a "Yayınla" in the CMS shows up on the live
  site within seconds instead of waiting for the hourly fallback.
- If the CMS is unreachable, every fetch falls back to the hardcoded content baked into the
  page components — the site never breaks because the CMS is down.

## Content model

9 collections, matching the content inventory in `../docs/CMS_INTEGRATION_PLAN.md`:
`Campaigns`, `FaqItems`, `BlogPosts`, `FeeRows`, `LimitTables`, `NavLinks`, `ProductHeroes`,
`FeatureCards`, `StepCards` — plus `Users` (auth) and `Media` (uploads, backed by MinIO).

Only **Campaigns** and **FaqItems** are currently wired into the site's frontend (homepage,
`/kampanyalar`, `/sikca-sorulan-sorular`, and each product page's FAQ section). The rest of the
collections exist and are editable in the admin panel now, so the schema is ready, but the
remaining pages (Blog, Ücretler ve Limitler, product page hero/feature/step content) still render
their original hardcoded content — wiring them up follows the exact same pattern as
`src/lib/cms.ts` + the `Campaigns`/`Faq` components.

## What's intentionally not here yet

Per the current scope: no LDAP/SSO, no approval workflow, no OpenShift manifests. The `role`
field on `Users` and the access-control hooks are structured so those can be layered on later
without a schema rewrite, but none of it is wired up today — every user with a login currently
has full access.

## Branding

Admin UI uses Vodafone red (`#E60000`) as the accent color (`src/styles/custom.css`, overriding
Payload's `--theme-success-*` ramp) and the Vodafone Pay logo (`public/admin-logo.svg`,
`src/components/AdminLogo.tsx` / `AdminIcon.tsx`).
