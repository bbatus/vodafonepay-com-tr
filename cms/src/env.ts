import { z } from "zod";

/**
 * R-03/R-04: the CMS must never boot with a missing or default/dev secret in
 * production. `PAYLOAD_SECRET` used to default to `""` (payload.config.ts),
 * and docker-compose's `PAYLOAD_SECRET:-dev-payload-secret-change-me` /
 * `REVALIDATE_SECRET:-dev-revalidate-secret` defaults mean a forgotten .env
 * silently boots the real deployment with secrets everyone can guess.
 *
 * This runs once at config-eval time (imported at the top of
 * payload.config.ts) and throws immediately if production requirements
 * aren't met, instead of booting into an insecure state.
 */

const KNOWN_DEV_SECRETS = new Set(["dev-payload-secret-change-me", "dev-revalidate-secret", ""]);

const envSchema = z.object({
  DATABASE_URI: z.string().min(1, "DATABASE_URI is required"),
  PAYLOAD_SECRET: z.string().min(1, "PAYLOAD_SECRET is required"),
  REVALIDATE_SECRET: z.string().min(1, "REVALIDATE_SECRET is required"),
});

const isProduction = process.env.NODE_ENV === "production";
// CMS_AUTO_LOGIN is itself a local-only dev flag (see payload.config.ts) —
// if it's set we're already in a non-production posture, so relax the
// default-secret check rather than double-block local dev.
const isLocalDev = process.env.CMS_AUTO_LOGIN === "true";

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(
    `[env] Missing required environment variable(s): ${missing}. Refusing to start — see .env.example.`
  );
}

if (isProduction && !isLocalDev) {
  if (KNOWN_DEV_SECRETS.has(parsed.data.PAYLOAD_SECRET)) {
    throw new Error(
      "[env] PAYLOAD_SECRET is unset or still the dev placeholder. Refusing to start in production — set a real secret."
    );
  }
  if (KNOWN_DEV_SECRETS.has(parsed.data.REVALIDATE_SECRET)) {
    throw new Error(
      "[env] REVALIDATE_SECRET is unset or still the dev placeholder. Refusing to start in production — set a real secret."
    );
  }
}

export const env = parsed.data;
