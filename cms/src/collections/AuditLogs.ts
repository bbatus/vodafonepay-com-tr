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
      // RFP §6: "export in CEF format for SIEM ingestion" — see AuditLogsCefExportButton.tsx.
      beforeList: [
        { path: "/components/HelpButton#default", clientProps: { collection: "audit-logs" } },
        "/components/AuditLogsExportButton#default",
        "/components/AuditLogsCefExportButton#default",
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
        // RFP §7.2: "record all userID locks" — logged the moment a locked
        // account is used to attempt a login (see Users.ts's `afterError`
        // hook, which distinguishes this from a plain wrong-password
        // `login_failed` via Payload's `LockedAuth` error class).
        { label: "Kilitli hesapla giriş denendi", value: "locked" },
        // RFP §7.2: "record all updates/changes to userID access rights" —
        // a role change used to disappear into a generic "update" entry
        // indistinguishable from any other user-doc edit; see Users.ts's
        // `auditRoleChange` hook.
        { label: "Rol değiştirildi", value: "role_changed" },
        // RFP §7.2: "record every print-out/export of certain predefined
        // reports/data entities" — the 5 CSV export buttons (Users,
        // Campaigns, Blog, Categories, Audit Logs) now report here; see
        // CsvExportButton.tsx and the `/audit/export` endpoint below.
        { label: "Dışa aktarıldı (export)", value: "export" },
        // RFP §7.2: "record all attempts to delete, write or append certain
        // predefined data entities" — a 403 from access control used to be
        // invisible everywhere (only the SUCCESSFUL half of a write was ever
        // logged). See payload.config.ts's root-level `hooks.afterError`
        // (auditForbiddenAttempt, hooks/audit.ts) — one hook covers every
        // collection instead of wiring this into each one individually.
        { label: "Yetkisiz işlem denemesi engellendi", value: "denied" },
      ],
    },
    { name: "collectionSlug", type: "text", label: "Koleksiyon" },
    { name: "documentId", type: "text", label: "Doküman ID" },
    { name: "summary", type: "text", required: true, label: "Özet" },
    { name: "ip", type: "text", label: "IP" },
    { name: "userAgent", type: "text", label: "Cihaz / Tarayıcı" },
    {
      // RFP §7.2: "before/after image of changed data" — a shallow,
      // top-level-field diff (see hooks/audit.ts's diffFields()), only
      // populated on real updates (a create/publish/delete has nothing to
      // diff against). Array of rows rather than a raw JSON blob so it's
      // actually scannable in the admin list without opening dev tools.
      name: "changes",
      type: "array",
      label: { tr: "Değişiklikler", en: "Changes" },
      admin: {
        readOnly: true,
        description: {
          tr: "Bu kayıtta değişen alanlar (üst seviye alanlar; iç içe zengin metin/blok içeriği kısaltılmıştır).",
          en: "Fields that changed in this save (top-level only; nested rich text/block content is truncated).",
        },
        condition: (data) => Array.isArray(data?.changes) && data.changes.length > 0,
      },
      fields: [
        { name: "field", type: "text", label: { tr: "Alan", en: "Field" } },
        { name: "before", type: "text", label: { tr: "Önce", en: "Before" } },
        { name: "after", type: "text", label: { tr: "Sonra", en: "After" } },
      ],
    },
  ],
};
