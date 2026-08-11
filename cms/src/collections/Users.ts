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
};
