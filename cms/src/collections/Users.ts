import type { CollectionConfig } from "payload";
import { isNewVerticalMaker, ROLE_OPTIONS, ROLES } from "@/access/roles";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role"],
    group: "Sistem",
  },
  auth: true,
  access: {
    // Any authenticated user (Payload's own default) — user list/emails must
    // never be public. Only isNewVerticalMaker may create/update/delete
    // other accounts.
    read: ({ req }) => Boolean(req.user),
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
};
