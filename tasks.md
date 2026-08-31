# Görev Listesi — 25.08.2026 geri bildirim turu

Bu dosya, kullanıcının 25.08.2026'da tek seferde ilettiği geri bildirim paketinin
maddelerini ve her birinin durumunu takip eder. Sıra, kullanıcının yazdığı sıradır.

Durum anahtarı: `[ ]` yapılacak · `[x]` yapıldı + canlı doğrulandı · `[!]` inceledi, yapılmadı (gerekçe yazılı)

---

## 1. Kampanya slug'ı otomatik üretilsin

**İstek:** "business product slug ne bilmez onu da sağa alalım ve kapalı alan olsun
dinamik olarak değişsin kullanıcıdan istemesin bence."

**Kök neden:** `slug` zorunlu + elle yazılan bir alandı. Boş bırakılınca hem kayıt
400 veriyordu hem de yayın önizlemesi "kaydedilmiş bir 'slug' değeri gerekiyor"
diyerek kampanyayı gösteremiyordu.

- [x] `slug` alanı kenar çubuğuna (sidebar) taşındı, `readOnly` yapıldı
- [x] Başlıktan otomatik türetiliyor (`beforeValidate` hook'u, Türkçe karakter uyumlu)
- [x] Aynı slug varsa `-2`, `-3` diye benzersizleştiriliyor
- [x] Yayındayken slug donduruluyor (canlı URL kendiliğinden değişmesin)
- [x] Kenar çubuğunda canlı önizleme gösteren alan bileşeni (`AutoSlugField.tsx`)

## 2. Kampanya kaydında 400 hatası + "ekstra feedback gitmiyor"

- [x] 400'ün sebebi 1. maddeydi (slug zorunlu ama boş) — slug otomatikleşince kalktı
- [x] Red (feedback/red sebebi) akışı incelendi: `submit()` sonucu hata olduğunda
      kullanıcıya hiçbir mesaj gösterilmiyordu, modal sessizce kapanıyordu. Artık
      hata mesajı modalın içinde gösteriliyor ve modal açık kalıyor.

## 3. Yayındaki kampanyada acil düzeltme

**İstek:** "cok acil bi düzeltme olabilir... önce yayından kaldırma talebi ile
ilerlemelisin ama ilerleyebilirsin onaylıyor musun gibi 2. bir onay metnini
onaylarsa canlıya alabilmeli."

- [x] Yayından kaldırma akışı varsayılan yol olarak KALDI (önce o öneriliyor)
- [x] Yanına "Acil düzeltme" ikinci onay akışı eklendi — ne olduğunu açıkça yazan
      bir uyarı metni + onay kutusu, onaylanmadan buton çalışmıyor
- [x] Sunucu tarafında `forceLiveEdit` bayrağı ile `guardPublishedEdit` aşılıyor;
      denetim kaydına ayrı bir satır olarak yazılıyor (kim, ne zaman, hangi kayıt)

## 4. Kategoriler — akış seçilince mevcutlar görünsün

- [x] "Akış" dropdown'ının altına, seçilen akıştaki mevcut kategorileri listeleyen
      bilgi amaçlı bir panel eklendi (`CategoryScopePeek.tsx`)

## 5. SSS sürükle-bırak sıralama hatası

**Kök neden (canlı yeniden üretildi):** `ReorderWidget`, grup alanını PATCH gövdesine
her zaman **string** olarak koyuyordu (`"18"`). `category` bir *relationship* alanı ve
Postgres tarafında id'si integer — Payload `"18"` string'ini reddediyordu:
`Lütfen geçersiz alanı düzeltin: Category`. Bu yüzden hem 1. faz hem 2. faz PATCH'leri
400 dönüyor, widget da "Bazı öğeler kaydedilemedi" diyordu.

- [x] Grup değeri artık ham tipiyle (sayı ise sayı) gönderiliyor
- [x] Canlı doğrulandı: sürükle-bırak + Kaydet başarılı

## 6. Kullanıcı oluşturma kapatılsın

**İstek:** "zaten user eklemicez... şimdilik kapalı kalsın."

- [x] `ALLOW_USER_CREATION = false` sabiti — "Yeni Oluştur" butonu ve API'den
      oluşturma kapalı. Tek satır değiştirilerek geri açılabiliyor.

## 7. Çeviriler kimseye görünmesin

- [x] `admin.hidden: true` — hiçbir rol için sidebar'da yok, doğrudan route da açılmıyor
- [x] Okuma erişimi arka planda açık kaldı (her rolün panel metinleri buradan besleniyor)

## 8. Sözleşmeler ve Formlar — iki akışlı belge yönetimi

**İstek:** Sekmeli yapı — "PDF yükle" veya "kendin oluştur". Kendi oluşturursa
`/sozlesmeler-ve-formlar/{slug}` gibi kendi URL'i olan bir sayfa; PDF yüklerse
MinIO'dan servis edilen bir PDF URL'i. Gerçek sitedeki akordeon yapısı da korunmalı.

- [x] Her belge satırında `Kaynak` seçimi: **PDF Yükle** / **Kendin Oluştur**
- [x] PDF akışı: `documents` koleksiyonuna yükleme (MinIO), doğrudan indirilebilir link
- [x] Kendin oluştur akışı: `slug` + zengin metin gövdesi → `/sozlesmeler-ve-formlar/{slug}`
- [x] Site tarafında akordeonlu grup yapısı (gerçek siteyle aynı davranış)
- [x] Yeni dinamik route: `src/app/sozlesmeler-ve-formlar/[slug]/page.tsx`

## 9. Duyurular koleksiyonu kaldırılsın mı?

- [!] **Kaldırılmadı — kontrol sonucu kaldırmamak gerektiğini gösterdi.** Gerçek
      `vodafonepay.com.tr/duyurular` sayfası CANLI (HTTP 200) ve içinde gerçek bir
      duyuru var ("18.08.2026 02:00-08:00 Planlı Altyapı Çalışması"). Sitenin
      footer'ındaki "Kurumsal" sütunundan da linkli (nav-links id=17). Bizde de 3
      kayıt + çalışan bir `/duyurular` akordeon sayfası var. Silmek canlı bir
      sayfayı ve footer linkini kırardı. Detay: aşağıdaki "Rapor" bölümü.

## 10. Layout blokları — gerçekçi Vodafone örnekleri

- [x] Blok açıklamaları jenerik ("başlık + görsel") yerine gerçek Vodafone Pay
      örnek metinleriyle yazıldı ("Vodafone'lu Ol!", "Hemen Vodafone'a gel" vb.)

## 11. Geri bildirim (feedback) koleksiyonu

- [x] `feedback` koleksiyonu — hiçbir kullanıcıya listelenmiyor (`admin.hidden`)
- [x] Sidebar'ın en altında "Geri Bildirim Gönder" bağlantısı + form ekranı
- [x] Kaydedilenler: kullanıcı, rol, mesaj, hangi sayfa/bileşen, tarih, IP
- [x] Motive edici açıklama metni ("CMS'i birlikte daha iyi hale getirelim")

## 12. Contact Info alan açıklamaları

- [x] 11 alanın tamamına ne işe yaradığını anlatan açıklama eklendi
- [x] Türkçe/İngilizce etiketler eklendi (global'in kendi adı da dahil)

## 13. Sidebar yeniden düzenlemesi

- [x] "İçerik" → **"İçerik Yönetimi"**, sıra: Kategoriler, Kampanyalar, Sayfalar,
      Sık Sorulanlar, Blog Yazıları, Temsilciler, İçerik Blokları
- [x] "İçerik Yönetimi" (custom view) → **"Tüm İçerikler"** olarak yeniden
      adlandırıldı ve **Sistem** grubunun altına taşındı
- [x] "Ücretler ve Limitler" → **İçerik Yönetimi** grubunun altına taşındı
- [x] "Erişim Matrisi" → **Sistem** grubunun altına taşındı
- [x] Contact Info'nun Türkçe etiketi eklendi (DB'de çeviri satırı yoktu)

## 14. Erişim matrisi görünümü

- [x] Rol sütunları yan yana (rol × koleksiyon gerçek matris), satır başına 1
      koleksiyon; yetki rozetleri renkli, yapışkan başlık satırı, arama kutusu

---

# Görev Listesi — 26.08.2026 turu

Kullanıcının 26.08.2026'da ilettiği paket. Sıra, kullanıcının belirlediği sıradır.

## 15. Dashboard "Sayfalar" sayacı gerçek site URL'lerini saysın

**İstek:** "sayfa bileşeni şu an localhost:3000 sayfası bile bizim için bir sayfa
olarak tutulmalı, tüm farklı url'leri sayfa olarak saymalı ve listeleyebilmeliyiz."

**Kök neden:** `CustomDashboardView.tsx` "Sayfalar" KPI'ını `payload.count({collection:"pages"})`
ile hesaplıyor — bu sadece editörün oluşturduğu Pages dokümanlarını (1 adet) sayıyor.
Sitenin gerçek 20 statik route'u (`/`, `/blog`, `/iletisim`, ...) `src/app/*/page.tsx`
dosyaları, Payload dokümanı değil, hiçbir API sorgusu onları göremez.

- [x] Ortak `cms/src/lib/sitePages.ts` — 3 kaynak: `static` (HAND_BUILT_ROUTES),
      `cms` (Pages koleksiyonu), `dynamic` (`[slug]`/`[id]` route'ları)
- [x] KPI "Sayfalar" `payload.count({pages})` yerine `countSiteUrls()` — **1 → 46**
- [x] "Site Sayfaları" tablosu: başlık, adres (canlı siteye link), kaynak rozeti, URL sayısı
- [x] Dinamik satırların sayısı sitenin kendi `generateStaticParams` filtresiyle
      birebir aynı (taslak blog yazısı / slug'sız kampanya sayıya girmiyor)
- [x] Taslak CMS sayfası listede görünür ama URL sayısına eklenmez (`urlCount: 0`)
- [x] tr/en (dosyanın mevcut `locale === "tr" ? ... : ...` deseni — yeni DB çeviri satırı gerekmedi)
- [x] 8 birim testi (`src/lib/__tests__/sitePages.test.ts`)
- [x] Canlı doğrulama: KPI 46 = tablo toplamı 46; `/` satırı gerçekten
      `http://localhost:3000/`'e gidiyor; 4 dinamik sayı SQL ile teyit edildi
      (blog 5, kampanya 20, temsilci 0, sözleşme/form 0 — sonuncusu doğru,
      tek doküman `source='pdf'` ve slug'sız, sayfa URL'i üretmiyor)

## 16. Test coverage yükseltilsin

**site: %36.8 → %65 → %82.9 (hedef %60'tı, sonra %80 istendi, ikisi de aşıldı) — TAMAMLANDI**
- [x] İkinci tur: `vitest.config.ts`'nin coverage kapsamı `page.tsx` dosyalarını
      da içerecek şekilde genişletildi (sadece `layout.tsx` hariç — next/font/local
      araç kısıtı, kasıtlı karar değil). 21 gerçek route + 6 dinamik route için
      37 yeni/genişletilmiş test dosyası: `notFound()` dalları, `ContentUnavailable`
      üçlü ayrımı, `draftMode()` ile `PreviewBanner`, CMS-vs-fallback dalları
- [x] `[...slug]/page.tsx`'in `BlockRenderer`'ı dışa aktarıldı (davranış değişmedi)
      ve 10 blok tipinin tamamı doğrudan test edildi
- [x] 355 test geçiyor, tsc/eslint temiz, Sonar: 0 açık bulgu
- [x] Canlı doğrulama: image rebuild, 21 gerçek route 200, 2 kasıtlı yanlış
      slug 404 (notFound() gerçekten prod'da çalışıyor), konsol hatası yok
- [x] Gerçek sayılar (Sonar): coverage %65 → %82.9, line coverage %88.8,
      duplication %1.5
- [x] Güvenlik-kritik: `previewSecret.ts` (timingSafeEqual), `/api/preview`
      + `/api/preview/disable` (açık yönlendirme koruması), `documentViewer.ts`
      (dosya host allowlist)
- [x] Etkileşimli bileşenler: `HeaderClient` (mobil çekmece/dropdown/
      mobileHref), `PhoneStepsCarousel`, `VideosWithTabs`, `ScrollReveal`
      (IntersectionObserver), `AppDownloadBanner`
- [x] Async server component'ler: `Footer`, `Header` (cms.ts mock'lanarak,
      `render(await Component())` deseniyle)
- [x] `RichText.tsx` link converter (dış/iç/çözülemeyen link), liste/alıntı/hr
- [x] `metadata.ts` — CMS-önce-varsayılan alan bazlı fallback
- [x] `vitest.setup.ts`'e global `IntersectionObserver` stub'ı eklendi
- [x] 208 test geçiyor, tsc/eslint temiz, Sonar: 0 açık bulgu
- [x] Canlı doğrulama: image rebuild, `/`, `/kampanyalar`, `/ucretler-ve-limitler` 200

**cms: %24.4 → %28.8 → %53.5 (Sonar `coverage`), line coverage %58.2 — kısmen tamamlandı, devam ediyor**
- [x] `cms/vitest.config.ts`'nin coverage kapsamı `src/lib/**` ve
      `src/components/**`'i de içerecek şekilde genişletildi (önceden sadece
      access/hooks/collections/globals) — zaten yazılmış ama sayılmayan
      testler (sitePages, exportFetch, cef, rolePermissions, slugify)
      "bedava" ortaya çıktı
- [x] Saf mantık için yeni testler: `csv.ts`, `loadDbStrings.ts`, `preview.ts`,
      `collectionLabels.ts`, `contentManagementTabs.ts`, `translationDefaults.ts`/
      `helpContent.ts` (veri bütünlüğü smoke testi)
- [x] `hooks/audit.ts` — `auditExportEndpoint` + `auditForbiddenAttempt` testleri
- [x] `hooks/autoSlug.ts` — 8 test (çakışma, id hariç tutma, boş kaynak vb.)
- [x] `collections/Users.ts` — 23 test: `blockPasswordChange`,
      `enforceAvatarSizeLimit`, `avatarUploadEndpoint` (401/400/500/başarı),
      `afterLogin`/`afterLogout`/`afterOperation`(unlock)/`afterError`
      (LockedAuth vs AuthenticationError) — AGENTS.md'nin en çok vurguladığı
      güvenlik-kritik dosya
- [x] `collections/Feedback.ts` — 10 test (0'dan)
- [x] `collections/Media.ts` — 14 test (`deriveMediaType`, `enforceFileSizeLimit`,
      `skipCropForSvg`)
- [x] **React admin bileşenleri** (kullanıcı onayıyla `jsdom` + `@testing-library/
      react` + `@testing-library/jest-dom` + `@testing-library/user-event` eklendi,
      site'daki sürümlerle birebir aynı; `vitest.setup.ts` + `vitest.config.ts`
      `setupFiles` eklendi): `HelpButton`, `RememberEmailCheckbox`,
      `DashboardWidgets` (async server component, rol dallanması), `ReorderWidget`
      (614 satır — sürükle-bırak, iki fazlı PATCH, gruplu/gruupsuz reorder),
      `RoleAwarePublishButton` (701 satır — rol bazlı publish/reject/unpublish/
      force-edit akışları), `FeesAndLimitsApp`, `ContentManagementApp` (390 satır
      — özet tablo, detay sekmeleri, site-routes statik tablo, arama/sayfalama),
      `GroupedNavLink`, `CsvExportButton`/`CefExportButton`/`ExportTriggerButton`
- [x] 336 test geçiyor, tsc/eslint temiz, Sonar: 0 açık bulgu, duplication %3.5
- [x] Canlı doğrulama: image rebuild (`docker compose up -d --build app cms`),
      her iki container healthy; `trivy-scan.sh all` çalıştırıldı — cms'in kendi
      `package-lock.json` taraması **0 bulgu** (yeni devDependency'ler temiz).
      Trivy'nin bulduğu 2 bulgu (Alpine base'in openssl CVE'leri, site'ın
      `dompurify` sürümü) bu turun kapsamı dışında kullanıcı onayıyla ayrı
      bırakıldı — ikisi de bu oturumdaki değişiklikle ilgisiz, önceden var olan
      borç
- [x] Kalan büyük 0% bileşenler: `AccessMatrixApp` (156), `AccountForm` (196),
      `FeedbackApp` (117), export-button koleksiyon sarmalayıcıları
      (UsersExportButton, CampaignsExportButton, BlogPostsExportButton,
      CategoriesExportButton, AuditLogsExportButton, AuditLogsCefExportButton),
      `AutoSlugField`, `LiveOrderField`/`FooterOrderField`, `MediaUsageField`,
      `LoginHistoryField`, `UnlockAccountField`, `CategoryScopePeek`,
      `MediaFilterTabs`, `LockedAccountsBanner`, `LocalePreferenceSync` —
      **kapandı, madde 20**
- [x] Kalan collection'lar: BlogPosts.ts, FaqItems.ts, Campaigns.ts (kalan kısmı),
      Translations.ts, Documents.ts, Representatives.ts, PageMeta.ts, CookieRows.ts —
      **kapandı, madde 20**

## 17. CMS Sonar bulguları

- [x] 5 BLOCKER: `.resolves.not.toThrow()` ile niyet açık hale getirildi.
      İddianın boş olmadığı ayrıca kanıtlandı (reddedilen promise testi kırıyor).
- [x] 5 CRITICAL cognitive complexity: Feedback.ts, LegalPages.ts, Users.ts,
      ordering.ts, RoleAwarePublishButton.tsx — hepsi eşiğin altına indi
- [x] S6551 (3): `[object Object]` riski — `describeClash()` + açık daraltma
- [x] S3358 (6) / S4624 (2): iç içe ternary + template literal ayrıştırıldı;
      FeesAndLimitsApp'ın iki kopyası tek `<TablePanel>` oldu
- [x] S7780 (3): cef.ts `String.raw` sabitleri (BACKSLASH hariç — template
      literal ters bölüyle bitemez, sözdizimi hatası veriyor)
- [x] S4144: IconDraft artık IconBlog'un açık alias'ı
- [x] S6819: önizleme genişliği geçişi `<div role="group">` → `<fieldset>`
- [x] **CMS açık bulgu: 27 → 0**
- [x] Canlı doğrulama: LiveActions / LiveEditedActions / ForceLiveEditModal /
      useLockBodyScroll gerçek admin'de çalışıyor; fieldset'in eski div ile
      piksel bazında birebir aynı render ettiği ölçülerek kanıtlandı
- [x] CMS duplication %9.0 → %3.9 (hedef %3'e çok yakın). İki gerçek mantık
      tekrarı çıkarıldı: `orderField()` (9 collection'da birebir aynı `order`
      alanı) ve `fetchExportDocs()`/`pingExportAudit()`/`<ExportTriggerButton>`
      (Csv/CefExportButton'ın fetch+buton kısmı — CefExportButton'ın kendi doc
      comment'indeki "serialize kısmını birleştirme" kararına dokunulmadı).
      translationDefaults.ts/helpContent.ts CPD'den hariç tutuldu (literal veri
      tablosu, CPD string literal'leri normalize edip yanlış pozitif üretiyor —
      dosyalar tam okunarak doğrulandı). Kalan ~%3.9, projenin genelindeki
      "her collection kendi içinde tam literal" konvansiyonuna ait (~20
      collection'ın hepsi aynı iskeleti paylaşıyor) — daha fazla zorlamak
      mimari tutarlılığı bozar. Canlı doğrulama: CSV export gerçek admin'de
      denendi, doğru istek attı; 191 test geçiyor (12 yeni).

**Not (şeffaflık):** Doğrulama sırasında yanlışlıkla Payload'ın kendi
"Değişiklikleri yayınla" düğmesine basıp `content-blocks/31` ("Tıkla Gelsin",
brand-logos) taslağını yayınladım. Fark edilir edilmez `_status: draft`'a geri
alındı; DB ve canlı site teyit edildi (logo sitede yok). İçerik değişmedi,
sadece durum geçici olarak taslak→yayında→taslak oldu.

## 18. Klasör yapısı — TAMAMLANDI

**İstek:** `vodafonepaycomtr/` (site) ve `cms/` kardeş klasörler olsun, workspace
ile BAĞLANMASIN, tamamen ayrı kalsınlar.

**Karar (kullanıcıyla netleştirildi):** Git kökü ve oturum çalışma dizini
DEĞİŞMEDİ (`/Users/.../vodafonepaycomtr` aynı kaldı, dış klasör yeniden
adlandırılmadı — bu, açık editörleri/terminalleri kırardı). Mevcut git kökü
"proje" klasörü rolünü üstlendi; içine yeni bir `vodafonepaycomtr/` alt
klasörü açıldı (site dosyaları oraya taşındı), `cms/` zaten kardeş konumdaydı.
Ortak/orkestrasyon dosyaları (docker-compose.yml, scripts/, docs/, tasks.md,
README.md, AGENTS.md) kökte kaldı.

- [x] Etki analizi: tsconfig.json/eslint.config.mjs zaten `cms/`'i dışlıyordu
      (site zaten kavramsal olarak ayrıydı) — docker-compose.yml, scripts/
      (sonar-scan.sh, trivy-scan.sh, download-assets.mjs), .github/workflows/ci.yml,
      package.json (warm-cache script), AGENTS.md, README.md tespit edildi
- [x] `git mv` ile taşındı (git history korundu): src/, public/, package.json,
      package-lock.json, next.config.ts, tsconfig.json, eslint.config.mjs,
      postcss.config.mjs, components.json, vitest.config.ts, vitest.setup.ts,
      Dockerfile, Dockerfile.dev, .dockerignore
- [x] Düz taşındı (izlenmeyen): node_modules/, next-env.d.ts, .vercel/
- [x] Silindi (atılabilir build cache, eski konumda anlamsız): .next/,
      coverage/, tsconfig.tsbuildinfo
- [x] docker-compose.yml: `context: .` → `./vodafonepaycomtr` (app+dev),
      bind mount `.:/app` → `./vodafonepaycomtr:/app`; cms zaten doğruydu
- [x] scripts/sonar-scan.sh, trivy-scan.sh: site yolları `vodafonepaycomtr/`
      önekini ald
- [x] scripts/download-assets.mjs: `process.cwd()` yerine script'in kendi
      konumundan çözümleme (gizli bir "her yerden çalışmıyor" hatasını da düzeltti)
- [x] .github/workflows/ci.yml: `quality` job'ına cms-quality ile aynı
      `working-directory`/`cache-dependency-path` deseni eklendi
- [x] AGENTS.md, README.md güncellendi; `scripts/sync-agent-rules.sh` ile
      türetilmiş dosyalar (.clinerules, .continue, .amazonq, copilot) yenilendi
- [x] **Uçtan uca canlı doğrulama** (sadece config incelemesi değil):
      `docker compose config` geçti; sıfırdan `--build app cms` ile ikisi de
      `healthy`; rebuild edilen `app` gerçek CMS verisini render ediyor
      (anasayfada gerçek kampanya var, "CMS'e ulaşılamıyor" değil);
      `cms:3010/api/campaigns` gerçek veri döndürüyor (totalDocs: 20) —
      Docker ağ bağlantısı taşımadan etkilenmedi; 21 gerçek route 200;
      yeni `vodafonepaycomtr/` konumundan (Docker dışında, doğrudan)
      355 test geçti, tsc/eslint temiz, `npm run build` başarılı (20 canlı
      kampanya slug'ı dahil tüm route'lar prerender edildi); cms'in kendi
      179 testi de hâlâ geçiyor (dokunulmadığı teyit edildi)

## 19. R-10 — payload migrate:create / generate:importmap kırık (ERR_REQUIRE_ASYNC_MODULE) — Kapandı (26.08.2026)

Kök neden: `cms/package.json`'da `"type": "module"` eksikti, tsx dosyayı CJS
olarak transpile edip ESM-only `richtext-lexical`'ı `require()` ile
çağırıyordu. Detay: `docs/STATUS.md` §2.19.

- [x] Kök neden netleştirildi ve doğrulandı (tam stack trace ile).
- [x] `cms/package.json`'a `"type": "module"` eklendi;
      `admin.importMap.baseDir` düzeltmesiyle ikinci gizli bug da giderildi.
- [x] `generate:importmap`/`migrate:create`/`migrate` script'leri eklendi,
      gerçek bir migration üretilerek doğrulandı.
- [x] `docs/STATUS.md` §3'teki R-10/R-26 satırları güncellendi.

## 20. CMS test coverage — kalan bileşenler ve collection'lar

Madde 16'nın devamı. Kalan büyük 0% bileşenler: `AccessMatrixApp` (156),
`AccountForm` (196), `FeedbackApp` (117), export-button koleksiyon
sarmalayıcıları (UsersExportButton, CampaignsExportButton,
BlogPostsExportButton, CategoriesExportButton, AuditLogsExportButton,
AuditLogsCefExportButton), `AutoSlugField`, `LiveOrderField`/
`FooterOrderField`, `MediaUsageField`, `LoginHistoryField`,
`UnlockAccountField`, `CategoryScopePeek`, `MediaFilterTabs`,
`LockedAccountsBanner`, `LocalePreferenceSync`. Kalan collection'lar:
BlogPosts.ts, FaqItems.ts, Campaigns.ts (kalan kısmı), Translations.ts,
Documents.ts, Representatives.ts, PageMeta.ts, CookieRows.ts.

- [x] Yukarıdaki bileşenler için jsdom/RTL render testleri — `AccessMatrixApp`,
      `AccountForm`, `FeedbackApp`, `AutoSlugField`, `LiveOrderField`,
      `CategoryScopePeek`, `LocalePreferenceSync`, `LockedAccountsBanner`,
      `MediaFilterTabs` daha önceki bir turda eklenmişti; bu turda kalan 4
      alan bileşeni (`FooterOrderField`, `MediaUsageField`,
      `LoginHistoryField`, `UnlockAccountField`) ve 6 export-button
      sarmalayıcısı (`UsersExportButton`, `CampaignsExportButton`,
      `BlogPostsExportButton`, `CategoriesExportButton`,
      `AuditLogsExportButton`, `AuditLogsCefExportButton`) eklendi — 29 yeni
      test (10 yeni dosya), `cms/src/components/__tests__/`. Export-button testleri
      `CsvExportButton`/`CefExportButton`'ı gerçekten render edip
      `URL.createObjectURL`'e giden `Blob`'un içeriğini (`blob.text()`) okuyarak
      her sarmalayıcının kendi `buildTable`/`buildEvents` mantığını (rol/kilit/
      durum etiketleri, tarih formatlama, richtext düzleştirme) doğruluyor —
      `buildTable` export edilmedi, mevcut testlerde de precedent yoktu, bu yüzden
      gerçek render + blob-içerik okuma yeni kurulan desen oldu.
- [x] Yukarıdaki collection'lar için pure-logic hook/access testleri —
      BlogPosts/FaqItems/Campaigns/Translations/Documents/Representatives/
      PageMeta/CookieRows hepsi önceki turda eklenmişti (bkz. commit
      `323f921`), bu turda değişiklik gerekmedi.
- [x] tsc/eslint temiz, tüm testler geçsin — `npx tsc --noEmit` 0 hata,
      `npx eslint .` 0 hata (yalnızca 4 önceden bilinen `no-img-element`
      uyarısı, AdminIcon/AdminLogo/LoginBrandPanel/SidebarLogo), `npm test --
      --run` 443/443 geçti (67 dosya), `npm run build` başarılı. Sonar bu
      ortamda çalıştırılamadı (token/bağlantı yok, `docs/STATUS.md` §3'te
      önceden not edilmiş bilinen bir kısıt) — "Sonar 0 açık bulgu" hedefi bu
      yüzden doğrulanamadı, yerine tsc/eslint/test/build temizliği ve aşağıdaki
      Vitest coverage sayıları kaydedildi.
- [x] Gerçek coverage sayılarını bu maddeye kaydet — Sonar API'ye bu ortamda
      erişilemediği için (`docs/STATUS.md` §3, önceden bilinen kısıt) Vitest'in
      kendi `npm run test:coverage` raporu kullanıldı: **statements 82.73%
      (1917/2317), branches 66.91% (1183/1768), functions 76.06% (448/589),
      lines 84.04% (1723/2050)**, 443 test / 67 dosya. Detay: `docs/STATUS.md`
      §2.20.

## 21. Kalan ürün sayfalarının Pages'e göçü — Kapandı (26.08.2026)

Madde 10'un devamı — pilot (`vodafone-pay-uygulama`) tamamlanmıştı. 26.08'de
kullanıcıyla netleştirildi: 4 sayfadan 2'si pilotla aynı şekilde temiz göçer
(Hero + CardsWithIcons + PhoneStepsCarousel + Faq — `SimpleProductPage.tsx`
zaten bu ortak şekli paylaşıyor, blok karşılıkları pilot turunda eklenmişti);
diğer 2'si Pages'in blok sistemine hiç girmeyen bölümler içeriyor
(`faturana-yansit`: VideosWithTabs+LeadFormCta, `vodafone-pay-kart`:
WhereCanIBuy) — kullanıcı kararıyla **şimdilik atlandı**, elle yazılmış rota
olarak kalacak.

- [x] `aninda-bakiye` — göçürüldü
- [x] `qr-ile-faturana-yansit` — göçürüldü
- [x] `faturana-yansit` — **atlandı (kullanıcı kararı)**, VideosWithTabs/
      LeadFormCta blok olamıyor
- [x] `vodafone-pay-kart` — **atlandı (kullanıcı kararı)**, WhereCanIBuy
      blok olamıyor

Pilot sayfanın göç deseni tekrar kullanıldı (elle yazılmış `page.tsx` →
Pages koleksiyonu kaydı + layout blokları, `docs/RFP-OPEN-ITEMS.md` §10'da
adım adım belgeli). Her sayfa için: içerik birebir korundu, eski route
canlıda 200 dönüyor, CMS'ten düzenlenebilir, artık kullanılmayan
component/content-blocks kaydı temizlendi. Detay `docs/STATUS.md` §2.10'da.

## 22. Trivy bulguları — Alpine openssl CVE'leri + site'ın dompurify sürümü — Kapandı (26.08.2026)

25.08 turunda kasıtlı ayrı bırakılmıştı (cms'in kendi devDependency
değişikliğiyle ilgisizdi), bu turda kapatıldı. Detay: `docs/STATUS.md` §2.18.

- [x] `vodafonepaycomtr/package.json`: `overrides.dompurify` `^3.4.13`
      eklendi (4 CVE kapandı: CVE-2026-65898, GHSA-55q2-fjhq-7xh7,
      CVE-2026-65899, GHSA-c2j3-45gr-mqc4). Site test/typecheck/lint/build
      temiz.
- [x] cms + app Dockerfile'larının runner stage'ine `apk update && apk
      upgrade --no-cache libcrypto3 libssl3` eklendi (4 CVE kapandı:
      CVE-2026-14456, CVE-2026-18798, CVE-2026-63072, CVE-2026-63076).
- [x] Rebuild + healthy doğrulandı, `scripts/trivy-scan.sh all` 0 bulgu
      raporladı.

## 23. Sayfalar koleksiyonu — "Ürünler menüsünde göster" + getPages() bug'ı — Kullanıcı testi bekliyor (27.08.2026)

**Durum:** Kod tarafı bitti ve canlıda (localhost) benim tarafımdan
doğrulandı; **kullanıcı henüz test etmedi**. Detay: `docs/STATUS.md`.

### 23a. Bir sayfa kendini "Ürünler" menüsüne koyabiliyor

Sorun: Bir Page kaydedilip yayınlansa bile header'daki "Ürünler" menüsünde
görünmüyordu — editörün AYRI bir koleksiyona (`Menü Linkleri`/NavLinks)
gidip slug'ı elle yazarak bir link kaydı açması gerekiyordu. Canlıdaki 5
ürün sayfasının `Header.tsx` içinde sabit bir dizide durmasının sebebi de
buydu (yeni görsel/metin gerektiğinde koda dokunmak gerekiyordu).

- [x] `Pages`'e `showInProductsMenu` kutusu eklendi (+ opsiyonel
      `productsMenuLabel` ve `productsMenuOrder`) — Campaigns/FaqItems'taki
      `showInFooter`/`footerOrder` deseninin aynısı.
- [x] Site header'ı iki kaynağı tek listede birleştiriyor: NavLinks
      (`header-products`) + Pages (`showInProductsMenu`), ortak sıra
      numarasına göre. NavLinks KALDIRILMADI — Pages'te olmayan elle
      yazılmış rotalar (`/faturana-yansit`, `/vodafone-pay-kart`) ve dış
      bağlantılar için hâlâ tek yol o.
- [x] `assignNextHomepageOrder` (FaqItems'ta yereldi) `ordering.ts`'e
      `assignNextFlaggedOrder` olarak taşındı — kendi yorumu "ikinci bir
      çağıran olduğunda genelleştir" diyordu, bu o çağıran.
- [x] Yardım metni (`helpContent.ts`) ve alan açıklamaları güncellendi —
      eski "menüler ayrı yerden yönetiliyor" adımı artık yanlış bilgiydi.
- [x] DB kolonları elle eklendi (`pages` + `_pages_v`), bkz. `docs/STATUS.md` §5.
- [ ] **Kullanıcı testi:** CMS'te bir sayfa açıp kutuyu işaretle → yayınla →
      sitede "Ürünler" menüsünde çıktığını, etiketin/sıranın çalıştığını,
      Görünürlük "Gizli" yapılınca menüden düştüğünü doğrula.

### 23b. 10 layout bloğunun tamamı UI'dan tek tek eklenip test edildi

- [x] CMS UI'ından bir sayfa oluşturulup 10 blok tipinin hepsi tek tek
      eklendi (hero, richText, faqList, campaignGrid, video, logoGrid,
      iconCards, steps, imageTextSlides, videoList) — **hepsi render
      oluyor**: 10 `<section>`, 2 YouTube gömme, 23 görsel, konsol/sunucu
      hatası yok. Blok seçicide de 10'unun hepsi listeleniyor.
- [x] **Bu tur GERÇEK bir bug ortaya çıkardı** (uygulama zaten loglamış,
      kimse bakmamış): `getPages()` tam `pageSchema`'ya doğruluyordu (blok
      görselleri **nesne** bekliyor) ama `depth=0` ile istiyordu (Payload
      orada upload ilişkisini **sayı id** döndürüyor). Görsel içeren tek bir
      blok bile tüm listeyi `null`'a düşürüyordu → **editörün yaptığı her
      sayfa sitemap'ten sessizce düşüyordu** ve hiçbiri statik üretilmiyordu.
      Canlıda doğrulandı: sitemap'te sıfır Pages kaydı vardı.
- [x] İkincil bug (yukarıdaki düzeltme açığa çıkardı): Pages'e göç ettirilen
      3 ürün sayfası `STATIC_ROUTES`'tan hiç silinmemişti → sitemap'te çift
      çıkıyorlardı. Bayat kayıtlar silindi + liste tekilleştirildi.
- [x] Regresyon testleri yazıldı (eski test `layout: []` kullandığı için bu
      bug'ı hiç yakalayamıyordu). Site 355, CMS 449 test geçiyor.
- [ ] **Kullanıcı testi:** `Layout Test Sayfasi` CMS'te duruyor — açıp
      blokları gözden geçir; istenmiyorsa sil.

## 24. Layout bloklarının teması canlı siteyle birebir hizalandı (27.08.2026)

**İstek:** "layoutta eklediğimiz şey canlı sitenin css yapısına uyuyo mu…
hero blogumuzda başlığın arkasındaki box çok çirkin… canlı sitede yapılar
nasılsa layout aynı css temasında olmalı, tamamen aynı olsun."

**Kök neden:** Ürün sayfaları Pages'e göç ederken her blok sıfırdan, jenerik
stille yeniden yazıldı — elle yazılmış sayfaların zaten canlıya birebir uyan
bileşenleri (`ProductHero`, `CardsWithIcons`, `PhoneStepsCarousel`) yeniden
kullanılmadı. Sonuç: aynı bölüm, CMS sayfasında ve elle yazılmış sayfada
farklı görünüyordu ve ikisi de canlıya uymuyordu.

- [x] Canlı `vodafonepay.com.tr/aninda-bakiye` + `/qr-ile-faturana-yansit`
      ölçüldü (ikisi yapısal olarak birebir aynı).
- [x] **Hero (şikayet edilen madde):** canlı hero TEK değil İKİ layout —
      `lg`+ ekranda metin görselin ÜSTÜNE beyaz overlay olarak biniyor ve
      hiçbir gri kutu YOK; `lg` altında overlay gizlenip görselin altında
      `#f3f4f6` şerit çıkıyor ve metne yapışıyor (`my-[10px]`). Bizimki her
      ekranda `px-6 py-8` ile 96px'lik gri kutu çiziyordu. `ProductHero`
      artık iki dalı da yapıyor (h1 masaüstü dalında, mobil dalda düz div —
      canlının kendi yöntemi, tek h1 korunuyor).
- [x] **iconCards:** canlı kartlar düz `#F2F2F2` `rounded-md`, kırmızı 28px
      başlıklı. Blok beyaz+gölgeli, siyah 16px başlık çiziyordu →
      `CardsWithIcons`'a bağlandı (o zaten uyuyordu).
- [x] **steps:** canlı, `h-[226px] rounded-xl` kutuların 368px telefon
      görselini çevrelediği bir karusel, aktif kutu kırmızı dolu.
      `PhoneStepsCarousel` göç sırasında silinmişti → geri getirildi.
- [x] richText/video/logoGrid/imageTextSlides/videoList/campaignGrid sitenin
      kendi token'larına taşındı (1030px kolon, `text-2xl lg:text-4xl`
      başlık, `bg-vf-gray` yüzey).
- [x] **Ayrıca bulunan gerçek layout bug'ı:** `<main>` flex-column olduğu için
      `mx-auto` olan section'lar kendi metin genişliğine büzülüyordu — bir
      rich-text bölümü 1030px yerine 367px ölçüldü ve ortalandı. 15 section
      bileşenine + blok render'ına `w-full` eklendi.
- [x] Canlı doğrulama (masaüstü 1440 + mobil 375): overlay/şerit doğru
      breakpoint'lerde, başlık canlı gibi 2 satır, 4 section de 1030px.
      SSS bölümünün 1425px tam genişlik olması canlıyla AYNI — dokunulmadı.
- [x] `ProductHero` için 5 regresyon testi (canlı geometrisi teste bağlandı).
      Site 364, CMS 449 test; tsc/lint/build temiz.
- [ ] **Kullanıcı testi:** ürün sayfalarını ve `Layout Test Sayfasi`'nı
      masaüstü+mobilde canlıyla yan yana gözden geçir.

## 25. Canlı site layout envanteri — blok kütüphanesi 10 → 16 (27.08.2026)

**İstek:** "canlı sitenin tüm sayfalarında TAMAMEN AYNI STİL Mİ diye bakıp
düzelt, HEM DE canlı sitede kullanılmış ama bizde olmayan layoutları bul ve
ekle. Mesela görsel koymuşlar sağında da yazı var ama bizde bu layout yok."

**Araştırma yöntemi:** Canlı site her bölümünü DOM'da `widget_*` sınıfıyla
isimlendiriyor (`widget_VpayApp_NasilKazanirim`, `widget_CardsTitleSubtitle`,
`widget_PhoneSteps` …). 14 canlı sayfa tarandı ve **tam bölüm kataloğu**
çıkarıldı — tahmin değil, sitenin kendi isimlendirmesi. Katalog bizim 10
bloğumuzla karşılaştırıldı.

### Eklenen 6 yeni blok (hepsi canlıda kullanılıyor, bizde yoktu)

- [x] `howToEarn` — `widget_VpayApp_NasilKazanirim` (2 canlı sayfa). Bir
      tarafta ürün görseli, diğer tarafta ikonlu + bağlayıcı çizgili adım
      listesi. **Kullanıcının örnek verdiği eksik layout buydu.**
      `HowToEarn.tsx` zaten canlıya birebir uyuyordu, sadece blok olarak
      açılmamıştı.
- [x] `imageWithText` — `widget_WhereCanIBuy` + `widget_WhereCanIUse` (aynı
      şekil, iki isim). Görsel bir tarafta, başlık+metin diğer tarafta;
      `imageSide` ile taraf değiştirilebiliyor (canlı ikisini de kullanıyor).
      `WhereCanIBuy.tsx` de artık aynı bileşenden render oluyor → elle
      yazılmış sayfa ile editör sayfası birbirinden sapamaz.
- [x] `pricesAndLimits` — `widget_PricesAndLimits`. İçerik alanı YOK (rakamlar
      zaten Ücret/Limit koleksiyonlarında; kopyalamak editöre iki ayrı yer
      bakımı yüklerdi). `faqList`/`campaignGrid` ile aynı desen. İki koleksiyon
      da boşsa hiç render etmiyor.
- [x] `blogGrid` — `widget_Blogs`. `campaignGrid`'in blog karşılığı.
- [x] `featureHighlights` — `widget_Homepage_VpayAyricaliklarDunyasi`.
      Bileşen vardı ama medyası hardcoded'dı; `media` opsiyonel upload oldu.
- [x] `profileGrid` — `widget_BoardOfDirectors`. Fotoğraf + isim + unvan
      grid'i; kurul dışı ekip listeleri için de kullanılabilsin diye genel
      isimlendirildi.

### Bilinçli olarak blok yapılmayanlar

- [x] `widget_TextareaAndContent` → zaten `richText` bloğumuz.
- [x] `widget_DownloadVpayApp` → zaten `AppDownloadBanner`, sayfa bloğu değil,
      site genelinde render oluyor.
- [!] `widget_VideosWithTabs` / `widget_LeadForm` → bileşenleri var ama
      içerikleri hardcoded; R-23 gereği (gerçek video yok) bilinçli olarak
      CMS'e bağlanmadı. Değişmedi.

### Doğrulama

- [x] Test sayfasına 16 bloğun tamamı eklendi. Masaüstü 1440: 16/16 bölüm
      render oluyor, beklenmeyen genişlik 0, boş bölüm 0 (SSS'in 1425px tam
      genişliği canlıyla AYNI). Mobil 375: 16/16, yatay taşma 0.
- [x] importMap `npm run generate:importmap` ile üretildi (R-10 sayesinde
      artık elle düzenlenmiyor).
- [x] Site 372, CMS 449 test; tsc/lint temiz.
- [ ] **Kullanıcı testi:** `Layout Test Sayfasi`'nı masaüstü+mobilde gözden
      geçir; yeni 6 bloğu CMS'te kendi sayfanda dene.

## 26. İki gerçek bug: blok kaydetme hatası + sessiz kategori hatası (28.08.2026)

**Kullanıcı bildirimi:** "anasayfaya bir layout ekledim, oluşmadı" +
"/melihbatuhan'da bazı eklenen layoutlar gözükmedi".

### 26a. Sayfa kaydetme, elle yazılan blok tablolarında kırılıyordu

**Kök neden:** Yeni blokların DB tablolarını elle `CREATE TABLE` ile açmıştım
(R-10 sonrası bile push interaktif olduğu için). Payload'ın kendi ürettiği
tablolarda olan **`_parent_id → pages(id) ON DELETE CASCADE` foreign key'i ve
index'ler eksikti.** Payload bir sayfanın `layout`'unu güncellerken eski blok
satırlarını bu cascade ile temizliyor; olmayınca eski satırlar kalıyor ve
yeniden ekleme primary key'e çarpıyordu:
`Değer benzersiz olmalıdır / path: id / tableName: pages`.

Admin UI mevcut blok ID'lerini geri gönderdiği için **UI'dan her kaydetme
başarısız oluyordu**; benim API scriptlerim ID'leri sıyırdığı için fark
edilmemişti. Kullanıcının eklediği blok bu yüzden hiç kaydedilmemişti
(sayfanın yeni sürümü bile oluşmamıştı).

- [x] 28 blok tablosunun tamamına eksik FK + index eklendi
      (`scripts/fix-block-table-constraints.sql`, idempotent).
- [x] FK eklenemeyen tablolarda **50 yetim satır** bulundu ve temizlendi —
      bunlar zaten hatanın kaynağı olan artık kayıtlardı.
- [x] Doğrulandı: ID'leri koruyarak kaydetme, yeniden kaydetme ve yeni blok
      ekleme — üçü de OK. UI'dan da test edildi.

### 26b. Olmayan kategori yazılınca blok sessizce kayboluyordu

`/melihbatuhan`'daki SSS bloğunun kategorisi `testtttt` yazılmıştı; böyle bir
kategori yok → 0 soru → blok hiç render olmuyor, hiçbir uyarı yok. Projenin
kendi "sessiz maskeleme yapma" kuralına aykırıydı.

- [x] `faqList`/`campaignGrid`/`blogGrid` kategori alanlarına
      `categoryExistsValidate` eklendi — olmayan slug artık kaydedilemiyor,
      hata hangi blok/alan olduğunu söylüyor.
- [x] Payload iç içe blok `validate`'inden sadece alan yolunu yüzeye
      çıkardığı için, geçerli slug listesi editörün göreceği yere kondu:
      alanın altında canlı liste (`CategorySlugHint`, tr/en).
- [x] 5 birim testi. CMS 454 test geçiyor.
- [ ] **Kullanıcı testi:** CMS'te bir SSS/Kampanya/Blog bloğunun kategorisine
      olmayan bir şey yaz → kaydetmeye çalış (hata almalısın), alanın altındaki
      listeden doğrusunu seç.

## 27. ProductHeroes/FeatureCards/StepCards hayalet koleksiyonları emekliye ayrıldı, 2 sayfa Pages'e taşındı (28.08.2026)

`/aninda-bakiye`'deki adım kartlarının "Adım Kartları" listesinde neden
görünmediği sorusu, gerçek bir mimari kusuru ortaya çıkardı: bu üç koleksiyon
sidebar'da listeleniyordu ama DB'de sıfır kayıt vardı — `StepCards` render
kodunda hiç çağrılmıyordu bile. Gerçek içerik hep Pages'in kendi
`hero`/`steps`/`stepPhones`/`featureHighlights` bloklarındaydı.
`ProductHeroes`/`FeatureCards` tam ölü değildi — sadece iki elle-yazılmış
route'un (`/vodafone-pay-kart`, `/faturana-yansit`) hâlâ çağırdığı, boş
oldukları için hep hardcoded fallback'e düşen bir mekanizmaydı.

- [x] `/vodafone-pay-kart` ve `/faturana-yansit` gerçek Pages belgesine
      dönüştürüldü (id 9, 10) — mevcut hardcoded/fallback içerik bloklara
      taşındı, faturana-yansit'in 13 fallback SSS'i yeni bir
      `faturana-yansit` FAQ kategorisine seed edildi.
- [x] Migration'da bulunan 2 blok-alan açığı (EarnWithCard'ın sabit-görsel
      karuseli, VideoGuideSection'ın koyu panel) yeni blok yerine mevcut
      bloklara opsiyonel alan eklenerek kapatıldı: `iconCards.description`,
      `imageTextSlides.sideImage`/`intro`, `videoList.subheading`/
      `darkBackgroundImage`. `VideosWithTabs`/`LeadFormCta` için (gerçek
      içeriği olmayan, bilinçli hardcoded) 2 "marker" blok eklendi.
- [x] Üç koleksiyon kod + DB'den tamamen silindi
      (`scripts/drop-ghost-collections.sql`).
- [x] Mentalite AGENTS.md'ye yazıldı: yeni koleksiyon/alan aynı değişiklikte
      gerçek bir render yoluna bağlanmalı, önce Pages'in blok kütüphanesi
      genişletilmeli.
- [x] Bu mentalite kodun geri kalanına da uygulandı: `Pages.deeplink` ve
      `LegalPages.deeplink` kendi alan açıklamalarında "henüz render
      edilmiyor" diye itiraf ediyordu (RFP §3.1.7) — ikisi de artık
      "İlgili bağlantı →" linkiyle bağlandı (6 route + `[...slug]`).
      Diğer tüm koleksiyonlar taranıp aynı hastalıkta başka biri
      bulunmadı — Announcements/CookieRows/PageMeta boş ama gerçekten
      bağlı, sadece henüz veri girilmemiş (mimari kusur değil).
- [x] Canlı doğrulama: her iki sayfa tarayıcıda kontrol edildi, tüm içerik
      eskiyle birebir eşleşiyor; faturana-yansit ilk kez CMS'ten gerçek SEO
      meta alıyor. Admin sidebar'da "Ürün Sayfaları" grubu tamamen kalktı.
      468 CMS + 378 site testi geçti.

## 28. Growth Maker/Checker'ın kapsamı Campaigns'ten tüm CMS'e genişletildi (28.08.2026)

Gerçek AccessPoint rol matrisi paylaşıldı — kullanıcı bunlardan 3'ünü kabul
etti (4.'sü, "biz"/geliştirici kod erişimi, bilinçli olarak dışarıda
bırakıldı, dokunulmadı): `RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW` →
`NEW_VERTICAL_CHECKER`, `ROLE_VODAFONEPAY_CMS_MAKER_RW` → `GROWTH_MAKER`,
`ROLE_VODAFONEPAY_CMS_CHECKER_RO` → `GROWTH_CHECKER`. LDAP eşlemesi
(`roleMapping.ts`) zaten 18.08 refactor'ünden beri bu tam ID'lerle
yazılıydı — değişiklik gerekmedi. Asıl iş: Growth'un yetkisi bugüne kadar
sadece Campaigns'le sınırlıydı, artık New Vertical ile birebir aynı içerik
kapsamına sahip.

Kullanıcı onayıyla netleşen kararlar (AskUserQuestion):
1. Kapsam: New Vertical'ın gördüğü tüm içerik (14 collection + Media).
2. Silme: Growth Maker her yerde de sadece kendi taslağını silebilir.
3. Growth Checker artık hiçbir yerde create yapamaz (Campaigns'teki mevcut
   hakkı da kaldırıldı) — sadece onaylar/yayınlar.
4. Categories/Representatives/Documents'a da `versions.drafts:true`
   eklendi — taslak kavramı olmayan bu 3 collection'da da segregation-of-
   duties aynı şekilde işlesin diye.

- [x] `cms/src/access/roles.ts`'e paylaşılan yapı taşları eklendi:
      `growthCreate`, `growthReadWrite`, `standardCreate`,
      `standardReadWrite`, `standardDelete`, `denyMakerEditPublished`.
      Campaigns'in kendi zengin `reviewStatus`/`unpublishRequest`/
      `forceLiveEdit` sistemi BİLİNÇLİ OLARAK diğer collection'lara
      taşınmadı — onun yerine `denyMakerPublish` (yayınlayamaz) +
      `denyMakerEditPublished` (yayındakine dokunamaz) ikilisi genelleştirildi.
- [x] 13 "standard shape" collection + Campaigns + Media güncellendi:
      `createdBy` alanı eklendi (Campaigns/Pages'teki tekrar eden
      `setCreatedBy` de kaldırılıp var olan `hooks/ownership.ts`'teki
      `setOwnerOnCreate` paylaşılan hook'una taşındı).
- [x] Categories/Representatives/Documents'a drafts eklendi — DB migration
      (`scripts/growth-role-migration-28-08.sql`, idempotent): `_status` +
      `created_by_id` + tam `_v` versiyon tabloları, mevcut tüm satırlar
      `published`'e backfill edildi (site'ten hiçbir şey kaybolmadı).
- [x] `collectionLabels.ts`/`rolePermissions.ts` (elle bakımlı SOX matrisi)
      yeni duruma göre güncellendi.
- [x] 468 CMS testi geçiyor (roles.test.ts'e yeni fonksiyonlar için testler
      eklendi).
- [x] Canlı doğrulama: API'den tam senaryo (Growth Maker taslak oluşturur →
      yayınlayamaz → yayındakine dokunamaz; Growth Checker create edemez →
      taslağı yayınlayabilir; NV Checker davranışı değişmedi) ve gerçek
      admin UI'da (sidebar artık New Vertical ile aynı, yayındaki bir SSS'i
      düzenlemeye çalışınca doğru kırmızı hata toast'ı çıkıyor) test edildi.

## 29. Rol sistemi tam denetimi + kodda kalan içeriğin CMS'e taşınması (28.08.2026)

Kullanıcı §28'in gerçekten her collection'da doğru uygulanıp uygulanmadığından
emin olamadı ve üç şey istedi: (1) her collection'ı iki rolle tek tek, gerçek
login yaparak test et, (2) sitenin içeriğini gerçekten bu roller mi yönetiyor
doğrula, (3) eski kullanıcılar silinip gerçek rol matrisindekiler eklendi mi.

### 29a. Her collection × her akış, gerçek login ile

- [x] 14 collection için tam maker→checker akışı koşuldu (`create draft` →
      `edit own draft` → `publish (deny)` → `checker create (deny)` →
      `checker publish` → `maker edit published (deny)` → `maker real content
      edit (deny)` → `delete published (deny)` → `checker delete (deny)` →
      `NV checker create (deny)` → `NV checker update` → `maker kendi
      taslağını sil` → `anonim taslak görmesin`): **196/196 assertion geçti.**
- [x] Campaigns'in kendi zengin koruması ayrıca sondalandı: yayındaki bir
      kampanyada gerçek içerik değişikliği **409**, yayından kaldırma **403**,
      `forceLiveEdit` acil-düzeltme kaçış kapısı **403** — başlık hiç
      değişmedi. (İlk turda "GM edit published 200" görünmüştü; bu bir bug
      değil, Campaigns'in `guardPublishedEdit`'inin bilinçli olarak izin
      verdiği "yayın-nötr kayıt" — Growth Maker'ın yayından kaldırma TALEBİ
      oluşturabilmesi bunu gerektiriyor, RFP 5.4. Test aracı düzeltildi.)
- [x] Gerçek admin UI'da uçtan uca: Ece Boran (Growth Maker) Duyurular'da
      taslak oluşturdu (`Oluşturan` otomatik damgalandı) → "Değişiklikleri
      yayınla" **"Bu işlemi gerçekleştirmek için izniniz yok."** ile reddedildi
      → Mert Sarıhan (Growth Checker) listede taslağı gördü, **"Yeni oluştur"
      butonu kendisinde hiç yok** → onayladı → içerik `/duyurular`'da canlıya
      çıktı.

### 29b. Kodda kalan, hiçbir rolün yönetemediği içerik CMS'e taşındı

Denetimde asıl açık buydu: bazı collection'lar boştu ve o sayfaların içeriği
kodda duruyordu — yani hiçbir rol onları değiştiremiyordu.

- [x] `cookie-rows`: 59 satırlık çerez tablosu `cookieRows.ts`'ten CMS'e
      taşındı (Growth Maker taslak → Growth Checker onay, 59/59 başarılı).
      Hardcoded dosya ve fixture testi silindi.
- [x] `page-meta`: 16 elle-yazılmış route'un SEO başlık/açıklama ve breadcrumb
      metni CMS'e taşındı (aynı akış). Alan-bazlı `?? "sabit"` varsayılanları
      son çare olarak duruyor — silinen bir satır sayfayı `<title>`'sız
      bırakmasın diye.
- [x] `legal-pages`: 5 hukuki sayfadan 4'ünün gövdesi kodda duruyordu, hepsi
      CMS'e taşındı. Ardından 4 sayfanın ölü yedeği kaldırıldı (kodun kendi
      yorumu "koleksiyonu doldurduğun aynı değişiklikte kaldır" diyordu).
- [x] Tam tur kanıtı: Growth Maker içerik ekler → **site değişmez** (taslak) →
      Growth Checker onaylar → **site değişir**; Growth Maker yayındaki
      `page-meta` kaydını düzenleyemez (403), Checker düzenler (200) ve
      `/iletisim` sayfasının `<title>`'ı anında değişir.
- [x] Kalan boş collection: sadece `announcements` (0 kayıt) — ama orada kodda
      da içerik yok, yani zaten tamamen rol-yönetimli, sadece henüz veri
      girilmemiş. Mimari açık değil.

### 29c. Kullanıcılar gerçek rol matrisine göre yeniden oluşturuldu

- [x] 4 `test-*@vodafonepay.local` fixture'ı silindi; matristeki 6 gerçek kişi
      eklendi (4 Growth Maker, 1 Growth Checker, 1 NV Checker) —
      `scripts/seed-real-users.mjs` (idempotent, Payload'ın pbkdf2
      parametreleriyle). `admin@vodafonepay.local` bilinçli korundu: 4. rolü
      taşıyor ve kullanıcı yönetimi/denetim/silme/çeviri yetkisi olan tek rol o.
- [x] Canlıda bulunan bug: e-postalar büyük harfle yazılınca hiçbir zaman
      giriş yapılamıyordu (Payload girişte küçük harfe çeviriyor, benzersiz
      indeks ise harf duyarlı). Script artık `norm()` ile küçültüyor. 7/7 hesap
      giriş yapabiliyor; tam denetim (196/196) bu gerçek hesaplarla tekrarlandı.
- [x] Erişim Matrisi ekranına gerçek AccessPoint kimlikleri eklendi: her rolün
      AD grup adı, yetkili departmanı, rol sorumlusu, kritiklik durumu ve ne
      yapabildiğinin özeti (`ROLE_DIRECTORY`, `roleMapping.ts`). CSV dışa
      aktarımı da bu sütunları taşıyor — denetçi tabloyu kaynak rol matrisiyle
      doğrudan eşleştirebiliyor.

### 29d. Yan bulgu: aylardır kırık olan 3 test düzeltildi

`src/app/__tests__/page.test.tsx` `getPageBySlug`'ı mock'lamıyordu; testler
gerçek CMS'e HTTP isteği atıyor, dev CMS ayaktayken canlı anasayfa belgesini
çekip async `BlockRenderer`'ları render etmeye çalışıyor ve tüm ağaç boş
dönüyordu — ortama bağımlı, kalıcı kırıklık. Mock eklendi.

- [x] **Site: 380/380 test geçiyor** (önceki turlarda 377/380 idi).
- [x] **CMS: 468/468 test geçiyor.**

### 29e. Yayınla butonu Checker'a alındı + gerçek UI turu (API değil)

Kullanıcı haklıydı: 29a–29d'deki 196 kanıtlık denetim **tamamen API üzerinden**
koşuyordu ve tek bir collection UI'da gezilmişti. Bu turda 14 collection'ın
hepsi tarayıcıda tek tek, iki rolle açıldı — ve API testlerinin **yapısal
olarak göremeyeceği** üç ayrı hata çıktı.

- [x] **Yayınla butonu Maker'da kaldırıldı** (kullanıcı isteği: "zaten maker
      yayınlayamıyor, yayınla butonunun olmasına gerek yok, checker'da olsun").
      Payload butonu `update` yetkisi olan herkese basıyor ve `denyMakerPublish`
      hook'undan haberi yok; Maker'ın gördüğü buton sadece 403 toast
      üretebiliyordu. Yeni `MakerAwarePublishButton` yerine gri "Onay bekliyor
      (Checker yayınlar)" bilgisi gösteriyor. Aktif checker vekili (delegate)
      gerçek butonu görmeye devam ediyor — sunucu tarafında yayınlama hakkı
      var, UI'da elinden alınmamalı. 14 collection'a bağlandı; Campaigns kendi
      `RoleAwarePublishButton`'ını (reddet / yayından kaldırma talebi / acil
      canlı düzenleme akışı) koruyor.
- [x] **Bug 1 — boş `_v` tabloları:** Categories/Representatives/Documents'a bu
      turda draft eklenmişti ama mevcut satırların versiyon kaydı yoktu;
      Payload admin ilişki seçicilerini versiyon tablosundan okuduğu için SSS
      formundaki kategori seçicisi "Seçenek yok" diyordu. Migration'a PART 6
      (geriye dönük versiyon doldurma) eklendi. **API testleri bunu göremezdi:
      ilişki id'lerini doğrudan gönderiyorlar, seçiciyi hiç açmıyorlar.**
- [x] **Bug 2 — `importMap.js`:** `MakerAwarePublishButton` kayıt defterine
      eklenmeyince Payload yayınla yuvasına **hiçbir şey** basmadı — iki rol
      için de. Eşlenmemiş bileşen yolu hata vermiyor, sessizce boş render
      ediyor. R-10 geleneği gereği elle eklendi. **Ders: `admin.components.*`'a
      yeni bir yol yazan her değişiklik aynı commit'te `importMap.js`'e de
      girmeli, ve sonucu tarayıcıda görülmeli.**
- [x] **Bug 3 — Checker'da "Yeni Ücret Satırı" butonu:** `/admin/fees-and-limits`
      elle yazılmış bir görünüm (FeeRows/LimitTables `admin.hidden`), ve
      `CreateButton` hiçbir yetki kontrolü yapmıyordu. Growth Checker'ın
      tasarım gereği hiçbir yerde `create` yetkisi yok; buton çalışır
      görünüyor, kaydetmede 403 veriyordu. `useAuth().permissions` ile
      gizlendi — yayınla butonuyla birebir aynı ilke. 2 test eklendi.
- [x] **Growth Maker (ece.boran), 14/14 collection tarayıcıda doğrulandı:**
      sadece `Onaya Gönder` + gri `Onay bekliyor (Checker yayınlar)`, yayınla
      butonu yok — faq-items, pages, announcements, blog-posts, content-blocks,
      cookie-rows, nav-links, page-meta, categories, representatives,
      legal-pages, campaigns, fee-rows (drawer), limit-tables (drawer).
- [x] **Growth Checker (mert.sarihan) tarayıcıda doğrulandı:** her collection'da
      `Değişiklikleri yayınla` görünüyor, hiçbirinde "Yeni oluştur" yok;
      fee-rows/limit-tables drawer'ında da yayınla var, create butonu yok.
      Uçtan uca kanıt: Checker bir SSS taslağını yayınladı ("Başarıyla
      güncellendi.", durum → Yayınlandı, Sürümler 2), ardından Maker aynı
      kayıtta yayınla butonu yerine bekleme bilgisini gördü.
- [x] `documents`/`fee-rows`/`limit-tables` doğrudan `/admin/collections/...`
      adreslerinde 404 veriyor — `admin.hidden: true` olduğu için beklenen
      davranış, düzenleme kendi drawer'ları üzerinden.
- [x] **CMS: 470/470, site: 380/380 test geçiyor**; `tsc --noEmit` ve `eslint`
      iki projede de temiz.

### 29f. Gerçek UI turu: her collection'ın her alanı elle dolduruldu

Kullanıcının ikinci itirazı da yerindeydi — 29e'de 14 collection'ın *yayınla
butonunu* tarayıcıda doğrulamıştım, ama gerçek "Maker içerik yazar → Checker
onaylar → siteye düşer" döngüsünü sadece birkaçında koşturmuştum. Bu turda 13
collection'da form baştan sona elle dolduruldu, Maker taslağı gönderdi, Checker
tek tek yayınladı ve 14/14 içerik render edilmiş sayfada arandı.

- [x] **13 collection'da uçtan uca döngü**: duyuru, kategori, blog yazısı,
      temsilci, içerik bloğu, menü linki, çerez satırı, sayfa meta, SSS, sayfa
      (Hero bloğuyla), kampanya, ücret satırı (drawer), limit tablosu (drawer).
      Taslakken site değişmedi, Checker onayladıktan sonra 14/14 göründü.
- [x] **Kampanyaların reddetme döngüsü**: Checker "Reddet" → gerekçe zorunlu,
      boşken buton pasif → durum "Reddedildi", red sebebi/tarihi/reddeden
      kaydedildi → Maker panosunda "Taslaklarınız: Reddedildi" bildirimi →
      Maker eksiği tamamlayıp tekrar gönderdi → durum otomatik "İncelemede"ye
      döndü ve red bilgileri temizlendi (`manageReviewCycle`).
- [x] **Checker'a özel yayın öncesi canlı önizleme** (Kampanyalar): "Onayla ve
      Yayınla" modalı kampanya kartını gerçek görünümüyle gösteriyor.
- [x] Sıra öneri bileşeni her collection'da doğru grubu sayıyor (ör.
      content-blocks'ta page+blockType, categories'te scope), ilişki seçicileri
      dolu, medya seçici filtreleri ve arama çalışıyor, çakışan slug net hata
      veriyor, zorunlu alan hatası hem toast hem alan işaretiyle geliyor.

### 29g. Turun çıkardığı 5 canlı hata

1. **Alan etiketleri İngilizceydi.** Payload etiketi olmayan alanın `name`'ini
   başlığa çeviriyor; Türkçe panelde "Business Name", "Rep Code", "Page Key",
   "Unverified Limit" yazıyordu — altlarında Türkçe açıklamalarla. Temsilciler
   11 alanda 1 etikete, Pages 96 alanda 12'ye sahipti. Hepsi tr/en etiketlendi,
   array'lere `labels` eklendi ("Grup 01 / Belge 01 / Belge ekle" da Türkçeleşti).
2. **Ücret/limit drawer'ından kayıt 404'e düşürüyordu.** Payload create sonrası
   yeni kaydın kendi route'una yönlendiriyor (`depth < 2 && redirectAfterCreate
   !== false`); iki collection da `admin.hidden` olduğu için o route 404. Kayıt
   doğru oluşuyor, editör siyah hata sayfasında kalıyordu. `redirectAfterCreate={false}`.
3. **`ContentBlocks` koleksiyonunun tamamı ölüydü** — çağrısı vardı ama o dal
   `anasayfa` Pages kaydı yayınlandığı gün çalışmayı bıraktı. Emekliye ayrıldı
   (`scripts/retire-content-blocks-29-08.sql`). Ders: "çağrısı var" yeterli
   kontrol değil; kontrol, render edilmiş sayfada değişikliği görmek.
4. **`PageMeta` her CMS sayfasında sessizce okunmuyordu** — oysa kendi yardım
   metni örnek olarak `/aninda-bakiye`'yi, yani bir CMS sayfasını veriyor.
   Artık fallback: sayfanın kendi SEO alanları önde, boşsa PageMeta devreye
   giriyor. `/ulasim-odemeleri` ile canlıda doğrulandı.
5. **`warm-cache.sh` .env'i okumuyordu**, `dev-revalidate-secret` varsayılanına
   düşüp her deploy'da 401 veriyordu — yani dokümante edilmiş tek deploy-sonrası
   adım sessizce hiç çalışmamış. Bu turda bir rebuild `/`'a CMS'siz fallback'i
   gömdü ve hiçbir şey süpürmedi; düzeltmeden sonra sweep sayfayı geri getirdi.

### 29h. Canlı sayfa kimse tarafından kaydedilemiyordu

`Pages`' `faqList.category` serbest metindi, sonradan `categoryExistsValidate`
eklendi ama mevcut satırlar taranmadı. İki satırda geçersiz slug kalmıştı
(`aninda-bakiye`, `batuhan`). Payload kaydederken tüm dokümanı doğruladığı için
**`/aninda-bakiye` yayındaki ürün sayfası hiçbir rol tarafından kaydedilemiyordu**
— editör dokunmadığı bir alandan hata alıyor, blok da ziyaretçiye hiçbir şey
basmadığı için kimsenin bakmak için sebebi olmuyordu.

- [x] Eksik "Anında Bakiye" SSS kategorisi gerçek Maker→Checker akışıyla
      oluşturuldu; sayfa tekrar kaydedilebiliyor (200).
- [x] `ozge-aydiner`'ın geçersiz `batuhan` referansı temizlendi.
- [x] Kural AGENTS.md'ye yazıldı: mevcut satırı olan bir alana `validate` /
      `required` / daraltılmış `options` eklemek bir veri migration'ıdır.

### 29i. Checker yayından kaldıramıyor (açık bulgu)

Growth Checker 13 standart collection'ın hiçbirinde admin arayüzünden içeriği
yayından kaldıramıyor. Sunucu izin veriyor (unpublish bir `update`; REST PATCH
200 döndü), ama iki bağımsız sebep butonu gizliyor: Payload'ın ⋮ menüsü
`hasCreatePermission || hasDeletePermission` istiyor (Checker'da ikisi de yok,
tasarım gereği), ve `UnpublishButton` ayrıca `typeof versions.drafts === 'object'`
arıyor — bu collection'lar `drafts: true` (boolean) kullanıyor. Yani yayını
kontrol eden rol yayınlayabiliyor ama geri alamıyor. Kampanyalar kendi
unpublish-request akışına sahip olduğu için etkilenmiyor.

**Kalan iş:** ⋮ dışına görünür bir "Yayından Kaldır" kontrolü + `drafts: true`
yerine `drafts: {}`. Bu tur içinde yapılmadı — yeni bir admin bileşeni ve 13
collection'da şema dokunuşu demek.

### 29j. Test verisi canlıdan kaldırıldı

- [x] `/test`, `/layout-test-sayfasi`, `/melihbatuhan`, `/ozge-aydiner` →
      Görünürlük "Gizli" (sayfaların bu iş için zaten bir alanı vardı; kayıt
      duruyor, ziyaretçiye ve sitemap'e çıkmıyor). Dördü de 404.
- [x] Footer'daki "layout Test Sayfası" menü linki, "Test ediyorumaa" ve
      "Batuhan Test Kampanyası!" kampanyaları, "...miyim?2" yazım hatalı SSS →
      yayından kaldırıldı (Checker yetkisiyle).
- [x] `sozlesmeler-ve-formlar` hukuki sayfasının başlığı ve giriş metni "test"ti
      ve canlı sayfada H1 olarak "test" görünüyordu → gerçek metinle değiştirildi.
- [x] sitemap.xml ve /site-haritasi temiz.

### 29k. Canlı site ile önyüz karşılaştırması (1440px, hesaplanmış CSS)

Bölüm sırası birebir aynı: Header → Hero → StepPhones → FeatureHighlights →
Kampanyalar → SSS → Footer. Font ailesi aynı (VodafoneRegular/Light/Bold);
bizde `ui-sans-serif` sızıntısı yok, canlıda SSS başlıklarında var. Bölüm H2'si
36px/40px, kart H3'ü 20px/28px, gövde 18px, kapsayıcı genişlikleri
1030/998/896 — hepsi eşleşiyor.

- **Tek ölçülen fark:** hero H1 — canlı 26px/32.5px, bizde 36px/45px. Ayrıca
  canlı başlığı iki satıra bölüyor ("Vodafone Pay" / "Ödemenin Akıllı Hali"),
  bizdeki tek satırda em-dash ile birleşik. İkincisi CMS içeriği (Hero bloğunun
  başlığı), ilki kod.
- **İçerik farkları (layout değil):** canlıda 5 stepPhone öğesi var, bizim
  `anasayfa` kaydında 2; canlı anasayfada 2 kampanya kartı gösteriyor, biz
  13'ünü birden basıyoruz (campaignGrid bloğunun `limit` alanı boş); canlı SSS
  bölümü seçili birkaç soru, bizde ~25 soru listeleniyor (faqList `limit` boş).
  Üçü de CMS'ten ayarlanabilir, kod değişikliği gerekmiyor.

**Not:** tarayıcı paneli oturumun bir kısmında gizli kaldığı için görsel
karşılaştırma ekran görüntüsüyle değil, iki sitede aynı seçicilerden okunan
hesaplanmış CSS değerleriyle yapıldı — tipografi/renk/ölçü için daha kesin,
ama boşluk ve hizalama için piksel karşılaştırması hâlâ yapılmadı.

### 29l. Checker artık yayından kaldırabiliyor (29i kapandı)

29i'de "kalan iş" diye bıraktığım şey yapıldı. Bir düzeltmeyle: orada iki
bağımsız sebep saymıştım, ikincisi yanlıştı. `UnpublishButton`'ın aradığı
`typeof versions.drafts === "object"` koşulu bizde zaten sağlanıyor — Payload
config sanitize'ında `drafts: true`'yu istemciye göndermeden önce nesneye
çeviriyor (`collections/config/sanitize.js:164`). Yani 13 collection'da şema
değişikliği gerekmedi; **tek engel ⋮ menüsüydü.**

- [x] `MakerAwarePublishButton` artık Payload'ın kendi `UnpublishButton`'ını
      Yayınla'nın yanında render ediyor. Sıfırdan yazmak yerine onunkini
      kullanmak bilinçli: onay modalı, sürüm sayacı bakımı ve **minimal
      `{_status:"draft"}` PATCH'i** onda hazır. Sonuncusu önemli — yayından
      kaldırma, dokümanın başka bir yerindeki doğrulama hatasına takılmamalı;
      `/aninda-bakiye` tam olarak öyle kilitlenmişti (29h). Bizim olan iki şey:
      etiket (panelin dilinde) ve stil (`PopupList.Button` markup'ı bir dropdown
      için yapılmış, `.mapb-unpublish` ile ikincil toolbar butonuna çevriliyor).
- [x] **Turda çıkan yeni hata:** Maker'ın ⋮ menüsünde "Yayından Kaldır"
      görünüyordu (create yetkisi olduğu için menü açılıyor, ve Payload
      `hasPublishPermission`'ı sadece `update` erişiminden türetiyor). Tıklayınca
      `denyMakerEditPublished` 403'ü geliyordu — mesajı da "önce bir Checker'dan
      yayından kaldırmasını isteyin" diyordu, yani panel editöre yayından
      kaldırma denemesine karşılık Checker'dan yayından kaldırmasını istemesini
      söylüyordu. 14 collection'da `admin.components.edit.UnpublishButton`
      → `HideMenuUnpublishButton` (hiçbir şey render etmiyor) ile menüden
      kaldırıldı; kontrol tek yerde, tek kuralla toolbar'da.
- [x] **Payload'ın Türkçesi düzeltildi.** `version:unpublishedSuccessfully`
      için gelen çeviri "Başarıyla yayınlanmadı." — yani "başarıyla YAYINLANMADI",
      az önce sayfayı indiren editöre verilecek güvencenin tam tersi. Dil
      paketini fork etmek yerine `i18n.translations` ile tek anahtar ezildi:
      "Yayından kaldırıldı."
- [x] Tarayıcıda doğrulandı: Checker butonu görüyor → onay modalı → SSS kaydı
      taslağa döndü ve `/sikca-sorulan-sorular` sayfasından düştü → geri
      yayınlandı. Maker'da ne toolbar butonu ne de menü öğesi var; menüsünde
      sadece "Yeni oluştur" ve "Çoğalt" kaldı. Kampanyalarda Checker kendi
      "Yayından Kaldır ve Düzenle" akışını görüyor, mükerrer kontrol yok.
- [x] `MakerAwarePublishButton.test.tsx` eklendi (4 test: Maker, Checker,
      New Vertical Maker, aktif vekil). CMS 473/473.

---

# Görev Listesi — 30.08.2026 turu (PoC hazırlığı)

29.08'de yapılan genel değerlendirmenin ("neyi iyi yaptık, ne eksik, PoC'yi
neyin etkileyeceği") sonucunda kullanıcının onayladığı 6 maddelik paket
(madde 32-36) + PROJECT-OVERVIEW.md'yi güncellerken bulunan acil bir canlı
bug'ın kaydı (madde 30).
Gözlemlenebilirlik (Sentry/APM) OpenShift'e taşınma planına bırakıldığı için
bu turun kapsamı dışında bırakıldı — bilinçli, dokunulmadı.

Sıra kullanıcının "sırayla, acele etmeden, her adımı test ederek" isteğine
göre belirlendi: önce bağımsız/hazırlık işleri (docs, güvenlik taraması),
sonra docs'un beslediği wiki route'u, sonra görsel/UX cilası, en son
dashboard + diyagram (ikisi de görünürlük/anlatım işi, önceki maddelere bağlı
değil).

## 30. ACİL — canlıda 404 veren "Vodafone Pay Uygulaması" sayfası kurtarıldı

**Nasıl bulundu:** Madde 31'i yazarken (PROJECT-OVERVIEW.md'yi güncel duruma göre
yeniden yazmak için route yapısını doğrularken) `pages` tablosunda id sırası
7 → 9 diye atlıyordu. id 8, `vodafone-pay-uygulama` slug'ının kendisiydi —
19.08'deki pilot göçle (`docs/STATUS.md` §2.10) CMS'e taşınmıştı, ama hiçbir
audit-log kaydı ve `_pages_v` satırı olmadan bir noktada silinmiş (API dışı
bir yoldan — muhtemelen erken bir SQL script). Header'ın "Ürünler" menüsündeki
NavLinks satırı (pozisyon 1, yayında) hâlâ `/vodafone-pay-uygulama`'ya
gidiyordu — **her ziyaretçi menüyü açıp ilk ürünü tıkladığında 404 alıyordu.**
Sayfanın Category'si (`vodafone-pay-uygulama` SSS scope'u) ve o kategoriye
bağlı FAQ'ler de sayfayla birlikte silinmiş; bunlar DB-only içerikti, git'te
hiç yoktu, **kurtarılamaz.**

- [x] Kurtarılabilir gerçek içerik (hero başlığı/görseli + 3 "Nasıl
      Kazanırım" adımı) `a0d65bf~1`'deki son CMS-öncesi commit'ten alındı —
      uydurma değil, sayfanın gerçek eski kopyası.
      `scripts/recover-vodafone-pay-uygulama-30-08.mjs` (idempotent) 5 görseli
      yükledi, Maker taslağı açtı, Checker yayınladı.
- [x] **Bulunan ikinci bug:** `Pages.slug` alanı her zaman `title`'dan
      otomatik türetiliyor (`generateSlug` hook'u) — script'e verdiğim açık
      `slug: "vodafone-pay-uygulama"` görmezden gelinip başlıktan
      `vodafone-pay-uygulamasi` üretildi ("Uygulaması" kelimesinin olduğu gibi
      slugify edilmesi). Hook sadece `create`'te çalıştığı için başlığı
      değiştirmek de düzeltmezdi; Checker olarak `PATCH /api/pages/18
      {slug:"vodafone-pay-uygulama"}` ile elle düzeltildi (alan `admin.readOnly`
      ama `access.update` kısıtı yok, API'den yazılabiliyor).
- [x] **Bilinçli olarak eklenmeyen:** SSS bloğu. Orijinal sorular DB-only
      olduğu için hiçbir yerde yok — uydurma soru/cevap yazmak projenin kendi
      "sahte içerik üretme" kuralına aykırı olurdu. Bu, editörün gerçek
      SSS'leri yeniden yazması gereken açık bir madde.
- [x] Canlı doğrulama: `/vodafone-pay-uygulama` artık 200, hero+adımlar
      doğru render oluyor, anasayfadaki "Ürünler" menüsü linki artık çalışıyor.
- [ ] **Kullanıcı kararı bekliyor:** SSS bölümü için yeni bir Category +
      gerçek soru/cevaplar kim tarafından yazılacak?

## 31. Docs/ klasörü konsolidasyonu

**İstek:** "bi toplayalım hangi döküman neyi anlatıyor diye. hem development
sürecinde bize yarayacak şekilde olanları birleştiririz hem de gerçekten
ürünün son halini anlatan ve kritik noktalarımızı hem kendimiz notlamış
oluruz hem de claude sessionlarım hatırlar. 45 rapor gerçekten fazla geldi
bana da. gerek yok."

- [x] `docs/` altındaki 30 dosyanın tamamı okunup kategorize edildi (bir agent
      ile — mimari/karar, kronolojik fix raporu, RFP/gap analizi, kullanıcı
      testi/walkthrough, prompt arşivi, "bizim değil, referans vendor CMS
      notu"). Sonuç: 27+1 (STATUS.md) rapor/prompt/plan dosyası + kullanıcının
      farkında olmadığı 2 tane "Butterfly" (referans vendor CMS) dosyası.
- [x] İki hedef doküman yazıldı (planlanandan biraz farklı çıktı — `STATUS.md`
      zaten `tasks.md`'yle içerik olarak çakışıyordu ve ondan geride kalmıştı,
      genişletmek yerine görevini `tasks.md`'ye devretti):
      1. **`docs/HISTORY.md`** — arşivlenen 20 dosyanın kronolojik indeksi
         (hangi tarih, ne anlatıyor, hangi prompt hangi raporu üretti).
         Detayları kaybetmeden birleştirmenin yolu: dosyaların İÇERİĞİNİ tek
         tek yeniden yazmak değil (kayıp/hata riski yüksek), `docs/archive/`e
         taşıyıp üstüne bir indeks koymak.
      2. **`docs/PROJECT-OVERVIEW.md`** — tamamen yeniden yazıldı (eskisi
         25.08'den kalmaydı, artık var olmayan 3 koleksiyonu hâlâ listeliyordu,
         rol modeli/test sayıları bayattı). Şimdi: gerçek AccessPoint rol
         eşlemesi, 19 güncel koleksiyon, 5/5 ürün sayfası Pages'te, PoC
         bağlamı + bilinen sınırlamalar tablosu (§11) — iş insanına da
         gösterilebilir.
- [x] 20 dosya `docs/archive/`e taşındı (git mv, içerik korunarak):
      `STATUS.md`, `RFP-GAP-ANALYSIS.md` (eski), `CMS_INTEGRATION_PLAN.md`,
      `DUZELTME-TURU-RAPORU.md`, `DUZELTME-TURU-3-RAPORU.md`,
      `GUVENLIK-TARAMA-VE-ROL-TESTI.md`, `KATEGORI-SSS-TURU-RAPORU.md`,
      `RICHTEXT-SIRA-TURU-RAPORU.md`, `UI-WALKTHROUGH-MAKER.md`,
      `UI-WALKTHROUGH-CHECKER.md`, `AUDIT-CONTENT-CMS.md`,
      `BACKLOG-CONTENT-CMS.md`, `CLAUDE-CODE-PROMPT.md`…`-5.md`,
      `CONTENT-CMS-AUDIT-PROMPT.md`, `PRODUCTION_READINESS_PROMPT.md`,
      `T0-PRODUCTION-READINESS.md`. `docs/` kökü: 27+ dosya → 9 dosya
      (+ `HISTORY.md`, `PROJECT-OVERVIEW.md`).
- [x] **Beklenmeyen bulgu:** `varnish-cache.md` ve (agent'ın ilk taramada
      kaçırdığı) `PAGE-CREATE-PRODUCTION.MD` bizim raporumuz değil — gerçek
      vodafonepay.com.tr'nin çalıştığı vendor CMS'in ("Butterfly") kendi
      cache/sayfa-oluşturma mimarisi notları, `LAYOUT-PARITY.md`'nin
      "Butterfly parity analizi" için referans olarak kullanılmış. Arşive
      değil, yeni bir `docs/reference/`e taşındı — bunlar tarihsel değil,
      hâlâ geçerli tasarım-ilhamı kaynağı.
- [x] Kırılan tüm çapraz referanslar düzeltildi: `cms/README.md` (kökten
      kökten yanlış — 9 koleksiyon/Strapi-planı/no-approval-workflow
      diyordu, artık kısa + `PROJECT-OVERVIEW.md`'ye yönlendiriyor),
      `cms/payload.config.ts` (R-10 yorumu), `docs/RFP-OPEN-ITEMS.md`,
      `docs/RFP-GAP-ANALYSIS-2026-08-24.md`, `docs/CMS-USER-TESTS.md`,
      `vodafonepaycomtr/src/lib/cms.ts` + `cms/src/collections/Pages.ts`
      (`PAGE-CREATE-PRODUCTION.MD` yolu).
- [x] `docs/research/` (INSPECTION_GUIDE.md/PAGE_TOPOLOGY.md/BEHAVIORS.md) ve
      `docs/design-references/` **bilinçli olarak dokunulmadı** —
      `.claude/skills/clone-website/SKILL.md` bu tam yollara yazıyor, kendi
      geçmişimiz değil, aktif bir araç konvansiyonu.

## 32. Güvenlik taraması gerçekten çalıştırılıp ölçülsün

**İstek:** "bunları daha önceden yaptık ama ölçmemişiz büyük ihtimal."

**Durum:** tasks.md'nin kendi geçmişi (madde 16, 17, 22) Sonar'ın gerçekten
çalıştırıldığını ve `0 açık bulgu`ya indirildiğini gösteriyor — yani iddia
boş değil, iş yapılmıştı. Ama o turlarda kullanılan `SONAR_TOKEN` hiçbir yerde
kalıcı değildi (o zaman `.sonar-token` mekanizması yoktu) ve şu an ne ortam
değişkeni ne dosya olarak mevcut; SonarQube kendi de (parola ile bile) bana
login yaptırılamıyor — bu kalıcı bir kural. **Kullanıcıdan yeni bir token
gerekiyor** (My Account → Security → Generate Tokens → `.sonar-token`'a
yapıştır, `scripts/sonar-scan.sh` otomatik okuyor).

- [ ] Kullanıcıdan `.sonar-token` bekleniyor.
- [ ] Token gelince: `scripts/sonar-scan.sh all` çalıştırılıp güncel
      coverage/duplication/açık bulgu sayıları bu maddeye kaydedilecek.
- [ ] `scripts/trivy-scan.sh all` çalıştırılıp güncel CVE durumu kaydedilecek
      (son çalıştırma madde 22'deydi, o zamandan beri image/deps değişmiş
      olabilir).
- [ ] İkisinin sonucu da bu maddeye rakamla yazılacak — PoC sunumunda
      söylenebilecek somut bir cümle olsun diye.

## 33. CMS admin içinde kullanım kılavuzu (wiki) route'u

**İstek:** "bi tane cms de docs route'u yapabiliriz ve bildiğin wiki gibi
sırayla cms adminde hem rolleri tanıtarak başlayan hem loginle başlayan
kullanıcı sıkışırsa napacağını hangi collection'da neler yapabileceğini ekran
görüntüleriyle içeren bir docs yapabiliriz kullanım amaçlı."

- [x] Yeni admin view: `/admin/guide` (`GuideView.tsx` + `GuideApp.tsx`),
      `payload.config.ts`'e `views.guide` + `afterNavLinks` girişi olarak
      eklendi. `npm run generate:importmap` ile üretildi (R-10 sayesinde elle
      düzenlemeye gerek kalmadı).
- [x] İçerik iskeleti tam istenen sırayla: Başlarken (login) → Rolünüz Ne
      Yapabilir (4 rol) → Dashboard'u Okumak → Koleksiyon Rehberi → Sıkıştım
      Ne Yapmalıyım. Anchor'lı bir "İçindekiler" üstte sabit duruyor.
- [x] **Karar (kullanıcıya gerekçeyle):** gerçek piksel ekran görüntüsü
      YOK. Elimdeki tarayıcı araçları bir ekran görüntüsünü dosyaya kaydedip
      bileşene gömecek bir yol vermiyor (sadece sohbet içinde görüntülüyor).
      Onun yerine her bölüm, tam buton metni/sidebar grup adı gibi somut
      referanslarla yazıldı ("toolbar'daki 'Yayından Kaldır' butonu" gibi) —
      bu ayrıca bir arayüz küçük bir detay değiştiğinde piksel görüntünün
      bayatlaması riskini de ortadan kaldırıyor. Gerçek ekran görüntüsü
      istenirse `GuideApp.tsx` eklenecek dosya.
- [x] **İçerik neredeyse tamamen mevcut, zaten doğrulanmış kaynaklardan
      derlendi, sıfırdan yazılmadı** — Rol bölümü `getRoleDirectory()`'den
      (Erişim Matrisi'nin de kullandığı gerçek RFP rol özetleri), Koleksiyon
      Rehberi `HELP_CONTENT`'ten (her koleksiyonun kendi '?' butonunun
      kullandığı içerik) besleniyor. Bu, iki yüzeyin birbirinden
      kopmasını yapısal olarak imkansız hale getiriyor.
- [x] **Bu sırada bulunan 2 küçük bayat içerik düzeltildi:** `helpContent.ts`
      Sayfalar rehberi hâlâ "10 blok var" diyordu (gerçek sayı 16, blok
      kütüphanesi item 25'te büyüdü) — güncellendi. `Categories.ts`'in kendi
      yorumu "Deliberately New-Vertical-only (not Growth-scoped)" diyordu —
      28.08'den beri yanlış (Growth artık `standardCreate` ile erişiyor);
      düzeltildi. Ayrıca `HELP_CONTENT`'te eksik olan tek koleksiyon
      (`categories`) eklendi — `HelpButton`'ın kendisi de artık orada
      içerik gösteriyor.
- [x] tr/en — `useAdminLocale()` + local `STRINGS` map deseni (rol
      özetleri/koleksiyon içerikleri zaten kendi kaynaklarından iki dilli
      geliyor).
- [x] Sidebar: "Sistem" grubunda, Erişim Matrisi'nin hemen altında "Nasıl
      Kullanılır?" linki.
- [x] Testler: `GuideApp.test.tsx` (5 test — tüm bölümler render oluyor,
      4 rolün tamamı listeleniyor, sadece giriş yapan kullanıcının kendi
      rolü "Siz" rozetiyle işaretleniyor, tanınmayan rolde rozet çıkmıyor,
      koleksiyon rehberi gruplanmış şekilde render oluyor). CMS 536/536,
      tsc/eslint temiz.
- [x] Canlı doğrulama: `docker compose up -d --build cms`, `/admin/guide`
      hem Growth Maker (ece.boran, "Growth — Maker" kartı "Siz" rozetli)
      hem Growth Checker (mert.sarihan, "Growth — Checker" kartı "Siz"
      rozetli) olarak tarayıcıda gezildi.

### 33b. Zenginleştirme — "sayfa sayfa" koleksiyon rehberi (30.08.2026, ikinci tur)

**İstek:** "madde 33 ü biraz daha zenginleştirir misin her collection için
daha detaylı adım adım sayfa sayfa bir yapı olabilir."

Koleksiyon Rehberi'ndeki tek satırlık özet listesi (`dt`/`dd`, sadece
`steps[0]`), soldan koleksiyon seçilen — sağda o koleksiyonun TÜM adımlarının
numaralı olarak açıldığı bir düzenle değiştirildi (sidebar'ın kendi
gruplamasıyla birebir aynı nav). Panelin sidebar'ı gibi, ama panel içinde.

- [x] `GuideApp.tsx`: `useState` ile seçili koleksiyon; nav soldan tıklanınca
      sağdaki `<article>` o koleksiyonun `HELP_CONTENT[slug][locale].title` +
      TÜM `steps[]` dizisini numaralı liste olarak gösteriyor. Varsayılan
      açılan: gruplardaki ilk `HELP_CONTENT`'i olan koleksiyon (Kategoriler).
- [x] CSS: `.guide__collections-layout` (14rem nav + esnek detay paneli,
      `position: sticky` nav), aktif buton kırmızı vurgulu
      (`rgba(230,0,0,0.08)` + `--vf-red` metin). 44rem altında nav yatay
      sarmalı listeye dönüyor (dar ekranda da kullanılabilir).
- [x] Testler güncellendi/eklendi: artık nav buton olarak render olduğunu
      doğruluyor (`getByRole("button")`), varsayılan seçilinin TÜM adımlarını
      gösterdiğini (sadece özet değil) ve seçili OLMAYAN bir koleksiyonun
      adımlarının görünmediğini, tıklayınca detay panelinin değiştiğini
      (`aria-current="page"` dahil) doğruluyor. CMS 557/557.
- [x] **Canlı doğrulamada bulunan gerçek bir altyapı hatası:** ilk
      `docker compose up -d --build cms` görünürde başarılı bitti (build
      loglarında hata yok, sonradan "exit 0" bile raporlandı) ama container
      **yeniden oluşturulmadı** — Compose "Recreate" değil "Running" dedi,
      yani `latest` tag'i aynı kaldığı için imaj gerçekten değişse bile
      container'ı hiç yeniden başlatmadı, tarayıcı hâlâ eski kodu
      görüyordu. `docker compose up -d --force-recreate cms` ile düzeltildi.
      **Bu proje için ders:** `up -d --build` tek başına yeterli DEĞİL,
      imaj gerçekten değiştiğinde `--force-recreate` de eklenmeli — aksi
      halde "rebuild ettim ama site güncellenmedi" diye görünen bir sorun
      sessizce ortaya çıkabilir.
- [x] Canlı doğrulama: `force-recreate` sonrası `/admin/guide`'da yeni
      düzen doğrulandı; "Kategoriler" varsayılan açık (5 adım tam görünür),
      "Sayfalar"a tıklayınca detay paneli 7 adımlı "Sayfalar (Sayfa
      Kurucu)..." içeriğine değişti, aktif buton vurgusu doğru koleksiyona
      geçti. (Not: tarayıcı otomasyon aracının `ref` bazlı tıklaması bu
      sayfada sticky nav + scroll etkileşiminde bir kere yanlış hedefe
      tıkladı — gerçek bir React state hatası değildi, doğrudan DOM
      `click()` ile doğrulanarak netleştirildi.)

## 34. CMS admin ekranlarına loading/skeleton state + mikro-etkileşim

**İstek:** "Loading/skeleton state, animasyon, mikro-etkileşim... bunları
sadece cms ekranında eklememiz gerekiyor ekleyebiliriz." (Kapsam netleştirildi:
sadece CMS admin, public site'a dokunulmuyor.)

- [x] **Tarama sonucu:** 13 client bileşeni gerçek `fetch()` çağırıyor;
      13'ün 10'unda zaten bir loading/busy durumu vardı (çoğu buton üstünde
      "Kaydediliyor…"/"Gönderiliyor…" metniyle — kabul edilebilir). Sıfır
      loading-state göstergesi bulunan 3'ü (`FeedbackApp`, `LockedAccountsBanner`,
      `UnlockAccountField`) incelendi: hiçbiri gerçek bir boşluk değil —
      ya render'ı veri gelene kadar `null` (banner, doğru davranış: yoksa
      hiç görünmemeli) ya da zaten forma yüklenmiş bir alan değeri kullanıyor
      (kilit açma), ek bir loading state gerektirmiyor.
- [x] **Gerçek boşluk 2 yerde çıktı — panelin en büyük iki ekranı:**
      `ContentManagementApp` (Tüm İçerikler) ve `FeesAndLimitsApp` (Ücretler
      ve Limitler), ikisi de tablo yüklenene kadar düz "Yükleniyor…" metni
      gösteriyordu — veri gelince tablonun tam şekliyle yer değiştiren bir
      sıçrama. Yeni `TableSkeleton.tsx` (paylaşılan, kolon sayısına göre
      nabız atan çubuklarla gerçek tablo iskeletini önceden çiziyor,
      `aria-hidden`) her ikisine de bağlandı — sayfa şekli yükleniyor→yüklendi
      geçişinde sabit kalıyor.
- [x] Mikro-etkileşim: gerçek veri skeleton'ın yerini alırken kısa bir
      fade-in (`cm-table-fade-in`, 200ms) — ani "pop" yerine yumuşak geçiş.
      `prefers-reduced-motion` için hem skeleton nabzı hem fade-in kapatılıyor
      (erişilebilirlik). Panelde zaten 7 yerde transition vardı (buton hover
      vb.) — abartıya kaçmamak için üstüne yeni bir tasarım dili eklenmedi,
      mevcut token'lar (`--theme-elevation-*`, `--vf-red`, `--style-radius-s`)
      kullanıldı.
- [x] Bu sırada `FeesAndLimitsApp`'ın artık kullanılmayan `loadingLabel` prop'u
      (TablePanel skeleton'a geçince ölü koddu) temizlendi.
- [x] Testler: `TableSkeleton.test.tsx` (3 test), `ContentManagementApp`/
      `FeesAndLimitsApp`'a birer "hiç bitmeyen fetch sırasında skeleton
      render olur" testi eklendi. CMS 541/541, tsc/eslint temiz.
- [x] Canlı doğrulama: `docker compose up -d --build cms`, her iki ekran
      tarayıcıda gezildi, veri doğru render oluyor (yerelde DB sorgusu
      skeleton'ı gözle yakalayamayacak kadar hızlı — testler bu durumu
      sahte, hiç çözülmeyen bir `fetch` ile deterministik olarak kanıtlıyor).

## 35. İçerik metrikleri dashboard widget'ı

**İstek:** "kaç sayfa, kaç onay bu ay, ortalama onay süresi... audit log
verisi zaten var, bunu görselleştirmek... dashboarda konumlandırabiliriz."

- [x] Toplam sayfa sayısı zaten vardı (`countSiteUrls`/"Sayfalar" KPI'ı) —
      tekrar hesaplanmadı. Yeni: `cms/src/lib/contentMetrics.ts` →
      `loadContentMetrics()` — "Bu Ay Yayınlanan" (audit-logs'ta
      `action=publish`, bu ayki `createdAt`) ve "Ort. Onay Süresi".
- [x] **Onay süresi gerçek bir ölçüm değil, dürüst bir proxy — kod
      yorumunda açıkça yazılı:** audit-logs'ta "onaya gönderildi" diye ayrı
      bir olay yok, sadece create/update/publish var. Her `publish` satırı
      için AYNI dokümanın kendi en son create/update'i bulunuyor (Growth
      Maker `denyMakerPublish` yüzünden kendi taslağını istediği kadar
      düzenleyebiliyor, publish'ten hemen önceki düzenleme GERÇEKTEN
      Checker'ın onayladığı versiyon) ve `publish - o düzenleme` farkı
      ortalanıyor.
- [x] Ayrı bir "onay kuyruğu" değil — Maker/Checker'ın zaten gördüğü
      `approvalQueue` widget'larıyla karışmasın diye mevcut KPI satırına
      2 kart olarak eklendi (`cm-kpi-row` zaten `flex-wrap`, 4→6 kart
      sorunsuz sardı) — herkese görünür, tıpkı diğer 4 KPI gibi.
- [x] Performans: ay toplamı (`totalDocs`) sınırsız/doğru; ortalama süre
      hesaplaması için örnekleme sınırı (`maxSamples=50`, en yeni 50
      publish) — N+1 sorgu riskini audit-logs büyüdükçe sınırlıyor.
- [x] Testler: `contentMetrics.test.ts` — 8 test (ay toplamı örnekleme
      sınırından bağımsız, publish'i doğru dokümanın en son düzenlemesiyle
      eşleştiriyor — daha eskisiyle değil, farklı dokümanın düzenlemesini
      asla eşleştirmiyor, veri yokken NaN/0 değil null döndürüyor, süre
      formatlama saat/gün+saat). CMS 549/549, tsc/eslint temiz.
- [x] Canlı doğrulama: rebuild sonrası dashboard'da "Bu Ay Yayınlanan: 182",
      "Ort. Onay Süresi: 0.1 sa" render oldu. **Not:** bu oturumdaki script'li
      seed/publish akışları (Maker→Checker milisaniyeler içinde) sayıyı
      gerçekçi olmayan biçimde hızlı gösteriyor — hesaplama doğru (8 test
      kanıtlıyor), ama gerçek editoryal kullanım birikince sayı daha
      anlamlı olacak.

## 36. Tek sayfalık mimari özet diyagramı

**İstek:** "Tek bir sayfada mimari özet (Next.js + Payload + Postgres +
MinIO + Docker, tek diagram) — teknik olmayan paydaşlar için. kesinlikle
yapalım."

- [x] Ayrı bir Artifact (yayınlanmış, paylaşılabilir HTML sayfası) olarak
      yapıldı — `docs/PROJECT-OVERVIEW.md`'nin içine GÖMÜLMEDİ, çünkü o
      dosya zaten teknik/yoğun; iş insanına gösterilecek ayrı, kendi başına
      duran bir sayfa istendiği gibi daha iyi hizmet ediyor. Link session'da
      kullanıcıya verildi (Artifact URL'leri kişiye özel/varsayılan gizli —
      git'e commit edilecek bir şey değil, bu yüzden bu dosyada da yok).
- [x] İçerik: "Parçalar" (Ziyaretçi/Editör → Next.js sitesi/Payload CMS →
      ortak Postgres+MinIO altyapısı, Docker Compose çerçevesi), "Bir
      içerik editörden ziyaretçiye" (5 adımlı yaşam döngüsü: taslak → onaya
      gider → onaylanır → site tazelenir → ziyaretçi görür), "Bugün nerede
      duruyoruz" (çalışan 3 madde / bilinçli ertelenen 3 madde, PROJECT-
      OVERVIEW.md §11'in en iş-insanına-yönelik 6 satırı).
- [x] Tasarım: gerçek Vodafone marka fontu (`cms/public/vodafone-*.woff`,
      base64 gömülü — jenerik bir Google Font yerine bu projenin kendi
      görsel kimliği) başlıklarda, Source Sans 3 gövde metninde; Vodafone
      kırmızısı (#E60000) tek vurgu rengi; açık/koyu tema ikisi de elle
      tasarlandı ve tarayıcıda doğrulandı (sistemin karşı tarafı bilerek
      ters çevrilmedi, ikisi de kendi kontrastıyla okunur).
- [x] Rakam doğruluğu: ilk taslakta "1000'in üzerinde otomatik test" yazmıştı,
      gerçek toplam (549 CMS + 380 site = 929) kontrol edilip "900'ün
      üzerinde"ye düzeltildi — yayınlamadan önce.

## 37. "Taslak kaydet" butonu Growth Maker için görünmüyor (rapor edildi) — etiket kafa karıştırıyormuş, kod zaten doğruydu

**İstek:** "ben hala growth makerın hiçbir collecitonda taslak kaydetme
akışını göremiyorum butonu onu eklemedik mi" → ekran görüntüsüyle: "yok
işte uı a bakmıyorsun sanırım bak yok burada taslagı kaydet butonu hiçbir
collectionda cıkmıyor maker için."

- [x] Önce canlıda 3 farklı yerde test edildi (Sık Sorulanlar hem yeni
      kayıt hem yayındaki kayıt, Kampanyalar yayındaki kayıt, Ücretler ve
      Limitler drawer'ı) — buton her seferinde vardı ve çalıştı ("Taslak
      başarıyla kaydedildi" toast'ı, sürüm sayısı arttı).
- [x] Kullanıcının gönderdiği ekran görüntüsü incelendi: buton **gerçekten
      oradaydı** — sağ üstte "Onaya Gönder" yazan buton. Kullanıcı bile onu
      "taslak kaydetme" olarak tanımamış — kök neden kod değil, **etiket**:
      "Onaya Gönder" sadece SONUCU söylüyordu (inceleneceğini), EYLEMİ
      söylemiyordu (işinizin kaydedildiğini).
- [x] `saveOrSubmit.submitForReview` çevirisi "Onaya Gönder" → **"Taslağı
      Onaya Gönder"** yapıldı (tr+en, `SaveOrSubmitButton.tsx`'in kendi
      yorumu da güncellendi). İkisini de söylüyor artık: kaydediliyor VE
      onaya gidiyor.
- [x] Canlı doğrulama: Growth Maker (ece.boran) olarak Sık Sorulanlar'da
      yeni kayıt ekranı — buton artık "Taslağı Onaya Gönder" diyor.
- [x] **Ders:** İşlevsel olarak doğru bir buton, yanlış kelimeyle
      "yok" gibi görünebiliyor — bu, "gerçekten çalışıyor mu" sorusunun
      sadece kod okumakla değil, gerçek bir kullanıcının ekranı nasıl
      okuduğuyla da test edilmesi gerektiğinin bir örneği daha.

## 38. "+ Layout Ekle" ile eklenen blok bazen boş kalıyor — otomatik düzeltildi

Madde 27.08.2026 taşımasında bulunan, Payload 3.87→3.88 yükseltmesinin de
kapatamadığı, kullanıcının canlıda elle doğruladığı bilinen upstream Payload
hatası (payloadcms/payload#9567) için gerçek bir çözüm.

**Kök neden (kaynak koddan doğrulandı, `node_modules/@payloadcms/ui`):**
`addFieldRow` yeni satırı `isLoading:true` ile ekliyor
(`forms/Form/fieldReducer.js`), ama bunu temizleyen tek yol
`getFormState`'in `renderAllFields:true` ile TAM bir yeniden-çözümleme
yapması — bu da normal yazma sırasında çalışan kısmi/debounce'lu
yenilemede olmuyor, sadece "Taslağı Onaya Gönder"in kendi submit
round-trip'inde oluyor. Kullanıcının elle bulduğu geçici çözüm ("bloğu
ekledikten hemen sonra kaydet") tam olarak bunu tetikliyormuş.

- [x] `cms/src/components/BlockFieldAutoResolve.tsx` (yeni) — `layout`
      alanının satır sayısını izliyor, bir satır ARTINCA (azalma/yeniden
      sıralamada tetiklenmiyor) 600ms sonra formun KENDİ mevcut verisiyle
      (`getData()`) `reset()` çağırıyor — bu, submit'in kullandığı AYNI
      `renderAllFields:true` isteği, ama hiçbir şey kaydetmiyor/yayınlamıyor,
      sadece render şemasını tazeliyor. 600ms gecikme, blok satırının
      kendi shimmer penceresiyle (`useThrottledValue`, 500ms) örtüşecek
      şekilde seçildi — editöre "boş blok sonra düzeliyor" değil, "normal
      yükleniyor animasyonu" gibi görünsün diye.
- [x] `Pages.ts`'e `admin.components.edit.beforeDocumentControls`'a
      eklendi (`path: "layout"`), `generate:importmap` ile üretildi.
- [x] Testler: `BlockFieldAutoResolve.test.tsx` (6 test — ilk yüklemede
      tetiklenmiyor, satır artınca ~600ms sonra `getData()`'yı `reset()`'e
      geçiriyor, satır silinince tetiklenmiyor, yeniden sıralamada
      tetiklenmiyor, gecikme dolmadan satır tekrar silinirse bekleyen
      çağrı iptal oluyor, hiçbir şey render etmiyor). CMS 563/563,
      tsc/eslint temiz.
- [x] Canlı doğrulama: Growth Maker olarak yeni bir sayfada arka arkaya 2
      blok eklendi (Hero — upload alanlı, İkonlu Kartlar — array+upload
      alanlı) — ikisi de TÜM alanlarıyla (Başlık, Görsel picker, Kartlar
      dizisi vb.) sorunsuz render oldu. Test sayfası kaydedilmeden
      atıldı, DB'de iz bırakmadı (`SELECT` ile doğrulandı).

---

# Görev Listesi — OCP hazırlığı, Faz 1: repo ayrımı (30-31.08.2026)

`docs/OCP-DEVOPS-RUNBOOK.md`'nin §1'inde önerilen karar onaylandı: **git
subtree split** ile `cms/`, kendi git geçmişini koruyarak ayrı bir repo'ya
çıkarılıyor. Yeni servisin adı **Clover** (İngilizce "yonca") — repo:
`https://github.com/bbatus/clover.git` (kullanıcı tarafından zaten oluşturuldu).

## 39. `cms/` → `clover` — ayrı repo + ayrı yerel klasör + bağımsız Docker

**İstek (özet):** "cms in ismini repo ve deployment ismini clover olarak
seçtim... buraya clover yani cms in kodunu pushlucaz... localde de bunun
vodafonepaycomtr nin olduğu dizinde [yeni bir] klasörünü aç ve oraya tüm cms
kodunu taşı. docker compose ile kaldırıyorduk... artık öyle olmayacak, 2 ayrı
klasörden docker container ile kaldıracaksın ve bakacaksın ikisi birbiriyle
haberleşebiliyor mu, ortak postgrelerini/miniolarını kullanabiliyorlar mı,
eklenen data senkronize mi."

**Kapsam netliği (kendi yorumum, teyide açık):** Bu turun hedefi *kurmak ve
doğrulamak* — `cms/` klasörünü mevcut monorepo'dan silmek şimdilik kapsam
dışı bırakıldı. Tüm ara doğrulamalar (haberleşme, ortak Postgres/MinIO,
veri senkronu) geçmeden eski kopyayı silmek riskli olur; kullanıcı "taşı"
dedi ama aynı mesajda sırayla doğrulanacak bir kontrol listesi de verdi —
önce doğrula, sonra temizle sırası izleniyor. Temizlik (cms/'i monorepo'dan
kaldırmak) ayrı, bu doğrulamalar bittikten sonra istenecek bir adım olarak
bırakıldı.

- [x] `git subtree split --prefix=cms -b cms-only` — 148 commit (cms/'e
      dokunan tüm commit'ler), dosya yolları `cms/x` → `x` olarak yeniden
      yazıldı, hiçbir geçmiş kaybolmadı.
- [x] `cms-only` → `https://github.com/bbatus/clover.git` (`main`) —
      **kullanıcı kendi terminalinden push etti** (bu oturumun izin
      sınıflandırıcısı harici repo'ya ilk push'u ve proje-dışı `ls`'i
      engelledi; kullanıcıya iki komutu verdim, kendisi çalıştırdı).
- [x] Yerel: `/Users/guestbatu/Documents/Projects/clover/` — kullanıcı
      `git clone https://github.com/bbatus/clover.git` ile açtı,
      `vodafonepaycomtr/`'ın tam yanında, subtree split'in ürettiği
      geçmişle. Bundan sonra proje-dışı dosya işlemleri de izin verildi,
      kalan her şeyi ben yaptım.
- [x] `cms/` monorepo'dan **hâlâ silinmedi** (bilinçli, kararlaştırıldığı
      gibi) — aşağıdaki doğrulamalar bitti ama temizlik ayrı bir onay
      bekliyor.
- [x] **Docker ayrımı — gerçek yapı:**
      - `docker network create vodafonepay-net` — paylaşılan, harici
        (`external: true`) bir ağ; OCP'de iki ayrı Service'in aynı
        namespace'te birbirini bulması gibi, iki bağımsız compose bunun
        üzerinden container adıyla birbirini buluyor.
      - `clover/docker-compose.yml` (yeni) — Postgres + MinIO + `clover`
        servisi, hepsi bu ağda. Postgres/MinIO volume'ları **eski
        `vodafonepaycomtr_postgres-data` / `-minio-data` isimleriyle,
        `external: true`** referans veriyor — veri taşınmadı/kopyalanmadı,
        aynı disk verisi.
      - `vodafonepaycomtr/docker-compose.yml` (yeni, artık `vodafonepaycomtr/`
        alt klasörünün İÇİNDE) — sadece `app`+`dev`, aynı ağda,
        `CMS_API_URL=http://clover:3000/api`.
      - Eski kök `docker-compose.yml` — silinmedi, üstüne büyük bir
        "RETIRING" uyarısı eklendi (hâlâ `scripts/trivy-scan.sh` ve
        `AGENTS.md` ona referans veriyor — onları güncellemek ayrı bir
        takip maddesi, aşağıda).
      - `clover/.gitignore` **yoktu** — subtree split `cms/`'in hiç kendi
        `.gitignore`'ı olmadığını, kök deponunkine bel bağladığını ortaya
        çıkardı; artık bağımsız repo olduğu için `node_modules`/`.next`/
        `.env` bir `git add .` ile commit'e girebilirdi. Önce bunu
        oluşturdum, sonra `docker-compose.yml`'i ekledim.
      - `clover/.env` + `vodafonepaycomtr/.env` (ikisi de gitignore'da,
        commit edilmedi) — eski kök `.env`'deki gerçek `PAYLOAD_SECRET`/
        `REVALIDATE_SECRET`/`PREVIEW_SECRET` değerleriyle. **Bulunan gerçek
        hata:** ilk build denemesi `PAYLOAD_SECRET is unset or still the
        dev placeholder` diye patladı — `clover/`'da `.env` hiç yoktu
        (gitignore'lu dosya subtree split'e hiç girmemişti), compose
        placeholder default'a düşüyordu, kod da (haklı olarak) production
        modda placeholder secret'ı reddediyordu.
- [x] **Doğrulama listesi — hepsi geçti, gerçek komutlarla:**
      - [x] İki klasör, iki bağımsız `docker compose up` ile ayrı ayrı
            ayağa kalktı (`cd clover && docker compose up -d`,
            `cd vodafonepaycomtr/vodafonepaycomtr && docker compose up -d app`).
      - [x] Haberleşme, iki yönde de container adıyla doğrulandı:
            site içinden `fetch('http://clover:3000/api/campaigns')` →
            gerçek veri döndü; clover içinden
            `fetch('http://vodafonepaycomtr:3000/')` → 200.
      - [x] Ortak Postgres: `docker exec vodafonepaycms-postgres psql ...`
            ile satır sayıları bölünmeden ÖNCEKİ (`pages 12, campaigns 14,
            faq 26, ann 6, media 44, users 7, audit 1422`) ve SONRAKİ
            değerler **birebir aynı** çıktı.
      - [x] Ortak MinIO: obje sayısı bölünmeden önce/sonra **128/128**,
            birebir aynı.
      - [x] Veri senkronu — gerçek uçtan uca test: Clover'da yeni bir
            duyuru oluşturuldu (Maker→Checker REST akışıyla), yayınlandı;
            **hiçbir revalidate çağrısı elle tetiklenmeden** site
            `/duyurular`'da anında göründü (Clover'ın kendi `afterChange`
            hook'u, yeni container-adı tabanlı `SITE_REVALIDATE_URL`'i
            kullanarak otomatik tetiklemiş). Test verisi sonra temizlendi
            (silindi + revalidate edildi), site ve DB'de iz kalmadı.
- [x] Testler: site 380/380, clover 564/564 (ilk kez `npm install`
      gerekti — subtree split `node_modules` taşımaz, beklenen).
- [ ] **Takip — bu turda bilinçli ertelendi:**
      - `cms/`'i monorepo'dan silme kararı (ayrı onay bekliyor)
      - `AGENTS.md`, `scripts/trivy-scan.sh`, `scripts/warm-cache.sh`,
        `scripts/sonar-scan.sh` — hâlâ eski kök `docker-compose.yml`'e ve
        `cms/` yoluna referans veriyorlar, yeni yapıya göre güncellenmeli
      - OCP'ye gerçek deploy, GitHub Actions pipeline'ları, k8s
        manifestleri — `docs/OCP-DEVOPS-RUNBOOK.md`'nin sonraki fazları

## 40. S1-S12 cevaplandı, health endpoint'leri + gerçek k8s manifestleri üretildi (31.08.2026)

Runbook'un §2'sindeki 12 soru kullanıcı tarafından tek seferde cevaplandı
(namespace `vepas-ai-am`, ikisi de Node.js, MinIO namespace-içi geçici,
sadece TEST, düz `5432`, otomatik route host — kullanıcının verdiği gerçek
`finwatcher-frontend` örneğiyle doğrulandı, Sonar/Fortify sadece rapor
[blocker yok], 1 replica). `docs/OCP-DEVOPS-RUNBOOK.md` bu cevaplarla
güncellendi, §1 (repo ayrımı) özetlendi.

- [x] **Health endpoint'leri** (§6.2'nin karşılığı, artık gerçek kod):
      `clover/src/lib/healthEndpoints.ts` — `payload.config.ts`'in
      `endpoints` dizisine top-level Payload endpoint olarak eklendi
      (`auditExportEndpoint`'in kullandığı aynı desen, `getPayload()` ile
      ikinci bir manuel bootstrap yerine `req.payload` bedava geliyor).
      Liveness hiç DB'ye gitmiyor (bir DB kesintisi pod'u öldürüp restart
      loop'una çevirmesin diye); readiness gerçek bir
      `find({limit:0, overrideAccess:true})` round-trip'i yapıyor. Site
      tarafında (`vodafonepaycomtr/src/app/api/health/*`) readiness
      BİLİNÇLİ OLARAK Clover'a gitmiyor — kısa bir CMS aksaklığını tüm
      site pod'larını route'tan düşüren bir soruna çevirmemek için (ISR
      zaten bunu tolere ediyor). 3+2 test, canlıda doğrulandı (`curl` ile
      200/503 senaryoları), her iki repoda da commit'lendi.
- [x] **Gerçek k8s manifestleri** — iki repo'nun kendi `k8s/` klasöründe:
      `deployment.yaml` (1 replica, gerçek health path'leri,
      `readOnlyRootFilesystem`), `service.yaml`, `route.yaml` (otomatik
      host), `configmap.yaml`, `secret.yaml` + `.env.secret.example` +
      `create-secret.sh`, `serviceaccount.yaml`, `hpa.yaml` (1-2),
      `networkpolicy.yaml` (placeholder, şablonla aynı desen).
- [x] **Clover'a özel: `k8s/minio.yaml`** — MinIO'yu `vepas-ai-am`
      namespace'ine biz deploy ediyoruz (Deployment+PVC+Service+Route+
      bucket-init Job, docker-compose'daki `minio-init`'in Job karşılığı).
      **Bulunan gerçek bir mimari nokta:** MinIO'nun kendi Route'u
      ZORUNLU — yüklenen medya tarayıcıya doğrudan MinIO'dan servis
      ediliyor (Clover üzerinden proxy değil), Route olmadan hiçbir görsel
      açılmaz. Sadece S3 API portu (9000) dışa açık, konsol (9001) kapalı.
- [x] **`DATABASE_URI` kararı netleşti:** `k8s/configmap.yaml`'da host/
      port/db/user YOK — Payload tek bir bağlantı string'i okuduğu için
      (koddan doğrulandı, `docs/OCP-DEVOPS-RUNBOOK.md §3`) tamamı
      `k8s/secret.yaml`'da.
- [x] **Bulunan ikinci gerçek boşluk:** `k8s/.env.secret` iki repoda da
      hiçbir `.gitignore`'da yoktu (`.env` deseni sadece tam o dosya adını
      eşliyor, `.env.secret`'ı değil) — ikisine de eklendi.
- [x] `clover/DEPLOYMENT_RUNBOOK.md` ve
      `vodafonepaycomtr/vodafonepaycomtr/DEPLOYMENT_RUNBOOK.md` — kopyala-
      yapıştır çalışan, gerçek değerlerle dolu Faz 0 + rollback +
      sorun giderme.
- [x] Tüm YAML'lar `python3 -c "yaml.safe_load_all(...)"` ile sözdizimi
      doğrulandı, `create-secret.sh`'lar `bash -n` ile kontrol edildi.
- [x] `docs/OCP-DEVOPS-RUNBOOK.md`: §1 özetlendi (artık "✅ TAMAMLANDI"),
      §2'nin 12 sorusu cevaplarla dolduruldu, §6.2 "✅ tamamlandı" oldu,
      yeni §8 ("k8s manifestleri üretildi") eklendi, §7 sadece gerçekten
      DevOps'a sorulması gereken kalan maddelere daraltıldı (GHES kaydı,
      namespace kota/izin teyidi, DB parolası, pull secret, migration
      kararı).
- [ ] **Takip — henüz yapılmadı:** `.github/workflows/` pipeline'ları
      (GHES repo kaydı netleşmeden anlamlı doldurulamaz), gerçek `oc apply`
      ile ilk TEST kurulumu (manifestler hazır, hiç uygulanmadı), migration
      kararı (§6.3, hâlâ açık).

### 40b. Düzeltme — MinIO kaynakları repo isimlendirmesine uymuyordu (31.08.2026)

**Bildirim:** "yalnız şyi yanlıs yapmısız deployment yaml lar configmapler
ve secretlar falan reponun isimlendirmesi ile olması gerekiyordu onlar
olmamış."

Kendi çıktımı yeniden denetleyip doğruladım: `clover/k8s/`'teki HER kaynak
(`deployment`, `service`, `route`, `configmap`, `secret`, `serviceaccount`,
`hpa`, `networkpolicy`) doğru şekilde `clover`/`clover-*` ile
isimlendirilmişti — **tek istisna `k8s/minio.yaml`'dı**: PVC/Deployment/
Service/Route düz `minio`/`minio-data` adlarıyla kalmıştı (Job zaten
`clover-minio-init` idi, tutarsızlık oradan görülebilirdi).

- [x] `minio-data` → `clover-minio-data` (PVC)
- [x] `minio` → `clover-minio` (Deployment, Service, Route, pod label'ı)
- [x] Bağımlı referanslar güncellendi: `configmap.yaml`'daki `S3_ENDPOINT`
      (`http://clover-minio:9000`) ve `S3_PUBLIC_URL`
      (`https://clover-minio-vepas-ai-am.apps.tst-vcloud.vpara.local`),
      `minio.yaml`'ın kendi Job komutundaki `mc alias set` hedefi,
      `DEPLOYMENT_RUNBOOK.md`'deki `oc wait`/`oc get route` komutları.
- [x] Neden önemli: aynı namespace'te birden fazla proje yaşıyor
      (`finwatcher`, `genaiops` — route örneğinden zaten biliniyordu) —
      düz `minio` adı gelecekte bir başka projenin kendi MinIO'suyla
      çakışabilirdi; her kaynağın hangi mikroservise ait olduğu isminden
      belli olmalı.
- [x] Tüm YAML'lar yeniden doğrulandı (`yaml.safe_load_all`), site
      tarafında (`vodafonepaycomtr/k8s/`) aynı taramada başka bir
      tutarsızlık bulunmadı — sadece Clover'ın MinIO'su etkilenmişti.

### 40c. Düzeltme — `docs/OCP-DEVOPS-RUNBOOK.md` kendi içinde çelişiyordu (31.08.2026)

**Bildirim:** "senin ocp devops runbook md de güncelleme yapman lazmdı ama
güncelnnememis sanırım."

Haklıydı — 40/40b'deki güncellemeler tek tek eklenmişti ama dosyanın tamamı
baştan sona yeniden okunmamıştı; sonuç, aynı belge içinde biri "tamamlandı"
diyen yeni bölümlerle hâlâ "yapılacak"/taslak diyen eski bölümlerin bir arada
kalmasıydı. Dosyayı baştan sona okuyup şunları düzelttim:

- [x] Başlık altındaki durum özeti — "§2-§7 hâlâ analiz/planlama... henüz
      uygulanmadı" diyen eski cümle, §1/§2/§6.2/§8'in tamamlandığını ve
      sadece Faz 3 (`oc apply`) + `.github/workflows/` kaldığını söyleyen
      doğru bir özetle değiştirildi.
- [x] §2 başlığı hâlâ "taslak cevaplar" diyordu, gövde metni kesinleştiğini
      söylüyordu — başlık "✅ kesinleşen cevaplar (31.08.2026)" oldu.
- [x] §3 "Nereye gidecek" — hâlâ hipotetik, ayrı `DATABASE_URI_HOST/PORT/
      NAME/USER` ConfigMap anahtarları öneren eski örnek YAML silinip,
      gerçekte yapılan (`clover/k8s/configmap.yaml` + `secret.yaml`) ile
      değiştirildi.
- [x] §4 Faz 0-3 checklist'leri — Faz 2'de "Health endpoint'leri yazılmalı —
      şu an ikisinde de yok" ifadesi aynı belgenin kendi §6.2'siyle
      ("✅ tamamlandı") çelişiyordu; tüm checklist'ler gerçek duruma göre
      `[x]`/`[ ]` olarak yeniden işaretlendi.
- [x] §5 "İşin sonunda elimizde ne olacak" — §8'i tekrarlayan/çelişen eski
      genel `<repo>/` şablonu ve hiç yapılmamış hipotetik `sql/`+`ldap/`
      klasör örnekleri silindi, §8'e yönlendirildi.
- [x] §6.1 ve §6.4 — dosya yolları hâlâ eski `cms/Dockerfile` ve
      `cms/src/access/roleMapping.ts` diyordu; ikisi de gerçek yeni yola
      (`clover/Dockerfile`, `clover/src/access/roleMapping.ts`) düzeltildi.
- [x] Son bir `grep -n -i cms` taramasıyla kalan tüm "cms" geçişleri
      kontrol edildi — geri kalanlar ya §1'in meşru öncesi/sonrası
      karşılaştırma tablosu (bilinçli olarak tarihsel) ya da "CMS" kelimesinin
      genel/kavramsal kullanımı (örn. "CMS'teki test kullanıcıları"), path
      referansı değil — düzeltme gerektirmedi.
- [x] §7 ve §9 yeniden okundu, güncel ve tutarlı bulundu — değişiklik
      gerekmedi.
