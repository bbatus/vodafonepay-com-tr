import type { CollectionBeforeChangeHook, Field, PayloadRequest, Where } from "payload";
import { APIError } from "payload";

function locale(req: PayloadRequest): "tr" | "en" {
  return req.i18n?.language === "en" ? "en" : "tr";
}

/**
 * Names the clashing document inside an editor-facing error message. The
 * candidates are tried in order and only a string/number is accepted: several
 * collections here carry bilingual object-shaped values, and blindly
 * `String()`-ing one would put a literal "[object Object]" in front of the
 * editor instead of a document name.
 */
function describeClash(doc: Record<string, unknown> | undefined, fields: string[]): string {
  for (const field of [...fields, "id"]) {
    const value = doc?.[field];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "?";
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

  const clashTitle = describeClash(docs[0] as Record<string, unknown> | undefined, ["title", "label"]);
  const lang = locale(req);
  const message =
    lang === "en"
      ? `Position ${order} is already used by "${clashTitle}" in this group. Pick a different number, or leave it empty to append to the end.`
      : `${order}. sıra bu grupta zaten "${clashTitle}" tarafından kullanılıyor. Farklı bir sayı seçin, ya da sona eklemek için boş bırakın.`;
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
 * `scopeFields` are the fields that define "the same list" — ContentBlocks
 * is per `page`, FaqItems per `category`, NavLinks per `section`. Without
 * scoping, adding a block to one page would push the numbering of every
 * other page's blocks.
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

/**
 * The `order` number field itself, identical (comment included) across every
 * collection that uses `assignNextOrder`/`rejectIfOrderTaken` above — found
 * duplicated verbatim across 9 files by a SonarQube CPD scan. `liveOrder`
 * wires up the drag-reorder-aware LiveOrderField widget; omit it for a
 * collection with no groupField (a single flat list, e.g. FeeRows) or where
 * the widget isn't wanted.
 *
 * Deliberately NO defaultValue. Payload populates defaults BEFORE
 * beforeChange runs, so a `defaultValue: 1` here arrives at assignNextOrder
 * looking exactly like a number the editor typed — the hook's "respect an
 * explicit value" guard then bails out and the auto-numbering never happens.
 * Caught live: a new FAQ in a category whose highest order was 12 was still
 * being saved as 1. Leaving this empty is also the honest UI, and matches
 * the field description: blank means "put it at the end", which is what the
 * hook then does.
 */
export function orderField(liveOrder?: {
  collection: string;
  // Required for "relationship"/"boolean" (there has to be a field to
  // group by); meaningless for "flat" — an ungrouped, site-wide sequence,
  // used by Announcements/FeeRows/LimitTables so they get the same live
  // count/suggestion every scoped collection already has.
  watchPath?: string;
  mode?: "relationship" | "boolean" | "flat";
}): Field {
  return {
    name: "order",
    type: "number",
    label: { tr: "Sıra", en: "Order" },
    min: 1,
    admin: {
      description: ORDER_FIELD_DESCRIPTION,
      ...(liveOrder
        ? {
            components: {
              Field: {
                path: "/components/LiveOrderField#default",
                clientProps: {
                  collection: liveOrder.collection,
                  watchPath: liveOrder.watchPath,
                  mode: liveOrder.mode ?? "relationship",
                },
              },
            },
          }
        : {}),
    },
  };
}

/**
 * Sequential-append numbering for a "görünürlük kutusu + ona ait kendi sıra
 * alanı" çifti — FaqItems'ın `showOnHomepage`/`homepageOrder`'ı ve Pages'in
 * `showInProductsMenu`/`productsMenuOrder`'ı.
 *
 * `assignNextOrder`'dan ayrı, çünkü o her zaman düz `order` adlı bir alanı
 * okuyup yazıyor. Bu mantık FaqItems'ın içinde yerel bir hook olarak
 * duruyordu ve oradaki yorum "bir genelleştirmeye başka çağıran ihtiyaç
 * duymadığı için yerel bırakıldı" diyordu — Pages birebir aynı şekle ihtiyaç
 * duyunca o not vadesi doldu ve buraya taşındı.
 *
 * `assignFooterOrder`'ın aksine burada sabit bir slot üst sınırı YOK, o
 * yüzden düz "en yüksek + 1" doğru davranış: bu listeler sınırsız.
 */
export function assignNextFlaggedOrder(args: {
  collection: string;
  flagField: string;
  orderField: string;
}): CollectionBeforeChangeHook {
  const { collection, flagField, orderField: orderFieldName } = args;
  return async ({ data, req }) => {
    // Create VE update'te çalışır — editör "Ürünler menüsünde göster"i var
    // olan bir kayıtta sonradan da işaretleyebilir, o an da bir sıraya
    // yeni kayıt kadar ihtiyaç duyar.
    if (!data?.[flagField]) return data;
    const current = data[orderFieldName];
    if (typeof current === "number" && current > 0) return data;

    try {
      const { docs } = await req.payload.find({
        collection,
        where: { [flagField]: { equals: true } },
        sort: `-${orderFieldName}`,
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      const highest = (docs[0] as Record<string, unknown> | undefined)?.[orderFieldName];
      data[orderFieldName] = typeof highest === "number" ? highest + 1 : 1;
    } catch (err) {
      console.error(`[ordering] failed to compute next ${orderFieldName} for "${collection}":`, err);
      data[orderFieldName] = 1;
    }
    return data;
  };
}

/**
 * RFP follow-up: "footer'da göster" seçeneği + 1-6 arası sıra —
 * Campaigns/FaqItems'a eklenen `showInFooter`/`footerOrder` çifti için.
 *
 * Deliberately NOT `assignNextOrder`/`assignNextHomepageOrder`'ın "en
 * yüksek + 1" (sequential-append) mantığı — footer sabit 6 slotluk (
 * `FOOTER_ORDER_MAX`), ve bir kayıt footer'dan kaldırıldığında (showInFooter
 * false'a çekildiğinde) o slot boşalır. "En yüksek + 1" burada kullanılsaydı
 * 6 kayıt gelip gittikten sonra yeni bir "7" üretip cap'i aşardı. Bunun
 * yerine 1..6 arasında BOŞ olan ilk slotu bulup kullanıyor (gap-filling) —
 * kullanıcının kendi talebi de zaten buydu: "otomatik hangi sıra boşsa
 * onunla listelensin".
 */
export const FOOTER_ORDER_MAX = 7;

export const FOOTER_ORDER_FIELD_DESCRIPTION = {
  tr: `Footer'daki gösterim sırası (1-${FOOTER_ORDER_MAX}). Boş bırakılırsa 1-${FOOTER_ORDER_MAX} arasında boş olan ilk sıraya otomatik yerleşir. Footer'da aynı anda en fazla ${FOOTER_ORDER_MAX} kayıt gösterilebilir.`,
  en: `Position in the footer (1-${FOOTER_ORDER_MAX}). Leave empty to automatically take the first open slot in 1-${FOOTER_ORDER_MAX}. At most ${FOOTER_ORDER_MAX} records can show in the footer at once.`,
};

async function rejectIfFooterSlotTaken(args: {
  collection: string;
  footerOrder: number;
  req: PayloadRequest;
  excludeId?: string | number;
}): Promise<void> {
  const { collection, footerOrder, req, excludeId } = args;
  const constraints: Where[] = [{ showInFooter: { equals: true } }, { footerOrder: { equals: footerOrder } }];
  if (excludeId !== undefined) constraints.push({ id: { not_equals: excludeId } });

  const { docs, totalDocs } = await req.payload.find({
    collection,
    where: { and: constraints },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (totalDocs === 0) return;

  const clashTitle = describeClash(docs[0] as Record<string, unknown> | undefined, ["title", "question"]);
  const lang = locale(req);
  const message =
    lang === "en"
      ? `Footer position ${footerOrder} is already used by "${clashTitle}". Pick a different number (1-${FOOTER_ORDER_MAX}), or leave it empty.`
      : `Footer sırası ${footerOrder} zaten "${clashTitle}" tarafından kullanılıyor. Farklı bir sayı (1-${FOOTER_ORDER_MAX}) seçin, ya da boş bırakın.`;
  throw new APIError(message, 400, undefined, true);
}

/**
 * Wire into `beforeChange` on any collection with a `showInFooter` checkbox
 * + `footerOrder` number field (min:1, max:FOOTER_ORDER_MAX). Only acts when
 * `showInFooter` is explicitly present in this save's data — an update that
 * doesn't touch it (e.g. a raw API PATCH of just `title`) is left alone
 * rather than having its footer state silently cleared.
 *
 * The free-slot lookup and the write that claims it are still not one atomic
 * transaction, so two near-simultaneous saves can both compute "slot 3 is
 * free" — this used to let three records share a slot, confirmed live during
 * this feature's own testing. That race is now caught one level down instead
 * of here: `footerOrder` carries `unique: true` on both Campaigns and
 * FaqItems, so Postgres rejects the second writer (NULLs never collide, so
 * records that aren't in the footer are unaffected). Verified by racing seven
 * concurrent saves: two succeeded, five were rejected with the standard
 * validation error.
 */
/** Lowest 1..FOOTER_ORDER_MAX slot nobody holds, or undefined when the footer is full. */
function firstFreeFooterSlot(docs: { footerOrder?: number }[]): number | undefined {
  const used = new Set(docs.map((d) => d.footerOrder).filter((n): n is number => typeof n === "number"));
  for (let i = 1; i <= FOOTER_ORDER_MAX; i += 1) {
    if (!used.has(i)) return i;
  }
  return undefined;
}

export function assignFooterOrder(collection: string): CollectionBeforeChangeHook {
  return async ({ data, operation, req, originalDoc }) => {
    if (data.showInFooter === false) {
      // Turned off (or never was on) — its old slot, if any, is now free for
      // someone else; null it so a stale value can't collide later.
      data.footerOrder = null;
      return data;
    }
    if (data.showInFooter !== true) return data;

    const excludeId = operation === "update" ? (originalDoc as { id?: string | number } | undefined)?.id : undefined;
    const explicit = data.footerOrder;

    if (typeof explicit === "number" && explicit > 0) {
      await rejectIfFooterSlotTaken({ collection, footerOrder: explicit, req, excludeId });
      return data;
    }

    try {
      const { docs } = await req.payload.find({
        collection,
        where: {
          and: [{ showInFooter: { equals: true } }, ...(excludeId !== undefined ? [{ id: { not_equals: excludeId } }] : [])],
        },
        limit: FOOTER_ORDER_MAX,
        depth: 0,
        overrideAccess: true,
      });
      const slot = firstFreeFooterSlot(docs as { footerOrder?: number }[]);
      if (slot === undefined) {
        const lang = locale(req);
        throw new APIError(
          lang === "en"
            ? `Footer already shows the maximum of ${FOOTER_ORDER_MAX} items — remove or uncheck one before adding another.`
            : `Footer'da zaten en fazla ${FOOTER_ORDER_MAX} kayıt gösteriliyor — yeni birini eklemeden önce birini kaldırın ya da işaretini kaldırın.`,
          400,
          undefined,
          true
        );
      }
      data.footerOrder = slot;
    } catch (err) {
      if (err instanceof APIError) throw err;
      // Same "never let numbering block the save" principle as
      // assignNextOrder — but here there's no safe default to fall back to
      // (an unknown slot could collide), so re-throw as a clear 400 instead
      // of silently saving with a broken footerOrder.
      console.error(`[ordering] failed to compute next footerOrder for "${collection}":`, err);
      const lang = locale(req);
      throw new APIError(
        lang === "en" ? "Couldn't determine the next footer position — try again." : "Sonraki footer sırası hesaplanamadı — tekrar deneyin.",
        400,
        undefined,
        true
      );
    }
    return data;
  };
}

/**
 * RFP follow-up: "footer aşağı doğru genişler, bunun bir sınırı olmalı" —
 * NavLinks'in Footer — Kurumsal / Footer — Yasal bölümleri Campaigns/FaqItems
 * gibi ayrı bir `showInFooter` kutusuna sahip değil: bir kayıt zaten o
 * bölümdeyse (section = "footer-kurumsal") footer'da GÖRÜNÜR, ara bir
 * açma/kapama durumu yok. O yüzden `assignFooterOrder`'ın slot-doldurma
 * mantığı yerine, burada basitçe grup büyüklüğünü sayıp sınırı aşan
 * kaydı reddediyoruz — 8. linki eklemeye çalışan editör "önce birini silin"
 * mesajını görür.
 *
 * `scopeField`'ın YENİ değeri (data'daki) limitler tablosunda yoksa (örn.
 * "header-main") hiç çalışmaz — sınır sadece footer bölümlerine uygulanıyor.
 * Bir güncelleme kaydı zaten bulunduğu bölümde bırakıyorsa (section
 * değişmiyorsa) sayıma hiç girmiyoruz — var olan bir kaydı resave etmek asla
 * kendi doluluğuna çarpmamalı.
 */
export function rejectIfGroupFull(args: {
  collection: string;
  scopeField: string;
  limits: Record<string, number>;
}): CollectionBeforeChangeHook {
  const { collection, scopeField, limits } = args;
  return async ({ data, operation, req, originalDoc }) => {
    const scopeValue = data?.[scopeField];
    if (typeof scopeValue !== "string") return data;
    const limit = limits[scopeValue];
    if (!limit) return data;

    const previousScope = (originalDoc as Record<string, unknown> | undefined)?.[scopeField];
    const excludeId = operation === "update" ? (originalDoc as { id?: string | number } | undefined)?.id : undefined;
    if (operation === "update" && previousScope === scopeValue) return data;

    const constraints: Where[] = [{ [scopeField]: { equals: scopeValue } }];
    if (excludeId !== undefined) constraints.push({ id: { not_equals: excludeId } });

    const { totalDocs } = await req.payload.find({
      collection,
      where: { and: constraints },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    if (totalDocs < limit) return data;

    const lang = locale(req);
    throw new APIError(
      lang === "en"
        ? `This section already has the maximum of ${limit} links — delete an existing one before adding another.`
        : `Bu bölümde zaten en fazla ${limit} link var — yeni bir tane eklemeden önce var olan birini silin.`,
      400,
      undefined,
      true
    );
  };
}
