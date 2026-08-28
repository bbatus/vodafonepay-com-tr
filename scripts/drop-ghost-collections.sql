-- Idempotent cleanup for the ProductHeroes/FeatureCards/StepCards collections
-- removed 28.08.2026 (see tasks.md / AGENTS.md "her CMS koleksiyonu gerçek
-- bir render yoluna bağlı olmalı" — the three had zero live rows and were
-- superseded by Pages' own hero/steps/stepPhones/iconCards/featureHighlights
-- layout blocks; vodafone-pay-kart and faturana-yansit, the only two hand-
-- written routes that still read them, were migrated to Pages documents
-- first). Run after confirming (SELECT count(*)) there is nothing left worth
-- keeping — these DROPs are irreversible.
DROP TABLE IF EXISTS product_heroes CASCADE;
DROP TABLE IF EXISTS _product_heroes_v CASCADE;
DROP TABLE IF EXISTS feature_cards CASCADE;
DROP TABLE IF EXISTS _feature_cards_v CASCADE;
DROP TABLE IF EXISTS step_cards CASCADE;
DROP TABLE IF EXISTS _step_cards_v CASCADE;
