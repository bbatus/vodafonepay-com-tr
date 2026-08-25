# Translations table snapshot

`schema.sql` + `data.sql` — a portable snapshot of the CMS's `translations`
Postgres table (admin-panel UI copy: labels, descriptions, button text,
error messages — everything routed through `useAdminLocale()` / `dbLabel()`
instead of being hardcoded in one language). Regenerate with
`cms/scripts/export-translations.sh` any time the table changes and the
snapshot needs updating.

## Why this table and not the rest of the DB

Every other collection (users, campaigns, faq-items, media, …) is
provisioned fresh on a new deploy — users come from LDAP, content gets
re-created by editors. Translations are the one exception: they're
~280 rows of admin UI copy that took real effort to write and would be
genuine lost work to retype by hand against a fresh Postgres.

## Restoring against a fresh Postgres

Run once Payload's own migrations have created the base schema (so the
`translations_id_seq` sequence and the table's foreign-key target from
`payload_locked_documents_rels` already exist):

```bash
docker exec -i <postgres-container> psql -U payload -d <db-name> < schema.sql
docker exec -i <postgres-container> psql -U payload -d <db-name> < data.sql
```

`schema.sql` only creates the `translations` table itself (columns +
indexes) — it does not touch `payload_locked_documents_rels` or its
`translations_id` FK column; that's part of Payload's own generated
schema, not this table's concern.
