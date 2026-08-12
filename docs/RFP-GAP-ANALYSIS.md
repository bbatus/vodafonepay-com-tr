# RFP Uyum Analizi — vodafonepaycomtr PoC

**Kaynak:** `02_Technical Annex_RFPset_Cleaner_v10.14_final.docx`
**Değerlendirilen:** Bu repo (kök: Next.js public site, `cms/`: Payload CMS) — commit `05c9559`
**Tarih:** 2026-08-11
**Sorumlu soru:** *Bu PoC'u vodafonepay.com.tr ve CMS'i olarak business ekiplerine devredebilir miyiz?*

---

## 1. Yönetici özeti

**Kısa cevap: Hayır — mevcut haliyle devredilemez.** Ancak PoC amacına ulaşmış durumda: siteyi
klonlamanın ve içeriği bir headless CMS'e taşımanın teknik olarak mümkün olduğunu kanıtladı.
Eksikler "biraz daha çalışma" değil, **mimari ve süreç düzeyinde** eksikler.

RFP'nin **Scope** bölümü projenin varlık sebebini şöyle tanımlıyor:

> *"Vodafone Pay web page content... manage by jira request. Then a web developer makes the demanded
> changes in the code, after that another jira request is created for going live. This flow causes
> loss of time and operational load. With the integration of CMS tool solution, the content
> management flow will be removed from jira flow request."*

**Mevcut PoC bu ana hedefi karşılamıyor.** İçeriğin bir kısmı CMS'ten besleniyor (13 collection),
ama:

- **Yeni sayfa oluşturulamıyor.** RFP §3.3 Lifecycle Management açıkça hub page / landing page /
  campaign page oluşturmayı istiyor. Bizim modelimizde her sayfa `src/app/*/page.tsx` altında elle
  yazılmış bir React bileşeni. Yeni bir kampanya sayfası açmak hâlâ **kod yazmak + deploy** demek —
  yani jira akışı kalkmıyor, sadece bazı metinler için kısalıyor.
- **Maker-checker yok.** RFP bunu iki ayrı yerde zorunlu tutuyor (§3.1 User Role Management ve
  §5.2 Operational Requirements). `cms/src/collections/Users.ts`'te rol alanı tanımlı ama hiçbir
  collection'ın `access` bloğuna bağlanmamış — pratikte "Editör" rolündeki kullanıcı da her şeyi
  silebiliyor.
- **Audit trail yok.** RFP §7.2 Audits 15 maddelik bir liste istiyor (userID, login/logout, IP,
  before/after image, SIEM'e CEF export). Karşılanan: 4 collection'da Payload'ın kendi versiyon
  geçmişi. Bu, SOX / BDDK / ISO 27001 için yeterli değil.
- **SSO (LDAP) yok, test CMS ortamı yok.** İkisi de RFP §3.1'de açık madde.

**Sayısal özet** — yazılımla kapatılabilir 105 değerlendirme satırı (§7.2 Audits'in 17 alt maddesi
dahil):

| Durum | Adet | Oran |
|---|---:|---:|
| ✅ Karşılanıyor | 4 | %4 |
| 🟡 Kısmi / koşullu | 22 | %21 |
| ❌ Yok | 75 | %71 |
| ⬜ Kapsam dışı (altyapı/tedarikçi kararı) | 4 | %4 |

Bu oranın olduğundan kötü göründüğünü not etmek gerek: ❌'lerin büyük bölümü (Fortify, SonarQube,
ArcSight, Zabbix, SNMP, DR, OpenShift) **kurumsal altyapı entegrasyonları** — bunlar hiçbir PoC'ta
zaten bulunmaz. PoC'un kendi kapsamında (§3.1 Content Management + §3.2 SEO + §3.3 Lifecycle)
uyum oranı ise %20 civarında ve asıl bakılması gereken yer burası.

**Karar önerisi:** Devir yerine **iki aşamalı ilerle**. (a) Bölüm 6'daki 9 maddelik minimum listeyi
kapat, sınırlı kapsamda (kampanya + SSS + duyuru) ve staging ortamında **kontrollü pilot** aç.
(b) Paralelde Bölüm 7'deki mimari kararı ver — bu PoC'u ürünleştirmek mi, yoksa PoC'u bir *ister
netleştirme aracı* olarak kullanıp RFP'yi tedarikçiye vermek mi. Bu iki yol farklı efor
büyüklüklerinde ve karar Bölüm 7'de gerekçelendirildi.

---

## 2. Yöntem ve notasyon

RFP'nin 14 ana bölümünden **yazılımla/konfigürasyonla kapatılabilir** olanlar değerlendirildi:
§3 Functional Requirements, §4 Architecture Requirements (Application + Data), §5 Operational
Requirements, §7 Security Requirements. Tedarikçi–sözleşme maddeleri (Project Management, HR,
Change Request, SLA, Support, Training) Bölüm 8'de kısaca ele alındı; bunlar bir kod deposunun
kapatabileceği maddeler değil.

| İşaret | Anlamı |
|---|---|
| ✅ | Karşılanıyor, kanıtı var |
| 🟡 | Kısmen karşılanıyor veya koşula bağlı |
| ❌ | Karşılanmıyor |
| ⬜ | Bu repo'nun kapsamı dışında (altyapı/kurumsal karar) |

Her satırda **Kanıt** kolonu ya bir `dosya:satır` referansı ya da doğrudan gözlem içerir.
Kanıtı olmayan madde raporlanmadı.

---

## 3. §3.1 Content Management

| # | RFP maddesi | Durum | Kanıt / not |
|---|---|:--:|---|
| 3.1.1 | Authorized users should create, edit, delete, publish, unpublish content | 🟡 | CRUD Payload'da hazır. Ancak publish/unpublish ayrımı yalnızca `versions.drafts` açık olan 4 collection'da var: `Campaigns.ts:11`, `BlogPosts.ts:11`, `FaqItems.ts:11`, `Announcements.ts:11`. Kalan 9 collection'da (FeeRows, LimitTables, NavLinks, ProductHeroes, FeatureCards, StepCards, LegalPages, Media, Users) taslak kavramı yok — kaydet = yayınla. |
| 3.1.2 | Different content types (text, image, video, pdf etc) should be supported | ❌ | `cms/src/collections/Media.ts:19` → `mimeTypes: ["image/*"]`. **Video ve PDF yüklenemiyor.** Bu bir yapılandırma detayı değil, gerçek bir işlev boşluğu: canlı anasayfada `.mp4` tanıtım videosu var ve `/sozlesmeler-ve-formlar` sayfasının tamamı PDF dokümanlarına dayanıyor. |
| 3.1.3 | Publish / unpublish scheduling (kampanya sayfası verilen tarihte kendini yayından kaldırsın) | ❌ | `Campaigns.ts` içinde `startDate`/`endDate` alanları tanımlı ama `src/lib/cms.ts:47` sorgusunda hiç kullanılmıyor — süresi dolan kampanya sitede kalmaya devam eder. Zamanlanmış yayın/yayından kaldırma mekanizması (cron/job) hiç yok. |
| 3.1.4 | Image management: tekli + toplu yükleme, image size kabiliyeti | 🟡 | Payload toplu yüklemeyi destekler. Ancak `Media.ts`'te `imageSizes` tanımlı değil → responsive türev üretilmiyor; dosya boyutu limiti yok; focal point yok. Sadece `alt` alanı var. |
| 3.1.5 | Filter feature | ✅ | Payload admin list view'ında alan bazlı filtre yerleşik olarak geliyor. |
| 3.1.6 | Content sorting, ID ile sıralı gösterim | 🟡 | Çoğu collection'da `order` (number) alanı var ve `src/lib/cms.ts` sorguları `sort=order` kullanıyor. Ancak admin'de sürükle-bırak sıralama yok; editör elle sayı giriyor, araya ekleme yapmak zahmetli. |
| 3.1.7 | Each content item should have a deeplink field | ❌ | Yalnızca `Campaigns.ctaUrl` var. Diğer 12 collection'da deeplink alanı yok. Uygulama indirme Adjust deeplink'i de koda gömülü. |
| 3.1.8 | Each content should be able to be set as active or inactive | ❌ | Hiçbir collection'da `isActive` benzeri alan yok. 4 collection'daki draft/publish bunu kısmen karşılıyor ama RFP bunu ayrı bir görünürlük anahtarı olarak istiyor. |
| 3.1.9 | SSO (LDAP) log-in | ❌ | Payload yerel auth (e-posta + parola), `Users.ts:11` → `auth: true`. `Users.ts:24`'teki alan açıklaması bunu zaten kabul ediyor: *"LDAP entegrasyonu ileriki fazda bu alan üzerinden bağlanacak."* |
| 3.1.10 | Test CMS is needed to test new content before publishing on live | ❌ | Tek bir `docker-compose.yml` stack'i var (postgres + minio + cms + app). Test/prod ortam ayrımı, ayrı veritabanı, ayrı URL yok. |
| 3.1.11 | Test CMS, Vodafone Pay test URL'ine bağlı olmalı; onaylanınca aynı değişiklik live'da yapılabilmeli | ❌ | Yukarıdakinin devamı. İçerik promosyon (test→prod) akışı hiç tasarlanmamış. |
| 3.1.12 | Flexible and Extensible Panel: gelecekteki layout değişiklikleri ve özellik eklemeleri | 🟡 | Payload config-as-code — genişletilebilir ama **geliştirici tarafından**. RFP'nin kastı belirsiz; iş birimi kastediliyorsa ❌. |
| 3.1.13 | Robust customizability allowing the addition, removal, or modification of input fields | ❌ | Alan eklemek/çıkarmak `cms/src/collections/*.ts` dosyasını düzenlemek + yeniden deploy demek. Admin UI'dan alan yönetimi yok. Bu, Payload'ın mimari tercihinin doğrudan sonucu. |
| 3.1.14 | User Role Management: maker / checker / maker+checker profilleri | ❌ | `Users.ts:14-22`'de `admin / publisher / editor / viewer` seçenekleri tanımlı, ama **hiçbir collection'ın `access` bloğunda kullanılmıyor.** Tüm collection'larda sadece `read: () => true` var; create/update/delete için Payload'ın "authenticated" default'u geçerli → **giriş yapan herkes her şeyi yapabiliyor.** Maker-checker onay/red akışı, checker'ın yetki devri (izin/görev başı olmadığında) hiç yok. |
| 3.1.15 | An audit trail to track changes made by different users | 🟡→❌ | Payload `versions` yalnızca 4 collection'da kim/ne zaman bilgisini tutuyor. RFP §7.2'nin istediği kapsama (Bölüm 7'deki tabloya bakınız) göre efektif olarak karşılanmıyor. |
| 3.1.16 | Seamless integration with existing systems and databases | ⬜ | VEPAS/VPAY entegrasyonu bu PoC'un kapsamında değildi; değerlendirilemedi. |
| 3.1.17 | API access for external tools (analytics, reporting) | ✅ | Payload REST (`/api/*`) ve GraphQL (`/api/graphql`) endpoint'leri hazır: `cms/src/app/(payload)/api/`. |

---

## 4. §3.2 SEO-Specific Functionalities

Bu bölüm PoC'un en zayıf olduğu alan. RFP'nin Scope'unda SEO ayrı bir gerekçe olarak sayılmış
(*"Current processes do not readily support continuous SEO optimization"*), ama mevcut mimaride
SEO alanlarının neredeyse tamamı koda gömülü.

| # | RFP maddesi | Durum | Kanıt / not |
|---|---|:--:|---|
| 3.2.1 | SEO-friendly URL taxonomy, hiyerarşik ve tutarlı yapı | 🟡 | Site route'ları canlıyla uyumlu ve temiz. Ancak URL'ler dosya sistemine gömülü; CMS'ten yönetilemiyor. `slug` alanı yalnızca `BlogPosts` ve `LegalPages`'te var. |
| 3.2.2 | Editable desktop and mobile URLs (ayrı alanlar) | ❌ | Böyle bir alan yok. |
| 3.2.3 | Editable breadcrumb elements | ❌ | `src/components/Breadcrumb.tsx` sabit bir `current` prop'u alıyor, her sayfada elle yazılmış. CMS'te breadcrumb yönetimi yok. |
| 3.2.4 | SEO text fields — homepage, kategori ve ürün detay sayfaları için ayrılmış metin/görsel alanları | ❌ | Yok. |
| 3.2.5 | Rich text support (temel biçimlendirme + multimedya) | 🟡 | `lexicalEditor()` kurulu (`payload.config.ts`) ama richText yalnızca `BlogPosts.body`'de kullanılıyor. `LegalPages` uzun hukuki metni `intro` (textarea) olarak tutuyor — biçimlendirme yok. |
| 3.2.6 | Meta tags editing: title, description, keywords + önizleme | ❌ | 20 sayfada `export const metadata` **koda gömülü**. CMS'te yalnızca `BlogPosts.seoTitle/seoDescription` var — o da frontend'de kullanılmıyor, çünkü blog detay sayfası yok. Ölü şema. |
| 3.2.7 | Dynamic meta data fields | ❌ | Yok. |
| 3.2.8 | Open Graph configuration (başlık, açıklama, görsel — kanal bazlı) | ❌ | Repoda hiçbir sayfada OG/Twitter meta yok. Canlı sitede her sayfada `og:title`, `og:description`, `og:image`, `twitter:card` var. Hem parity hem RFP boşluğu. |
| 3.2.9 | Content versioning: rollback ve version history | 🟡 | 4 collection'da var, 9'unda yok (bkz. 3.1.1). Ücret ve limit tabloları gibi **finansal/yasal** içerikte rollback olmaması ayrıca riskli. |
| 3.2.10 | SEO auditing and reporting — analitik araç entegrasyonu | ❌ | Yok. Sitede analytics/GTM entegrasyonu da yok. |
| 3.2.11 | Multi-channel publishing (desktop, mobile, 3rd-party) | ❌ | Tek kanal (web). API üzerinden teknik olarak mümkün ama tasarlanmamış. |
| 3.2.12 | Preview feature — mobil ve masaüstü görünüm önizlemesi | ❌ | `payload.config.ts`'te `admin.livePreview` / `admin.preview` konfigürasyonu yok. Editör yayınlamadan sonucu göremiyor. |
| 3.2.13 | Drag and drop web page design | ❌ | **Mimari boşluk.** Payload'ın Blocks / layout builder özelliği hiç kullanılmamış; 13 collection sabit şemalı veri tablosu olarak tasarlanmış. Mevcut yaklaşım sayfa *tasarlamaya* değil, var olan sayfaların *alanlarını doldurmaya* izin veriyor. |
| 3.2.14 | Localization support — çok dilli içerik ve sayfa oluşturma | ❌ | `payload.config.ts`'te `localization` bloğu yok; site tarafında i18n yok. Tek dil (TR). |
| 3.2.15 | Database management — Oracle/MongoDB/PostgreSQL/Couchbase üzerinde yetkili CRUD | ⬜ | Bu madde bir CMS isterinden çok genel bir veritabanı yönetim aracı isteri gibi duruyor. Kapsam netleştirilmeli; mevcut PoC yalnızca kendi PostgreSQL şemasını yönetiyor. |

---

## 5. §3.3 Lifecycle Management ve §3.5 Admin Screen

### 5.1 Lifecycle Management — **en kritik boşluk**

| # | RFP maddesi | Durum | Kanıt / not |
|---|---|:--:|---|
| 3.3.1 | Yeni içerik sayfalarının oluşturulması (Hub page, landing page, campaign page) bu platform üzerinden yönetilecek | ❌ | Mevcut mimaride sayfa oluşturmak `src/app/<slug>/page.tsx` yazmak demek. CMS'te "Page" collection'ı yok, blok tabanlı sayfa kurgusu yok. **RFP'nin varlık sebebi olan madde karşılanmıyor.** |
| 3.3.2 | Yetkili kullanıcılar HTML kodlamak yerine aracı kullanarak sayfa oluşturup yayınlayabilmeli | ❌ | Yukarıdakinin doğrudan sonucu. |
| 3.3.3 | Kolay kullanımlı drag-and-drop, code view ve sektör standardı araçlar; hem teknik hem teknik olmayan kullanıcılar için | ❌ | Hiçbiri yok. |

Bu üç maddenin sonucu: **iş birimi bugün yeni bir kampanya landing page'i açmak istediğinde hâlâ
jira + geliştirici + deploy zincirine ihtiyaç duyuyor.** PoC, mevcut sayfaların *içeriğini*
güncellenebilir hale getirdi; *sayfa üretimini* değil.

### 5.2 Admin Screen

| # | RFP maddesi | Durum | Kanıt / not |
|---|---|:--:|---|
| 3.5.1 | 5 admin rolü: Content Provider, Content Admin, Report Admin, Full Admin, CC Admin | ❌ | 4 farklı rol tanımlı (`admin/publisher/editor/viewer`), isimler eşleşmiyor ve hiçbiri yetkilendirmeye bağlı değil (bkz. 3.1.14). |
| 3.5.2 | Content Provider: içerik kullanım raporlarını görme, içerik yükleme, metadata düzenleme, SMS keyword tanımlama | ❌ | Rapor ekranı yok, SMS keyword kavramı yok. |
| 3.5.3 | Content Admin: kanal bazlı raporlar, içerik/metadata onaylama, top10 liste yönetimi | ❌ | Onay akışı ve raporlama yok. |
| 3.5.4 | Report Admin: tüm raporları görüntüleme | ❌ | Raporlama modülü yok. |
| 3.5.5 | CC Admin: CC agent aktivite loglarını görme | ❌ | Yok; CC entegrasyonu kapsam dışıydı. |
| 3.5.6 | Full Admin: yeni admin kullanıcı oluşturma + tüm aktivite loglarını görme | 🟡 | Kullanıcı oluşturma var (`Users` collection). Aktivite logu görüntüleme yok. |
| 3.5.7 | **All Admin interfaces shall be in Turkish** | 🟡 | Collection `group` ve `label` değerleri Türkçe girilmiş (ör. `group: "İçerik"`). Ancak `payload.config.ts`'te `i18n` ayarı yok → Payload'ın kendi arayüzü (menüler, butonlar, doğrulama mesajları, tarih formatları) İngilizce. **Kapatması en kolay maddelerden biri.** |

---

## 6. §5 Operational ve §7 Security Requirements

### 6.1 Operational

| RFP maddesi | Durum | Kanıt / not |
|---|:--:|---|
| Süreçler BDDK / MASAK / TCMB / BTK ile uyumlu olmalı | ❌ | Uyum için gereken temel (audit log, maker-checker, yetki ayrımı) mevcut değil. |
| System shall support maker-checker principal | ❌ | Bkz. 3.1.14. RFP'de ikinci kez tekrarlanan madde — ağırlığı yüksek. |
| Infra layer must have OpenShift | ❌ | Yalnızca `docker-compose.yml`. K8s/OpenShift manifest'i, Helm chart'ı, `yaml` deployment dosyası yok. |
| Database must be Oracle/PostgreSQL | ✅ | `@payloadcms/db-postgres` + PostgreSQL 16 (`docker-compose.yml`). |
| Code base is preferred based on Java | 🟡 | TypeScript/Node.js. RFP "preferred" diyor, zorunlu değil — ama tedarikçi değerlendirmesinde puan kaybı olabilir, karar noktası olarak not edilmeli. |
| Code repo Git tabanlı (Bitbucket/GitHub Enterprise) | ✅ | Git; GitHub. |
| OpenShift servisleri autoscale ve self-healing | ❌ | Yok. |
| Yaml dosyaları Vodafone operasyon ekibine teslim edilmeli | ❌ | Üretilmemiş. |
| CI/CD pipeline (Jenkins/GitHub Actions), deploy'a hazır | 🟡→❌ | `.github/workflows/ci.yml` var (lint + typecheck + build) ama **iki kritik kusuru var:** (1) `on.push.branches: [master]` — reponun default branch'i `main`, yani **pipeline hiç çalışmıyor**; (2) yalnızca kök uygulamayı kontrol ediyor, `cms/` hiç lint/typecheck/build edilmiyor. Deploy adımı da yok. |
| Pipeline test quality, code quality ve security check kapsamalı | ❌ | Hiçbiri yok. |
| Fortify taraması, critical/high bulgu olmamalı | ❌ | Entegre değil. |
| SonarQube: blocker/critical/major/security hotspot olmamalı | ❌ | Entegre değil. Bir worktree'de (`.claude/worktrees/selam-login-disable-temp-725fb7/tools/sonarqube/`) başlangıç yapılmış ama `main`'e girmemiş. |
| **SonarQube Coverage > %90, Duplicated Lines %0** | ❌ | **Repoda hiç test yok** — test framework'ü dahi kurulu değil. Mevcut coverage %0. Bu tek başına en büyük efor kalemlerinden biri. |
| Smartcheck / Mend / Twistlock | ❌ | Yok. |
| Bulgu varsa pipeline kırılmalı | ❌ | Kalite kapıları yok. |
| Egress/ingress portları Container Native Firewall için tanımlanmalı | ❌ | Yok. |
| Service account parolaları OpenShift secret'larda saklanmalı | ❌ | `.env` dosyası kullanılıyor. `.env.example`'da `PAYLOAD_SECRET=dev-payload-secret-change-me` gibi default'lar var ve `payload.config.ts` → `secret: process.env.PAYLOAD_SECRET \|\| ""` — **boş secret ile boot edebilir.** |
| Görsel/video saklama formatı belirtilmeli, denetim için şifrelenmeli | ❌ | MinIO/S3'te şifreleme konfigürasyonu yok; `Media` collection'ının `read` erişimi `() => true` (herkese açık). |
| Değişiklikler audit log aracında (ArcSight, ELK) saklanmalı | ❌ | Log gönderimi yok. |
| DR konfigürasyonu sağlanmalı | ❌ | Yok. |
| Alarm/bildirim (Zabbix, log, e-posta, SMS) | ❌ | Yok. |
| Monitoring: TDR, SNMP v2, Tivoli/Zabbix entegrasyonu, web tabanlı izleme aracı | ❌ | Yok. Uygulamada health endpoint'i bile yok (docker-compose healthcheck'i `node fetch` ile ana sayfayı çekiyor). |
| Web tabanlı yönetim & konfigürasyon aracı; tüm konfigürasyon değişiklikleri buradan yapılmalı | 🟡 | Payload admin paneli bunu içerik için karşılıyor. Sistem konfigürasyonu (env, secret, feature flag) hâlâ dosya/deploy üzerinden. |

### 6.2 Security — §7.2 Audits

RFP 15 alt madde sayıyor. Mevcut durum: **Payload'ın 4 collection'daki versiyon geçmişi dışında
hiçbiri karşılanmıyor.**

| Talep | Durum |
|---|:--:|
| Tüm kullanıcı aksiyonlarının kaydı, ISO 27001 uyumu | ❌ |
| userID kaydı | 🟡 (yalnızca versiyonlanan 4 collection'da) |
| Olay tarih/saati | 🟡 (aynı) |
| Başarılı/başarısız tüm login-logout kayıtları | ❌ |
| Bilinmeyen userID/workstation'dan login denemeleri | ❌ |
| Erişilen dosyalar / kullanılan programlar | ❌ |
| Değişen verinin before/after image'ı | 🟡 (versiyon diff'i kısmen; 9 collection'da hiç yok) |
| Privileged (admin/superuser) işlemlerin kaydı | ❌ |
| Erişim hakkı değişikliklerinin kaydı | ❌ |
| Rapor/veri export ve print-out kaydı | ❌ |
| Silme/yazma/ekleme denemeleri, sınıflandırma etiketi değişiklikleri | ❌ |
| Seçili işlemlerin takibi | ❌ |
| userID kilitlenmeleri | ❌ |
| Audit log konfigürasyon değişiklikleri | ❌ |
| Uzak oturum aksiyonları | ❌ |
| **SIEM'e CEF formatında export** | ❌ |
| userID karşılaştırma tabloları | ❌ |

### 6.3 Security — Authorization / Software Security / Access Security

| RFP maddesi | Durum | Kanıt / not |
|---|:--:|---|
| Role/profile based authorization | ❌ | Rol alanı var, enforcement yok (3.1.14). |
| Need-to-know / segregation of duty based authorization | ❌ | Görev ayrımı uygulanmıyor. |
| Her deploy'da Fortify raporu yayınlanmalı, critical/high olmamalı | ❌ | Fortify entegrasyonu yok. |
| Veri saklama yöntemleri bilgi güvenliği birimiyle paylaşılmalı | ❌ | Dokümante edilmemiş. |
| İç/dış veritabanı iletişimi HTTPS olmalı | 🟡 | Lokal Docker ağı, TLS yok. Prod konfigürasyonu tasarlanmamış. |
| Sunucu OS'leri Vodafone MSB ile taranmalı | ⬜ | Altyapı; repo kapsamı dışı. |

### 6.4 §4 Application & Data Architecture — seçili maddeler

| RFP maddesi | Durum | Kanıt / not |
|---|:--:|---|
| Layered architecture, katmanlar arası bağımlılık minimizasyonu | 🟡 | Site ve CMS ayrı servisler — iyi. Ancak site tarafında sayfa bileşenleri veri erişimi + sunum + fallback içeriği aynı dosyada karışık. |
| SOA / mikroservis / cloud-native / containerization | 🟡 | İki container'lı yapı var; OpenShift/K8s yok. |
| Well-defined service interactions (REST + kapsamlı dokümantasyon) | 🟡 | REST var, API dokümantasyonu yok. |
| Centralized error tracking — tüm hatalar tek noktadan izlenebilmeli | ❌ | `src/lib/cms.ts:38` → `catch { return null }` — **hata sessizce yutuluyor**, loglanmıyor. CMS erişilemezse site hardcoded fallback içeriği gösterip devam ediyor ve kimse fark etmiyor. |
| Configurable error messages | ❌ | Hata mesajları kodda sabit. |
| Auditable data changes — kullanıcı, zaman damgası, IP; arayüzden erişilebilir | ❌ | IP kaydı yok, arayüzden audit erişimi yok. |
| UI-accessible configuration — tüm konfigürasyon öğeleri arayüzden düzenlenebilmeli | ❌ | Env dosyası + kod. |
| Parametric validations — yeni doğrulama/kontroller scripting gerektirmemeli | ❌ | Doğrulama kodda. |
| API management + API security | ❌ | API gateway, rate limiting, token yönetimi yok. `/api/revalidate` yalnızca paylaşılan bir secret header ile korunuyor (`src/app/api/revalidate/route.ts:6`) — rate limit yok. |
| Event-driven architecture desteği | 🟡 | Yalnızca CMS→site revalidate webhook'u var (`cms/src/hooks/revalidate.ts`), best-effort, retry yok, hata sadece console'a yazılıyor. |
| Container orchestration (Kubernetes) | ❌ | Yok. |
| DevOps: CI, CD, otomatik test | 🟡→❌ | Bkz. 6.1. |
| Monitoring and logging | ❌ | Yok. |
| Data lifecycle: arşivleme, yedekleme, silme | ❌ | Yedekleme stratejisi yok; Postgres ve MinIO yalnızca Docker volume'da. |
| Data classification / ownership / CRUD matrisi | ❌ | Tanımlanmamış. |
| Data lineage tracking | ❌ | Yok. |
| Common Information Model (TMF SID) uyumu | ⬜ | İçerik yönetimi domaininde uygulanabilirliği tedarikçiyle netleştirilmeli. |

---

## 7. Kritik değerlendirme: iki farklı yol var

Yukarıdaki tablolar tek tek kapatılabilir maddeler gibi görünüyor, ama üç tanesi diğerlerinden
farklı — **bunlar mevcut PoC'un mimari tercihinin sonucu, ek çalışmayla değil ancak yeniden
tasarımla kapanır:**

1. **Sayfa üretimi (§3.3 + §3.2.13).** Bugünkü model "her sayfa bir React dosyası, CMS alanları
   doldurur". RFP'nin istediği model "editör blokları sürükleyip yeni sayfa kurar". İkincisine
   geçmek `Page` collection'ı + Payload Blocks + dinamik `[...slug]` route + blok→bileşen eşleme
   katmanı demek — yani sitenin **yeniden yapılandırılması**. Mevcut 21 sayfanın hepsi bu modele
   taşınmalı.
2. **Maker-checker + audit (§3.1.14, §3.1.15, §7.2).** Bunlar Payload'ın üzerine yazılabilir
   (access control fonksiyonları, `afterChange` hook'larıyla audit collection'ı, onay durumu alanı)
   ama düzenleyici uyum gerektiren bir alanda "kendi yazdığımız audit" ile ilerlemek hukuk ve bilgi
   güvenliği onayı ister. Teknik karar değil, kurumsal karar.
3. **Test coverage %90 (§5.2).** Repoda şu an sıfır test var. Bu eşiği tutturmak, mevcut kodun
   test edilebilir hale getirilmesi dahil, projenin en büyük tek efor kalemi olabilir.

Buradan iki yol çıkıyor:

**Yol A — PoC'u ürünleştir.** Yukarıdaki üçünü de içeriden çöz. Avantajı: kontrol bizde, teknoloji
seçimi (Payload/Next.js) modern ve hızlı. Dezavantajı: RFP'nin operasyonel/güvenlik maddeleri
(OpenShift, Fortify, SonarQube, ArcSight, DR, monitoring, SLA, 7/24 destek) bir ürün ekibi
gerektiriyor; bunlar kod yazarak kapanmıyor.

**Yol B — PoC'u ister netleştirme aracı olarak kullan.** Elimizdeki çalışan site + CMS, RFP'ye
tedarikçi teklifi değerlendirirken somut bir kıyas noktası. "Bizim istediğimiz şey tam olarak bu,
artı şu 45 madde" diyebilmek, RFP'yi soyut bir doküman olmaktan çıkarır. Bu raporun kendisi o
konuşmanın girdisi olabilir.

**Öneri:** Bu bir bütçe ve organizasyon kararı, tek başına teknik bir karar değil — dolayısıyla
kararı bu rapor vermemeli. Ancak şu söylenebilir: **Bölüm 8'deki minimum liste (9 madde) her iki
yolda da değerli.** Yol A'da ilk sprint, Yol B'de tedarikçiye "kabul kriteri" olarak verilecek
somut örnek. O yüzden karar beklenmeden başlanabilir.

---

## 8. Kontrollü pilot için minimum şart listesi

*Hedef: sınırlı kapsamda (kampanya + SSS + duyuru), staging ortamında, 2-3 kişilik bir iş birimi
ekibiyle gerçek kullanım denemesi. Production devri değil.*

| # | Madde | Neden pilot için zorunlu | RFP ref | Efor |
|---|---|---|---|:--:|
| P0-1 | **Rol bazlı access control'ü gerçekten bağla** — `Users.role` alanını her collection'ın `access.create/update/delete` fonksiyonlarına ilet; `viewer` salt-okur, `editor` taslak oluşturur, `publisher` yayınlar, `admin` her şeyi yapar. | Şu an giriş yapan herkes her şeyi silebiliyor. Bir iş birimi kullanıcısına hesap açmak bu haliyle sorumsuzluk olur. | §3.1.14, §7.4 | M |
| P0-2 | **Maker-checker akışı** — `editor` yayınlayamasın, `publisher` onaylasın/reddetsin; red gerekçesi alanı. | RFP'de iki kez zorunlu tutulan madde; iş biriminin ilk soracağı şey. | §3.1.14, §5.2 | M |
| P0-3 | **Audit collection'ı** — `afterChange`/`afterDelete`/`afterLogin` hook'larıyla kullanıcı, aksiyon, collection, kayıt ID, zaman, IP, before/after özeti. Admin'de salt-okunur liste. | Pilotta bile "kim neyi değiştirdi" sorusunun cevabı olmalı. Tam SIEM entegrasyonu pilot için gerekmez. | §3.1.15, §7.2 | M |
| P0-4 | **Kalan 9 collection'a `versions.drafts` ekle** — özellikle FeeRows, LimitTables, LegalPages. | Ücret/limit/hukuki metinde yanlış kayıt geri alınamıyor. Tek satırlık konfigürasyon, riski yüksek. | §3.1.1, §3.2.9 | S |
| P0-5 | **Media'da video + PDF desteği** — `mimeTypes`'ı genişlet, boyut limiti ve `imageSizes` ekle. | Anasayfa videosu ve sözleşme PDF'leri olmadan içerik yönetimi eksik kalıyor. | §3.1.2, §3.1.4 | S |
| P0-6 | **Zamanlanmış yayın/kaldırma** — `startDate`/`endDate`'i `src/lib/cms.ts` sorgularına uygula. | Süresi dolmuş kampanya sitede kalıyor; iş birimi bunu ilk günde fark eder. | §3.1.3 | S |
| P0-7 | **Preview** — Payload `admin.livePreview` ile taslak içeriğin site görünümü (mobil + masaüstü). | Editör yayınlamadan sonucu göremezse pilot güven kazanmaz. | §3.2.12 | M |
| P0-8 | **Admin panelini Türkçeleştir** — `payload.config.ts`'e `i18n: { fallbackLanguage: 'tr', supportedLanguages: { tr } }`. | RFP'de açık madde, ve iş birimi kullanıcısı için pratikte kritik. Efor çok düşük. | §3.5.7 | XS |
| P0-9 | **Fail-loud + CI'ı düzelt** — `src/lib/cms.ts`'teki sessiz `catch`'i loglayıp uyarıya çevir; `ci.yml`'de `master` → `main` düzeltmesi ve `cms/` için lint/typecheck/build adımı. | CMS düştüğünde site sessizce eski içeriği gösteriyor — pilotta bu, iş biriminin "değişikliğim niye yansımadı" şikayetine dönüşür. CI ise şu an hiç çalışmıyor. | §4.3, §5.2 | S |

**Pilotta bilinçli olarak kapsam dışı bırakılanlar** (ve iş birimine önceden söylenmesi gerekenler):
SSO/LDAP (P0 sonrası), ayrı test CMS ortamı, drag-and-drop sayfa oluşturma, yeni sayfa üretimi,
SEO meta yönetimi, çok dillilik, raporlama ekranları. Pilot **var olan sayfaların içeriğini
güncelleme** kapsamındadır — bunun net söylenmesi beklenti yönetimi açısından şart.

---

## 9. Kapsam dışı bıraktıklarım

Dürüst olmak gerekirse şunlara bakmadım veya bakamadım, ve bunlar raporun güvenilirlik sınırıdır:

- **§9 Acceptance, §10 Support, §11 Project Management, §12 Change Request, §13 HR, §14 BCP,
  §15-17 AD/AM/SLA, §18 Training** — bunlar tedarikçi–müşteri sözleşme maddeleri. Bir kod deposu
  bunları karşılayamaz; organizasyonel taahhüt gerektirir. Yine de not: bu bölümler RFP'nin
  yaklaşık yarısını oluşturuyor ve içeriden geliştirme yolunda (Yol A) bu yükümlülüklerin **bizim
  üzerimizde** kalacağı unutulmamalı.
- **§4 Architecture'ın kurumsal maddeleri** (CIM/TMF SID uyumu, eTOM, convergence, partner
  ecosystem) — bunların içerik yönetimi domainine nasıl uygulanacağı RFP'de net değil; Vodafone
  mimari ekibiyle netleştirilmeli.
- **VEPAS/VPAY entegrasyonu** (§3.4 Domains & Applications Affected) — PoC'ta hiç ele alınmadı,
  entegrasyon yüzeyi bilinmiyor.
- **Ekli dosyalarla gelen NFR ve Security NFR listeleri** — RFP §5.1 ve §7.1 "Supplier is fully
  compliant with the requirements at the file attached" diyor; o ekler elimde yok. **Bu iki
  bölümdeki madde sayısı bilinmiyor ve yukarıdaki %59 oranını değiştirebilir.**
- **Performans/yük testi** — hiç yapılmadı. RFP performans KPI'ları ve TPS bekliyor; mevcut sistemin
  kapasitesi ölçülmedi.
- **Erişilebilirlik (a11y)** — RFP §3.2 "Accessibility: The platform should meet accessibility
  standards" diyor. Ne sitede ne admin panelinde a11y denetimi yapılmadı.

---

## 10. İlgili dokümanlar

- `docs/CONTENT-CMS-AUDIT-PROMPT.md` — canlı site parity ve CMS kapsama denetimi için Claude Code prompt'u
- `docs/PRODUCTION_READINESS_PROMPT.md` — teknik borç ve production hazırlık analizi
- `docs/CMS_INTEGRATION_PLAN.md` — CMS seçim gerekçesi ve entegrasyon planı (Strapi önerilmişti, Payload ile ilerlenmiş)

> **Not:** `CMS_INTEGRATION_PLAN.md` Strapi öneriyor ama implementasyon Payload ile yapılmış. Bu
> sapmanın gerekçesi hiçbir yerde yazılı değil. RFP değerlendirmesinde "neden bu teknoloji" sorusu
> gelecektir; kararın gerekçesi dokümante edilmeli.
