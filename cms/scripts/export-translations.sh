#!/usr/bin/env bash
# Dumps the `translations` table (schema + data) to cms/db/translations/,
# so it can be restored against a fresh Postgres later without needing the
# CMS/site running or `payload run` (broken in this environment — see
# AGENTS.md's note on ERR_REQUIRE_ASYNC_MODULE).
#
# Deliberately scoped to just this ONE table — every other collection
# (users, campaigns, faq-items, …) is provisioned fresh on a new deploy
# (LDAP-managed users, editors re-creating content), so dumping them here
# would just be stale data nobody restores. Translations are the one
# exception: they're admin-panel UI copy, not content, and re-typing ~280
# rows by hand on every fresh Postgres would be real lost work.
#
# Run this again any time translations change and the snapshot needs
# updating — it always overwrites both files with the live DB's current
# state.
set -euo pipefail

CONTAINER="${TRANSLATIONS_DB_CONTAINER:-vodafonepaycms-postgres}"
DB_USER="${POSTGRES_USER:-payload}"
DB_NAME="${POSTGRES_DB:-vodafonepaycms}"
OUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/db/translations"

mkdir -p "$OUT_DIR"

echo "Dumping translations schema -> $OUT_DIR/schema.sql"
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -t translations --schema-only --no-owner --no-privileges \
  | grep -v '^\\restrict' | grep -v '^\\unrestrict' > "$OUT_DIR/schema.sql"

echo "Dumping translations data -> $OUT_DIR/data.sql"
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -t translations --data-only --no-owner --no-privileges --inserts --column-inserts \
  | grep -v '^\\restrict' | grep -v '^\\unrestrict' > "$OUT_DIR/data.sql"

rows=$(docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM translations;" | tr -d '[:space:]')
echo "Done. $rows rows exported."
