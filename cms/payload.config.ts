import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
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
import { ContactInfo } from "./src/globals/ContactInfo";
import { ROLES } from "./src/access/roles";
import { env } from "./src/env";
import { TRANSLATION_DEFAULTS } from "./src/lib/translationDefaults";

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

export default buildConfig({
  serverURL: cmsServerUrl,
  // RFP §3.5.7: admin UI must be Turkish. Payload UI (menus, buttons,
  // validation messages, dates) is now localized; `en` stays available as a
  // fallback/switchable option for developer debugging.
  i18n: {
    supportedLanguages: { tr, en },
    fallbackLanguage: "tr",
  },
  // RFP §3.2.14: multi-language content infrastructure. This is the CMS-side
  // half only — Pages.title is marked `localized: true` to prove the
  // mechanism (a brand-new, empty collection — safe to localize with no
  // migration ambiguity). Campaigns/BlogPosts were deliberately NOT
  // localized: both already have live data + versions.drafts version
  // history, and converting an existing field to localized changes how
  // Payload encodes the `_<collection>_v.snapshot` version column —
  // confirmed live, this puts drizzle-kit's schema push into an
  // interactive "is this a rename or a new column?" prompt that can't be
  // answered non-interactively and will hang. Localizing fields on a
  // collection with real history needs a deliberate, reviewed data
  // migration, not a config flag.
  //
  // The SITE itself has no locale-aware routing or language switcher yet
  // (it's Turkish-only end to end today), and no English translations have
  // been entered — building the site-side i18n routing layer is a
  // separate, large frontend initiative, not attempted here.
  localization: {
    locales: ["tr", "en"],
    defaultLocale: "tr",
    fallback: true,
  },
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
    components: {
      graphics: {
        Logo: "/components/AdminLogo#default",
        Icon: "/components/AdminIcon#default",
      },
      beforeLogin: ["/components/LoginBrandPanel#default"],
      beforeDashboard: ["/components/DashboardWidgets#default"],
      beforeNav: ["/components/SidebarLogo#default", "/components/LocalePreferenceSync#default"],
      afterNavLinks: ["/components/ContentManagementNavLink#default", "/components/WaitingApprovalsNavLink#default"],
      views: {
        contentManagement: {
          Component: "/components/ContentManagementView#default",
          path: "/content-management",
        },
        waitingApprovals: {
          Component: "/components/WaitingApprovalsView#default",
          path: "/waiting-approvals",
        },
        // RFP feedback 3.4: disable self-service password reset (LDAP will
        // own identity later) — overriding the built-in view keys blocks
        // the actual routes, not just the UI link.
        forgot: { Component: "/components/ForgotPasswordDisabled#default" },
        reset: { Component: "/components/ForgotPasswordDisabled#default" },
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
      select: { key: true },
      overrideAccess: true,
    });
    const existingKeys = new Set(existingRows.docs.map((d) => (d as { key: string }).key));
    const missing = Object.entries(TRANSLATION_DEFAULTS).filter(([key]) => !existingKeys.has(key));
    if (missing.length > 0) {
      for (const [key, value] of missing) {
        await payload.create({
          collection: Translations.slug,
          overrideAccess: true,
          data: { key, tr: value.tr, en: value.en },
        });
      }
      payload.logger.info(`[translations] Seeded ${missing.length} new default translation row(s).`);
    }

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
  collections: [
    Users,
    Media,
    Documents,
    Campaigns,
    Categories,
    FaqItems,
    BlogPosts,
    FeeRows,
    LimitTables,
    NavLinks,
    ProductHeroes,
    FeatureCards,
    StepCards,
    Announcements,
    LegalPages,
    ContentBlocks,
    Representatives,
    CookieRows,
    AuditLogs,
    PageMeta,
    Pages,
    Translations,
  ],
  globals: [ContactInfo],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URI,
    },
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
