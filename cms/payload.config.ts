import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import type { Block } from "payload";
import {
  lexicalEditor,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  HeadingFeature,
  ParagraphFeature,
  UnorderedListFeature,
  OrderedListFeature,
  LinkFeature,
  BlockquoteFeature,
  HorizontalRuleFeature,
  UploadFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  EXPERIMENTAL_TableFeature,
  TextStateFeature,
  BlocksFeature,
} from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { tr } from "@payloadcms/translations/languages/tr";
import { en } from "@payloadcms/translations/languages/en";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Users } from "./src/collections/Users";
import { Media } from "./src/collections/Media";
import { Documents } from "./src/collections/Documents";
import { Campaigns } from "./src/collections/Campaigns";
import { Categories } from "./src/collections/Categories";
import { FaqItems } from "./src/collections/FaqItems";
import { BlogPosts } from "./src/collections/BlogPosts";
import { FeeRows } from "./src/collections/FeeRows";
import { LimitTables } from "./src/collections/LimitTables";
import { NavLinks } from "./src/collections/NavLinks";
import { ProductHeroes } from "./src/collections/ProductHeroes";
import { FeatureCards } from "./src/collections/FeatureCards";
import { StepCards } from "./src/collections/StepCards";
import { Announcements } from "./src/collections/Announcements";
import { LegalPages } from "./src/collections/LegalPages";
import { ContentBlocks } from "./src/collections/ContentBlocks";
import { Representatives } from "./src/collections/Representatives";
import { CookieRows } from "./src/collections/CookieRows";
import { AuditLogs } from "./src/collections/AuditLogs";
import { PageMeta } from "./src/collections/PageMeta";
import { Pages } from "./src/collections/Pages";
import { Translations } from "./src/collections/Translations";
import { Feedback } from "./src/collections/Feedback";
import { ContactInfo } from "./src/globals/ContactInfo";
import { ROLES } from "./src/access/roles";
import { env } from "./src/env";
import { TRANSLATION_DEFAULTS } from "./src/lib/translationDefaults";
import { refreshLabelCache } from "./src/lib/collectionLabels";
import { auditExportEndpoint, auditForbiddenAttempt } from "./src/hooks/audit";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const siteUrl = process.env.SITE_URL || "http://localhost:3000";
const cmsPort = process.env.CMS_PORT || "3010";

// The CMS admin panel's own origin was never in this list — only the
// frontend's SITE_URL was. Payload's CSRF check runs on every mutating
// request (PATCH/POST/DELETE) and, on an origin mismatch, doesn't throw a
// distinct CSRF error — it silently drops the cookie-derived user, so the
// request proceeds as unauthenticated and every access-control check fails
// closed. Confirmed live: with CMS_AUTO_LOGIN off, every write (save
// draft, publish, delete) from the admin UI itself 403'd with req.user
// undefined, while reads kept working (no CSRF check on GET). Also covers
// the LAN IP case (opening the admin from a phone on the same network).
const trustedOrigins = Array.from(
  new Set(
    [siteUrl, `http://localhost:${cmsPort}`, `http://127.0.0.1:${cmsPort}`, process.env.CMS_LAN_URL].filter(
      (v): v is string => Boolean(v)
    )
  )
);

// TEMPORARY (local review only): set CMS_AUTO_LOGIN=true to skip the admin
// login screen, so the CMS UI/UX can be reviewed without a real auth flow.
//
// IMPORTANT — this is NOT scoped to the admin UI. Payload's `autoLogin`
// treats every incoming request as authenticated as the dev user, including
// raw unauthenticated REST/GraphQL calls with no session/cookie at all.
// Confirmed by testing: with this on, `GET /api/campaigns/:id?draft=true`
// from a cookie-less curl request returned as if logged in. That means ALL
// access-control checks in this codebase (read/readVersions/create/update/
// delete, the denyUnauthenticatedDraftRead hooks) are meaningless while this
// flag is on — you cannot use it to test whether access control actually
// works. Off unless explicitly enabled; never set this in a real deployment
// or anywhere reachable from outside your own machine.
const autoLoginEnabled = process.env.CMS_AUTO_LOGIN === "true";
const devAdminEmail = process.env.CMS_ADMIN_EMAIL || "admin@vodafonepay.local";
const devAdminPassword = process.env.CMS_ADMIN_PASSWORD || "dev-admin-please-change";

// Without an explicit serverURL, Payload doesn't know its own
// externally-reachable address and falls back to whatever it's actually
// bound to inside the container — here, `localhost:3000` (the Next.js
// server's internal listen port), never the `3010` the docker-compose
// port mapping exposes it as. The admin UI's own save/publish actions run
// through a server-side call that builds its request from this value; with
// it wrong, that call reconstructs a `localhost:3000` request carrying
// none of the browser's cookies, so every write 403s with an empty
// req.user while reads (which don't go through this path) keep working —
// confirmed live: CMS_AUTO_LOGIN masked this because its fallback
// auto-auths on any failed auth extraction, so this was never exercised
// until real login was tested.
const cmsServerUrl = process.env.CMS_SERVER_URL || `http://localhost:${cmsPort}`;

/**
 * RFP follow-up: inline video embed inside richText content — same idea as
 * Pages.ts's page-builder `VideoBlock` (accepts a raw YouTube URL/ID,
 * renders as a responsive iframe), but registered as a *lexical* block via
 * `BlocksFeature` so it can be dropped anywhere inside a blog/campaign body,
 * not just as a whole-page section. URL parsing (accepting the full
 * youtube.com/watch, youtu.be, or embed URL, not just a bare ID) happens at
 * render time in src/components/RichText.tsx, not here — this only stores
 * whatever the editor pasted.
 */
const YouTubeEmbedBlock: Block = {
  slug: "youtubeEmbed",
  labels: { singular: { tr: "YouTube Video", en: "YouTube Video" }, plural: { tr: "YouTube Videoları", en: "YouTube Videos" } },
  fields: [
    {
      name: "youtubeUrl",
      type: "text",
      required: true,
      label: { tr: "YouTube Video Linki", en: "YouTube Video Link" },
      admin: {
        description: {
          tr: "youtube.com/watch?v=..., youtu.be/... veya embed linki yapıştırabilirsiniz.",
          en: "Paste a youtube.com/watch?v=..., youtu.be/..., or embed link.",
        },
      },
    },
  ],
};

export default buildConfig({
  serverURL: cmsServerUrl,
  // RFP §3.5.7: admin UI must be Turkish. Payload UI (menus, buttons,
  // validation messages, dates) is now localized; `en` stays available as a
  // fallback/switchable option for developer debugging.
  i18n: {
    supportedLanguages: { tr, en },
    fallbackLanguage: "tr",
  },
  // RFP feedback 5.7 — CONTENT LOCALIZATION IS OFF, deliberately.
  //
  // There are two different "language" concepts in this panel and they were
  // being confused for one:
  //   1. Admin UI language — `i18n` above, the `payload-lng` cookie. Owned by
  //      the user's own `preferredLocale` profile setting. Still here.
  //   2. Content locale — this `localization` block. Payload renders its own
  //      locale selector in the app header whenever it's set.
  //
  // (2) was enabled but Pages.title was the ONLY field anywhere marked
  // `localized: true`, so the header selector switched a locale that changed
  // nothing on any screen — exactly the user's report that "sayfaların locals
  // değerleri hiç değişmiyor". A selector that does nothing is worse than no
  // selector, so it's gone rather than CSS-hidden: hiding it would have left
  // `?locale=en` reachable by URL and the half-configured state in place.
  //
  // Turning it off was safe to do NOW specifically because `pages` (and
  // `pages_locales` / `_pages_v_locales`) were verified empty — zero rows, so
  // no content could be lost. Turning it back on later is a deliberate
  // project: it needs the fields that should actually be translatable, real
  // English content, and a reviewed data migration. Note the previous round's
  // finding still stands as the reason not to do that casually — marking a
  // field localized on a collection that already has `versions.drafts`
  // history puts drizzle-kit's schema push into an interactive "rename or new
  // column?" prompt that can't be answered non-interactively.
  //
  // The SITE itself is Turkish-only end to end (no locale routing, no
  // language switcher), so nothing downstream depended on this either.
  admin: {
    user: Users.slug,
    theme: "light",
    ...(autoLoginEnabled
      ? {
          autoLogin: {
            email: devAdminEmail,
            password: devAdminPassword,
            prefillOnly: false,
          },
        }
      : {}),
    meta: {
      titleSuffix: " — Vodafone Pay CMS",
      icons: [{ url: "/favicon.ico" }],
    },
    // RFP feedback 4a: the header icon otherwise only supports Payload's
    // "default" (generic silhouette) or "gravatar" — neither reads our own
    // users.avatar upload field.
    avatar: { Component: "/components/UserAvatarIcon#default" },
    components: {
      graphics: {
        Logo: "/components/AdminLogo#default",
        Icon: "/components/AdminIcon#default",
      },
      beforeLogin: ["/components/LoginBrandPanel#default", "/components/RememberEmailCheckbox#default"],
      // RFP follow-up: `beforeDashboard` only PREPENDS content above
      // Payload's own default dashboard grid (every collection as a link
      // card) — it can't remove it. Full replacement now happens via
      // `views.dashboard` below (CustomDashboardView), which composes this
      // same DashboardWidgets component alongside new KPI/recent-items
      // panels — see that file's doc comment.
      beforeNav: ["/components/SidebarLogo#default", "/components/LocalePreferenceSync#default"],
      // Follow-up 25.08: these custom top-level views used to render as three
      // stray blocks below every group ("en altta iki tane atıl duran…").
      // GroupedNavLink portals each one into the group it logically belongs
      // to — see that component for why a portal is needed at all (Payload
      // builds groups from collection `admin.group`; a custom view can't join
      // one through config). `groupNames` lists both language spellings since
      // the match is on the group header's rendered text.
      //
      // Feedback deliberately stays ungrouped at the very bottom — the
      // request was specifically "sidebarın en altında feedback ver gibi bir
      // alanda".
      afterNavLinks: [
        {
          path: "/components/GroupedNavLink#default",
          clientProps: { href: "/admin/content-management", labelKey: "contentManagement.navLabel", groupNames: ["Sistem", "System"] },
        },
        {
          path: "/components/GroupedNavLink#default",
          clientProps: { href: "/admin/access-matrix", labelKey: "accessMatrix.navLabel", groupNames: ["Sistem", "System"], nvMakerOnly: true },
        },
        {
          path: "/components/GroupedNavLink#default",
          clientProps: {
            href: "/admin/fees-and-limits",
            labelKey: "feesAndLimits.navLabel",
            groupNames: ["İçerik Yönetimi", "Content Management"],
          },
        },
        {
          path: "/components/GroupedNavLink#default",
          clientProps: { href: "/admin/feedback", labelKey: "feedback.navLabel", groupNames: [], spaced: true },
        },
      ],
      views: {
        contentManagement: {
          Component: "/components/ContentManagementView#default",
          path: "/content-management",
        },
        // RFP follow-up: "ücret ve limit tabloları tek sayfada, tabli geçişle
        // yönetilebilmeli" — one combined view replaces the two separate
        // FeeRows/LimitTables sidebar entries (now `admin.hidden`, see both
        // collection configs).
        feesAndLimits: {
          Component: "/components/FeesAndLimitsView#default",
          path: "/fees-and-limits",
        },
        // RFP follow-up: full replacement of Payload's own dashboard body
        // (a generic grid of every collection) with a real, role-scoped
        // summary — see CustomDashboardView.tsx's doc comment.
        dashboard: {
          Component: "/components/CustomDashboardView#default",
        },
        // RFP §7 "userID comparison tables" — see AccessMatrixApp.tsx's doc
        // comment for the interpretation (a role × collection access matrix).
        accessMatrix: {
          Component: "/components/AccessMatrixView#default",
          path: "/access-matrix",
        },
        // Follow-up 25.08: one-way "tell us what's awkward" form — see
        // collections/Feedback.ts for why nothing can read it back.
        feedback: {
          Component: "/components/FeedbackView#default",
          path: "/feedback",
        },
        // RFP feedback 3.4: disable self-service password reset (LDAP will
        // own identity later) — overriding the built-in view keys blocks
        // the actual routes, not just the UI link.
        forgot: { Component: "/components/ForgotPasswordDisabled#default" },
        reset: { Component: "/components/ForgotPasswordDisabled#default" },
        // RFP feedback 4a-4f: replaces the default Account view body (read-only
        // email/role, working avatar upload without alt/caption friction, a
        // single language switcher) — see CustomAccountView.tsx for why a full
        // replacement was necessary rather than patching individual fields.
        account: { Component: "/components/CustomAccountView#default" },
      },
    },
  },
  onInit: async (payload) => {
    // RFP feedback 3.2: seed the DB-backed translations collection with any
    // KEY that doesn't already exist yet — runs every boot, but only ever
    // inserts missing keys (e.g. new code defaults added after the first
    // deploy), never touches/overwrites a row an editor already customized.
    const existingRows = await payload.find({
      collection: Translations.slug,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    });
    const existingTranslations = new Map(
      (existingRows.docs as unknown as { id: string | number; key: string; tr: string; en: string; isCustomized?: boolean }[]).map(
        (row) => [row.key, row]
      )
    );

    let created = 0;
    let refreshed = 0;
    for (const [key, value] of Object.entries(TRANSLATION_DEFAULTS)) {
      const row = existingTranslations.get(key);
      if (!row) {
        await payload.create({
          collection: Translations.slug,
          overrideAccess: true,
          data: { key, tr: value.tr, en: value.en },
        });
        created += 1;
        continue;
      }
      // Changing a string in translationDefaults.ts used to be a silent no-op
      // once the row had been seeded — the old seeder only ever INSERTED
      // missing keys, so an updated default never reached the running panel
      // (found while verifying the new login copy: the code said one thing and
      // the screen still said the old one). Rows an editor actually touched
      // are still never overwritten; `isCustomized` is what separates the two
      // (see Translations.ts).
      if (row.isCustomized) continue;
      if (row.tr === value.tr && row.en === value.en) continue;
      await payload.update({
        collection: Translations.slug,
        id: row.id,
        overrideAccess: true,
        data: { tr: value.tr, en: value.en },
      });
      refreshed += 1;
    }
    if (created > 0 || refreshed > 0) {
      payload.logger.info(`[translations] Seeded ${created} new row(s), refreshed ${refreshed} un-customized row(s) from code defaults.`);
    }
    await refreshLabelCache(payload);

    if (!autoLoginEnabled) return;
    const existing = await payload.find({
      collection: Users.slug,
      limit: 1,
      overrideAccess: true,
    });
    if (existing.totalDocs === 0) {
      await payload.create({
        collection: Users.slug,
        overrideAccess: true,
        data: {
          email: devAdminEmail,
          password: devAdminPassword,
          role: ROLES.NEW_VERTICAL_MAKER,
        },
      });
      payload.logger.info(
        `[CMS_AUTO_LOGIN] Seeded dev admin user (${devAdminEmail}) — login screen is bypassed.`,
      );
    }
  },
  // Follow-up 25.08: Payload renders each sidebar group's links in THIS
  // array's order, so the requested ordering ("altında ilk kategoriler olmalı.
  // ikinci kampanyalar sonra sayfalar sık sorulanlar blog yazıları temsilciler
  // içerik blokları") is expressed here, not in a separate config. Grouped by
  // sidebar section for readability — the group each one lands in is its own
  // `admin.group`.
  collections: [
    // — Sistem —
    Users,
    Media,
    Documents,
    AuditLogs,
    Translations,
    // — İçerik Yönetimi —
    Categories,
    Campaigns,
    Pages,
    FaqItems,
    BlogPosts,
    Representatives,
    ContentBlocks,
    Announcements,
    FeeRows,
    LimitTables,
    // — Site Yapısı —
    NavLinks,
    LegalPages,
    CookieRows,
    PageMeta,
    // — Ürün Sayfaları —
    ProductHeroes,
    FeatureCards,
    StepCards,
    // Hidden from every sidebar group (admin.hidden) — reachable only through
    // the "Geri Bildirim Gönder" screen's submit endpoint.
    Feedback,
  ],
  globals: [ContactInfo],
  // RFP §7.2 follow-up: audits collection can't hook a plain read (see
  // auditExportEndpoint's doc comment in hooks/audit.ts) — a root-level
  // endpoint is the extension point for that, unrelated to any one
  // collection's own CRUD lifecycle.
  endpoints: [auditExportEndpoint],
  // RFP §7.2: logs every rejected (403) write attempt, across every
  // collection at once — see auditForbiddenAttempt's doc comment
  // (hooks/audit.ts) for why root-level is the right extension point here.
  hooks: {
    afterError: [auditForbiddenAttempt],
  },
  // RFP follow-up (§3.6): was `lexicalEditor()` with zero feature config —
  // that leaves the editor with only bold/italic/underline/paragraph and no
  // headings, lists, links, tables, or images, which is why editors couldn't
  // reproduce vodafonepay.com.tr's blog formatting (tables, colored
  // headings) at all: the editor UI never offered those controls. This is
  // the single shared config for all three richText usages (BlogPosts.body,
  // Campaigns.body/terms, Pages' `richText` block) — see
  // src/components/RichText.tsx on the site for the matching renderer.
  editor: lexicalEditor({
    features: ({ rootFeatures }) => [
      ...rootFeatures,
      ParagraphFeature(),
      HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
      BoldFeature(),
      ItalicFeature(),
      UnderlineFeature(),
      StrikethroughFeature(),
      UnorderedListFeature(),
      OrderedListFeature(),
      // Internal-doc linking disabled on purpose: the site's renderer
      // (src/components/RichText.tsx) has no slug/collection → URL resolver
      // wired up, so an internal link would silently render `href="#"`.
      // Editors get "custom URL" only, which always renders correctly.
      LinkFeature({ enabledCollections: [] }),
      BlockquoteFeature(),
      HorizontalRuleFeature(),
      // RFP follow-up: `width` is a per-instance field on the upload node
      // itself (not on Media), so the same image can be inserted small in
      // one post and full-width in another — src/components/RichText.tsx's
      // `upload` converter reads `node.fields.width` and applies it.
      UploadFeature({
        collections: {
          media: {
            fields: [
              {
                name: "width",
                type: "select",
                defaultValue: "large",
                label: { tr: "Görsel Boyutu", en: "Image Size" },
                options: [
                  { label: { tr: "Küçük", en: "Small" }, value: "small" },
                  { label: { tr: "Orta", en: "Medium" }, value: "medium" },
                  { label: { tr: "Büyük", en: "Large" }, value: "large" },
                  { label: { tr: "Tam Genişlik", en: "Full Width" }, value: "full" },
                ],
              },
            ],
          },
        },
      }),
      // RFP follow-up: inline YouTube embed, droppable anywhere in the
      // content (not just as a whole-page section like Pages.ts's own
      // VideoBlock). See YouTubeEmbedBlock's own comment above.
      BlocksFeature({ blocks: [YouTubeEmbedBlock] }),
      // @experimental in the package itself (literally named
      // EXPERIMENTAL_TableFeature) — this is the only table implementation
      // Payload ships, and it's what the live vodafonepay.com.tr fee/limit
      // tables inside blog posts need. Documented as an accepted risk in the
      // round report rather than hidden.
      EXPERIMENTAL_TableFeature(),
      // Approved decision: a single fixed "Vurgu" (Vodafone red) highlight,
      // not a free color picker — matches the live site's actual usage
      // (one accent color, never arbitrary ones) and avoids editors
      // producing off-brand colors. `#e60000` is the same value as the
      // site's `--color-vf-red` (src/app/globals.css).
      TextStateFeature({
        state: {
          color: {
            // `TextStateFeature`'s `label` type is `string`, not Payload's
            // usual bilingual StaticLabel (@payloadcms/richtext-lexical's
            // feature.server.d.ts) — this toolbar entry can't be localized
            // the normal way.
            vurgu: { css: { color: "#e60000" }, label: "Vurgu" },
          },
        },
      }),
      FixedToolbarFeature(),
      InlineToolbarFeature(),
    ],
  }),
  secret: env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URI,
    },
    // Payload's dev-mode schema push is drizzle-kit's INTERACTIVE push. In this
    // project it reliably stops on a prompt nobody can answer — "is this enum
    // created or renamed?", "accept possible data loss?" — and a `next dev`
    // that's blocked on stdin looks exactly like a hung server (documented as
    // R-10, and hit again this round). Set PAYLOAD_DB_PUSH=false to run the CMS
    // in dev against an already-migrated database and skip that entirely.
    //
    // Default is unchanged (push on in dev) so nobody's normal workflow moves;
    // this is an opt-out for the case where the schema was applied by hand.
    push: process.env.PAYLOAD_DB_PUSH !== "false",
  }),
  sharp,
  cors: trustedOrigins,
  csrf: trustedOrigins,
  plugins: [
    s3Storage({
      collections: {
        media: {
          // The S3 client (below) talks to MinIO over the internal Docker
          // network address. Browsers can't resolve that host, so uploaded
          // file URLs are built from a separate, publicly reachable address
          // (the host-mapped MinIO port) instead of the client's default.
          generateFileURL: ({ filename, prefix }) => {
            const base = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || "";
            const bucket = process.env.S3_BUCKET || "vodafonepaycomtr-media";
            const key = prefix ? `${prefix}/${filename}` : filename;
            return `${base}/${bucket}/${key}`;
          },
        },
        documents: {
          generateFileURL: ({ filename, prefix }) => {
            const base = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || "";
            const bucket = process.env.S3_BUCKET || "vodafonepaycomtr-media";
            const key = prefix ? `${prefix}/${filename}` : filename;
            return `${base}/${bucket}/${key}`;
          },
        },
      },
      bucket: process.env.S3_BUCKET || "vodafonepaycomtr-media",
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
        forcePathStyle: true,
      },
    }),
  ],
});
