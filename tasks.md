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

**cms: %22.9 (henüz başlanmadı — bu turda kapsam dışı, sadece site istendi)**
- [ ] Kapsam planı
- [ ] cms: %24.2 → hedef

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
- [ ] CMS duplication %9.0 → %3 altına (henüz yapılmadı)

**Not (şeffaflık):** Doğrulama sırasında yanlışlıkla Payload'ın kendi
"Değişiklikleri yayınla" düğmesine basıp `content-blocks/31` ("Tıkla Gelsin",
brand-logos) taslağını yayınladım. Fark edilir edilmez `_status: draft`'a geri
alındı; DB ve canlı site teyit edildi (logo sitede yok). İçerik değişmedi,
sadece durum geçici olarak taslak→yayında→taslak oldu.

## 18. Klasör yapısı (vodafonepaycomtr-project/)

**İstek:** Ana klasör `vodafonepaycomtr-project/` → altında `vodafonepaycomtr/` (site)
ve `cms/` kardeş klasörler. Workspace ile BAĞLANMASIN, tamamen ayrı kalsınlar.

- [ ] Etki analizi (git kökü, docker-compose build context'leri, script yolları)
- [ ] Uygulama
