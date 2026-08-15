import type { CollectionBeforeChangeHook, CollectionConfig, Endpoint } from "payload";
import { isNewVerticalMaker, ROLE_OPTIONS, ROLES } from "@/access/roles";
import { authenticated } from "@/access/authenticated";
import { auditAfterChange, auditAfterDelete, writeAuditLog, ipOf, userAgentOf } from "@/hooks/audit";
import { blockDeleteIfReferenced } from "@/hooks/referentialIntegrity";
import { dbLabel } from "@/lib/collectionLabels";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2MB
const AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * RFP feedback: `mediaCreate` (access/roles.ts) is Maker-only — a Checker
 * hitting the normal `POST /api/media` for their own avatar gets a 403.
 * Widening `mediaCreate` itself would let Checkers upload arbitrary content
 * media, which is a real scope violation (Checkers review, they don't
 * create). This is a narrow, purpose-built endpoint instead: any
 * authenticated user can upload an image through it, but it always creates
 * the Media doc with `overrideAccess: true` and immediately attaches it to
 * ONLY the requesting user's own `avatar` field — there's no way to use
 * this to create general-purpose media or set someone else's avatar.
 *
 * Also sidesteps the second complaint (item B1/4b): Payload's admin upload
 * drawer forces filling in `alt` text for a profile photo, which is
 * meaningless here — this generates it automatically from the user's email,
 * the same pattern AccountForm.tsx already uses for the old direct-to-
 * /api/media flow (see git history) before Checkers could even reach it.
 */
const avatarUploadEndpoint: Endpoint = {
  path: "/me/avatar",
  method: "post",
  handler: async (req) => {
    if (!req.user?.id) {
      return Response.json({ errors: [{ message: "Giriş yapmalısınız." }] }, { status: 401 });
    }

    let formData: FormData;
    try {
      if (!req.formData) throw new Error("formData unsupported");
      formData = await req.formData();
    } catch {
      return Response.json({ errors: [{ message: "Geçersiz istek gövdesi." }] }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ errors: [{ message: "Dosya bulunamadı." }] }, { status: 400 });
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return Response.json(
        { errors: [{ message: `Profil fotoğrafı ${AVATAR_MAX_BYTES / (1024 * 1024)}MB'den küçük olmalı.` }] },
        { status: 400 }
      );
    }
    if (!AVATAR_MIME_TYPES.has(file.type)) {
      return Response.json({ errors: [{ message: "Sadece JPEG, PNG, WebP veya GIF yükleyebilirsiniz." }] }, { status: 400 });
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const email = (req.user as { email?: string }).email ?? "kullanıcı";
      const media = await req.payload.create({
        collection: "media",
        overrideAccess: true,
        data: { alt: `${email} — profil fotoğrafı` },
        file: { data: buffer, mimetype: file.type, name: file.name, size: file.size },
      });
      const updated = await req.payload.update({
        collection: "users",
        id: req.user.id,
        overrideAccess: true,
        disableTransaction: true,
        context: { skipAudit: true },
        data: { avatar: media.id },
        depth: 1,
      });
      return Response.json({ doc: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen hata.";
      console.error("[users] avatar upload failed:", err);
      return Response.json({ errors: [{ message }] }, { status: 500 });
    }
  },
};

/** RFP feedback 3.5: profile photo — capped size, checked against the selected Media doc. */
const enforceAvatarSizeLimit: CollectionBeforeChangeHook = async ({ data, req, originalDoc }) => {
  const avatarId = data?.avatar;
  if (!avatarId || avatarId === originalDoc?.avatar) return data;
  const media = await req.payload.findByID({ collection: "media", id: avatarId as string | number, depth: 0, overrideAccess: true });
  const filesize = (media as { filesize?: number } | null)?.filesize;
  if (typeof filesize === "number" && filesize > AVATAR_MAX_BYTES) {
    throw new Error(`Profil fotoğrafı ${AVATAR_MAX_BYTES / (1024 * 1024)}MB'den küçük olmalı.`);
  }
  return data;
};

export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: dbLabel("collectionLabel.users.singular", { tr: "Kullanıcı", en: "User" }),
    plural: dbLabel("collectionLabel.users.plural", { tr: "Kullanıcılar", en: "Users" }),
  },
  endpoints: [avatarUploadEndpoint],
  admin: {
    hideAPIURL: true,
    useAsTitle: "email",
    // RFP feedback 5.6: lock state has to be visible from the list, not just
    // discoverable by trying to log in as someone. `lockUntil` is one of
    // Payload's own account-lock fields, un-hidden below — being a real
    // field (not a UI-only badge) is what makes Payload's list filters able
    // to filter on it.
    defaultColumns: ["email", "role", "lockUntil", "lastLoginAt"],
    group: { tr: "Sistem", en: "System" },
    components: {
      // RFP feedback: "users listesinde export alabilmeliydik" — see
      // UsersExportButton.tsx for why CSV (not a real .xlsx) was the choice.
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "users" } },
        "/components/UsersExportButton#default",
        "/components/LockedAccountsBanner#default",
      ],
    },
  },
  // RFP feedback 5.6 — account lockout.
  //
  // CORRECTION to the previous round's comment ("see auth.maxLoginAttempts,
  // not configured", implying no lockout existed): Payload applies its own
  // defaults to ANY auth config, object form included —
  // `addDefaultsToAuthConfig` (payload/dist/collections/config/defaults.js)
  // does `auth.maxLoginAttempts = auth.maxLoginAttempts ?? 5` and
  // `auth.lockTime = auth.lockTime ?? 600000`. Lockout was therefore already
  // live and silently enforced; confirmed against the running DB, where the
  // `login_attempts`/`lock_until` columns exist (they're only created when
  // maxLoginAttempts > 0) and a wrong password really does increment the
  // counter. Spelling both values out here so the policy is a deliberate,
  // reviewable decision instead of an invisible framework default.
  //
  // 5 attempts: enough headroom for a genuine typo or a stale saved password,
  // few enough that online password guessing gets nowhere. 15 minutes rather
  // than Payload's 10: an NV Maker can now clear a lock instantly from
  // /admin/locked-accounts, so a locked-out colleague is unblocked by asking
  // rather than by waiting — which makes a longer automatic window cheap for
  // real users and meaningfully more expensive for an attacker.
  //
  // RFP feedback 3.3: "remember me" was requested, but Payload 3.x's login
  // cookie is httpOnly (client JS can't read/rewrite it) and a session's
  // JWT expiration is fixed per-collection with no supported way to vary it
  // per-login based on a checkbox — the only way to make "checked = longer
  // session" work would be reimplementing Payload's internal (non-public)
  // JWT-signing code, which risks breaking login for everyone if it drifts
  // from Payload's actual internals on an upgrade. Safer, real fix: extend
  // the session for EVERYONE from Payload's default 2h (7200s) to 12h —
  // no checkbox, but addresses the actual complaint (getting logged out
  // mid-workday) without touching undocumented internals.
  auth: { tokenExpiration: 60 * 60 * 12, maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  access: {
    // RFP feedback 3.4: reverses the earlier P1-11 narrowing — the business
    // explicitly wants every role to be able to see the full user list
    // (email/role/login history for "export edilebilir bir alan" purposes),
    // just not create/edit/delete accounts. Read-only visibility of who
    // exists carries no real risk here; write access stays isNewVerticalMaker-only.
    read: authenticated,
    create: isNewVerticalMaker,
    update: ({ req, id }) => isNewVerticalMaker({ req }) || req.user?.id === id,
    delete: isNewVerticalMaker,
    // RFP feedback 5.6: "sadece bu role sahip kullanıcılar yapabilsin".
    // This is the SERVER-side gate — the Locked Accounts screen hiding its
    // button for other roles is only cosmetic; Payload's unlock operation
    // runs this before touching anything (auth/operations/unlock.js).
    unlock: isNewVerticalMaker,
  },
  fields: [
    {
      // RFP feedback 4c: nobody edits their OWN email — Payload auto-injects
      // this field for any auth-enabled collection, but redefining it here
      // (same name) lets mergeBaseFields (payload/dist/fields/mergeBaseFields.js)
      // deep-merge our access rule on top of Payload's base field instead of
      // replacing it, so email/username login machinery is untouched. Same
      // self-vs-other split as the role field below — New Vertical Maker can
      // still fix another user's email; nobody can edit their own via the UI.
      name: "email",
      type: "email",
      access: {
        update: ({ req, id }) => req.user?.id !== id,
      },
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: ROLES.GROWTH_MAKER,
      options: ROLE_OPTIONS,
      admin: {
        description:
          "vodafone.local LDAP / AccessPoint rolü. Bu 4 rol dışında değer eklenmeyecek — gerçek LDAP bağlandığında bu alan doğrudan eşlenecek.",
      },
      // RFP feedback 3.5: nobody edits their OWN role — a self-service role
      // change would be a privilege-escalation path. New Vertical Maker can
      // still change ANOTHER user's role (kept until the LDAP plan in
      // docs/RFP-OPEN-ITEMS.md §6 replaces this entirely).
      access: {
        update: ({ req, id }) => req.user?.id !== id,
      },
    },
    {
      // RFP feedback 5.6: Payload injects `lockUntil`/`loginAttempts` with
      // `hidden: true`, so a locked account was invisible everywhere in the
      // admin. Redefining them by name lets mergeBaseFields
      // (payload/dist/fields/mergeBaseFields.js) deep-merge these overrides
      // ON TOP of Payload's base config — verified in that source: our object
      // is the winning side of the merge, so `access.update: () => false`
      // from the base field survives and these stay unwritable through a
      // normal PATCH. Only Payload's own unlock operation clears them.
      name: "lockUntil",
      type: "date",
      label: { tr: "Kilitli (bitiş)", en: "Locked until" },
      hidden: false,
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
        description: {
          tr: "Doluysa hesap art arda hatalı parola denemesi yüzünden kilitli. Bir New Vertical Maker 'Kilitli Hesaplar' ekranından hemen açabilir.",
          en: "If set, the account is locked after repeated failed password attempts. A New Vertical Maker can clear it from the Locked Accounts screen.",
        },
      },
    },
    {
      name: "loginAttempts",
      type: "number",
      label: { tr: "Hatalı Deneme", en: "Failed attempts" },
      hidden: false,
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      label: "Profil Fotoğrafı",
      admin: { description: "En fazla 2MB — MinIO'da saklanır." },
    },
    {
      name: "preferredLocale",
      type: "select",
      label: "Dil Tercihi",
      defaultValue: "tr",
      options: [
        { label: "Türkçe", value: "tr" },
        { label: "English", value: "en" },
      ],
      admin: {
        description: "Her girişte panel bu dilde açılır — üstteki geçici dil değiştiriciden farklı olarak kalıcıdır.",
      },
    },
    {
      name: "loginHistory",
      type: "ui",
      label: "Son Girişler",
      admin: {
        position: "sidebar",
        components: { Field: "/components/LoginHistoryField#default" },
      },
    },
    // RFP feedback: kept alongside `loginHistory` (last 10 logins, queried
    // from audit-logs) rather than replacing it — these three are a cheap,
    // always-available snapshot of just the MOST RECENT login, readable
    // straight off the user doc (no join), which is what the Users CSV
    // export needs (see UsersExportButton.tsx / A2).
    {
      name: "lastLoginAt",
      type: "date",
      label: "Son Giriş",
      admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime" } },
    },
    { name: "lastLoginIp", type: "text", label: "Son Giriş IP", admin: { position: "sidebar", readOnly: true } },
    {
      name: "lastLoginUserAgent",
      type: "text",
      label: "Son Giriş Cihazı",
      admin: { position: "sidebar", readOnly: true },
    },
  ],
  hooks: {
    // RFP §7.2: login/logout must be audited. Failed-login attempts aren't
    // logged here — Payload doesn't expose a hook for them, only its own
    // internal lockout counters (see auth.maxLoginAttempts, not configured).
    afterLogin: [
      async ({ req, user }) => {
        const typedUser = user as { id: string | number; email?: string; role?: string };
        const email = typedUser.email ?? "unknown";
        await writeAuditLog(req, {
          action: "login",
          summary: `${email} giriş yaptı`,
          actorEmail: email,
          actorRole: typedUser.role,
        });
        // Same IP/user-agent extraction the audit-log entry above just used
        // (ipOf/userAgentOf, hooks/audit.ts) — kept on the user doc itself so
        // it's readable without a join (see lastLoginAt/lastLoginIp/
        // lastLoginUserAgent fields above, and the Users CSV export).
        //
        // Deliberately NOT awaited, and this is load-bearing, not a style
        // choice: the login operation's own transaction is still open here
        // (it inserts into users_sessions and updates this exact user row),
        // and AWAITING a second write to a row your own outer transaction
        // already holds a lock on deadlocks the connection regardless of
        // `disableTransaction` — the new transaction still has to wait for
        // the row lock, and the outer transaction won't release it until
        // this hook returns, which it can't do while awaiting. Confirmed
        // live: every login request hung indefinitely (curl -m 15 timed out
        // with zero response) until `pg_terminate_backend` killed the stuck
        // "idle in transaction" sessions this produced. Firing without
        // awaiting lets afterLogin return immediately, the outer
        // transaction commits, the row lock releases, and THEN this update
        // goes through — a few hundred ms of eventual consistency on a
        // "last login" timestamp is a non-issue.
        req.payload
          .update({
            collection: "users",
            id: typedUser.id,
            overrideAccess: true,
            disableTransaction: true,
            context: { skipAudit: true },
            data: {
              lastLoginAt: new Date().toISOString(),
              lastLoginIp: ipOf(req) ?? null,
              lastLoginUserAgent: userAgentOf(req) ?? null,
            },
          })
          .catch((err: unknown) => {
            console.error("[users] failed to stamp lastLogin fields:", err);
          });
      },
    ],
    afterLogout: [
      async ({ req }) => {
        const email = (req.user as { email?: string } | undefined)?.email ?? "unknown";
        await writeAuditLog(req, { action: "logout", summary: `${email} çıkış yaptı` });
      },
    ],
    // RFP feedback 5.6 / RFP §7.2: every unlock is attributable. Payload runs
    // `buildAfterOperation` with operation "unlock" (auth/operations/unlock.js),
    // which is the only hook point the unlock path exposes — there is no
    // afterUnlock.
    afterOperation: [
      async (args) => {
        if (args.operation !== "unlock") return args.result;
        const target = (args.req.data as { email?: string } | undefined)?.email ?? "unknown";
        await writeAuditLog(args.req, {
          action: "unlock",
          collectionSlug: "users",
          summary: `${target} hesabının kilidi kaldırıldı`,
        });
        return args.result;
      },
    ],
    // RFP §7.2: failed logins. Payload throws AuthenticationError from
    // `loginOperation` BEFORE any beforeLogin/afterLogin hook runs (verified
    // in auth/operations/login.js — the `if (!authResult)` branch throws
    // directly), so a failed attempt is unreachable from the login hooks the
    // previous round looked at. `afterError` is the one place it does surface.
    afterError: [
      async ({ error, req }) => {
        const attempted = (req.data as { email?: string } | undefined)?.email;
        // AuthenticationError is what a wrong password/unknown user produces;
        // gate on an attempted email too so unrelated 401s aren't logged as
        // login attempts.
        if (!attempted || error?.name !== "AuthenticationError") return;
        await writeAuditLog(req, {
          action: "login_failed",
          summary: `${attempted} için başarısız giriş denemesi`,
          actorEmail: attempted,
        });
      },
    ],
    beforeChange: [enforceAvatarSizeLimit],
    // Every users reference (campaigns.createdBy/rejectedBy, media.uploadedBy)
    // is provenance metadata, so this never blocks — it records what got
    // orphaned in the audit log. See referentialIntegrity.ts for why.
    beforeDelete: [blockDeleteIfReferenced("users")],
    afterChange: [auditAfterChange("users")],
    afterDelete: [auditAfterDelete("users")],
  },
};
