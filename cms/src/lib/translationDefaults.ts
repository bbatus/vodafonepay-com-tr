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
  // RFP feedback 5.4 — the "unpublish first, then edit" path.
  "roleAwarePublishButton.liveNotice": {
    tr: "Bu kampanya yayında. Düzenlemek için önce yayından kaldırılması gerekir — ilk oluşturulma tarihi ve listedeki sırası korunur.",
    en: "This campaign is live. It has to be taken off the air before it can be edited — its original creation date and list position are kept.",
  },
  "roleAwarePublishButton.unpublish": { tr: "Yayından Kaldır ve Düzenle", en: "Unpublish & Edit" },
  "roleAwarePublishButton.unpublishing": { tr: "İşleniyor…", en: "Working…" },
  "roleAwarePublishButton.requestUnpublish": { tr: "Yayından Kaldırma Talebi Oluştur", en: "Request Unpublish" },
  "roleAwarePublishButton.unpublishRequested": {
    tr: "Yayından kaldırma talebiniz Checker onayında.",
    en: "Your unpublish request is awaiting Checker approval.",
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
  // RFP feedback 5.9: the user liked "One platform for all your need" and asked
  // for a subheadline that names vodafonepay.com.tr concretely. TR and EN are
  // written separately on purpose — a literal translation of either reads
  // stilted in the other language, so each says the same thing in its own
  // idiom rather than mirroring word for word.
  "loginBrandPanel.headline": { tr: "Sitenizin tek kumanda merkezi.", en: "One platform for all your need." },
  "loginBrandPanel.subheadline": {
    tr: "vodafonepay.com.tr'deki kampanyaları, sayfaları, duyuruları ve SSS'leri tek yerden yönetin. Onay akışı, roller ve denetim kaydı kutudan çıkar — ne göç, ne bağımlılık.",
    en: "Run every campaign, page, announcement and FAQ on vodafonepay.com.tr from one place. Approval workflows, roles and audit trails come built in — no migration, no lock-in.",
  },

  // RFP feedback 5.8: the user wants the English phrase in BOTH languages
  // ("remember me olması daha iyi"), so this is intentionally not translated.
  // The hint below it is, and it exists because "Remember me" on its own
  // implies the password is being kept — it is not, only the email address.
  "rememberEmail.label": { tr: "Remember me", en: "Remember me" },
  "rememberEmail.hint": {
    tr: "Sadece e-posta adresiniz bu tarayıcıda hatırlanır — parolanız hiçbir zaman saklanmaz.",
    en: "Only your email address is remembered in this browser — your password is never stored.",
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
  "dashboardWidgets.ownDraftsTitle": { tr: "Taslaklarınız", en: "Your Drafts" },
  "dashboardWidgets.ownDraftsEmpty": { tr: "Şu anda incelemede veya reddedilmiş taslağınız yok.", en: "You have no drafts currently pending or rejected." },
  "dashboardWidgets.ownDraftsPending": { tr: "İncelemede", en: "Pending review" },
  "dashboardWidgets.ownDraftsRejected": { tr: "Reddedildi", en: "Rejected" },
  "dashboardWidgets.editCta": { tr: "Düzenle →", en: "Edit →" },

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

  "mediaFilterTabs.all": { tr: "Tümü", en: "All" },
  "mediaFilterTabs.images": { tr: "Görseller", en: "Images" },
  "mediaFilterTabs.videos": { tr: "Videolar", en: "Videos" },

  "mediaUsage.title": { tr: "Kullanıldığı Yerler", en: "Used In" },
  "mediaUsage.loading": { tr: "Aranıyor…", en: "Searching…" },
  "mediaUsage.empty": { tr: "Herhangi bir içerikte kullanılmıyor.", en: "Not used in any content." },
  "mediaUsage.inUseNote": {
    tr: "Kullanımda olduğu için bu medya silinemez — önce yukarıdaki kayıtlardan kaldırın.",
    en: "This media can't be deleted while it's in use — remove it from the records above first.",
  },

  "contentManagement.navLabel": { tr: "İçerik Yönetimi", en: "Content Management" },
  "contentManagement.title": { tr: "İçerik Yönetimi", en: "Content Management" },
  // RFP feedback 5.7: the page is a report now — these say so, and the old
  // addNew/edit/delete/confirm keys are gone with the actions they labelled.
  "contentManagement.readOnlyNote": {
    tr: "Bu sayfa salt okunurdur — buradan hiçbir kayıt eklenemez, düzenlenemez veya silinemez. Bir kaydın üzerine tıklayarak kendi düzenleme sayfasına gidebilirsiniz.",
    en: "This page is read-only — nothing can be created, edited or deleted here. Click a record to open its own edit page.",
  },
  "contentManagement.summaryTitle": { tr: "Tüm Koleksiyonlar", en: "All Collections" },
  "contentManagement.detailTitle": { tr: "Koleksiyon Detayı", en: "Collection Detail" },
  "contentManagement.searchPlaceholder": { tr: "Ara...", en: "Search..." },
  "contentManagement.recordCount": { tr: "kayıt", en: "records" },
  "contentManagement.loading": { tr: "Yükleniyor…", en: "Loading…" },
  "contentManagement.noAccess": {
    tr: "Bu koleksiyonu görüntüleme yetkiniz yok.",
    en: "You don't have permission to view this collection.",
  },
  "contentManagement.empty": { tr: "Kayıt bulunamadı.", en: "No records found." },
  "contentManagement.colTitle": { tr: "Başlık", en: "Title" },
  "contentManagement.colCollection": { tr: "Koleksiyon", en: "Collection" },
  "contentManagement.colTotal": { tr: "Toplam", en: "Total" },
  "contentManagement.colUpdated": { tr: "Son Güncelleme", en: "Last Updated" },
  "contentManagement.published": { tr: "Yayında", en: "Published" },
  "contentManagement.draft": { tr: "Taslak", en: "Draft" },
  "contentManagement.yes": { tr: "Evet", en: "Yes" },
  "contentManagement.no": { tr: "Hayır", en: "No" },

  "lockedAccounts.navLabel": { tr: "Kilitli Hesaplar", en: "Locked Accounts" },
  "lockedAccounts.title": { tr: "Kilitli Hesaplar", en: "Locked Accounts" },
  "lockedAccounts.intro": {
    tr: "Art arda 5 hatalı parola denemesinden sonra hesap 15 dakika kilitlenir. Buradan kilidi hemen kaldırabilirsiniz.",
    en: "An account locks for 15 minutes after 5 consecutive failed password attempts. You can clear the lock here immediately.",
  },
  "lockedAccounts.loading": { tr: "Yükleniyor…", en: "Loading…" },
  "lockedAccounts.empty": { tr: "Şu anda kilitli hesap yok.", en: "No accounts are locked right now." },
  "lockedAccounts.loadError": { tr: "Kilitli hesaplar yüklenemedi.", en: "Couldn't load locked accounts." },
  "lockedAccounts.colEmail": { tr: "E-posta", en: "Email" },
  "lockedAccounts.colUntil": { tr: "Kilit bitişi", en: "Locked until" },
  "lockedAccounts.colAttempts": { tr: "Hatalı deneme", en: "Failed attempts" },
  "lockedAccounts.unlock": { tr: "Kilidi Kaldır", en: "Unlock" },
  "lockedAccounts.unlocking": { tr: "Kaldırılıyor…", en: "Unlocking…" },
  "lockedAccounts.unlocked": { tr: "{email} hesabının kilidi kaldırıldı.", en: "Unlocked {email}." },
  "lockedAccounts.unlockError": { tr: "Kilit kaldırılamadı — yetkiniz olmayabilir.", en: "Couldn't unlock — you may not have permission." },
  "lockedAccounts.forbidden": {
    tr: "Bu sayfa sadece New Vertical Maker rolündeki kullanıcılar içindir.",
    en: "This page is for New Vertical Maker users only.",
  },
  "lockedAccounts.bannerCount": { tr: "{n} hesap şu anda kilitli.", en: "{n} account(s) are currently locked." },
  "lockedAccounts.bannerCta": { tr: "Kilitli Hesaplar ekranını aç →", en: "Open Locked Accounts →" },

  "saveOrSubmit.saveDraft": { tr: "Taslağı Kaydet", en: "Save Draft" },
  "saveOrSubmit.submitForReview": { tr: "Onaya Gönder", en: "Submit for Review" },

  "accountForm.email": { tr: "E-posta", en: "Email" },
  "accountForm.role": { tr: "Rol", en: "Role" },
  "accountForm.roleDescription": {
    tr: "vodafone.local LDAP / AccessPoint rolünüz. Rolünüzü siz değiştiremezsiniz — gerekiyorsa bir New Vertical Maker değiştirebilir.",
    en: "Your vodafone.local LDAP / AccessPoint role. You cannot change your own role — a New Vertical Maker can if needed.",
  },
  "accountForm.avatar": { tr: "Profil Fotoğrafı", en: "Profile Photo" },
  "accountForm.avatarHint": { tr: "En fazla 2MB — MinIO'da saklanır.", en: "Up to 2MB — stored in MinIO." },
  "accountForm.avatarUploading": { tr: "Yükleniyor…", en: "Uploading…" },
  "accountForm.avatarSaved": { tr: "Profil fotoğrafı güncellendi.", en: "Profile photo updated." },
  "accountForm.avatarError": { tr: "Fotoğraf yüklenemedi.", en: "Couldn't upload photo." },
  "accountForm.locale": { tr: "Dil Tercihi", en: "Language Preference" },
  "accountForm.localeDescription": {
    tr: "Her girişte panel bu dilde açılır — üstteki geçici dil değiştiriciden farklı olarak kalıcıdır.",
    en: "The panel opens in this language every time you log in — unlike the temporary switcher above, this one persists.",
  },
  "accountForm.save": { tr: "Kaydet", en: "Save" },
  "accountForm.localeSaved": { tr: "Dil tercihi kaydedildi.", en: "Language preference saved." },
  "accountForm.localeError": { tr: "Kaydedilemedi.", en: "Couldn't save." },
  "accountForm.logout": { tr: "Çıkış Yap", en: "Log Out" },

  "usersExport.button": { tr: "Dışa Aktar (CSV)", en: "Export (CSV)" },
  "usersExport.exporting": { tr: "Hazırlanıyor…", en: "Preparing…" },
  "usersExport.done": { tr: "Liste indirildi.", en: "List downloaded." },
  "usersExport.error": { tr: "Liste indirilemedi.", en: "Couldn't download list." },

  // RFP feedback: collection sidebar labels — DB-editable via dbLabel()
  // (see collectionLabels.ts). Seeded here like every other admin string.
  "collectionLabel.campaigns.singular": { tr: "Kampanya", en: "Campaign" },
  "collectionLabel.campaigns.plural": { tr: "Kampanyalar", en: "Campaigns" },
  "collectionLabel.categories.singular": { tr: "Kategori", en: "Category" },
  "collectionLabel.categories.plural": { tr: "Kategoriler", en: "Categories" },
  "collectionLabel.faq-items.singular": { tr: "Sık Sorulan Soru", en: "FAQ Item" },
  "collectionLabel.faq-items.plural": { tr: "Sık Sorulanlar", en: "FAQ Items" },
  "collectionLabel.blog-posts.singular": { tr: "Blog Yazısı", en: "Blog Post" },
  "collectionLabel.blog-posts.plural": { tr: "Blog Yazıları", en: "Blog Posts" },
  "collectionLabel.announcements.singular": { tr: "Duyuru", en: "Announcement" },
  "collectionLabel.announcements.plural": { tr: "Duyurular", en: "Announcements" },
  "collectionLabel.content-blocks.singular": { tr: "İçerik Bloğu", en: "Content Block" },
  "collectionLabel.content-blocks.plural": { tr: "İçerik Blokları", en: "Content Blocks" },
  "collectionLabel.representatives.singular": { tr: "Temsilci", en: "Representative" },
  "collectionLabel.representatives.plural": { tr: "Temsilciler", en: "Representatives" },
  "collectionLabel.pages.singular": { tr: "Sayfa", en: "Page" },
  "collectionLabel.pages.plural": { tr: "Sayfalar", en: "Pages" },
  "collectionLabel.fee-rows.singular": { tr: "Ücret Satırı", en: "Fee Row" },
  "collectionLabel.fee-rows.plural": { tr: "Ücret Tablosu", en: "Fee Rows" },
  "collectionLabel.limit-tables.singular": { tr: "Limit Tablosu", en: "Limit Table" },
  "collectionLabel.limit-tables.plural": { tr: "Limit Tabloları", en: "Limit Tables" },
  "collectionLabel.nav-links.singular": { tr: "Menü Linki", en: "Nav Link" },
  "collectionLabel.nav-links.plural": { tr: "Menü Linkleri", en: "Nav Links" },
  "collectionLabel.legal-pages.singular": { tr: "Hukuki Sayfa", en: "Legal Page" },
  "collectionLabel.legal-pages.plural": { tr: "Hukuki Sayfalar", en: "Legal Pages" },
  "collectionLabel.cookie-rows.singular": { tr: "Çerez Satırı", en: "Cookie Row" },
  "collectionLabel.cookie-rows.plural": { tr: "Çerez Satırları", en: "Cookie Rows" },
  "collectionLabel.page-meta.singular": { tr: "Sayfa Meta Bilgisi", en: "Page Meta" },
  "collectionLabel.page-meta.plural": { tr: "Sayfa Meta Bilgileri", en: "Page Metas" },
  "collectionLabel.product-heroes.singular": { tr: "Ürün Hero Alanı", en: "Product Hero" },
  "collectionLabel.product-heroes.plural": { tr: "Ürün Hero Alanları", en: "Product Heroes" },
  "collectionLabel.feature-cards.singular": { tr: "Özellik Kartı", en: "Feature Card" },
  "collectionLabel.feature-cards.plural": { tr: "Özellik Kartları", en: "Feature Cards" },
  "collectionLabel.step-cards.singular": { tr: "Adım Kartı", en: "Step Card" },
  "collectionLabel.step-cards.plural": { tr: "Adım Kartları", en: "Step Cards" },
  "collectionLabel.media.singular": { tr: "Medya", en: "Media" },
  "collectionLabel.media.plural": { tr: "Medya", en: "Media" },
  "collectionLabel.documents.singular": { tr: "Doküman", en: "Document" },
  "collectionLabel.documents.plural": { tr: "Dokümanlar", en: "Documents" },
  "collectionLabel.users.singular": { tr: "Kullanıcı", en: "User" },
  "collectionLabel.users.plural": { tr: "Kullanıcılar", en: "Users" },
  "collectionLabel.audit-logs.singular": { tr: "Denetim Kaydı", en: "Audit Log" },
  "collectionLabel.audit-logs.plural": { tr: "Denetim Kayıtları", en: "Audit Logs" },
  "collectionLabel.translations.singular": { tr: "Çeviri", en: "Translation" },
  "collectionLabel.translations.plural": { tr: "Çeviriler", en: "Translations" },

  "campaignsExport.button": { tr: "Dışa Aktar (CSV)", en: "Export (CSV)" },
  "campaignsExport.exporting": { tr: "Hazırlanıyor…", en: "Preparing…" },
  "campaignsExport.done": { tr: "Liste indirildi.", en: "List downloaded." },
  "campaignsExport.error": { tr: "Liste indirilemedi.", en: "Couldn't download list." },

  "auditLogsExport.button": { tr: "Dışa Aktar (CSV)", en: "Export (CSV)" },
  "auditLogsExport.exporting": { tr: "Hazırlanıyor…", en: "Preparing…" },
  "auditLogsExport.done": { tr: "Liste indirildi.", en: "List downloaded." },
  "auditLogsExport.error": { tr: "Liste indirilemedi.", en: "Couldn't download list." },
};

export function applyPlaceholder(template: string, n: number): string {
  return template.replace("{n}", String(n));
}
