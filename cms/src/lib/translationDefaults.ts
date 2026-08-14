/**
 * RFP feedback 3.2: seed data + fallback source for the DB-backed
 * `translations` collection. Every custom admin component's UI microcopy
 * lives here, namespaced `componentName.key`. `{n}` is a placeholder a
 * caller substitutes at render time (see useDbStrings.ts) — Payload text
 * fields can't store a function, so pluralized strings use this instead.
 */
export const TRANSLATION_DEFAULTS: Record<string, { tr: string; en: string }> = {
  "reorderWidget.title": { tr: "Sürükleyerek sırala", en: "Drag to reorder" },
  "reorderWidget.saving": { tr: "(kaydediliyor…)", en: "(saving…)" },
  "reorderWidget.loadError": { tr: "Liste yüklenemedi.", en: "Failed to load list." },

  "roleAwarePublishButton.publish": { tr: "Değişiklikleri yayınla", en: "Publish changes" },
  "roleAwarePublishButton.publishing": { tr: "Yayınlanıyor…", en: "Publishing…" },
  "roleAwarePublishButton.already": {
    tr: "Bu doküman zaten yayında — bekleyen bir değişiklik yok.",
    en: "This document is already published — nothing pending.",
  },
  "roleAwarePublishButton.heading": { tr: "Yayınlamadan önce son kez bir göz at", en: "One last look before you publish" },
  "roleAwarePublishButton.body": {
    tr: "Bu, kampanyanın yayınlandığında sitede tam olarak nasıl görüneceğidir. Devam etmek istiyor musunuz?",
    en: "This is exactly how the campaign will look on the site once published. Continue?",
  },
  "roleAwarePublishButton.noPreview": {
    tr: "Önizleme kullanılamıyor — kaydedilmiş bir 'slug' değeri gerekiyor.",
    en: "Preview unavailable — a saved 'slug' is required.",
  },
  "roleAwarePublishButton.cancel": { tr: "Vazgeç", en: "Cancel" },
  "roleAwarePublishButton.confirm": { tr: "Onayla ve Yayınla", en: "Confirm & Publish" },
  "roleAwarePublishButton.awaiting": { tr: "Onay bekliyor (Checker yayınlar)", en: "Awaiting approval (Checker publishes)" },
  "roleAwarePublishButton.awaitingTitle": {
    tr: "Bu değişikliği siz yayınlayamazsınız — bir Growth Checker onaylayıp yayınlamalı.",
    en: "You cannot publish this — a Growth Checker must review and publish it.",
  },
  "roleAwarePublishButton.reject": { tr: "Reddet", en: "Reject" },
  "roleAwarePublishButton.rejecting": { tr: "Reddediliyor…", en: "Rejecting…" },
  "roleAwarePublishButton.rejectHeading": { tr: "Bu taslağı reddet", en: "Reject this draft" },
  "roleAwarePublishButton.rejectBody": {
    tr: "Maker'a görünecek bir red sebebi yazın. Maker taslağı tekrar kaydettiğinde otomatik olarak yeniden incelemeye düşer.",
    en: "Write a reason the Maker will see. The draft automatically goes back to review once the Maker saves it again.",
  },
  "roleAwarePublishButton.rejectReasonLabel": { tr: "Red sebebi", en: "Rejection reason" },
  "roleAwarePublishButton.rejectReasonPlaceholder": {
    tr: "Örn: Görsel çok düşük çözünürlükte, lütfen yenisini yükleyin.",
    en: "E.g.: The image resolution is too low, please re-upload.",
  },
  "roleAwarePublishButton.rejectReasonRequired": { tr: "Red sebebi zorunludur.", en: "A rejection reason is required." },
  "roleAwarePublishButton.rejectConfirm": { tr: "Reddet", en: "Reject" },

  "loginBrandPanel.tagline": {
    tr: "Ödemenin Akıllı Hali — İçerik Yönetim Paneli",
    en: "The Smart Way to Pay — Content Management Panel",
  },
  "loginBrandPanel.headline": { tr: "Tüm içeriğin tek platformda.", en: "One platform for all your content." },
  "loginBrandPanel.subheadline": {
    tr: "Kampanyaları, sayfaları ve tüm site içeriğini tek panelden yönet. Onay süreçleri, roller ve denetim kaydı hazır — göç veya bağımlılık yok.",
    en: "Manage campaigns, pages, and every piece of site content from a single panel. Approval workflows, roles, and audit trails built in — no migration, no lock-in.",
  },

  "waitingApprovalsNavLink.label": { tr: "Bekleyen Onaylar", en: "Waiting Approvals" },

  "waitingApprovals.title": { tr: "Bekleyen Onaylar", en: "Waiting Approvals" },
  "waitingApprovals.approved": { tr: "Onaylanan", en: "Approved" },
  "waitingApprovals.rejected": { tr: "Reddedilen", en: "Rejected" },
  "waitingApprovals.total": { tr: "Toplam Açılan", en: "Total Opened" },
  "waitingApprovals.pendingTitle": { tr: "Cevap Bekleyen Kampanyalar", en: "Campaigns Awaiting Response" },
  "waitingApprovals.pendingEmpty": {
    tr: "Şu an cevap bekleyen bir kampanya yok.",
    en: "Nothing is awaiting a response right now.",
  },
  "waitingApprovals.openedBy": { tr: "Açan kullanıcı", en: "Opened by" },
  "waitingApprovals.review": { tr: "İncele →", en: "Review →" },
  "waitingApprovals.noAccess": {
    tr: "Bu sayfa sadece kampanyaları onaylayabilen/reddedebilen kullanıcılar içindir.",
    en: "This page is only for users who can approve/reject campaigns.",
  },

  "dashboardWidgets.summaryTitle": { tr: "İçerik Özeti", en: "Content Summary" },
  "dashboardWidgets.pendingTitle": { tr: "Onay Bekleyen Taslaklar", en: "Pending Drafts" },
  "dashboardWidgets.pendingBody": {
    tr: "Toplam {n} taslak henüz yayınlanmadı.",
    en: "{n} draft(s) not yet published.",
  },
  "dashboardWidgets.published": { tr: "yayında", en: "published" },
  "dashboardWidgets.draft": { tr: "taslak", en: "draft" },
  "dashboardWidgets.total": { tr: "kayıt", en: "records" },
  "dashboardWidgets.loginsTitle": { tr: "Son Giriş Yapanlar", en: "Recent Logins" },
  "dashboardWidgets.noLogins": { tr: "Henüz giriş kaydı yok.", en: "No login records yet." },
  "dashboardWidgets.reviewTitle": { tr: "İncelemeni Bekleyen Kampanyalar", en: "Campaigns Awaiting Your Review" },
  "dashboardWidgets.reviewEmpty": {
    tr: "Şu an incelemeni bekleyen bir kampanya yok.",
    en: "Nothing is waiting for your review right now.",
  },
  "dashboardWidgets.reviewCta": { tr: "İncele →", en: "Review →" },
  "dashboardWidgets.ip": { tr: "IP", en: "IP" },
  "dashboardWidgets.distinctUsers": { tr: "farklı kullanıcı", en: "distinct users" },
  "dashboardWidgets.openedBy": { tr: "Açan kullanıcı", en: "Opened by" },

  "forgotPasswordDisabled.title": { tr: "Parola sıfırlama kapalı", en: "Password reset is disabled" },
  "forgotPasswordDisabled.body": {
    tr: "Bu hesap yönetimi ileride LDAP (vodafone.local) üzerinden yapılacak. Parolanızla ilgili bir sorun yaşıyorsanız IT ile iletişime geçin.",
    en: "Account management will move to LDAP (vodafone.local). If you're having trouble with your password, contact IT.",
  },

  "loginHistory.title": { tr: "Son Girişler", en: "Recent Logins" },
  "loginHistory.loading": { tr: "Yükleniyor…", en: "Loading…" },
  "loginHistory.empty": { tr: "Henüz giriş kaydı yok.", en: "No login records yet." },
  "loginHistory.date": { tr: "Tarih", en: "Date" },
  "loginHistory.ip": { tr: "IP Adresi", en: "IP Address" },
  "loginHistory.userAgent": { tr: "Cihaz / Tarayıcı", en: "Device / Browser" },

  "contentManagement.navLabel": { tr: "İçerik Yönetimi", en: "Content Management" },
  "contentManagement.title": { tr: "İçerik Yönetimi", en: "Content Management" },
  "contentManagement.searchPlaceholder": { tr: "Ara...", en: "Search..." },
  "contentManagement.recordCount": { tr: "kayıt", en: "records" },
  "contentManagement.addNew": { tr: "Yeni Ekle", en: "Add New" },
  "contentManagement.deleteSelected": { tr: "Seçilenleri Sil", en: "Delete Selected" },
  "contentManagement.loading": { tr: "Yükleniyor…", en: "Loading…" },
  "contentManagement.loadError": { tr: "Liste yüklenemedi.", en: "Failed to load list." },
  "contentManagement.deleteError": {
    tr: "Silinemedi — yetkiniz olmayabilir.",
    en: "Couldn't delete — you may not have permission.",
  },
  "contentManagement.confirmDelete": {
    tr: "Bu kaydı silmek istediğinize emin misiniz?",
    en: "Are you sure you want to delete this record?",
  },
  "contentManagement.confirmBulkDelete": {
    tr: "Seçilen kayıtları silmek istediğinize emin misiniz?",
    en: "Are you sure you want to delete the selected records?",
  },
  "contentManagement.empty": { tr: "Kayıt bulunamadı.", en: "No records found." },
  "contentManagement.colTitle": { tr: "Başlık", en: "Title" },
  "contentManagement.colStatus": { tr: "Durum", en: "Status" },
  "contentManagement.colUpdated": { tr: "Güncellendi", en: "Updated" },
  "contentManagement.published": { tr: "Yayında", en: "Published" },
  "contentManagement.draft": { tr: "Taslak", en: "Draft" },
  "contentManagement.edit": { tr: "Düzenle", en: "Edit" },
  "contentManagement.delete": { tr: "Sil", en: "Delete" },
};

export function applyPlaceholder(template: string, n: number): string {
  return template.replace("{n}", String(n));
}
