import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import { isNewVerticalMaker, ROLE_OPTIONS, ROLES } from "@/access/roles";
import { authenticated } from "@/access/authenticated";
import { auditAfterChange, auditAfterDelete, writeAuditLog } from "@/hooks/audit";
import { dbLabel } from "@/lib/collectionLabels";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2MB

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
  admin: {
    hideAPIURL: true,
    useAsTitle: "email",
    defaultColumns: ["email", "role"],
    group: { tr: "Sistem", en: "System" },
    components: {
      // RFP feedback: "users listesinde export alabilmeliydik" — see
      // UsersExportButton.tsx for why CSV (not a real .xlsx) was the choice.
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "users" } },
        "/components/UsersExportButton#default",
      ],
    },
  },
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
  auth: { tokenExpiration: 60 * 60 * 12 },
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
  ],
  hooks: {
    // RFP §7.2: login/logout must be audited. Failed-login attempts aren't
    // logged here — Payload doesn't expose a hook for them, only its own
    // internal lockout counters (see auth.maxLoginAttempts, not configured).
    afterLogin: [
      async ({ req, user }) => {
        const typedUser = user as { email?: string; role?: string };
        const email = typedUser.email ?? "unknown";
        await writeAuditLog(req, {
          action: "login",
          summary: `${email} giriş yaptı`,
          actorEmail: email,
          actorRole: typedUser.role,
        });
      },
    ],
    afterLogout: [
      async ({ req }) => {
        const email = (req.user as { email?: string } | undefined)?.email ?? "unknown";
        await writeAuditLog(req, { action: "logout", summary: `${email} çıkış yaptı` });
      },
    ],
    beforeChange: [enforceAvatarSizeLimit],
    afterChange: [auditAfterChange("users")],
    afterDelete: [auditAfterDelete("users")],
  },
};
