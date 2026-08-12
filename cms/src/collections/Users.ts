import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, ROLE_OPTIONS, ROLES } from "@/access/roles";
import { auditAfterChange, auditAfterDelete, writeAuditLog } from "@/hooks/audit";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    hideAPIURL: true,
    useAsTitle: "email",
    defaultColumns: ["email", "role"],
    group: "Sistem",
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "users" } }],
    },
  },
  auth: true,
  access: {
    // Payload's own default (`Boolean(req.user)`) let ANY authenticated
    // user — including a checker/growth-maker role — list every CMS
    // account's email. Narrowed to isNewVerticalMaker-or-self, matching the
    // update rule below: everyone can see their own record, only
    // isNewVerticalMaker can browse the full user list.
    read: ({ req, id }) => isNewVerticalMaker({ req }) || req.user?.id === id,
    create: isNewVerticalMaker,
    update: ({ req, id }) => isNewVerticalMaker({ req }) || req.user?.id === id,
    delete: isNewVerticalMaker,
  },
  fields: [
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
    afterChange: [auditAfterChange("users")],
    afterDelete: [auditAfterDelete("users")],
  },
};
