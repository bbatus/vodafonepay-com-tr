import type { CollectionBeforeValidateHook } from "payload";
import { turkishSlugify, uniqueSlug } from "@/lib/slugify";

/**
 * Follow-up 25.08: "business product slug ne bilmez … kullanıcıdan istemesin."
 *
 * `slug` was a required, hand-typed field. An editor who didn't fill it in got
 * a bare 400 on save (`POST /api/campaigns … 400`), and — because the publish
 * preview URL is built from the slug — the confirm-before-publish modal showed
 * "Önizleme kullanılamıyor — kaydedilmiş bir 'slug' değeri gerekiyor" instead
 * of the campaign. Both symptoms had the same cause.
 *
 * Derives the slug from a source field (title/label/question) instead. Mirrors
 * the pattern Categories.ts's `generateSlug` already established, generalized
 * so more than one collection can use it.
 *
 * **Only fills a slug that is missing** — never re-derives an existing one.
 * That's deliberate, not laziness: the site addresses a campaign by
 * `/kampanyalar/{slug}`, so silently rewriting the slug when someone fixes a
 * typo in the title would change (and break) an already-shared, already-indexed
 * URL. AutoSlugField.tsx tells the editor this in the sidebar.
 */
export function autoSlug(collection: string, sourceField: string): CollectionBeforeValidateHook {
  return async ({ data, req, originalDoc }) => {
    if (!data) return data;
    const existing = (data.slug ?? (originalDoc as { slug?: string } | undefined)?.slug) as string | undefined;
    if (typeof existing === "string" && existing.trim().length > 0) {
      // Carry the already-saved value forward: the field is readOnly in the
      // admin, so a plain PATCH that doesn't include it must not end up
      // clearing it.
      data.slug = existing;
      return data;
    }

    const source = data[sourceField];
    if (typeof source !== "string" || source.trim().length === 0) return data;

    const base = turkishSlugify(source);
    if (!base) return data;

    const excludeId = (originalDoc as { id?: string | number } | undefined)?.id;
    data.slug = await uniqueSlug(base, async (candidate) => {
      const { totalDocs } = await req.payload.count({
        collection,
        where:
          excludeId === undefined
            ? { slug: { equals: candidate } }
            : { and: [{ slug: { equals: candidate } }, { id: { not_equals: excludeId } }] },
        overrideAccess: true,
      });
      return totalDocs > 0;
    });
    return data;
  };
}
