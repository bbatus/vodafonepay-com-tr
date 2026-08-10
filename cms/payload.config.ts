import path from "path";
import { fileURLToPath } from "url";
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
import { ContactInfo } from "./src/globals/ContactInfo";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const siteUrl = process.env.SITE_URL || "http://localhost:3000";

// TEMPORARY (local review only): set CMS_AUTO_LOGIN=true to skip the admin
// login screen entirely, so the CMS UI/UX can be reviewed without a real
// auth flow. Off unless explicitly enabled — flip CMS_AUTO_LOGIN off (or
// remove it) to restore normal login. Never set this in a real deployment.
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
          role: "admin",
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
  ],
  globals: [ContactInfo],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
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
