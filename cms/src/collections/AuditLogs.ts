import type { CollectionConfig } from "payload";
import { isNewVerticalMaker } from "@/access/roles";

/**
 * RFP §3.1.15 / §7.2: a change history that survives independently of each
 * collection's own `versions.drafts` (which only 13 content collections
 * have, and which an admin could in principle purge). This collection is
 * append-only from the application's perspective — nothing writes to it
 * except the hooks in `src/hooks/audit.ts`, and no one can edit or delete
 * an entry through the API (see `access` below).
 */
export const AuditLogs: CollectionConfig = {
  slug: "audit-logs",
  admin: {
    useAsTitle: "summary",
    defaultColumns: ["createdAt", "userEmail", "action", "collectionSlug", "summary"],
    group: "Sistem",
    description: "Salt okunur değişiklik kaydı — kimse bu kayıtları düzenleyemez veya silemez.",
    components: {
      beforeList: [{ path: "/components/HelpButton#default", clientProps: { collection: "audit-logs" } }],
    },
  },
  access: {
    read: isNewVerticalMaker,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: "userEmail", type: "text", required: true },
    { name: "userRole", type: "text" },
    {
      name: "action",
      type: "select",
      required: true,
      options: [
        { label: "Giriş", value: "login" },
        { label: "Başarısız giriş", value: "login_failed" },
        { label: "Çıkış", value: "logout" },
        { label: "Oluşturuldu", value: "create" },
        { label: "Güncellendi", value: "update" },
        { label: "Yayınlandı", value: "publish" },
        { label: "Silindi", value: "delete" },
      ],
    },
    { name: "collectionSlug", type: "text" },
    { name: "documentId", type: "text" },
    { name: "summary", type: "text", required: true },
    { name: "ip", type: "text" },
  ],
};
