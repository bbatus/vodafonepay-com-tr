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

## 16. Test coverage %70-80'e çıkarılsın

**Ölçülen gerçek durum (Sonar'a lcov bağlandıktan sonra, 26.08):**
site %36.8 · cms %22.9 (daha önce tahmin edilen "%57/%56" yanlıştı)

- [ ] Kapsam planı (hangi modüller önce)
- [ ] site: %36.8 → hedef
- [ ] cms: %22.9 → hedef

## 17. CMS Sonar bulguları

- [ ] 5 BLOCKER: `denyRolePublish.test.ts` + `roles.test.ts` — assertion'sız test case'ler
- [ ] 3 CRITICAL: cognitive complexity (Feedback.ts, LegalPages.ts, Users.ts, ordering.ts, RoleAwarePublishButton.tsx)
- [ ] MAJOR/MINOR: nested ternary, nested template literal, S6551, erişilebilirlik
- [ ] CMS duplication %9.3 → %3 altına

## 18. Klasör yapısı (vodafonepaycomtr-project/)

**İstek:** Ana klasör `vodafonepaycomtr-project/` → altında `vodafonepaycomtr/` (site)
ve `cms/` kardeş klasörler. Workspace ile BAĞLANMASIN, tamamen ayrı kalsınlar.

- [ ] Etki analizi (git kökü, docker-compose build context'leri, script yolları)
- [ ] Uygulama
