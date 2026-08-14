import { ROLES } from "@/access/roles";
import { COLLECTION_LABELS } from "@/lib/collectionLabels";

/**
 * RFP feedback 3.10: "kampanya blog video ekleme temsilcilikler faqs ve
 * pages tek bir pagede açılsın... yukarda tab'ler olsun." One tab per
 * collection here — the page itself (ContentManagementApp.tsx) talks to
 * Payload's own REST API for each, so every existing access-control rule
 * (campaignsCreate, isNewVerticalMaker, etc.) is enforced server-side
 * exactly as it already is everywhere else — nothing new to re-verify.
 */
export type ContentManagementTab = {
  slug: string;
  titleField: string;
  hasDraft: boolean;
  isUpload?: boolean;
  /** Roles allowed to see the "Yeni Ekle" button — mirrors each collection's real `create` access. */
  canCreate: (role: string | undefined) => boolean;
  /** Roles allowed to see a "Sil" button — mirrors each collection's real `delete` access (server still enforces the exact rule, e.g. Growth Maker's own-draft-only scoping on Campaigns). */
  canDelete: (role: string | undefined) => boolean;
};

const isNvMaker = (role: string | undefined) => role === ROLES.NEW_VERTICAL_MAKER;

export const CONTENT_MANAGEMENT_TABS: ContentManagementTab[] = [
  {
    slug: "campaigns",
    titleField: "title",
    hasDraft: true,
    canCreate: (role) => role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.GROWTH_MAKER,
    canDelete: (role) => role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.GROWTH_MAKER,
  },
  { slug: "blog-posts", titleField: "title", hasDraft: true, canCreate: isNvMaker, canDelete: isNvMaker },
  { slug: "faq-items", titleField: "question", hasDraft: true, canCreate: isNvMaker, canDelete: isNvMaker },
  { slug: "announcements", titleField: "title", hasDraft: true, canCreate: isNvMaker, canDelete: isNvMaker },
  { slug: "representatives", titleField: "businessName", hasDraft: false, canCreate: isNvMaker, canDelete: isNvMaker },
  { slug: "media", titleField: "filename", hasDraft: false, isUpload: true, canCreate: isNvMaker, canDelete: isNvMaker },
  { slug: "pages", titleField: "title", hasDraft: true, canCreate: isNvMaker, canDelete: isNvMaker },
];

export function tabLabel(slug: string, locale: "tr" | "en"): string {
  return COLLECTION_LABELS[slug]?.[locale] ?? slug;
}
