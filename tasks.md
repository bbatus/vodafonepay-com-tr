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
