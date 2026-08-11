import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Users } from "./src/collections/Users";
import { Media } from "./src/collections/Media";
import { Campaigns } from "./src/collections/Campaigns";
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
import { ContactInfo } from "./src/globals/ContactInfo";
import { ROLES } from "./src/access/roles";
import { env } from "./src/env";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const siteUrl = process.env.SITE_URL || "http://localhost:3000";

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

export default buildConfig({
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
    },
  },
  onInit: async (payload) => {
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
    Campaigns,
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
  cors: [siteUrl],
  csrf: [siteUrl],
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
