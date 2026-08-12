# RFP Açık Madde Listesi

**Kaynak:** `docs/RFP-GAP-ANALYSIS.md` (ana repo, 2026-08-11 tarihli analiz)
**Bu doküman:** O analizdeki her maddenin bu branch'teki (`claude/selam-login-disable-temp-725fb7`) güncel durumu.
**Tarih:** 2026-08-12

Notasyon: ✅ Karşılanıyor · 🟡 Kısmi/bilinçli sınırlı · ❌ Açık, kod ile kapatılabilir · ⬜ Kapsam dışı (kullanıcı kararı veya gerçek altyapı/3.parti bağımlılığı)

---

## 1. Hâlâ açık olan maddeler (❌) — kod ile kapatılabilir, henüz yapılmadı

| # | Madde | Neden açık | Efor |
|---|---|---|:--:|
| 3.2.2 | Editable desktop and mobile URLs (ayrı alanlar) | Hiç alan yok. Niş bir istek — çoğu modern sitede masaüstü/mobil için ayrı URL tutulmaz (responsive tasarım kullanılır), ama RFP açıkça istiyor. | S |
| 3.2.10 | SEO auditing and reporting — analitik araç entegrasyonu | Sitede hiç analytics/GTM entegrasyonu yok. Gerçek bir GA4/GTM hesabı ve tracking ID gerektirir — bu olmadan sahte bir entegrasyon eklemek anlamsız. | ⬜'e yakın — gerçek hesap bilgisi lazım |
| 3.2.11 | Multi-channel publishing (desktop, mobile, 3rd-party) | REST/GraphQL API teknik olarak mümkün kılıyor ama tasarlanmış bir "kanal" kavramı yok (hangi içerik hangi kanala gider). | M — gerçek bir 2. tüketici (mobil app, 3rd-party) olmadan test edilemez |
| 3.5.2-3.5.5 | Content Provider / Content Admin / Report Admin / CC Admin rol-özel ekranları (raporlama, SMS keyword, CC agent log) | Gerçek raporlama modülü, SMS gateway, CC (call center) sistemi entegrasyonu gerektiriyor — bunlar bu repo'nun üretebileceği şeyler değil. | ⬜'e yakın |
| §4 | Centralized error tracking / configurable error messages (Sentry vb.) | `src/lib/cms.ts`'te fail-loud logging var (R-08) ama merkezi bir hata izleme servisi (Sentry/Datadog) entegre değil — gerçek bir hesap/DSN gerektirir. | ⬜'e yakın |

---

## 2. Bilinçli olarak kapatılmayan maddeler (🟡) — teknik gerekçeyle

| # | Madde | Gerekçe |
|---|---|---|
| 3.1.8 | Active/inactive toggle (ayrı alan) | Artık her collection'da `versions.drafts` var (yayın durumu zaten var). Ayrı bir `isActive` boolean eklemek, "taslak ama aktif" gibi çelişkili durumlara yol açar — draft/publish zaten aynı işlevi görüyor. İstenirse eklenebilir ama gereksiz karmaşıklık riski var. |
| 3.2.5 | Rich text (tüm collection'larda) | Blog, Pages (RichTextBlock), Campaigns'te var; `LegalPages.intro` hâlâ düz textarea — hukuki metinlerde biçimlendirme ihtiyacı sınırlı olduğu için bilinçli olarak ertelendi. |
| 3.2.6 | Meta "keywords" alanı | Google 2009'dan beri meta keywords etiketini kullanmıyor — ölü bir SEO pratiği. title/description/OG zaten var (PageMeta). İstenirse eklenir ama gerçek SEO değeri yok. |
| 3.1.12 | Flexible/Extensible panel (iş birimi tarafından) | Payload config-as-code mimarisinin doğal sonucu — alan eklemek/çıkarmak hâlâ geliştirici + deploy gerektiriyor. Bu, Payload'ı bırakıp başka bir mimariye geçmeden kapanmaz. |
| 3.1.13 | Admin UI'dan alan yönetimi (no-code field builder) | Aynı mimari sınır — Payload'ın kendisi bunu desteklemiyor. |
| 3.2.14 | Localization — site tarafı | CMS içeriği tr/en localization altyapısı hazır (`payload.config.ts`), ama site (`vodafonepaycomtr`) tarafında dil değiştirici/route yok. Kullanıcı talimatıyla kapsam CMS-only tutuldu (bkz. bu oturumun ilk talimatı: "vodafonepaycomtr websitede olmasına gerek yok"). |

---

## 3. Kullanıcı kararıyla kapsam dışı (⬜)

| # | Madde | Karar |
|---|---|---|
| 3.1.9 | SSO (LDAP) gerçek entegrasyonu | Kullanıcı: "sadece rol simülasyonu" — gerçek LDAP dizini/auth stratejisi kurulmayacak, mevcut 4-rol RBAC yeterli. |
| 3.1.10, 3.1.11 | Ayrı test CMS ortamı, test→prod promosyon akışı | Kullanıcı: "ortam bağımlı, şu an gerek yok." |
| 3.5.1 | RFP'nin 5 isimli rol taksonomisi (Content Provider/Admin/Report Admin/Full Admin/CC Admin) | Kullanıcı: mevcut 4 rol (New Vertical Maker/Checker, Growth Maker/Checker) "değişmeyecek" — LDAP rol simülasyonu bu 4 role sabit. |
| §5/§7 (tamamı) | OpenShift, Fortify, SonarQube-CI entegrasyonu, ArcSight/SIEM CEF export, Zabbix/SNMP monitoring, DR, CI/CD pipeline (GitHub Actions branch/deploy) | Kullanıcı: "github vs ci cd akısları su an ortam bagımlı ... onlara gerek yok." Bunların hepsi gerçek kurumsal altyapı/tedarikçi kararları — bir kod deposu bunları kapatamaz. |
| 3.1.16 | VEPAS/VPAY entegrasyonu | PoC kapsamında hiç ele alınmadı, entegrasyon yüzeyi bilinmiyor — RFP'nin kendisi de bunun kapsam netleştirmesi gerektiğini söylüyor. |
| 3.2.15 | Çoklu veritabanı (Oracle/MongoDB/Couchbase) yönetimi | RFP maddesi genel bir DB yönetim aracı gibi duruyor, CMS isteri değil — netleştirilmeli. |

---

## 4. Bu oturumda kapatılanlar (özet — detay için sohbet geçmişine bakınız)

- 3.1.1 Draft/publish tüm içerik collection'larında
- 3.1.2 Video + PDF desteği (Media + Documents collection)
- 3.1.3 Zamanlanmış yayın/kaldırma (startDate/endDate)
- 3.1.4 Image mgmt (boyut, focal point, caption)
- 3.1.6 Sürükle-bırak sıralama — **tüm** order'lı collection'lara genelleştirildi, canlı doğrulandı
- 3.1.7 Deeplink alanı
- 3.1.14 Maker-checker — RBAC uçtan uca kuruldu
- 3.1.15 Audit trail — AuditLogs collection + hook'lar
- 3.2.3 Breadcrumb — PageMeta üzerinden CMS'ten yönetiliyor
- 3.2.6/7/8 Meta tag/OG/dynamic meta — PageMeta + generateMetadata
- 3.2.9 Content versioning/rollback — evrensel
- 3.2.12 Preview — livePreview/admin.preview
- 3.2.13 Drag-and-drop sayfa tasarımı — Payload Blocks + Pages collection + dinamik route
- 3.3.1-3.3.3 Sayfa üretimi (kod yazmadan) — Pages/Blocks modeliyle gerçek
- 3.5.6 Full Admin aktivite log görüntüleme — AuditLogs
- 3.5.7 Türkçe admin paneli — i18n

---

## 5. Bu konuşmada eklenen yeni işler (henüz tamamlanmadı)

- CMS admin TR/EN dil değiştiricisinin varsayılanının TR olduğunu doğrulama + gerçek geçiş testi
- Custom admin bileşenlerinin (ReorderWidget vb.) locale-aware hale getirilmesi ve bunun bundan sonraki her yeni component için kural olarak benimsenmesi
- Her collection için "Yardım (?)" butonu — sayfa bazlı adım adım kullanım kılavuzu
- 4 test kullanıcısıyla tarayıcıda uçtan uca RBAC/CRUD akış testi (şifre sıfırlama kullanıcıdan bekleniyor)
