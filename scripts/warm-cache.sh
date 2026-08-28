#!/usr/bin/env bash
# Run this right after every deploy that rebuilds/recreates the `app`
# container (docker compose up -d --build app), before real traffic hits it.
#
# Why this exists: `next build` runs inside the Docker image build, before
# compose brings the CMS container up — so every CMS-backed page is baked
# with empty data (see [cms] fetch failed in `docker logs vodafonepaycomtr`
# right after a build). Next only replaces that baked-in emptiness once
# something calls revalidatePath, and nothing does that automatically on
# container start — a visitor would otherwise be served the empty build-time
# shell until an unrelated CMS edit happens to sweep it away.
#
# One POST to /api/revalidate with pathType "layout" on "/" does the same
# full-site sweep the CMS itself now sends on every publish (see
# cms/src/hooks/revalidate.ts) — every route rebuilds with real data on its
# very next visit, deploy or no deploy.
set -euo pipefail

# docker-compose.yml reads REVALIDATE_SECRET from .env, so the running app
# validates against whatever is in there — but this script used to fall
# straight through to the `dev-revalidate-secret` default, which stopped
# matching the moment .env carried a real secret. Every warm-up since then
# died on "HTTP 401 / Invalid secret" (seen live 29.08.2026), which meant the
# one documented post-deploy step silently never ran. Read the same file
# compose does; an env var passed on the command line still wins.
ENV_FILE="${ENV_FILE:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.env}"
if [ -z "${REVALIDATE_SECRET:-}" ] && [ -f "$ENV_FILE" ]; then
  REVALIDATE_SECRET="$(grep -E '^REVALIDATE_SECRET=' "$ENV_FILE" | tail -n 1 | cut -d= -f2-)"
fi

SITE_URL="${SITE_URL:-http://localhost:3000}"
REVALIDATE_SECRET="${REVALIDATE_SECRET:-dev-revalidate-secret}"

echo "Warming ${SITE_URL} (full-site layout sweep)..."
response=$(curl -s -o /tmp/warm-cache-response.json -w "%{http_code}" \
  -X POST "${SITE_URL}/api/revalidate" \
  -H "content-type: application/json" \
  -H "x-revalidate-secret: ${REVALIDATE_SECRET}" \
  -d '{"tag":"pages","paths":["/"],"pathType":"layout"}')

if [ "$response" != "200" ]; then
  echo "Warm-up failed: HTTP ${response}" >&2
  cat /tmp/warm-cache-response.json >&2
  exit 1
fi

echo "Warm-up OK: $(cat /tmp/warm-cache-response.json)"
