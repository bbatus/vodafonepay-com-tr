import { ROLES, type RoleValue } from "@/access/roles";
import { DRAFT_ENABLED_COLLECTIONS } from "@/lib/collectionLabels";

/**
 * Mirrors the actual access-control wiring in `access/roles.ts` +
 * each collection's `access` block — this file must stay in sync with that
 * one by hand (there's no way to introspect Payload's resolved access
 * functions at the type level). Every category here corresponds to a real,
 * distinct `create`/`update`/`delete` combination used by at least one
 * collection; see the comment on each category for which collections use it
 * and why.
 */
type Category = "standard" | "media" | "campaigns" | "users" | "audit-logs" | "contact-info";

const CATEGORY_BY_COLLECTION: Record<string, Category> = {
  // create: newVerticalCreate, update: newVerticalReadWrite, delete: isNewVerticalMaker
  "faq-items": "standard",
  "blog-posts": "standard",
  announcements: "standard",
  "content-blocks": "standard",
  representatives: "standard",
  pages: "standard",
  "fee-rows": "standard",
  "limit-tables": "standard",
  "nav-links": "standard",
  "legal-pages": "standard",
  "cookie-rows": "standard",
  "page-meta": "standard",
  "product-heroes": "standard",
  "feature-cards": "standard",
  "step-cards": "standard",
  documents: "standard",
  media: "media",
  campaigns: "campaigns",
  users: "users",
  "audit-logs": "audit-logs",
  "contact-info": "contact-info",
};

export type PermissionFlags = {
  view: boolean;
  create: boolean;
  update: boolean;
  /** Only meaningful when the collection has `versions.drafts` — flat (no-draft) collections ignore this. */
  publish: boolean;
  delete: boolean;
};

const NV_MAKER = ROLES.NEW_VERTICAL_MAKER;
const NV_CHECKER = ROLES.NEW_VERTICAL_CHECKER;
const G_MAKER = ROLES.GROWTH_MAKER;
const G_CHECKER = ROLES.GROWTH_CHECKER;

const MATRIX: Record<Category, Record<RoleValue, PermissionFlags>> = {
  standard: {
    [NV_MAKER]: { view: true, create: true, update: true, publish: true, delete: true },
    [NV_CHECKER]: { view: true, create: false, update: true, publish: true, delete: false },
    [G_MAKER]: { view: true, create: false, update: false, publish: false, delete: false },
    [G_CHECKER]: { view: true, create: false, update: false, publish: false, delete: false },
  },
  media: {
    [NV_MAKER]: { view: true, create: true, update: true, publish: false, delete: true },
    [NV_CHECKER]: { view: true, create: false, update: true, publish: false, delete: false },
    [G_MAKER]: { view: true, create: true, update: false, publish: false, delete: false },
    [G_CHECKER]: { view: true, create: false, update: false, publish: false, delete: false },
  },
  campaigns: {
    [NV_MAKER]: { view: true, create: true, update: true, publish: true, delete: true },
    [NV_CHECKER]: { view: true, create: false, update: true, publish: true, delete: false },
    [G_MAKER]: { view: true, create: true, update: true, publish: false, delete: false },
    [G_CHECKER]: { view: true, create: false, update: true, publish: true, delete: false },
  },
  users: {
    [NV_MAKER]: { view: true, create: true, update: true, publish: false, delete: true },
    [NV_CHECKER]: { view: true, create: false, update: true, publish: false, delete: false },
    [G_MAKER]: { view: true, create: false, update: true, publish: false, delete: false },
    [G_CHECKER]: { view: true, create: false, update: true, publish: false, delete: false },
  },
  "audit-logs": {
    [NV_MAKER]: { view: true, create: false, update: false, publish: false, delete: false },
    [NV_CHECKER]: { view: false, create: false, update: false, publish: false, delete: false },
    [G_MAKER]: { view: false, create: false, update: false, publish: false, delete: false },
    [G_CHECKER]: { view: false, create: false, update: false, publish: false, delete: false },
  },
  "contact-info": {
    [NV_MAKER]: { view: true, create: false, update: true, publish: false, delete: false },
    [NV_CHECKER]: { view: true, create: false, update: true, publish: false, delete: false },
    [G_MAKER]: { view: false, create: false, update: false, publish: false, delete: false },
    [G_CHECKER]: { view: false, create: false, update: false, publish: false, delete: false },
  },
};

const ROLE_NAME: Record<RoleValue, { tr: string; en: string }> = {
  [NV_MAKER]: { tr: "New Vertical — Maker", en: "New Vertical — Maker" },
  [NV_CHECKER]: { tr: "New Vertical — Checker", en: "New Vertical — Checker" },
  [G_MAKER]: { tr: "Growth — Maker", en: "Growth — Maker" },
  [G_CHECKER]: { tr: "Growth — Checker", en: "Growth — Checker" },
};

function isKnownRole(role: string | undefined): role is RoleValue {
  return role === NV_MAKER || role === NV_CHECKER || role === G_MAKER || role === G_CHECKER;
}

/**
 * Builds the "sizin yetkiniz" text HelpButton shows: what this specific
 * user can/cannot do in this specific collection, and — for the "cannot"
 * items — a one-line reason, so a Growth Maker looking at Faq Items
 * understands they're not missing a button, they simply don't own that
 * content, versus a Growth Maker looking at Campaigns understanding why
 * "Publish" is greyed out for them specifically (maker/checker segregation
 * of duties) rather than for everyone.
 */
export function getRolePermissionSummary(
  collectionSlug: string,
  role: string | undefined,
  locale: "tr" | "en"
): { roleLabel: string; lines: string[] } | null {
  const category = CATEGORY_BY_COLLECTION[collectionSlug];
  if (!category || !isKnownRole(role)) return null;

  const flags = MATRIX[category][role];
  const roleLabel = ROLE_NAME[role][locale];
  const hasDrafts = DRAFT_ENABLED_COLLECTIONS.has(collectionSlug);
  const lines: string[] = [];

  if (!flags.view) {
    lines.push(
      locale === "tr"
        ? "Bu bölümü göremezsiniz — sol menüde de listelenmez. Yalnızca New Vertical — Maker rolü erişebilir."
        : "You cannot see this section — it isn't even listed in the left menu. Only the New Vertical — Maker role can access it."
    );
    return { roleLabel, lines };
  }

  // Audit Logs: read-only for EVERYONE (even New Vertical — Maker) — this
  // isn't a maker/checker distinction, it's a deliberate "nobody edits
  // history" rule, so the generic create/update/delete copy below (which
  // explains gaps in terms of role tier) would be actively misleading here.
  if (category === "audit-logs") {
    lines.push(
      locale === "tr"
        ? "Bu liste tamamen salt-okunurdur — New Vertical — Maker dahil hiç kimse buradan bir kayıt ekleyemez, düzenleyemez veya silemez. Kayıtlar yalnızca sistem tarafından otomatik oluşturulur; bu, denetim izinin güvenilir kalması için kasıtlıdır."
        : "This list is entirely read-only — no one, including New Vertical — Maker, can add, edit, or delete an entry here. Entries are only ever written automatically by the system; this is deliberate, so the audit trail stays trustworthy."
    );
    return { roleLabel, lines };
  }

  // Users: create/delete are global (only NV Maker), but "update" is
  // self-only for every other role — the generic flag text below would
  // wrongly read as "you can edit any user's record."
  if (category === "users") {
    if (role === NV_MAKER) {
      lines.push(
        locale === "tr"
          ? "Yeni kullanıcı oluşturabilir, herhangi bir kullanıcının rolünü değiştirebilir ve kullanıcı silebilirsiniz — kullanıcı yönetimi tamamen sizin yetkinizdedir."
          : "You can create new users, change any user's role, and delete users — user management is entirely within your authority."
      );
    } else {
      lines.push(
        locale === "tr"
          ? "Yalnızca KENDİ kullanıcı kaydınızı görüntüleyip düzenleyebilirsiniz (örn. şifrenizi değiştirmek). Başka bir kullanıcıyı göremez, değiştiremez veya silemezsiniz — kullanıcı/rol yönetimi yalnızca New Vertical — Maker rolüne aittir."
          : "You can only view and edit YOUR OWN user record (e.g. to change your password). You cannot see, change, or delete any other user — user/role management belongs to the New Vertical — Maker role only."
      );
    }
    return { roleLabel, lines };
  }

  // Contact Info is a Payload "global" — a single record with no
  // create/delete concept at all (for anyone), so the generic create/delete
  // copy below (which frames a "no" as a role-tier restriction) doesn't
  // apply here; only "can you update it" is meaningful.
  if (category === "contact-info") {
    lines.push(
      flags.update
        ? locale === "tr"
          ? "Bu, tek bir kayıttan oluşan bir 'global' — sitedeki tüm sayfaların kullandığı iletişim bilgilerini düzenleyebilirsiniz."
          : "This is a single-record 'global' — you can edit the contact info used across every page on the site."
        : locale === "tr"
          ? "Bu bölümü DÜZENLEYEMEZSİNİZ — site geneli iletişim bilgileri yalnızca New Vertical rolündeki kullanıcılar tarafından yönetilir."
          : "You CANNOT edit this section — site-wide contact info is managed only by users with a New Vertical role."
    );
    return { roleLabel, lines };
  }

  if (flags.create) {
    lines.push(locale === "tr" ? "Yeni kayıt oluşturabilirsiniz." : "You can create new records.");
  } else {
    lines.push(
      locale === "tr"
        ? "Yeni kayıt OLUŞTURAMAZSINIZ — bu, rolünüzün 'maker' değil 'checker'/salt-okunur tarafında olmasından kaynaklanır; sadece mevcut kayıtları inceleyip (yetkiniz varsa) onaylarsınız."
        : "You CANNOT create new records — this is because your role sits on the 'checker'/read-only side, not 'maker'; you only review (and, if permitted, approve) existing records."
    );
  }

  if (flags.update) {
    lines.push(locale === "tr" ? "Var olan kayıtları düzenleyebilirsiniz." : "You can edit existing records.");
  } else {
    lines.push(
      locale === "tr"
        ? "Var olan kayıtları DÜZENLEYEMEZSİNİZ — bu içerik sizin sorumluluk alanınızda değil, yalnızca görüntüleyebilirsiniz."
        : "You CANNOT edit existing records — this content isn't in your area of responsibility; you can only view it."
    );
  }

  if (hasDrafts) {
    if (flags.publish) {
      lines.push(
        locale === "tr"
          ? "Değişiklikleri yayınlayabilirsiniz (taslaktan canlıya alabilirsiniz)."
          : "You can publish changes (move a draft live)."
      );
    } else if (flags.update) {
      lines.push(
        locale === "tr"
          ? "Kaydedebilirsiniz ama YAYINLAYAMAZSINIZ — maker/checker ayrımı gereği kendi değişikliğinizi kendiniz onaylayamazsınız; başka bir yetkili (checker) yayınlamalı."
          : "You can save changes but CANNOT publish them — under the maker/checker separation of duties, you can't approve your own change; another authorized user (a checker) must publish it."
      );
    }
  }

  if (flags.delete) {
    lines.push(locale === "tr" ? "Kayıt silebilirsiniz." : "You can delete records.");
  } else {
    lines.push(
      locale === "tr"
        ? "Kayıt SİLEMEZSİNİZ — silme yetkisi kazara/yetkisiz veri kaybını önlemek için yalnızca New Vertical — Maker rolüne verilmiştir."
        : "You CANNOT delete records — delete access is restricted to the New Vertical — Maker role only, to prevent accidental or unauthorized data loss."
    );
  }

  return { roleLabel, lines };
}
