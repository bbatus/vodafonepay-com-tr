-- Repairs two campaign-scope category slugs (29.08.2026).
--
-- Found by walking the Kategoriler list: the category labelled "Kart" carries
-- the slug `aninda-bakiye`, and the category actually labelled "Anında Bakiye"
-- was pushed to `aninda-bakiye-2`. Someone created a category called "Anında
-- Bakiye", renamed it to "Kart", and the slug stayed — it is generated once on
-- create and then frozen ("kaydedildikten sonra değişmez"), which is the right
-- call for a stable technical reference but leaves no way to correct a rename.
-- The wrong name then squatted on the right name's slug.
--
-- Not a site defect: /kampanyalar filters client-side on the slug carried by
-- the same category objects it renders the tabs from, so labels and matching
-- stayed consistent and no visitor-facing URL contains these. It is a CMS
-- legibility problem — including on the "Bu akışta zaten olan kategoriler"
-- helper, which shows each category next to its slug.
--
-- Safe because campaigns/blog posts/FAQ items reference categories by
-- relationship id, never by slug, and both the filter tabs and the matcher read
-- the slug from these same rows — so renaming updates both sides at once.
--
-- Order matters: the compound unique index is (scope, slug), so `aninda-bakiye`
-- has to be vacated before it can be handed to the category that deserves it.

BEGIN;

-- 1. "Kart" gets the slug its own name implies.
UPDATE categories SET slug = 'kart'
WHERE id = 1 AND scope = 'campaign' AND label = 'Kart' AND slug = 'aninda-bakiye';

-- 2. "Anında Bakiye" reclaims the slug, losing the "-2" it only ever had
--    because of the collision above.
UPDATE categories SET slug = 'aninda-bakiye'
WHERE id = 8 AND scope = 'campaign' AND label = 'Anında Bakiye' AND slug = 'aninda-bakiye-2';

-- Versions tables back the admin's relationship pickers, so they move too or
-- the picker keeps serving the old slug.
UPDATE _categories_v SET version_slug = 'kart'
WHERE parent_id = 1 AND version_slug = 'aninda-bakiye';

UPDATE _categories_v SET version_slug = 'aninda-bakiye'
WHERE parent_id = 8 AND version_slug = 'aninda-bakiye-2';

COMMIT;

-- Verify:
--   select id, label, scope, slug from categories where scope = 'campaign' order by "order";
--   -> Kart/kart, Faturana Yansıt/faturana-yansit, Anında Bakiye/aninda-bakiye, ...
