import { APIError } from "payload";
import type { CollectionBeforeDeleteHook, PayloadRequest } from "payload";
import { collectionLabelText } from "@/lib/collectionLabels";
import { writeAuditLog } from "@/hooks/audit";

/**
 * RFP feedback 5.1 — "kategoriyi silerken önce ona bağlı kampanyayı silmem
 * lazımdı".
 *
 * Root cause: this CMS had ZERO `beforeDelete` hooks. Nothing checked
 * whether the document being deleted was still referenced by another
 * document, and Postgres doesn't backstop it either — Payload/drizzle
 * generates every relationship/upload FK as `ON DELETE SET NULL` (verified
 * against the live DB: `campaigns.category_id`, `campaigns.image_id`,
 * `blog_posts.cover_image_id`, … all 17 of them). So deleting a category
 * silently NULLed `campaigns.category_id` on every campaign in it, even
 * though that field is declared `required: true`. The campaign stayed
 * "published" but fell out of every category filter on the site — an
 * invisible data-integrity break with no error anywhere.
 *
 * This module is the one place that knows "who points at whom". Adding a
 * new relationship means adding ONE row to REFERENCE_MAP; the guard itself
 * never changes.
 */

export type ReferenceSource = {
  /** Collection that holds the reference. */
  collection: string;
  /**
   * Field path exactly as Payload's `where` addresses it — dot notation for
   * array/blocks subfields. Verified live that Payload resolves paths inside
   * polymorphic `blocks` arrays (`pages.layout.image`) and arrays nested in
   * blocks (`pages.layout.logos.logo`), so those are covered here rather
   * than left as a "might be used somewhere" warning.
   */
  path: string;
  /** Field used to name the offending document in the error message. */
  titleField: string;
  /**
   * `true` — deleting the target would leave this document referencing
   * nothing through a field its own schema declares `required`. Blocked.
   *
   * `false` — provenance metadata (who created / rejected / uploaded).
   * Losing it is not a content break, and blocking on it would make it
   * impossible to ever offboard a user who once touched anything. Reported
   * in the audit-log entry instead of blocking the delete.
   */
  blocking: boolean;
};

export const REFERENCE_MAP: Record<string, ReferenceSource[]> = {
  categories: [
    { collection: "campaigns", path: "category", titleField: "title", blocking: true },
    // BlogPosts.category became a relationship to this collection too — same
    // taxonomy as campaigns, so the same delete protection has to cover it.
    { collection: "blog-posts", path: "category", titleField: "title", blocking: true },
    // FaqItems.category — was a hardcoded select, now the same relationship.
    // Unlike Campaigns/BlogPosts this one is `required: true`, so deleting a
    // category out from under an FAQ wouldn't just leave it uncategorized —
    // it'd fail the field's own required check the next time anyone saved it.
    { collection: "faq-items", path: "category", titleField: "question", blocking: true },
  ],

  media: [
    { collection: "campaigns", path: "image", titleField: "title", blocking: true },
    { collection: "blog-posts", path: "coverImage", titleField: "title", blocking: true },
    { collection: "feature-cards", path: "icon", titleField: "title", blocking: true },
    { collection: "step-cards", path: "image", titleField: "text", blocking: true },
    { collection: "product-heroes", path: "image", titleField: "heading", blocking: true },
    { collection: "content-blocks", path: "image", titleField: "title", blocking: true },
    { collection: "page-meta", path: "ogImage", titleField: "pageKey", blocking: true },
    { collection: "pages", path: "ogImage", titleField: "title", blocking: true },
    { collection: "pages", path: "layout.image", titleField: "title", blocking: true },
    { collection: "pages", path: "layout.logos.logo", titleField: "title", blocking: true },
    { collection: "representatives", path: "qrCode", titleField: "businessName", blocking: true },
    { collection: "users", path: "avatar", titleField: "email", blocking: true },
    { collection: "legal-pages", path: "heroImage", titleField: "title", blocking: true },
  ],

  documents: [{ collection: "legal-pages", path: "groups.documents.file", titleField: "title", blocking: true }],

  users: [
    { collection: "campaigns", path: "createdBy", titleField: "title", blocking: false },
    { collection: "campaigns", path: "rejectedBy", titleField: "title", blocking: false },
    { collection: "media", path: "uploadedBy", titleField: "filename", blocking: false },
  ],
};

/** How many offending documents to name before collapsing into "…and N more". */
const NAMED_LIMIT = 3;

export type ReferenceHit = {
  source: ReferenceSource;
  total: number;
  /** First few offenders: display title + admin edit URL. */
  samples: { title: string; url: string }[];
};

type DocWithId = { id: string | number; [key: string]: unknown };

function titleOf(doc: DocWithId, field: string): string {
  const value = doc[field];
  return typeof value === "string" && value.trim() ? value : `#${doc.id}`;
}

/**
 * Probes every collection that can point at `targetCollection` and reports
 * which ones actually do. Exported separately from the hook so the same
 * "what depends on this" logic is testable, and reusable by any UI that
 * wants to warn BEFORE the user clicks delete.
 */
export async function findReferences(
  req: PayloadRequest,
  targetCollection: string,
  id: string | number
): Promise<ReferenceHit[]> {
  const sources = REFERENCE_MAP[targetCollection] ?? [];
  const hits: ReferenceHit[] = [];

  for (const source of sources) {
    try {
      const result = await req.payload.find({
        collection: source.collection,
        where: { [source.path]: { equals: id } },
        limit: NAMED_LIMIT,
        depth: 0,
        // The guard has to see EVERY dependent document, including ones the
        // current user can't read — otherwise a reference invisible to this
        // role would let the delete through and break it anyway.
        overrideAccess: true,
      });
      if (result.totalDocs === 0) continue;
      hits.push({
        source,
        total: result.totalDocs,
        samples: (result.docs as unknown as DocWithId[]).map((doc) => ({
          title: titleOf(doc, source.titleField),
          url: `/admin/collections/${source.collection}/${doc.id}`,
        })),
      });
    } catch (err) {
      // A probe that can't run must fail CLOSED for a blocking reference —
      // silently allowing the delete is exactly the bug this module exists
      // to prevent.
      console.error(`[referentialIntegrity] probe failed for ${source.collection}.${source.path}:`, err);
      if (source.blocking) {
        hits.push({ source, total: -1, samples: [] });
      }
    }
  }

  return hits;
}

function locale(req: PayloadRequest): "tr" | "en" {
  return req.i18n?.language === "en" ? "en" : "tr";
}

export function formatReferenceError(
  req: PayloadRequest,
  targetCollection: string,
  targetTitle: string,
  hits: ReferenceHit[]
): string {
  const lang = locale(req);
  const collectionName = collectionLabelText(targetCollection, "singular", lang);
  const total = hits.reduce((sum, hit) => sum + Math.max(hit.total, 1), 0);

  const lines = hits.flatMap((hit) => {
    const sourceName = collectionLabelText(hit.source.collection, "plural", lang);
    if (hit.total === -1) {
      return [
        lang === "en"
          ? `• ${sourceName} → could not be checked (see server logs) — delete blocked as a precaution.`
          : `• ${sourceName} → kontrol edilemedi (sunucu loglarına bakın) — güvenlik için silme engellendi.`,
      ];
    }
    const named = hit.samples.map((s) => `• ${sourceName} → "${s.title}" (${s.url})`);
    const remaining = hit.total - hit.samples.length;
    if (remaining > 0) {
      named.push(lang === "en" ? `• …and ${remaining} more in ${sourceName}.` : `• …ve ${sourceName} içinde ${remaining} kayıt daha.`);
    }
    return named;
  });

  const head =
    lang === "en"
      ? `"${targetTitle}" (${collectionName}) can't be deleted — ${total} record(s) still reference it:`
      : `"${targetTitle}" (${collectionName}) silinemedi — ${total} kayıt hâlâ buna bağlı:`;
  const tail =
    lang === "en"
      ? "Delete those records first, or point them at something else, then try again."
      : "Önce bu kayıtları silin ya da başka bir kayda bağlayın, sonra tekrar deneyin.";

  return [head, ...lines, tail].join("\n");
}

/**
 * `beforeDelete` guard. Wire into every collection that appears as a key in
 * REFERENCE_MAP. Throws a 409 Conflict (not a bare 500) whose message names
 * the blocking documents and links straight to their edit pages — "silinemedi"
 * on its own doesn't tell an editor what to fix first.
 */
export function blockDeleteIfReferenced(targetCollection: string): CollectionBeforeDeleteHook {
  return async ({ req, id }) => {
    const hits = await findReferences(req, targetCollection, id);
    const blocking = hits.filter((hit) => hit.source.blocking);

    if (blocking.length === 0) {
      // Non-blocking (provenance) references still get recorded — the delete
      // is allowed, but "3 campaigns just lost their createdBy" should never
      // be something nobody can find out about afterwards.
      const orphaned = hits.filter((hit) => !hit.source.blocking);
      if (orphaned.length > 0) {
        const detail = orphaned.map((hit) => `${hit.source.collection}.${hit.source.path}×${hit.total}`).join(", ");
        await writeAuditLog(req, {
          action: "delete",
          collectionSlug: targetCollection,
          documentId: String(id),
          summary: `${targetCollection}: #${String(id)} silindi — referans veren alanlar boşaltıldı: ${detail}`,
        });
      }
      return;
    }

    let targetTitle = String(id);
    try {
      const doc = (await req.payload.findByID({
        collection: targetCollection,
        id,
        depth: 0,
        overrideAccess: true,
      })) as Record<string, unknown>;
      targetTitle =
        (typeof doc.label === "string" && doc.label) ||
        (typeof doc.title === "string" && doc.title) ||
        (typeof doc.filename === "string" && doc.filename) ||
        (typeof doc.email === "string" && doc.email) ||
        String(id);
    } catch {
      // Falls back to the raw id — never let the lookup for a nicer message
      // turn into the reason the guard itself crashes.
    }

    throw new APIError(formatReferenceError(req, targetCollection, targetTitle, blocking), 409, undefined, true);
  };
}
