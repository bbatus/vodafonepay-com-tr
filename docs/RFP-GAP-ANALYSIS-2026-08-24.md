# RFP Uyum Analizi — Güncel Durum (2026-08-24)

**Kaynak:** `02_Technical Annex_RFPset_Cleaner_v10.14_final.docx` (`~/Downloads/`, aynı doküman `docs/RFP-GAP-ANALYSIS.md`'nin de kaynağı — v10.14, 19 ana bölüm, tamamı okunup satır satır bu belgeye işlendi)
**Bu belge:** `docs/RFP-GAP-ANALYSIS.md` (2026-08-11, commit `05c9559`) analizinin **yerini alan** güncel versiyon — o tarihten bu yana repo'da devasa miktarda RFP-güdümlü çalışma yapıldı (bkz. `docs/RFP-OPEN-ITEMS.md` ve bu oturumdaki commit geçmişi). Eski belge tarihsel referans olarak duruyor, silinmedi.
**Değerlendirilen:** `main` dalı, HEAD `31b69db` (2026-08-24)
**Kapsam sözü:** RFP'nin 19 bölümünün **tamamı** okundu. §1-§7 (fonksiyonel/mimari/operasyonel/güvenlik/SOX) satır satır koda karşı doğrulandı. §8-§19 (teslimatlar, kabul testi süreçleri, proje yönetimi, değişiklik yönetimi, İK, iş sürekliliği, AD/AM, eğitim) de okundu ve aşağıda özetlendi — ama bunlar bir kod deposunun kapatabileceği maddeler değil (tedarikçi-müşteri sözleşme/organizasyon maddeleri), bu yüzden "❌ eksik özellik" olarak değil, ayrı bir bölümde dürüstçe "kod ile kapanmaz" olarak işaretlendi. Notasyon aşağıda.

| İşaret | Anlamı |
|---|---|
| ✅ | Karşılanıyor, koddan doğrulandı |
| 🟡 | Kısmen karşılanıyor / farklı bir mekanizmayla karşılanıyor / bilinçli sınırlı |
| ❌ | Karşılanmıyor — koda yazılabilir, henüz yazılmamış |
| ⬜ | Kod deposunun kapsamı dışı (gerçek altyapı/tedarikçi/organizasyon kararı) |

---

## 1. Yönetici özeti — 2026-08-11'den bu yana ne değişti

2026-08-11 tarihli analiz "devredilemez" diyordu, gerekçesi üç maddeydi: **sayfa üretimi yok, maker-checker yok, audit trail yok.** Üçü de o tarihten sonra baştan yazıldı:

| Madde | 2026-08-11 | 2026-08-24 |
|---|---|---|
| Sayfa üretimi (§3.3) | ❌ Yok — her sayfa elle yazılmış React dosyası | ✅ `Pages` collection, 10 hazır blok (Hero/Metin/SSS/Kampanya Grid/Video/Logo Grid/İkonlu Kartlar/Adım Listesi/Slayt/Çoklu Video), sürükle-bırak, kod yazmadan yayına |
| Maker-checker (§3.1.14) | ❌ Rol alanı var, hiçbir yere bağlı değil | ✅ 4 rol (`ROLES` — NV Maker/Checker, Growth Maker/Checker), her collection'ın `access` bloğuna bağlı, `denyMakerPublish` hook'uyla sunucu tarafında zorlanıyor |
| Audit trail (§3.1.15 / §7.2) | ❌ Yalnızca 4 collection'da Payload versiyonu | ✅ Ayrı `audit-logs` collection — login/login_failed/logout/create/update/publish/rejected/delete/unlock, IP+user-agent, CSV export |
| Video/PDF içerik (§3.1.2) | ❌ Yalnızca `image/*` | ✅ `Media` (image+video) + ayrı `Documents` (PDF) |
| Zamanlanmış yayından kaldırma (§3.1.3) | ❌ `endDate` DB'de var, sorguda kullanılmıyor | ✅ `src/lib/cms.ts`'te `endDate` filtre olarak uygulanıyor |
| Admin paneli Türkçe (§3.5.7) | 🟡 Etiketler Türkçe, Payload'ın kendi arayüzü İngilizce | ✅ `payload.config.ts`'te `i18n` bloğu, tam TR/EN |
| Sıralama / drag-drop (§3.1.6) | 🟡 Sayı elle giriliyor | ✅ `ReorderWidget` — tüm sıralı collection'larda sürükle-bırak, canlı test edildi |
| Test coverage (§5.2) | ❌ Sıfır test | 🟡 153 test (cms) + kök paket testleri, `vitest coverage` script'i var — %90 hedefine ulaşıldığı ayrıca ölçülmedi |
| CI/CD (§5.2) | ❌ `ci.yml` `master` dalını izliyor, repo `main` — **pipeline hiç çalışmıyor** | ❌ **Aynı hata hâlâ duruyor** — `git branch` `main`, `.github/workflows/ci.yml` hâlâ `branches: [master]`. Ayrıca `cms/` hâlâ CI'da lint/typecheck/build edilmiyor, sadece kök paket. |
| Sessiz hata yutma (§4.3) | ❌ `catch { return null }`, hiç loglanmıyor | ✅ `src/lib/cms.ts` artık her `catch`'te `console.error` ile fail-loud logluyor |

**Sonuç:** RFP'nin **kendi varlık sebebi** olan üç madde (sayfa üretimi, maker-checker, audit) artık gerçek. Kalan açık maddeler iki kategoride toplanıyor: (a) bu repo'nun kapsayabileceği ama henüz yapılmamış SEO/entegrasyon detayları, (b) gerçek kurumsal altyapı (OpenShift, Fortify, ArcSight, SSO/LDAP dizini) gerektiren, bir PoC'un asla kendi başına kapatamayacağı maddeler.

---

## 2. §3.1 Content Management — güncel durum

| # | RFP maddesi | Durum | Kanıt |
|---|---|:--:|---|
| 3.1.1 | Create/edit/delete/publish/unpublish | 🟡 | 15 collection'da `versions: { drafts: true }` (Campaigns, BlogPosts, FaqItems, Announcements, ContentBlocks, NavLinks, LegalPages, CookieRows, PageMeta, ProductHeroes, FeatureCards, StepCards, FeeRows, LimitTables, Pages). **`Representatives` ve `Media`/`Documents` taslak desteklemiyor** — bu üçünde kaydet = yayınla, geri dönüşü yok. Temsilcilik kaydı gibi düşük riskli içerik için makul bir seçim ama RFP'nin "her içerik" ifadesine göre tam karşılanmıyor. |
| 3.1.2 | Farklı içerik tipleri (metin/görsel/video/pdf) | ✅ | `Media.ts` → `mimeTypes: ["image/*", "video/*"]`; `Documents.ts` → `mimeTypes: ["application/pdf"]`. |
| 3.1.3 | Yayın/kaldırma zamanlaması | ✅ | `Campaigns.startDate/endDate` + `src/lib/cms.ts`'te `endDate][greater_than_equal]` sorgu filtresi — süresi dolan kampanya listeden otomatik düşüyor. **Not:** bu yalnızca Campaigns'te var; RFP'nin genel "her içerik" ifadesine göre diğer sıralı collection'larda (Announcements, FaqItems) aynı mekanizma yok — 🟡'a yakın bir ✅. |
| 3.1.4 | Görsel yönetimi: tekli+toplu yükleme, boyutlandırma | ✅ | `Media.ts` → `imageSizes: [thumbnail, card, hero]`, `focalPoint: true`. Payload'ın kendi upload UI'ı çoklu dosya sürükle-bırakı destekliyor. Dosya boyutu üst sınırı yalnızca `Users.avatar` için var (2MB) — genel Media için boyut limiti yok (küçük, gerçek bir boşluk). |
| 3.1.5 | Filtre özelliği | ✅ | Payload liste görünümü + `ContentManagementApp`'in kendi arama/filtre/sayfalama UI'ı. |
| 3.1.6 | Sıralama (ID ile gösterim) | ✅ | `order` alanı + `assignNextOrder` hook'u + `ReorderWidget` (sürükle-bırak) — Kategoriler, NavLinks, FaqItems, FeatureCards, StepCards, ContentBlocks, Announcements, FeeRows, LimitTables'ta. |
| 3.1.7 | Her içerikte deeplink alanı | 🟡 | Announcements/FeatureCards/StepCards'ta `deeplink` var; Campaigns'te `ctaUrl` aynı işi görüyor. Ama BlogPosts, FaqItems, Pages, LegalPages, CookieRows gibi collection'larda yok — "her içerik öğesi" ifadesine göre kısmi. |
| 3.1.8 | Aktif/pasif görünürlük anahtarı | 🟡 | Ayrı bir `isActive` alanı yok; `_status` (draft/published) + Campaigns'in `campaignStatus` (active/expired) + BlogPosts'un `postStatus` (active/archived) bunu farklı bir mekanizmayla karşılıyor. Bilinçli tasarım kararı (bkz. `docs/RFP-OPEN-ITEMS.md` §2) — ayrı bir boolean eklemek "taslak ama pasif" gibi çelişkili durumlar yaratır. |
| 3.1.9 | SSO (LDAP) girişi | ❌ | Hâlâ e-posta+parola (Payload local auth). `Users.username` alanı LDAP için hazırlık olarak var ama gerçek bir LDAP auth stratejisi bağlanmadı — `roleMapping.ts` yalnızca rol→AD-grup eşleme tablosu, gerçek dizin sorgusu yok. **Bilinçli olarak ertelendi** (kullanıcı kararı, `docs/RFP-OPEN-ITEMS.md` §3). |
| 3.1.10 / 3.1.11 | Ayrı test CMS + test URL'ine bağlı olma + test→prod promosyon | ❌ | Tek `docker-compose.yml` stack'i (postgres+minio+cms+app). Ayrı bir test ortamı/URL/promosyon akışı yok. Kullanıcı kararıyla kapsam dışı bırakıldı. |
| 3.1.12 / 3.1.13 | Esnek/genişletilebilir panel, iş biriminin alan ekleyip çıkarabilmesi | ❌ | Payload config-as-code mimarisinin doğal sonucu — alan eklemek hâlâ `cms/src/collections/*.ts` düzenlemek + deploy demek. Mimari sınır, kod eforu ile kapanmaz (Payload'ı bırakmadan). |
| 3.1.14 | Maker/checker/ikisi birden, checker'ın yetki devri | 🟡 | Maker-checker ✅ tam çalışıyor (bu belgenin en büyük başarısı). **Checker'ın izinliyken yetkisini başka birine devretmesi (delegation) hâlâ yok** — kod genelinde `delegat*` araması sıfır sonuç verdi. Bu, RFP'nin literal cümlesinde açıkça istenen ("Checker may delegate his/her rights to another user if necessary") ve şu an gerçekten eksik olan tek somut §3.1.14 alt maddesi. |
| 3.1.15 | Audit trail | ✅ | `audit-logs` collection, kapsamlı hook seti. Detay için §5 (Audits) aşağıda — RFP'nin 17 alt maddesinin çoğu karşılanıyor, birkaçı (SIEM/CEF export, userID karşılaştırma tablosu) hâlâ yok. |
| 3.1.16 | VEPAS/VPAY ile entegrasyon | ⬜ | PoC kapsamında hiç ele alınmadı; entegrasyon yüzeyi tanımlanmamış. |
| 3.1.17 | Dış araçlar için API erişimi | ✅ | Payload REST (`/api/*`) + GraphQL (`/api/graphql`) hazır. |

---

## 3. §3.2 SEO-Specific Functionalities — güncel durum

| # | RFP maddesi | Durum | Kanıt |
|---|---|:--:|---|
| 3.2.1 | SEO-friendly URL taxonomy | ✅ | `Pages`, `BlogPosts`, `Campaigns` hepsi `turkishSlugify`+`uniqueSlug` ile otomatik, tutarlı slug üretiyor; CMS'ten yönetiliyor (artık dosya sistemine gömülü değil — `Pages` collection'ı sayesinde). |
| 3.2.2 | Ayrı editable masaüstü/mobil URL | ❌ | Hâlâ yok. Sitenin responsive tasarımı zaten tek URL kullanıyor — RFP'nin bu maddesi muhtemelen eski/masaüstü-mobil ayrı site mimarisi varsayan bir dönemden kalma; niş ve düşük öncelikli. |
| 3.2.3 | Editable breadcrumb elemanları | ✅ | `PageMeta.breadcrumbLabel` + `getPageMeta()` — site genelinde 19 sayfa bunu kullanıyor (2026-08-11'de "sabit prop" denilen şey artık CMS'ten geliyor). `Pages.parent` da ayrıca breadcrumb hiyerarşisi sağlıyor. |
| 3.2.4 | SEO metin alanları (anasayfa/kategori/ürün) | ✅ | `seoTitle`/`seoDescription` Campaigns, BlogPosts, Pages'te; `PageMeta` sabit route'lar için aynısını sağlıyor. |
| 3.2.5 | Rich text desteği | 🟡 | `lexicalEditor()` kurulu; BlogPosts.body, Campaigns.body/terms, Pages'in RichTextBlock'unda kullanılıyor. `LegalPages.intro` hâlâ düz textarea (bilinçli — RFP-OPEN-ITEMS §2'de gerekçeli). |
| 3.2.6 | Meta tags: title/description/**keywords** + önizleme | 🟡 | title+description her yerde var. **`keywords` alanı hiçbir collection'da yok** — bilinçli atlama (Google 2009'dan beri meta keywords'ü kullanmıyor, RFP-OPEN-ITEMS §2'de gerekçeli) ama RFP'nin literal isteği karşılanmıyor. |
| 3.2.7 | Dinamik meta data alanları | ✅ | `seoTitle`/`seoDescription` boş bırakılırsa `title`/`description`'a düşüyor — sayfa içeriğine göre uyarlanan meta. |
| 3.2.8 | Open Graph konfigürasyonu (kanal bazlı) | ✅ | `src/lib/metadata.ts`'teki paylaşılan `buildMetadata()` her sayfada `openGraph` (title/description/url/siteName/locale/type/image) + `twitter` (summary_large_image) üretiyor; `image` parametresi `PageMeta.ogImage`/`Pages.ogImage`'dan geliyor (`src/app/**/page.tsx`'te ~19 çağrı noktası doğrulandı). İlk aramada yalnız `.tsx` dosyaları tarandığı için bu madde ilk turda kaçırılmıştı — `metadata.ts` bir `.ts` dosyası. |
| 3.2.9 | Content versioning / rollback | ✅ | Tüm içerik collection'larında `versions.drafts` — Payload'ın kendi versiyon geçmişi/diff/rollback arayüzü devrede. |
| 3.2.10 | SEO auditing/reporting (analitik araç entegrasyonu) | ❌ | Sitede GA4/GTM/analytics entegrasyonu yok. Gerçek bir hesap/tracking ID gerektiriyor — sahte bir entegrasyon eklemek anlamsız. |
| 3.2.11 | Multi-channel publishing (masaüstü/mobil/3.parti) | 🟡 | REST/GraphQL API teknik olarak mümkün kılıyor ama tasarlanmış bir "kanal" kavramı yok. |
| 3.2.12 | Preview (mobil+masaüstü) | ✅ | `admin.preview` ile `sitePreviewUrl()` (Campaigns/BlogPosts/Pages) + `RoleAwarePublishButton`'ın yayın-öncesi confirm modal'ında gerçek site iframe'i. **Mobil/masaüstü görünüm ARASINDA geçiş toggle'ı yok** — tek genişlikte önizleme, RFP'nin "hem mobil hem masaüstü" ifadesini tam karşılamıyor (🟡'a yakın ✅). |
| 3.2.13 | Drag-and-drop sayfa tasarımı | ✅ | `Pages.layout` (Payload Blocks) — 10 blok, sürükle-bırak, canlı test edildi. 2026-08-11'in "en kritik boşluk" dediği madde artık kapalı. |
| 3.2.14 | Çok dilli içerik oluşturma (localization) | 🟡 | CMS admin arayüzü tam TR/EN (`i18n` bloğu). **İçeriğin kendisi (kampanya/sayfa metni) çok dilli değil** — `payload.config.ts`'te content-level `localization` bloğu yok; Pages'in tek `localized` alanı bilinçli olarak kaldırıldı (RFP feedback 5.7, kod yorumunda gerekçeli: içerik lokalizasyonu iş kararıyla kapsam dışı bırakıldı). RFP'nin literal isteği (çok dilli İÇERİK oluşturma) karşılanmıyor. |
| 3.2.15 | Çoklu veritabanı yönetimi (Oracle/MongoDB/Couchbase) | ⬜ | Genel bir DB-yönetim aracı isteği gibi duruyor, CMS isterinden çok. Netleştirilmesi gereken bir madde. |

---

## 4. §3.3 Lifecycle Management ve §3.5 Admin Screen

### 4.1 Lifecycle Management — artık kapalı

| # | RFP maddesi | Durum |
|---|---|:--:|
| 3.3.1-3.3.3 | Hub/landing/campaign sayfası oluşturma, kod yazmadan, sürükle-bırak + code-view | ✅ | `Pages` collection'ı tam olarak bunu yapıyor — kod yazmadan, deploy gerekmeden yeni sayfa. "Code view" (blokların ham HTML/JSON görünümü) yok ama RFP'nin asıl istediği "geliştirici gerekmeden sayfa üretimi" karşılanıyor. |

### 4.2 Admin Screen — rol taksonomisi hâlâ farklı, bilinçli

| # | RFP maddesi | Durum | Not |
|---|---|:--:|---|
| 3.5.1 | 5 rol: Content Provider, Content Admin, Report Admin, Full Admin, CC Admin | ❌ | Sistemde 4 farklı rol var (New Vertical Maker/Checker, Growth Maker/Checker) — isimler ve kapsamlar RFP'ninkiyle eşleşmiyor. **Bilinçli kullanıcı kararı** (`docs/RFP-OPEN-ITEMS.md` §3): "mevcut 4 rol değişmeyecek". |
| 3.5.2-3.5.5 | Content Provider/Admin, Report Admin, CC Admin'e özel ekranlar (SMS keyword, top10 liste, CC agent log) | ❌ | Yok — gerçek bir SMS gateway / call-center sistemi entegrasyonu gerektiriyor, PoC kapsamı dışı. |
| 3.5.6 | Full Admin: yeni admin oluşturma + tüm aktivite logu | ✅ | `Users` (create: yalnız NV Maker) + `AuditLogs` (NV Maker tüm günlüğü görür). |
| 3.5.7 | Tüm admin arayüzleri Türkçe | ✅ | `i18n` bloğu, tam TR/EN — RFP'nin "Turkish zorunlu, English opsiyonel" ifadesini fazlasıyla karşılıyor. |

---

## 5. §6 Security Requirements — Audits (RFP §7'de "6" olarak numaralanmış, dokümanın kendi TOC'unda §6)

RFP 17 alt madde istiyor. `audit-logs` collection + `hooks/audit.ts` üzerinden karşılananlar:

| Talep | Durum | Not |
|---|:--:|---|
| userID kaydı | ✅ | `userEmail` her satırda |
| Olay tarih/saati | ✅ | `createdAt` |
| Başarılı/başarısız login-logout | ✅ | `login`/`login_failed`/`logout` action'ları — `Users.ts`'in `afterLogin`/`afterLogout`/`afterError` hook'ları |
| Bilinmeyen userID/workstation'dan login denemesi | 🟡 | `login_failed` genel olarak loglanıyor ama "bilinmeyen workstation" ayrımı (cihaz parmak izi) yok |
| Erişilen dosyalar/programlar | 🟡 | `collectionSlug` hangi koleksiyona dokunulduğunu söylüyor; "hangi dosya indirildi" (Media/Documents okuma) loglanmıyor — sadece yazma işlemleri |
| Değişen verinin before/after image'ı | ❌ | `summary` alanı yalnızca kısa bir metin (`"campaigns: X güncellendi"`) — alan bazlı önce/sonra diff'i audit log'da tutulmuyor. Payload'ın kendi version history'si bunu dolaylı olarak sağlıyor ama audit-logs collection'ının kendisinde yok. |
| Privileged (admin) işlem kaydı | ✅ | `unlock` action'ı (hesap kilidi açma) özel olarak loglanıyor |
| Erişim hakkı (rol) değişikliği kaydı | ❌ | Bir kullanıcının rolü değiştiğinde bu özel olarak loglanmıyor — genel `update` action'ı altında görünür ama "rol X'ten Y'ye değişti" diye ayrıştırılmıyor |
| Rapor/veri export kaydı | ❌ | CSV export butonlarının (5 tanesi) KULLANIMI audit log'a yazılmıyor — export edilen veri kendisi hassas olabilir, bu bir gerçek boşluk |
| Silme/yazma/ekleme DENEMELERİ (başarısız olanlar dahil) | ❌ | Yalnızca başarılı işlemler loglanıyor; 403 ile reddedilen bir silme denemesi loglanmıyor |
| userID kilitlenmeleri | 🟡 | Kilit AÇMA (`unlock`) loglanıyor, kilit KONMA anı (5. yanlış denemede) ayrı bir audit satırı olarak loglanmıyor (Payload'ın kendi `lockUntil` alanı DB'de tutuluyor ama audit-logs'a yazılmıyor) |
| Audit log konfigürasyon değişiklikleri | ⬜ | Böyle bir konfigürasyon yok (audit her yerde sabit kodlu, değiştirilemez) — madde anlamsız hale geliyor |
| Uzak oturum aksiyonları | ⬜ | "Remote session" kavramı bu mimaride yok |
| **SIEM'e CEF formatında export** | ❌ | Yok — yalnız CSV export var, ArcSight/ELK entegrasyonu yok |
| userID karşılaştırma tabloları | ❌ | Yok |

**Özet:** 17 maddeden ~7'si tam, ~4'ü kısmi, ~6'sı hâlâ açık. 2026-08-11'deki "neredeyse hiçbiri karşılanmıyor" durumundan büyük ilerleme, ama SIEM export ve export-log'lama gibi somut, koda yazılabilir maddeler duruyor.

**Authorization (§6.3):** Role/profile-based ✅, need-to-know/segregation-of-duty ✅ (maker-checker ayrımı tam olarak bu). Bu iki madde artık tam karşılanıyor.

---

## 6. §4-§5 Architecture/Operational — büyük ölçüde kurumsal altyapı, kod dışı

Bu iki bölümün büyük kısmı (Openshift, Fortify, Sonarqube-CI-gate, Smartcheck, Mend, Twistlock, ArcSight, Zabbix, SNMP, Tivoli, TMF SID/CIM uyumu, DR/geo-redundancy, konteyner orkestrasyon) **gerçek kurumsal altyapı/tedarikçi entegrasyonları** — bir PoC/uygulama deposu bunları kod yazarak kapatamaz, bunlar platform/DevOps kararlarıdır. Yine de somut, koda dokunan birkaç madde var ve bunlar hâlâ açık:

| Madde | Durum | Not |
|---|:--:|---|
| CI/CD pipeline'ın gerçekten çalışması | ❌ | **Hâlâ kırık.** `.github/workflows/ci.yml` → `on.push.branches: [master]`, repo'nun varsayılan dalı `main`. Pipeline şu an SIFIR kez tetiklenmiş olabilir. Tek satırlık düzeltme, hiç yapılmamış. |
| CI'ın `cms/` dizinini kontrol etmesi | ❌ | `ci.yml` yalnızca kök paketi (`npm ci && npm run lint/typecheck/build`) kontrol ediyor — `cms/`'in kendi `lint`/`typecheck`/`test`/`build`'i pipeline'da hiç çalışmıyor. |
| SonarQube/Trivy tarama | 🟡 | `AGENTS.md` bunu **manuel, geliştirici-tetikli** bir adım olarak tanımlıyor (`scripts/sonar-scan.sh`, `scripts/trivy-scan.sh`) — otomatik bir CI kapısı değil, "commit'ten önce elle çalıştır" kuralı. RFP'nin istediği "pipeline bulgu varsa kırılmalı" otomasyonu yok. |
| Test coverage | 🟡 | 153+ test var (2026-08-11'de sıfırdı) ama `%90 coverage / %0 duplication` hedefine ulaşıldığı ölçülmedi — `vitest run --coverage` script'i var, sonucu bu analiz kapsamında çalıştırılmadı. |
| Merkezi hata izleme (Sentry/Datadog) | ❌ | `console.error` ile fail-loud logging var (iyileşme) ama merkezi bir hata izleme SERVİSİ yok — gerçek bir hesap/DSN gerektirir. |
| Web tabanlı yönetim/konfigürasyon aracı | ✅ | Payload admin paneli bunu İÇERİK için tam karşılıyor. Sistem konfigürasyonu (env değişkenleri, secret'lar) hâlâ dosya/deploy üzerinden — RFP'nin "tüm konfigüratif değişiklikler bu araçtan" ifadesi içerik dışı ayarlar için karşılanmıyor. |
| Database: Oracle/PostgreSQL | ✅ | `@payloadcms/db-postgres` + Postgres 16. |
| Code base Java tercihi | 🟡 | TypeScript/Node.js — RFP "preferred" diyor, zorunlu değil, ama tedarikçi değerlendirmesinde not edilmeli. |
| Git tabanlı repo | ✅ | Git + GitHub. |

Geri kalan tüm OpenShift/Fortify/ArcSight/Zabbix/SNMP/Twistlock/Mend/TMF-SID maddeleri **⬜ kapsam dışı** — gerçek bir kurumsal altyapı sözleşmesi ve 3.parti araç lisansı gerektiriyor, bir kod incelemesiyle "eksik" ya da "tamam" denemez.

---

## 7. §7 SOX Requirements

SOX 302/404/902 — finansal raporlamanın bütünlüğü, denetlenebilirlik, kasıtlı veri tahribatının suç sayılması. Bunlar bir **yasal uyum çerçevesi**, kod satırı değil. Bu repo'nun sağladığı teknik temel:

- Audit trail (§5 yukarıda) → 404'ün "harici denetçiler tarafından doğrulanabilir olma" gereksinimine kısmi temel sağlıyor.
- Maker-checker ayrımı → 302'nin "yanlış/kurcalanmış veriye dayalı raporlama olmasın" ilkesine hizmet ediyor.

Ama resmi bir SOX uyum beyanı, bir kod deposunun kendi başına veremeyeceği bir organizasyonel/hukuki süreçtir (dış denetim, iç kontrol dokümantasyonu, yönetim onayı). **⬜ kapsam dışı**, teknik temel kısmen hazır.

---

## 8. §8-§19 — sözleşme/organizasyon maddeleri (kod ile kapanmayan yarısı)

RFP'nin **yaklaşık yarısı** bu bölümlerde ve hiçbiri bir kod deposu tarafından karşılanamaz — bunlar tedarikçinin Vodafone'a karşı taahhüt ettiği hizmet/organizasyon şartları:

| Bölüm | İçerik | Neden kod dışı |
|---|---|---|
| §8 Deliverables | 50 maddelik teslimat tablosu (FD/Macro/Micro Design onayları, gecikme cezaları %3/gün) | Proje yönetimi süreci, doküman teslim takvimi |
| §9 Acceptance | SIT/Performance/SAT/UAT test süreçleri, JIRA/XRAY kullanımı, %90 test-case geçme oranı | Test SÜRECİ tanımı — bizim 153 testimiz teknik olarak var ama bu bölümün istediği resmi SIT/SAT/UAT onay zinciri organizasyonel |
| §10 Support | 6 ay garanti, destek/bakım dönemi | Sözleşme şartı |
| §11 Project Management | Agile Scrum, haftalık PPT raporu, RACI matrisi | Süreç |
| §12 Change Request | CCB, CCN şablonu, değişiklik onay süreci | Süreç |
| §13 HR | Ofiste çalışma, mesai saatleri (8-17), personel değişikliği bildirimi | İnsan kaynağı sözleşme şartı |
| §14 Business Continuity | Marmara depremi sonrası yedek parça lojistiği, DR senaryoları | Fiziksel altyapı/lojistik |
| §15-17 AD/AM/SLA | Milestone cezaları, defect density eşikleri | Sözleşme KPI'ları |
| §18 Training | Eğitim içerikleri, maks. 10 katılımcı, video/doküman teslimi | Eğitim organizasyonu |
| §19 Glossary | Kısaltma sözlüğü | Referans, madde değil |

Bu bölümler **✅/❌ ile değerlendirilmedi** çünkü "kodlanmamış" değiller — kodlanamazlar. Yine de dürüstçe not edilmeli: içeriden geliştirme yoluna gidilirse (Payload/Next.js'i ürünleştirmek), bu yükümlülüklerin hepsi **ekibin üzerinde** kalır — bir tedarikçiye devredilmiyorsa, RFP'nin bu yarısını da birileri karşılamak zorunda.

---

## 9. Nihai liste — kodla kapatılabilir, hâlâ açık maddeler

Bu, sorunun asıl cevabı: **"kodlanmamış feature'lar neler."** Öncelik sırasıyla:

### Kritik / kolay (tek oturumda kapatılabilir)
1. **CI/CD dal adı hatası** — `.github/workflows/ci.yml`'de `branches: [master]` → `main` yapılmalı. Şu an pipeline muhtemelen hiç çalışmıyor. *(Efor: XS)*
2. **CI'a `cms/` eklenmesi** — pipeline yalnızca kök paketi kontrol ediyor, `cms/`'in lint/typecheck/test/build'i hiç çalışmıyor. *(Efor: S)*
3. **Checker yetki devri (delegation)** — RFP'nin literal cümlesi: "Checker may delegate his/her rights to another user if necessary (e.g while out of office)." Hiç yok. *(Efor: M — bir "vekil" alanı + o kişiye geçici publish yetkisi)*

### Orta öncelik
4. **CSV export/rapor indirmelerinin audit log'a yazılması** — RFP §7.2 açıkça istiyor ("print-out/export kaydı"), 5 export butonumuz var ama hiçbiri loglanmıyor. *(Efor: S — `auditAfterChange` deseninin export butonlarına eklenmesi)*
5. **Rol değişikliğinin özel olarak audit'e yazılması** — şu an genel "update" altında kayboluyor. *(Efor: S)*
6. **Hesap kilitlenme ANININ audit'e yazılması** (açılması zaten loglanıyor, kilitlenmesi loglanmıyor). *(Efor: S)*
7. **Genel Media dosya boyutu limiti** — şu an yalnızca kullanıcı avatarı için 2MB sınırı var, genel medya yüklemesi sınırsız. *(Efor: XS)*

### Düşük öncelik / niş
8. Ayrı masaüstü/mobil URL alanları (§3.2.2) — modern responsive mimaride anlamı tartışmalı.
9. Önizlemede mobil/masaüstü geçiş toggle'ı (şu an tek genişlik).
10. Deeplink alanının BlogPosts/FaqItems/Pages/LegalPages'e de eklenmesi (şu an yalnızca Announcements/FeatureCards/StepCards/Campaigns'te).
11. Başarısız silme/yazma DENEMELERİNİN de audit'e yazılması (şu an yalnız başarılı işlemler).

### Bilinçli olarak açık bırakılan (kullanıcı kararı, teknik eksiklik değil)
- SSO/LDAP gerçek entegrasyonu (§3.1.9)
- Ayrı test CMS ortamı + test→prod promosyon akışı (§3.1.10/11)
- İçerik seviyesinde çok dillilik (§3.2.14) — admin arayüzü çok dilli, içerik değil
- RFP'nin 5 isimli rol taksonomisi yerine mevcut 4 rolün korunması (§3.5.1)
- Meta "keywords" alanı (§3.2.6) — ölü SEO pratiği gerekçesiyle

### Bu deponun kapsamı dışı (gerçek kurumsal altyapı/organizasyon)
- OpenShift, Fortify, SonarQube-CI-gate, Smartcheck, Mend, Twistlock, ArcSight/SIEM-CEF, Zabbix/SNMP/Tivoli monitoring, TMF SID/CIM uyumu, DR/geo-redundancy
- §8-§19'un tamamı (teslimat takvimi, SIT/SAT/UAT resmi süreci, proje yönetimi, İK, iş sürekliliği, eğitim organizasyonu)
- SOX 302/404/902 resmi uyum beyanı (teknik temel kısmen hazır, resmi beyan organizasyonel)

---

## 10. Metodoloji notu — bu analiz nasıl doğrulandı

Her satır aşağıdaki yöntemlerden en az biriyle doğrulandı, tahmin edilmedi:

- **Doğrudan dosya okuma** — 22 collection dosyasının tamamı (`cms/src/collections/*.ts`), `payload.config.ts`, `hooks/*.ts`, `access/roles.ts` satır satır okundu (bu oturumun önceki "CMS Saha Rehberi" görevinden).
- **`grep`/`find` ile kod tabanında arama** — SSO/LDAP, delegation, i18n, livePreview, OG meta, CI branch adı, coverage script'leri gibi spesifik iddialar için.
- **`.github/workflows/ci.yml` doğrudan okundu** — dal adı uyuşmazlığı burada gözle görülerek doğrulandı.

**Doğrulanamayan/eksik bırakılan noktalar** (dürüstlük için not): test coverage'ın gerçek yüzdesi `vitest run --coverage` çalıştırılmadan bilinmiyor; SonarQube/Trivy taramalarının şu anki bulgu sayısı bu analiz kapsamında çalıştırılmadı. (İlk taslakta OG meta'nın site tarafında render edilip edilmediği de "doğrulanamadı" diye işaretlenmişti — ilk `grep` yalnızca `.tsx` dosyalarını taradığı için `src/lib/metadata.ts`'i (bir `.ts` dosyası) kaçırmıştı; ikinci bir aramada bulunup §3'te ✅'ya düzeltildi. Bu, kendi kendine yapılan bir doğrulamanın da yanlış olabileceğinin canlı bir örneği — mümkün olduğunca çift kontrol edilmeye çalışıldı.)
