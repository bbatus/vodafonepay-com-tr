-- Retires the ContentBlocks collection (29.08.2026).
--
-- Why: the collection was dead. `getContentBlocks` was called from exactly one
-- place — src/app/page.tsx — and only on the branch that runs when the CMS has
-- no published `anasayfa` Pages document. That document IS published, so the
-- branch never ran: an editor could open "İçerik Blokları" in the sidebar, edit
-- a row, send it through the Maker→Checker flow, watch it publish, and change
-- nothing on the live site. Exactly the silent trap AGENTS.md forbids, and the
-- same shape as the ProductHeroes/FeatureCards/StepCards retirement.
--
-- The 8 rows are NOT migrated: they are stale content from an earlier homepage
-- design ("Uygulamayı indir / Hesabını oluştur / Kartını ekle / Ödemeye başla"
-- plus three highlight logos) that matches neither the live vodafonepay.com.tr
-- homepage nor the current `anasayfa` Pages document, whose own `stepPhones`
-- and `featureHighlights` blocks are what actually renders. Copying them onto
-- Pages would ADD sections the live site does not have.
--
-- Idempotent — safe to re-run. Payload's own migration tooling is unusable here
-- (ERR_REQUIRE_ASYNC_MODULE, see R-10), so this is hand-written like the rest.

BEGIN;

-- Version table first: it carries the FK back to the parent.
DROP TABLE IF EXISTS _content_blocks_v CASCADE;
DROP TABLE IF EXISTS content_blocks CASCADE;

-- Enums Payload generated for this collection's `blockType` and `_status`.
-- The leading-underscore twins are the array types Postgres creates alongside
-- each enum; dropping the base type takes them with it.
DROP TYPE IF EXISTS enum_content_blocks_block_type CASCADE;
DROP TYPE IF EXISTS enum_content_blocks_status CASCADE;
DROP TYPE IF EXISTS enum__content_blocks_v_version_block_type CASCADE;
DROP TYPE IF EXISTS enum__content_blocks_v_version_status CASCADE;

-- Payload's cross-collection lock table keeps one FK column per collection.
-- Dropping the table above cascaded the constraint away but left the column
-- behind; with the collection gone from payload.config.ts Payload no longer
-- generates it, so it would sit there forever as a dead column.
ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS content_blocks_id;

-- Translation overrides for the retired collection's labels: dead keys that
-- would otherwise sit in the Translations editor forever with nothing to name.
DELETE FROM translations WHERE key LIKE 'collectionLabel.content-blocks.%';

-- `audit_logs` rows with collection_slug = 'content-blocks' are deliberately
-- LEFT IN PLACE. They are the record that these documents existed and who
-- changed them; the collection going away does not make that history untrue,
-- and an audit trail you prune when the subject is removed is not an audit
-- trail. AuditLogs has no FK to the collection, so nothing breaks.

COMMIT;

-- Verify:
--   \dt  -> no content_blocks / _content_blocks_v
--   select typname from pg_type where typname like '%content_blocks%';  -> 0 rows
