import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role"],
    group: "Sistem",
  },
  auth: true,
  fields: [
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Yayıncı", value: "publisher" },
        { label: "Editör", value: "editor" },
        { label: "İzleyici", value: "viewer" },
      ],
      admin: {
        description:
          "Rol bazlı yetkilendirme (onay akışı, LDAP entegrasyonu) ileriki fazda bu alan üzerinden bağlanacak.",
      },
    },
  ],
};
