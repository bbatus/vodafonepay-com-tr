import type { CollectionConfig } from "payload";
import { isNewVerticalMaker } from "@/access/roles";
import { dbLabel } from "@/lib/collectionLabels";

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
  labels: {
    singular: dbLabel("collectionLabel.audit-logs.singular", { tr: "Denetim Kaydı", en: "Audit Log" }),
    plural: dbLabel("collectionLabel.audit-logs.plural", { tr: "Denetim Kayıtları", en: "Audit Logs" }),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: "summary",
    defaultColumns: ["createdAt", "userEmail", "action", "collectionSlug", "summary", "ip"],
    group: { tr: "Sistem", en: "System" },
    description: "Salt okunur değişiklik kaydı — kimse bu kayıtları düzenleyemez veya silemez.",
    components: {
      // RFP feedback: "audit log CSV export" — see AuditLogsExportButton.tsx.
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "audit-logs" } },
        "/components/AuditLogsExportButton#default",
      ],
    },
  },
  access: {
    // RFP feedback 3.5: profile page shows the current user's OWN recent
    // login history — needs read access to their own entries specifically,
    // not the full log (still isNewVerticalMaker-only for that).
    read: ({ req }) => {
      if (isNewVerticalMaker({ req })) return true;
      if (req.user?.email) return { userEmail: { equals: req.user.email } };
      return false;
    },
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: "userEmail", type: "text", required: true, label: "Kullanıcı" },
    { name: "userRole", type: "text", label: "Rol" },
    {
      name: "action",
      type: "select",
      required: true,
      label: "İşlem",
      options: [
        { label: "Giriş", value: "login" },
        { label: "Başarısız giriş", value: "login_failed" },
        { label: "Çıkış", value: "logout" },
        { label: "Oluşturuldu", value: "create" },
        { label: "Güncellendi", value: "update" },
        { label: "Yayınlandı", value: "publish" },
        { label: "Reddedildi", value: "rejected" },
        { label: "Silindi", value: "delete" },
        // RFP feedback 5.6: who unlocked whose account, and when.
        { label: "Kilit kaldırıldı", value: "unlock" },
      ],
    },
    { name: "collectionSlug", type: "text", label: "Koleksiyon" },
    { name: "documentId", type: "text", label: "Doküman ID" },
    { name: "summary", type: "text", required: true, label: "Özet" },
    { name: "ip", type: "text", label: "IP" },
    { name: "userAgent", type: "text", label: "Cihaz / Tarayıcı" },
  ],
};
