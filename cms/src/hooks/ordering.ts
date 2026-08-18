import type { CollectionBeforeChangeHook, PayloadRequest, Where } from "payload";
import { APIError } from "payload";

function locale(req: PayloadRequest): "tr" | "en" {
  return req.i18n?.language === "en" ? "en" : "tr";
}

function scopeConstraints(data: Record<string, unknown>, scopeFields: string[]): Where[] {
  return scopeFields
    .filter((field) => data[field] !== undefined && data[field] !== null)
    .map((field) => ({ [field]: { equals: data[field] } }));
}

/**
 * RFP follow-up — "1 2 3 doluysa kullanıcı 1 2 3 dolu mu diye bakmamalı...
 * ama 1 2 3 yaparsa da hata almalı tabi": `assignNextOrder` below already
 * auto-fills a blank `order`, but an editor who explicitly TYPES a number
 * that's already taken by a sibling in the same group used to just silently
 * save it — two documents both claiming position 3, with nothing surfacing
 * that until someone noticed the list looked wrong. Throws a 400 naming the
 * conflicting document instead.
 */
async function rejectIfOrderTaken(args: {
  collection: string;
  scopeFields: string[];
  data: Record<string, unknown>;
  req: PayloadRequest;
  excludeId?: string | number;
}): Promise<void> {
  const { collection, scopeFields, data, req, excludeId } = args;
  const order = data.order;
  if (typeof order !== "number" || order <= 0) return;

  const constraints = [...scopeConstraints(data, scopeFields), { order: { equals: order } }];
  if (excludeId !== undefined) constraints.push({ id: { not_equals: excludeId } });

  const { docs, totalDocs } = await req.payload.find({
    collection,
    where: { and: constraints },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (totalDocs === 0) return;

  const clashTitle = (docs[0] as Record<string, unknown> | undefined)?.title ?? (docs[0] as Record<string, unknown> | undefined)?.label;
  const lang = locale(req);
  const message =
    lang === "en"
      ? `Position ${order} is already used by "${String(clashTitle ?? docs[0]?.id)}" in this group. Pick a different number, or leave it empty to append to the end.`
      : `${order}. sıra bu grupta zaten "${String(clashTitle ?? docs[0]?.id)}" tarafından kullanılıyor. Farklı bir sayı seçin, ya da sona eklemek için boş bırakın.`;
  throw new APIError(message, 400, undefined, true);
}

/**
 * RFP feedback 5.5 — "order 1'den başlamalı, list bileşenimiz order'a göre
 * listelemeli".
 *
 * Two separate problems shared one root: `order` defaulted to 0 on every
 * collection and nothing ever assigned a real value, while `defaultSort` was
 * set on Campaigns alone. So every ordered list (FAQ, nav links, feature
 * cards, …) showed up in Payload's fallback order, every new record landed
 * on 0 alongside every other new record, and the drag-to-reorder widget's
 * saved sequence was invisible in the list it was supposed to control.
 *
 * This hook fills in the number so an editor never has to: on create, the
 * new document goes to the END of its group with `max(order) + 1`. An
 * explicitly typed value is always respected — but (RFP follow-up) is now
 * also checked for collisions with a sibling in the same group, on both
 * create and update, via rejectIfOrderTaken above.
 *
 * `scopeFields` are the fields that define "the same list" — StepCards and
 * FeatureCards are per `page`, FaqItems per `category`, NavLinks per
 * `section`. Without scoping, adding a card to one page would push the
 * numbering of every other page's cards.
 */
export function assignNextOrder(collection: string, scopeFields: string[] = []): CollectionBeforeChangeHook {
  return async ({ data, operation, req, originalDoc }) => {
    if (operation !== "create") {
      // Update: only re-check when the editor actually changed `order` —
      // resaving a document without touching its position shouldn't ever
      // trip over its own prior value.
      const previous = (originalDoc as Record<string, unknown> | undefined)?.order;
      if (typeof data.order === "number" && data.order > 0 && data.order !== previous) {
        await rejectIfOrderTaken({ collection, scopeFields, data, req, excludeId: originalDoc?.id });
      }
      return data;
    }

    // 0 counts as "not set": it's the value the old defaultValue produced,
    // and it's never a valid position in a 1-based sequence.
    if (typeof data.order === "number" && data.order > 0) {
      await rejectIfOrderTaken({ collection, scopeFields, data, req });
      return data;
    }

    const constraints = scopeConstraints(data, scopeFields);
    try {
      const { docs } = await req.payload.find({
        collection,
        where: constraints.length > 0 ? { and: constraints } : {},
        sort: "-order",
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      const highest = (docs[0] as { order?: number } | undefined)?.order;
      data.order = typeof highest === "number" ? highest + 1 : 1;
    } catch (err) {
      // Never let numbering block the actual save — a 1 is a valid position,
      // and the editor can drag it where they want afterwards.
      console.error(`[ordering] failed to compute next order for "${collection}":`, err);
      data.order = 1;
    }
    return data;
  };
}

/** Shared `admin.description` for every `order` field, so the 1-based rule is stated in one place. */
export const ORDER_FIELD_DESCRIPTION = {
  tr: "Listedeki sırası — 1'den başlar, küçük sayı önce gelir. Boş bırakırsanız otomatik olarak sona eklenir.",
  en: "Position in the list — starts at 1, lower comes first. Leave empty to append to the end automatically.",
};
