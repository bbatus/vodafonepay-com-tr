/**
 * RFP feedback 3.2: seed data + fallback source for the DB-backed
 * `translations` collection. Every custom admin component's UI microcopy
 * lives here, namespaced `componentName.key`. `{n}` is a placeholder a
 * caller substitutes at render time (see useDbStrings.ts) — Payload text
 * fields can't store a function, so pluralized strings use this instead.
 */
export const TRANSLATION_DEFAULTS: Record<string, { tr: string; en: string }> = {
  "reorderWidget.title": { tr: "Sürükleyerek sırala", en: "Drag to reorder" },
  "reorderWidget.saving": { tr: "Kaydediliyor…", en: "Saving…" },
  "reorderWidget.loadError": { tr: "Liste yüklenemedi.", en: "Failed to load list." },
  "reorderWidget.save": { tr: "Kaydet", en: "Save" },
  "reorderWidget.discard": { tr: "Vazgeç", en: "Discard" },
  "reorderWidget.unsavedNotice": { tr: "Kaydedilmemiş sıralama değişikliği var.", en: "There are unsaved order changes." },
  "reorderWidget.saveError": {
    tr: "Bazı öğeler kaydedilemedi — sıralama kısmen değişmiş olabilir. Sayfayı yenileyip tekrar deneyin.",
    en: "Some items couldn't be saved — the order may be partially changed. Refresh and try again.",
  },
  "reorderWidget.saveSuccess": { tr: "Sıralama kaydedildi.", en: "Order saved." },
  "reorderWidget.switchGroupBlocked": {
    tr: "Önce bu listedeki değişiklikleri kaydedin ya da vazgeçin.",
    en: "Save or discard your changes in this list first.",
  },
  "reorderWidget.emptyGroup": { tr: "Bu grupta sürüklenecek yeterli kayıt yok.", en: "Not enough records in this group to reorder." },
  "reorderWidget.loadingItems": { tr: "Yükleniyor…", en: "Loading…" },
  "reorderWidget.truncatedNotice": {
    tr: "{total} kayıttan {shown} tanesi gösteriliyor — geri kalanı sıralamak için önce bu listeyi kaydedip filtrelemeyi daraltın.",
    en: "Showing {shown} of {total} records — save this list first, then narrow the filter to reorder the rest.",
  },

  "liveOrder.loading": { tr: "Hesaplanıyor…", en: "Calculating…" },
  "liveOrder.count": { tr: "Bu grupta {count} kayıt var", en: "{count} records in this group" },
  "liveOrder.suggested": { tr: "önerilen sıra: {suggested}", en: "suggested order: {suggested}" },
  "liveOrder.useSuggested": { tr: "{suggested} kullan", en: "Use {suggested}" },

  "footerOrderField.loading": { tr: "Hesaplanıyor…", en: "Calculating…" },
  "footerOrderField.count": { tr: "Footer'da {count}/{max} kayıt var.", en: "{count}/{max} records in the footer." },
  "footerOrderField.full": {
    tr: "Footer zaten dolu ({max}/{max}) — yeni birini eklemeden önce birini kaldırın ya da işaretini kaldırın.",
    en: "The footer is already full ({max}/{max}) — remove or uncheck one before adding another.",
  },

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
  // MakerAwarePublishButton's own label — deliberately NOT reusing
  // roleAwarePublishButton.unpublish ("Yayından Kaldır ve Düzenle"), which is
  // Campaigns-specific: there, unpublishing is the step that unlocks editing a
  // live campaign. Everywhere else it is just taking the record off the site.
  "makerAwarePublishButton.unpublish": { tr: "Yayından Kaldır", en: "Unpublish" },
  "roleAwarePublishButton.unpublish": { tr: "Yayından Kaldır ve Düzenle", en: "Unpublish & Edit" },
  "roleAwarePublishButton.unpublishing": { tr: "İşleniyor…", en: "Working…" },
  "roleAwarePublishButton.requestUnpublish": { tr: "Yayından Kaldırma Talebi Oluştur", en: "Request Unpublish" },
  "roleAwarePublishButton.unpublishRequested": {
    tr: "Yayından kaldırma talebiniz Checker onayında.",
    en: "Your unpublish request is awaiting Checker approval.",
  },
  "roleAwarePublishButton.previewDesktop": { tr: "Masaüstü", en: "Desktop" },
  "roleAwarePublishButton.previewMobile": { tr: "Mobil", en: "Mobile" },
  "roleAwarePublishButton.previewWidthGroup": { tr: "önizleme genişliği", en: "preview width" },
  "roleAwarePublishButton.previewFrameTitle": { tr: "önizleme", en: "preview" },

  // Follow-up 25.08 — the "acil düzeltme" escape hatch on a live campaign.
  "roleAwarePublishButton.forceRecommended": {
    tr: "Bu kampanya yayında ve üzerinde değişiklik yaptınız. Önerilen yol: önce yayından kaldırın, düzenleyin, tekrar onaya gönderin. Acil bir düzeltmeyse inceleme adımını atlayarak doğrudan canlıya uygulayabilirsiniz.",
    en: "This campaign is live and you've changed it. Recommended: unpublish, edit, send back through review. If it's urgent, you can skip review and apply the change directly to the live site.",
  },
  "roleAwarePublishButton.forceEdit": { tr: "Acil: Doğrudan Canlıya Uygula", en: "Urgent: Apply Live Now" },
  "roleAwarePublishButton.forceEditing": { tr: "Uygulanıyor…", en: "Applying…" },
  "roleAwarePublishButton.forceHeading": { tr: "İnceleme adımını atlıyorsunuz", en: "You are skipping the review step" },
  "roleAwarePublishButton.forceBody": {
    tr: "Bu değişiklik hiçbir Checker onayından geçmeden, şu anda yayında olan kampanyaya doğrudan uygulanacak ve sitede anında görünecek. İşlem, kim tarafından ve ne zaman yapıldığıyla birlikte denetim kaydına yazılır.",
    en: "This change will be applied straight to the live campaign with no Checker approval and will appear on the site immediately. The action is written to the audit log with who did it and when.",
  },
  "roleAwarePublishButton.forceAck": {
    tr: "Bunun acil bir düzeltme olduğunu ve inceleme adımının bilerek atlandığını onaylıyorum.",
    en: "I confirm this is an urgent fix and that the review step is being skipped deliberately.",
  },
  "roleAwarePublishButton.forceConfirm": { tr: "Onayla ve Canlıya Uygula", en: "Confirm & Apply Live" },
  "roleAwarePublishButton.submitFailed": {
    tr: "Kaydedilemedi — zorunlu bir alan eksik olabilir ya da bu işlem için yetkiniz olmayabilir. Formdaki hata mesajlarını kontrol edip tekrar deneyin.",
    en: "Couldn't save — a required field may be missing, or you may not have permission. Check the form for errors and try again.",
  },

  "feedback.navLabel": { tr: "Geri Bildirim Gönder", en: "Send Feedback" },
  "feedback.title": { tr: "Geri Bildirim Gönder", en: "Send Feedback" },
  "feedback.countLabel": { tr: "geri bildirim gönderildi", en: "feedback submissions so far" },
  "feedback.intro": {
    tr: "Bu paneli birlikte daha iyi hale getirelim. Kafanızı karıştıran, fazladan tıklama gerektiren ya da eksik bulduğunuz her şeyi buradan yazabilirsiniz — küçük bir detay bile olsa yazın, hepsini okuyoruz.",
    en: "Let's make this panel better together. Anything confusing, anything that takes too many clicks, anything missing — write it here. Even a small detail is worth sending; we read all of it.",
  },
  "feedback.areaLabel": { tr: "İlgili Ekran / Bileşen", en: "Screen / Component" },
  "feedback.areaPlaceholder": { tr: "Örn: Kampanyalar → Yeni Oluştur, sürükle-bırak sıralama", en: "E.g. Campaigns → Create New, drag-and-drop ordering" },
  "feedback.areaHint": {
    tr: "Opsiyonel — hangi ekrandan bahsettiğinizi yazarsanız çok daha hızlı buluruz.",
    en: "Optional — telling us which screen you mean helps us find it much faster.",
  },
  "feedback.messageLabel": { tr: "Geri Bildiriminiz", en: "Your Feedback" },
  "feedback.messagePlaceholder": {
    tr: "Ne oldu, ne bekliyordunuz, sizce nasıl olmalıydı?",
    en: "What happened, what did you expect, how do you think it should work?",
  },
  "feedback.send": { tr: "Gönder", en: "Send" },
  "feedback.sending": { tr: "Gönderiliyor…", en: "Sending…" },
  "feedback.thanks": { tr: "Teşekkürler — geri bildiriminiz bize ulaştı.", en: "Thank you — your feedback reached us." },
  "feedback.error": { tr: "Geri bildirim gönderilemedi. Lütfen tekrar deneyin.", en: "Couldn't send your feedback. Please try again." },
  "feedback.privacy": {
    tr: "Gönderdiğinizde kullanıcı adınız, rolünüz ve geldiğiniz ekran da kaydedilir — geri bildirimi doğru yere bağlayabilmemiz için.",
    en: "Your username, role and the screen you came from are recorded with your message, so we can connect it to the right place.",
  },

  "categoryPeek.title": { tr: "Bu akışta zaten olan kategoriler", en: "Categories already in this flow" },
  "categoryPeek.loading": { tr: "Yükleniyor…", en: "Loading…" },
  "categoryPeek.empty": { tr: "Bu akışta henüz başka kategori yok — ilkini siz oluşturuyorsunuz.", en: "No other categories in this flow yet — you're creating the first one." },
  "categoryPeek.error": { tr: "Mevcut kategoriler yüklenemedi.", en: "Couldn't load existing categories." },
  "categoryPeek.note": {
    tr: "Sadece bilgi amaçlıdır — aynısını tekrar oluşturmamanız için gösteriliyor.",
    en: "Informational only — shown so you don't create a duplicate.",
  },

  "autoSlug.label": { tr: "Sayfa Adresi (otomatik)", en: "Page URL (automatic)" },
  "autoSlug.liveHint": {
    tr: "Başlığı yazdıkça otomatik oluşur — elle doldurmanız gerekmez. Kayıt sonrasında sabitlenir.",
    en: "Generated automatically as you type the title — you don't need to fill it in. It's locked once saved.",
  },
  "autoSlug.frozenHint": {
    tr: "Bu adres sabitlendi. Başlığı değiştirseniz bile adres değişmez — böylece daha önce paylaşılmış linkler bozulmaz.",
    en: "This address is locked. Changing the title won't change it, so links shared earlier keep working.",
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
  // RFP feedback 5.10, revised 29.08: "tek kumanda merkezi" read as flat,
  // industrial copy for a login screen — replaced with a line that says what
  // actually happens here (the live site takes its shape from this panel)
  // instead of naming the product category. TR and EN are written separately
  // on purpose — a literal translation of either reads stilted in the other
  // language, so each says the same thing in its own idiom rather than
  // mirroring word for word.
  "loginBrandPanel.headline": { tr: "vodafonepay.com.tr burada şekilleniyor.", en: "This is where vodafonepay.com.tr takes shape." },
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
  // 29.08: was "…Bekleyen Kampanyalar" / "Campaigns Awaiting…" back when the
  // queue really was Campaigns-only. It now covers every collection in the
  // role's scope, so a title naming one of them would be misleading.
  "dashboardWidgets.reviewTitle": { tr: "Onayınızı Bekleyen İçerikler", en: "Content Awaiting Your Approval" },
  "dashboardWidgets.reviewEmpty": {
    tr: "Şu an onayınızı bekleyen içerik yok.",
    en: "Nothing is waiting for your approval right now.",
  },
  "dashboardWidgets.reviewCta": { tr: "İncele →", en: "Review →" },
  "dashboardWidgets.ip": { tr: "IP", en: "IP" },
  "dashboardWidgets.distinctUsers": { tr: "farklı kullanıcı", en: "distinct users" },
  "dashboardWidgets.openedBy": { tr: "Açan kullanıcı", en: "Opened by" },
  "dashboardWidgets.ownDraftsTitle": { tr: "Onaya Gönderdikleriniz", en: "Your Submissions" },
  "dashboardWidgets.ownDraftsEmpty": { tr: "Onay bekleyen veya reddedilmiş bir içeriğiniz yok.", en: "You have nothing pending approval or sent back." },
  "dashboardWidgets.ownDraftsPending": { tr: "İncelemede", en: "Pending review" },
  "dashboardWidgets.ownDraftsRejected": { tr: "Reddedildi", en: "Rejected" },
  "dashboardWidgets.editCta": { tr: "Düzenle →", en: "Edit →" },

  "dashboardKpi.title": { tr: "Anasayfa", en: "Dashboard" },
  "dashboardKpi.totalContent": { tr: "Toplam İçerik", en: "Total Content" },
  "dashboardKpi.recentTitle": { tr: "Son Güncellenen İçerikler", en: "Recently Updated Content" },

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

  // Follow-up 25.08: renamed from "İçerik Yönetimi" — that's now the name of
  // the sidebar GROUP this screen sits above, and two different things with
  // the same name in the same sidebar is worse than either name alone. "Tüm
  // İçerikler" also describes it more honestly: it's a cross-collection
  // read-only inventory, not a second place to manage content.
  "contentManagement.navLabel": { tr: "Tüm İçerikler", en: "All Content" },
  "contentManagement.title": { tr: "Tüm İçerikler", en: "All Content" },
  // RFP feedback 5.9: the page is a report now — these say so, and the old
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
  "contentManagement.loginRequired": {
    tr: "Bu sayfayı görmek için giriş yapmalısınız.",
    en: "You need to sign in to view this page.",
  },
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
  "contentManagement.colPath": { tr: "Adres", en: "Path" },
  "contentManagement.colLinkedFrom": { tr: "Nerede Bağlantılı", en: "Linked From" },
  "contentManagement.siteRoutesHint": {
    tr: "Bunlar Pages koleksiyonunda değil, geliştirici tarafından kodla oluşturulmuş sayfalar — burada sadece referans için listeleniyor, düzenlenemezler. İçeriklerinin çoğu yine de CMS'ten geliyor (örn. bu sayfalardaki SSS/kampanya bölümleri).",
    en: "These aren't Pages documents — they're pages built by a developer in code, listed here for reference only, not editable. Most of their content still comes from the CMS (e.g. the FAQ/campaign sections on these pages).",
  },

  "feesAndLimits.title": { tr: "Ücretler ve Limitler", en: "Fees and Limits" },
  "feesAndLimits.intro": {
    tr: "Ücret Tablosu ve Limit Tabloları artık bu tek sayfadan yönetiliyor — sekmeler arasında geçiş yapın, bir satıra tıklayıp düzenleyin, ya da aşağıdaki sürükle-bırak aracıyla sırasını değiştirin.",
    en: "Fee Rows and Limit Tables are now managed from this single page — switch between the tabs, click a row to edit it, or reorder with the drag-and-drop tool below.",
  },
  "feesAndLimits.createFeeRow": { tr: "Yeni Ücret Satırı", en: "New Fee Row" },
  "feesAndLimits.createLimitTable": { tr: "Yeni Limit Tablosu", en: "New Limit Table" },
  "feesAndLimits.colLabel": { tr: "Etiket", en: "Label" },
  "feesAndLimits.colValue": { tr: "Değer", en: "Value" },
  "feesAndLimits.colTitleCol": { tr: "Başlık", en: "Title" },
  "feesAndLimits.colRowCount": { tr: "Satır Sayısı", en: "Row Count" },
  "feesAndLimits.colStatus": { tr: "Durum", en: "Status" },
  "feesAndLimits.colOrder": { tr: "Sıra", en: "Order" },
  "feesAndLimits.reorderTitle": { tr: "Sürükleyerek Sırala", en: "Drag to Reorder" },
  "feesAndLimits.navLabel": { tr: "Ücretler ve Limitler", en: "Fees and Limits" },

  "lockedAccounts.colUntil": { tr: "Kilit bitişi", en: "Locked until" },
  "lockedAccounts.notLocked": { tr: "Hesap kilitli değil.", en: "Account is not locked." },
  "lockedAccounts.unlock": { tr: "Kilidi Kaldır", en: "Unlock" },
  "lockedAccounts.unlocking": { tr: "Kaldırılıyor…", en: "Unlocking…" },
  "lockedAccounts.unlocked": { tr: "{email} hesabının kilidi kaldırıldı.", en: "Unlocked {email}." },
  "lockedAccounts.unlockError": { tr: "Kilit kaldırılamadı — yetkiniz olmayabilir.", en: "Couldn't unlock — you may not have permission." },
  "lockedAccounts.bannerCount": { tr: "{n} hesap şu anda kilitli.", en: "{n} account(s) are currently locked." },
  "lockedAccounts.bannerCta": { tr: "Kilitli hesapları görüntüle →", en: "View locked accounts →" },

  "saveOrSubmit.saveDraft": { tr: "Taslağı Kaydet", en: "Save Draft" },
  "saveOrSubmit.submitForReview": { tr: "Onaya Gönder", en: "Submit for Review" },

  "accountForm.email": { tr: "E-posta", en: "Email" },
  "accountForm.username": { tr: "Kullanıcı Adı (LDAP)", en: "Username (LDAP)" },
  "accountForm.role": { tr: "Rol", en: "Role" },
  "accountForm.roleDescription": {
    tr: "vodafone.local LDAP / AccessPoint rolünüz. Rol AccessPoint üzerinden talep edilir ve LDAP grubuna göre atanır — bu panelde kimse (siz dahil) değiştiremez.",
    en: "Your vodafone.local LDAP / AccessPoint role. Roles are requested through AccessPoint and assigned from your LDAP group — nobody, including you, can change it in this panel.",
  },
  "accountForm.avatar": { tr: "Profil Fotoğrafı", en: "Profile Photo" },
  "accountForm.avatarHint": { tr: "Değiştirmek için fotoğrafa tıklayın. En fazla 2MB.", en: "Click the photo to change it. Up to 2MB." },
  "accountForm.avatarUploading": { tr: "Yükleniyor…", en: "Uploading…" },
  "accountForm.avatarSaved": { tr: "Profil fotoğrafı güncellendi.", en: "Profile photo updated." },
  "accountForm.avatarError": { tr: "Fotoğraf yüklenemedi.", en: "Couldn't upload photo." },
  "accountForm.avatarTooLarge": { tr: "Profil fotoğrafı {maxMb}MB'den küçük olmalı.", en: "Profile photo must be under {maxMb}MB." },
  "accountForm.avatarBadType": { tr: "Sadece JPEG, PNG, WebP veya GIF yükleyebilirsiniz.", en: "Only JPEG, PNG, WebP, or GIF can be uploaded." },
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
  "categoriesExport.button": { tr: "Dışa Aktar (CSV)", en: "Export (CSV)" },
  "categoriesExport.exporting": { tr: "Hazırlanıyor…", en: "Preparing…" },
  "categoriesExport.done": { tr: "Liste indirildi.", en: "List downloaded." },
  "blogPostsExport.button": { tr: "Dışa Aktar (CSV)", en: "Export (CSV)" },
  "blogPostsExport.exporting": { tr: "Hazırlanıyor…", en: "Preparing…" },
  "blogPostsExport.done": { tr: "Liste indirildi.", en: "List downloaded." },

  "auditLogsExport.button": { tr: "Dışa Aktar (CSV)", en: "Export (CSV)" },
  "auditLogsExport.exporting": { tr: "Hazırlanıyor…", en: "Preparing…" },
  "auditLogsExport.done": { tr: "Liste indirildi.", en: "List downloaded." },
  "auditLogsExport.error": { tr: "Liste indirilemedi.", en: "Couldn't download list." },
  "auditLogsCefExport.button": { tr: "Dışa Aktar (CEF)", en: "Export (CEF)" },
  "auditLogsCefExport.exporting": { tr: "Hazırlanıyor…", en: "Preparing…" },
  "auditLogsCefExport.done": { tr: "CEF dosyası indirildi.", en: "CEF file downloaded." },
  "auditLogsCefExport.error": { tr: "CEF dosyası indirilemedi.", en: "Couldn't download CEF file." },
  "accessMatrix.navLabel": { tr: "Erişim Matrisi", en: "Access Matrix" },
  "accessMatrix.title": { tr: "Kullanıcı Erişim Matrisi", en: "User Access Matrix" },
  "guide.navLabel": { tr: "Nasıl Kullanılır?", en: "How to Use This" },
  "guide.title": { tr: "Nasıl Kullanılır?", en: "How to Use This" },
  "accessMatrix.intro": {
    tr: "Her rolün her koleksiyonda ne yapabildiğini gösteren tablo — görüntüle/oluştur/düzenle/yayınla/sil. access/roles.ts'teki gerçek yetki mantığından üretilir; ikisi ayrışamaz.",
    en: "What each role can do in each collection — view/create/update/publish/delete. Generated from the same permission logic in access/roles.ts, so the two can't drift apart.",
  },
  "accessMatrix.export": { tr: "Dışa Aktar (CSV)", en: "Export (CSV)" },
  "accessMatrix.searchPlaceholder": { tr: "Koleksiyon ara…", en: "Search collections…" },
  "accessMatrix.legendOff": { tr: "soluk = yetki yok", en: "faded = not granted" },
  "accessMatrix.noAccess": { tr: "erişim yok", en: "no access" },
  "accessMatrix.noMatch": { tr: "Aramanızla eşleşen koleksiyon yok.", en: "No collection matches your search." },
  "accessMatrix.column.collection": { tr: "Koleksiyon", en: "Collection" },
  "accessMatrix.column.role": { tr: "Rol", en: "Role" },
  "accessMatrix.forbidden": {
    tr: "Bu sayfa sadece New Vertical Maker rolündeki kullanıcılar içindir.",
    en: "This page is for New Vertical Maker users only.",
  },
};

export function applyPlaceholder(template: string, n: number): string {
  return template.replace("{n}", String(n));
}
