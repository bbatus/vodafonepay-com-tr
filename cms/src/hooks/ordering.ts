import type { CollectionBeforeChangeHook, Where } from "payload";

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
 * explicitly typed value is always respected.
 *
 * `scopeFields` are the fields that define "the same list" — StepCards and
 * FeatureCards are per `page`, FaqItems per `category`, NavLinks per
 * `section`. Without scoping, adding a card to one page would push the
 * numbering of every other page's cards.
 */
export function assignNextOrder(collection: string, scopeFields: string[] = []): CollectionBeforeChangeHook {
  return async ({ data, operation, req }) => {
    if (operation !== "create") return data;
    // 0 counts as "not set": it's the value the old defaultValue produced,
    // and it's never a valid position in a 1-based sequence.
    if (typeof data.order === "number" && data.order > 0) return data;

    const constraints: Where[] = scopeFields
      .filter((field) => data[field] !== undefined && data[field] !== null)
      .map((field) => ({ [field]: { equals: data[field] } }));

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
