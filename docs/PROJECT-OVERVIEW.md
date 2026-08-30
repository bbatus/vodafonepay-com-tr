# Proje Rehberi — Baştan Sona

**Amaç:** Bu dosya, projeye hiç bakmamış birinin (ya da yeni bir Claude Code oturumunun) 10 dakikada "bu proje ne, ne var, ne yok, neden böyle yapıldı, nasıl çalışır" sorularının cevabını bulabileceği tek referans olsun diye yazıldı. Güncel, satır-satır iş takibi için `tasks.md`'ye (repo kökü) bakın — bu iki dosya birbirini tamamlar: bu dosya **mimariyi ve "neden"leri**, `tasks.md` **kimin ne zaman ne istediğini ve ne yapıldığını** anlatır.

_Son güncelleme: 30.08.2026. Bu dosyanın önceki hali (25.08'den kalma) ciddi ölçüde bayatlamıştı — artık var olmayan 3 koleksiyonu ("ProductHeroes/FeatureCards/StepCards") hâlâ listeliyor, rol modelini eski/basitleştirilmiş haliyle anlatıyor, test sayılarını 3 hafta önceki değerlerinde bırakmıştı. Bu, bu dosyanın kendisinin de zamanla bayatlayabileceğinin kanıtı — güvenilir kalması için periyodik olarak koda karşı yeniden doğrulanması gerekiyor, tek seferlik bir yazım değil. Geçmiş oturum raporlarının tam arşivi: `docs/HISTORY.md`._

Okuma sırası önerisi: önce bu dosya (mimariyi anla) → sonra `tasks.md` (güncel/açık işleri anla) → gerekirse §12'deki detay dosyalarına in.

---

## 1. Bu proje ne?

**Vodafone Pay'in (vodafonepay.com.tr) reverse-engineer edilmiş, CMS'e bağlı bir klonu.** Orijinal site tersine mühendislikle pixel-perfect kopyalanmış, ardından neredeyse tüm içeriği (metin, görsel, kampanya, blog, SSS, ücret tabloları vb.) hardcoded olmaktan çıkarılıp gerçek bir headless CMS'e taşınmış — böylece bir geliştirici olmadan, iş birimleri içeriği kendileri yönetebiliyor. RFP'nin karşılığı olarak inşa edildi (§2).

**PoC bağlamı:** Bu proje şu an bir kanıt-of-concept (PoC) sunumuna hazırlanıyor. Mühendislik tarafı (RBAC, audit trail, test kapsamı — §7, §9) PoC beklentisinin fazlasıyla üstünde; ürün/görsel tarafında (çok dillilik, performans cilası, gözlemlenebilirlik) bilinçli/geçici boşluklar var — bkz. §11.

İki ayrı, birbirinden bağımsız proje tek repo'da yaşıyor:

```
vodafonepaycomtr/     ← Next.js 16 pazarlama sitesi (App Router, React 19, TS strict)
cms/                  ← Payload CMS 3.87 admin paneli (ayrı Docker container)
docs/                 ← Dokümantasyon (bu dosya, RFP eşleşmesi, runbook'lar, arşiv)
scripts/              ← Sonar/Trivy tarama, cache warm-up, asset indirme, tek seferlik veri script'leri
docker-compose.yml    ← Tüm stack'i (site+cms+postgres+minio) ayağa kaldırır
```

`vodafonepaycomtr/` ve `cms/` npm workspace değil — her birinin kendi `package.json`/`node_modules`/lockfile'ı var, her `npm run <script>` ilgili klasörün İÇİNDEN çalıştırılmalı.

## 2. Neden var — arka plan

Bu, Vodafone Pay için hazırlanmış bir RFP'nin (teklif isteme dokümanı) karşılığı olarak inşa edildi. RFP; draft/publish akışı, maker-checker onay süreci, versiyon geçmişi, audit log, rol bazlı erişim, zamanlanmış yayın, canlı önizleme gibi kurumsal bir CMS'in beklenen tüm özelliklerini talep ediyordu. `docs/RFP-OPEN-ITEMS.md` RFP'nin her maddesinin bu repodaki karşılığını ✅/🟡/❌/⬜ ile işaretliyor; `docs/RFP-GAP-ANALYSIS-2026-08-24.md` en güncel satır-satır uyum analizi.

## 3. Tech stack

| Katman | Ne kullanılıyor | Neden |
|---|---|---|
| Site framework | Next.js 16, App Router, Turbopack | SSR/ISR, sunucu bileşenleri |
| Site UI | shadcn/ui (Radix), Tailwind v4 | Hızlı, erişilebilir, tema token'lı |
| CMS | Payload CMS 3.87 (Postgres adapter) | Headless, TypeScript-native, self-hosted (3. parti SaaS bağımlılığı yok) |
| DB | Postgres 16 | Payload'ın resmi desteklediği adapter |
| Dosya depolama | MinIO (S3-uyumlu) | Docker'da self-hosted S3 — prod'da gerçek S3'e taşınabilir |
| Zengin metin | `@payloadcms/richtext-lexical` | Payload'ın kendi editörü |
| Deployment | Docker Compose (4 servis: app, cms, postgres, minio) | Tek komutla ayağa kalkan, taşınabilir stack. **Prod planı: OpenShift'e taşınma — gözlemlenebilirlik (Sentry/APM) o adıma bırakıldı, bkz. §11.** |

## 4. Nasıl çalıştırılır

```bash
docker compose -p vodafonepaycomtr up -d --build app cms
```

Bu, `postgres` ve `minio`'yu da bağımlılık olarak otomatik ayağa kaldırır (`depends_on: condition: service_healthy`).

- Site: http://localhost:3000
- CMS admin: http://localhost:3010/admin
- MinIO console: http://localhost:9001

`docker-compose.yml`'de ayrıca bir `dev` servisi var (hot-reload, port 3001) — bu makinede host-seviyesi bir Docker Desktop dosya-paylaşım izin hatasıyla başlamıyor (bilinen, kod dışı bir sorun). Ana stack'i etkilemiyor, `up -d app cms` ile dev servisini atlayabilirsiniz.

Test kullanıcıları: `docs/TEST-USERS.MD` (4 rol + admin, e-posta/şifre — asla commit edilmez, sadece bu repo'nun kendi kopyasında durur).

## 5. Rol modeli (RBAC) — gerçek AccessPoint eşlemesi

Gerçek AccessPoint rol matrisi 4 satır tanımlıyor; bunlardan 3'ü CMS'e taşındı (4.'sü, geliştirici/kod erişimi rolü, bilinçli olarak "biz" olarak bırakıldı):

| AccessPoint/LDAP grubu | CMS rolü (`cms/src/access/roles.ts` → `ROLES`) | Yetki |
|---|---|---|
| `RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW` | `new_vertical_checker` | Her koleksiyonu görüntüler/onaylar/yayınlar, yeni kayıt oluşturamaz |
| `ROLE_VODAFONEPAY_CMS_MAKER_RW` | `growth_maker` | Her koleksiyonda taslak oluşturur/düzenler, **yayınlayamaz, yayındaki bir kayda dokunamaz** |
| `ROLE_VODAFONEPAY_CMS_CHECKER_RO` | `growth_checker` | Her koleksiyonu onaylar/yayınlar, **hiçbir yerde create yapamaz** |
| `RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW` | `new_vertical_maker` | Tam CRUD + publish + kullanıcı/audit/çeviri yönetimi — "biz" (geliştirici) rolü, `admin@vodafonepay.local` |

Growth'un (Maker/Checker) kapsamı başlangıçta sadece Campaigns'ti; 28.08.2026'da New Vertical ile **birebir aynı içerik kapsamına** genişletildi (19 koleksiyonun 14'ü + Media). `Users`/`AuditLogs`/`Translations`/`ContactInfo` Growth'a hiç açılmıyor.

**Segregation-of-duties, iki genel hook ile 14 koleksiyonun tamamında aynı şekilde işliyor** (Campaigns hariç, o kendi zengin sistemini koruyor — aşağıda):
- `standardCreate`/`standardReadWrite`/`standardDelete` — New Vertical ile Growth'u aynı çatı altında birleştiren paylaşılan erişim fonksiyonları.
- `denyMakerPublish` — Growth Maker taslağı yayınlayamaz.
- `denyMakerEditPublished` — Growth Maker yayındaki bir kayda hiç dokunamaz (önce bir Checker'ın yayından kaldırması gerekir).

**Campaigns kendi zengin onay döngüsünü koruyor** (`reviewStatus` pending/rejected, `rejectionReason`, `unpublishRequest`, acil-düzeltme `forceLiveEdit`) — bu, diğer koleksiyonlara bilinçli olarak genelleştirilmedi (kapsam/karmaşıklık kararı, `tasks.md` madde 28).

**Onay kuyruğu dashboard'ları — 29.08.2026'da genelleştirildi.** Checker'ın "Onayınızı Bekleyen İçerikler" ve Maker'ın "Onaya Gönderdikleriniz" widget'ları eskiden sadece Campaigns'i sorguluyordu (kapsam Campaigns-only'yken yazılmıştı, kapsam genişleyince kimse geri dönüp bakmamıştı). `cms/src/lib/approvalQueue.ts` artık rolün kapsamındaki **her** taslak-etkin koleksiyonu tarıyor — Checker tüm Maker'lardan gelen her şeyi, Maker kendi gönderdiği her şeyi (reddedilenler dahil) görüyor.

Gerçek LDAP/AccessPoint bağlantısı henüz kurulmadı (kullanıcı kararı — "şimdilik sadece rol simülasyonu", test kullanıcıları elle role atanmış). `cms/src/access/roleMapping.ts` gerçek AD grup adlarını yukarıdaki rollere çevirecek eşleme katmanı; LDAP bağlandığında sadece bu dosyanın auth stratejisine bağlanması yeterli olacak şekilde tasarlandı.

**Kullanıcı hesapları tamamen LDAP/AccessPoint'in olacak şekilde kilitlendi** — CMS içinden email/username/rol/parola değiştirilemez (`cms/src/collections/Users.ts`). Tek self-servis alanlar: avatar, dil tercihi (`preferredLocale`), checker delegasyonu (`delegateTo`). Auth: 5 başarısız denemede 15dk kilit, token 12 saatte düşüyor; CAPTCHA/2FA yok (LDAP'ın kendi kimlik doğrulamasının üstleneceği varsayılıyor).

**Erişim Matrisi** (`/admin/access-matrix`, rol × koleksiyon tam yetki tablosu) sadece New Vertical Maker'a görünüyor (`nvMakerOnly: true`, `payload.config.ts`) — kaybolmadı, kaldırılmadı, sadece scope'u bu. Bunu Checker'lara da açmak bir görünürlük kararı, henüz alınmadı.

## 6. CMS koleksiyonları — ne var, ne işe yarıyor (19 koleksiyon + 1 global)

Grup başlıkları admin sidebar'daki gruplamayla aynı.

### İçerik Yönetimi
| Koleksiyon | Ne tutar | Dikkat edilecek |
|---|---|---|
| **Campaigns** | Kampanyalar | Kendi zengin onay döngüsü (§5). `campaignStatus` alanı Payload'ın kendi `_status`'üyle Postgres enum çakışmasın diye özellikle bu adı aldı. |
| **Pages** | Blok sürükle-bırak ile oluşturulan sayfalar — anasayfa dahil, 5 ürün sayfasının tamamı burada (§8) | `[...slug]` catch-all route'tan render edilir. 16 blok tipi (hero, richText, faqList, campaignGrid, video, logoGrid, iconCards, steps, imageTextSlides, videoList, howToEarn, imageWithText, pricesAndLimits, blogGrid, featureHighlights, profileGrid). |
| **BlogPosts** | Blog yazıları | `coverImage`+`body` zorunlu, kategori `blog` scope'undan seçilir |
| **FaqItems** | SSS soruları | `showOnHomepage`/kategori scope'u ile Pages'in `faqList` bloğuna da düşebilir |
| **Categories** | Kampanya/Blog/SSS için ortak, business-editable kategori listesi | `scope` alanı (`campaign`/`blog`/`faq`) üç akışın picker'larını ayırır; taslak/onay akışı var (28.08'de eklendi) |
| **Representatives** | Temsilcilikler | Herkese açık okuma; taslak/onay akışı var |
| **Announcements** | Duyurular | `/duyurular` sayfası |
| **FeeRows** / **LimitTables** | `/ucretler-ve-limitler` sayfasının tabloları | `admin.hidden: true` — özel bir ekrandan (`/admin/fees-and-limits`) yönetiliyor, kendi koleksiyon route'u 404 verir (bilinçli) |

### Site Yapısı
| Koleksiyon | Ne tutar |
|---|---|
| **NavLinks** | Header/footer menü linkleri (`section`: `header-main`, `header-products`, `footer-kurumsal`, `footer-yasal`) — **4 bölümün tamamı 29.08'de CMS'ten besleniyor hale geldi**, `Header.tsx`/`Footer.tsx`'teki hardcoded diziler artık ölü kod (güvenlik ağı olarak bilinçli tutuluyor, CMS boş dönerse devreye girer) |
| **LegalPages** | 5 hukuki sayfa — gövde metni bilinçli olarak hardcoded (hukuki doğruluk riski) |
| **CookieRows** | Çerez politikası tablosu |
| **PageMeta** | Sayfa bazlı SEO meta override'ları |

### Sistem
| Koleksiyon | Ne tutar |
|---|---|
| **Users** | CMS kullanıcıları — email/username/rol salt-okunur, parola değişikliği tamamen kapalı (§5) |
| **Media** | Yüklenen görseller (MinIO/S3), boyut limiti + SVG crop atlama |
| **Documents** | `/sozlesmeler-ve-formlar` PDF'leri, herkese açık okuma |
| **AuditLogs** | Her create/update/delete/login/export/denied olayının kaydı — kim, ne zaman, ne yaptı, before/after diff |
| **Translations** | Admin panelinin TR/EN UI string'leri, DB-backed. `onInit` her boot'ta kod varsayılanlarını (kullanıcı özelleştirmediyse) tazeler — kod değişse bile ekran güncellenmiyorsa bir container rebuild yeterli. |

### Diğer
| Koleksiyon | Ne tutar |
|---|---|
| **Feedback** | Kullanıcıların CMS içinden gönderdiği geri bildirim — API'den erişilemez, sadece admin panelinden |

### Global
| Global | Ne tutar |
|---|---|
| **ContactInfo** | `/iletisim` sayfasının tekil içeriği. Sosyal medya linki (LinkedIn vb.) için alan YOK — Footer'daki LinkedIn ikonu hâlâ hardcoded genel bir URL'e gidiyor, bilinen küçük bir boşluk. |

## 7. Site nasıl CMS'ten besleniyor

- `vodafonepaycomtr/src/lib/cms.ts` — tüm CMS fetch'lerinin tek noktası. Her koleksiyon için bir `getX()` fonksiyonu, **zod ile runtime doğrulama**, timeout, yapılandırılmış hata loglama.
- **Fallback yok — CMS'in sağlıksız olduğu görünür olsun (RFP feedback 5.0).** Bir component CMS'ten veri alamazsa kendi hardcoded içeriğini GÖSTERMEZ, `ContentUnavailable` render eder. Header/Footer'daki nav-link fallback dizileri bunun İSTİSNASI DEĞİL, tam tersi kanıtı: onlar sadece CMS **gerçekten boş** dönerse (hata değil, 0 satır) devreye giren, bilinçli tutulan bir "boş menü göstermek yerine bilinen bir menü göster" güvenlik ağı — 29.08'de tüm bölümler dolduğu için şu an ölü kod.
- **ISR:** Sayfalar `revalidate: 1h` ile üretilir; `afterChange` hook'u `revalidateTag`/`revalidatePath` çağırıp ilgili sayfaları tazeler. Bir CMS değişikliğinden sonra tarayıcıda sayfayı **iki kez** yenilemek gerekebilir (stale-while-revalidate).
- **Draft önizleme:** `/api/preview` — `PREVIEW_SECRET` ile authenticate edilir, draft içeriği cache'lenmeden gösterir.

## 8. Route yapısı (`vodafonepaycomtr/src/app/`)

Çoğu sayfa kendi klasöründe sabit bir route (`/kampanyalar`, `/blog`, `/sikca-sorulan-sorular`, `/ucretler-ve-limitler`, `/iletisim`, `/temsilciliklerimiz`, 5 hukuki sayfa, vb.) — içerik CMS'ten geliyor ama route'un kendisi elle yazılmış bir `page.tsx`.

**`[...slug]`** — Pages koleksiyonundaki blok-tabanlı sayfaları render eden catch-all route. **5 ürün sayfasının tamamı** artık burada (elle yazılmış ürün sayfası route'u kalmadı):
- `vodafone-pay-uygulama`, `vodafone-pay-kart`, `faturana-yansit`, `aninda-bakiye`, `qr-ile-faturana-yansit`

**Site tek dilli — sadece Türkçe.** CMS admin paneli tr/en destekliyor ama bu, public site'a hiç yansımıyor: `[locale]` route segmenti yok, i18n kütüphanesi kullanılmıyor. PoC sunumunda muhtemelen sorulacak bir eksik (§11).

## 9. Test & kalite altyapısı

- **CI:** `.github/workflows/ci.yml` — `main`'e her push/PR'da site + cms ayrı ayrı: lint → typecheck → test → build. Deploy adımı yok.
- **Test kapsamı** (29.08.2026 ölçümü, `npm run test:coverage`): cms satır kapsamı ~%85 (528 test), site ~%94 (380 test).
- **Güvenlik taraması:** `scripts/sonar-scan.sh` ve `scripts/trivy-scan.sh` hazır. Trivy son kez 26.08'de çalıştırıldı, 0 açık bulgu (Alpine openssl + dompurify CVE'leri o turda kapatıldı). **Sonar'ın güncel bir çalıştırması yok** — geçmiş turlarda çalıştırılıp `0 açık bulgu` sonucu alınmıştı ama o zamanki token hiçbir yerde kalıcı değildi, şu an ne `.sonar-token` dosyası ne env değişkeni var; yeni bir token gerekiyor (`tasks.md` madde 32).
- **Gözlemlenebilirlik yok.** Sentry/APM/harici hata izleme yok, sadece `payload.logger.info` (birkaç yerde) ve Docker'ın kendi healthcheck'leri (container ayakta mı, kullanıcı hata mı alıyor sorusunu cevaplamaz). Bilinçli olarak OpenShift'e taşınma planına bırakıldı.

## 10. Önemli mimari kararlar — "neden böyle"

- **Fallback yok, hata görünür olsun** (§7).
- **Categories tek koleksiyon, `scope` ile ayrılıyor** — üç ayrı koleksiyon yerine tek koleksiyon + scope alanı.
- **`campaignStatus` adı, `status` değil** — Payload'ın kendi `_status`'üyle Postgres enum çakışması yaşandığı için.
- **Kullanıcı hesapları CMS'ten yönetilemiyor** — LDAP/AccessPoint'in tekil doğruluk kaynağı olması gerektiği için (bkz. `AGENTS.md`'deki "MOST IMPORTANT NOTES").
- **Campaigns'in zengin onay sistemi diğer koleksiyonlara kopyalanmadı** — aynı sonucu (Maker yayınlayamaz, yayındakine dokunamaz) çok daha az kod ve şema karmaşıklığıyla veren `denyMakerPublish`+`denyMakerEditPublished` ikilisi tercih edildi.
- **`node:24-alpine` (slim değil)** — Trivy'de Debian-slim'in çok daha fazla OS-seviyesi CVE taşıdığı görüldüğü için; runner stage'lerden `npm`/`npx`/`corepack` de bu yüzden silindi.
- **DB şeması push-tabanlı senkronla yönetiliyor, migration'lı değil** — `payload migrate:create` çalışıyor (R-10 kapandı, bkz. `docs/archive/STATUS.md` §2.19) ama migration'a geçiş ayrı bir karar, henüz alınmadı; yeni kolon/enum gerektiğinde hâlâ elle SQL uygulanıyor.
- **Her custom admin bileşeni `useAdminLocale()`/`useDbStrings()` üzerinden metin basmak zorunda** — admin paneli TR/EN destekliyor, hardcoded metin EN switch'ini kırar.
- **Yeni bir koleksiyon/alan, aynı değişiklikte gerçek bir render yoluna bağlanmalı.** `ProductHeroes`/`FeatureCards`/`StepCards` (sidebar'da vardı, DB'de sıfır kayıt) ve `ContentBlocks` (bağlıydı ama tek çağıranı CMS-unreachable fallback dalıydı, hiç çalışmıyordu) ikisi de bu kuralın ihlaliydi, ikisi de 28-29.08'de emekliye ayrıldı. 30.08'de bunun üçüncü, daha ciddi bir versiyonu bulundu: `vodafone-pay-uygulama` sayfası bir noktada (audit-log kaydı bile bırakmadan) CMS'ten tamamen silinmiş, ama header'ın "Ürünler" menüsündeki linki yayında kalmış — her ziyaretçi menüyü açıp tıkladığında 404 alıyordu. Kurtarılabilir içerik (`git` geçmişindeki son CMS-öncesi kopya) geri yüklendi, SSS içeriği (DB-only, kurtarılamaz) editör tarafından yeniden yazılmayı bekliyor. **Ders: "sayfa var ve linkleniyor" bile, periyodik olarak "sayfa gerçekten açılıyor mu" diye kontrol edilmeden güvenilir değil.**

## 11. Bilinen sınırlamalar / kapsam dışı (PoC bağlamında)

| Konu | Durum |
|---|---|
| Public site tek dilli (TR) | Bilinçli/geçici — CMS admin tr/en ama site'a yansımıyor |
| Gözlemlenebilirlik (Sentry/APM) | Yok — OpenShift'e taşınma planına bırakıldı |
| Sonar taraması | Script hazır, güncel token yok — sonuç henüz güncel değil |
| Görsel optimizasyon | `next.config.ts`: `images.unoptimized: true` (MinIO internal/public hostname farkı yüzünden) |
| Erişilebilirlik/performans ölçümü | Hiç yapılmadı — Lighthouse/axe-core tooling yok |
| CI'da deploy adımı | Yok, sadece lint/typecheck/test/build |
| LDAP/AccessPoint gerçek bağlantısı | Kurulmadı, sadece rol simülasyonu + eşleme katmanı hazır |
| 5 legal + 3 kurumsal sayfa gövdesi | Hardcoded (bilinçli, hukuki doğruluk riski) |
| `VideosWithTabs`/`LeadFormCta` | CMS'e bağlanmadı (gerçek video yok, ürün kararı bekliyor) |
| Footer'daki sosyal medya linki | Hardcoded genel URL, ContactInfo'da alan yok |
| `vodafone-pay-uygulama` SSS bölümü | 30.08'de bulunan içerik kaybı sonrası boş — editör tarafından yeniden yazılmalı |
| Analytics/çoklu-kanal raporlama | RFP'nin gerçek 3. parti hesap gerektiren maddeleri — hesap bilgisi olmadan sahte entegrasyon eklemek anlamsız |

## 12. Nerede ne var — doküman haritası

| İhtiyaç | Dosya |
|---|---|
| Satır-satır iş takibi, en güncel açık işler | `tasks.md` (repo kökü) — asıl takip dosyası |
| RFP'nin her maddesinin karşılığı | `docs/RFP-OPEN-ITEMS.md` |
| En güncel RFP uyum analizi (satır satır) | `docs/RFP-GAP-ANALYSIS-2026-08-24.md` |
| Kullanıcının ham CMS test geri bildirimi (60+ madde) | `docs/CMS-USER-TESTS.md` |
| Uçtan uca RBAC/collection test senaryoları | `docs/RUNBOOK.md` |
| Editörler için SSS/Blog kategori rehberi | `docs/SSS-BLOG-REHBER.md` |
| Canlı site ↔ blok kütüphanesi paritesi | `docs/LAYOUT-PARITY.md` |
| Test kullanıcıları (e-posta/şifre) | `docs/TEST-USERS.MD` |
| Geçmiş oturum raporlarının indeksi (20 dosya, tarihsel) | `docs/HISTORY.md` → `docs/archive/` |
| Referans vendor CMS ("Butterfly") notları — tasarım ilhamı | `docs/reference/` |
| `/clone-website` skill'inin kendi çıktı konumu | `docs/research/` |
| Kod yazarken uyulacak kurallar, komutlar, "en önemli notlar" | `AGENTS.md` / `CLAUDE.md` (repo kökü) |
