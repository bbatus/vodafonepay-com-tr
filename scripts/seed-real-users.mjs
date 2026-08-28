#!/usr/bin/env node
/**
 * Seeds the CMS's user accounts from the real AccessPoint role matrix
 * (28.08.2026) and removes the older `test-*@vodafonepay.local` fixtures.
 *
 * Why a script and not the API: `cms/src/collections/Users.ts` sets
 * `ALLOW_USER_CREATION = false` on purpose — accounts are LDAP/AccessPoint-
 * provisioned and `POST /api/users` is closed. Until the real LDAP bind
 * lands (docs/RFP-OPEN-ITEMS.md §6) the only way to put an account in the
 * local dev database is a direct INSERT with a Payload-compatible
 * pbkdf2 salt/hash pair, which is what this does. Same approach
 * docs/TEST-USERS.MD already documented for the fixtures it replaces.
 *
 * THESE ARE LOCAL DEVELOPMENT FIXTURES, NOT REAL CREDENTIALS. The named
 * accounts mirror the role matrix so the panel can be demoed and tested with
 * the actual role/person pairing; the shared dev password below is
 * meaningless outside this docker-compose stack, and every one of these
 * accounts is expected to be replaced by its real LDAP identity (which owns
 * email/username/role/password) before anything reaches a real environment.
 *
 * `admin@vodafonepay.local` is deliberately left alone: it holds
 * NEW_VERTICAL_MAKER (AccessPoint `RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW`
 * — the developer/system role, explicitly out of scope for this round) and is
 * the CMS's only route to user management, audit logs, deletes and
 * translations. Removing it would leave the panel unadministrable.
 *
 * Usage:
 *   node scripts/seed-real-users.mjs | docker exec -i vodafonepaycms-postgres \
 *     psql -U payload -d vodafonepaycms
 */
import crypto from "node:crypto";

/** Payload's own pbkdf2 parameters — verified against an existing account's stored hash. */
const ITERATIONS = 25000;
const KEYLEN = 512;
const DIGEST = "sha256";

/** Local-dev-only. LDAP owns the real password; see the file header. */
const DEV_PASSWORD = "VodafonePay!2026";

/**
 * From the business-provided AccessPoint role table. `role` is the CMS's
 * internal slug; the AccessPoint group name it maps from lives in
 * `cms/src/access/roleMapping.ts`.
 *
 * Emails are lowercased on insert (see `norm` below): Payload lowercases the
 * address on login before looking it up, while the `users_email_idx` unique
 * index is case-sensitive — so a row stored as `Ece.Boran@…` can never be
 * logged into. Confirmed live before this was fixed.
 */
const USERS = [
  // ROLE_VODAFONEPAY_CMS_MAKER_RW — Vodafone Pay Growth
  { email: "Ece.Boran@vodafone.com", role: "growth_maker" },
  { email: "YunusEmre.Karazeybek@vodafone.com", role: "growth_maker" },
  { email: "Hande.Tanis@vodafone.com", role: "growth_maker" },
  { email: "Sibel.Saribas@vodafone.com", role: "growth_maker" },
  // ROLE_VODAFONEPAY_CMS_CHECKER_RO — Vodafone Pay Growth
  { email: "Mert.Sarihan@vodafone.com", role: "growth_checker" },
  // RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW — New Vertical
  { email: "talha.ozgulcu@vodafone.com", role: "new_vertical_checker" },
];

/** The fixtures this replaces. `admin@vodafonepay.local` is intentionally absent. */
const RETIRED = [
  "test-nv-maker@vodafonepay.local",
  "test-nv-checker@vodafonepay.local",
  "test-growth-maker@vodafonepay.local",
  "test-growth-checker@vodafonepay.local",
];

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const norm = (email) => email.trim().toLowerCase();

const lines = ["BEGIN;"];
// Clear any mixed-case rows a previous run of this script may have inserted,
// so the lowercase INSERT below can't collide with an unusable duplicate.
lines.push(`DELETE FROM users WHERE lower(email) IN (${USERS.map((u) => q(norm(u.email))).join(", ")}) AND email <> lower(email);`);

for (const { email: rawEmail, role } of USERS) {
  const email = norm(rawEmail);
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto.pbkdf2Sync(DEV_PASSWORD, salt, ITERATIONS, KEYLEN, DIGEST).toString("hex");
  // Idempotent: re-running refreshes the credentials rather than erroring on
  // the unique email index.
  lines.push(
    `INSERT INTO users (email, role, salt, hash, preferred_locale, login_attempts, updated_at, created_at)
VALUES (${q(email)}, ${q(role)}::enum_users_role, ${q(salt)}, ${q(hash)}, 'tr', 0, now(), now())
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, salt = EXCLUDED.salt, hash = EXCLUDED.hash;`
  );
}

// Delete last, so the new accounts exist before the old ones go — the
// `created_by` FKs are ON DELETE SET NULL, so existing content simply loses
// its authorship stamp rather than being removed with the account.
lines.push(`DELETE FROM users WHERE email IN (${RETIRED.map(q).join(", ")});`);
lines.push("COMMIT;");
lines.push(`SELECT id, email, role FROM users ORDER BY role, email;`);

console.log(lines.join("\n"));
