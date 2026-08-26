# Genel Durum — Tek Takip Dosyası

_Son güncelleme: 25.08.2026, branch `main` (her adımda doğrudan `main`'e push edildi). Bu güncelleme, projedeki **tüm** `docs/*.md` dosyaları (ham prompt kayıtları hariç) tek tek okunup, `main`'in güncel commit geçmişiyle (bu dosyanın son güncellenişinden bu yana 20+ yeni commit) çapraz kontrol edilerek yazıldı — amaç: hiçbir açık maddenin raporlar arasında kaybolmamasını garanti etmek._

Bu dosya projenin **tek genel durum özeti**dir — "ne yapıldı, ne kaldı" sorusunun
cevabı için önce buraya bakın. Diğer `docs/*.md` dosyaları hâlâ duruyor (tarihsel detay,
madde madde RFP eşleşmesi, kullanıcı test kayıtları, ham prompt kayıtları için) ama günlük
takip için hepsini tek tek açmaya gerek yok — her birinin ne işe yaradığı en altta
[§6](#6-diğer-dokümanlar-ne-zaman-bakılır) içinde listeleniyor. Bu dosya veri kaybetmeden
hepsinin özetidir; hiçbiri silinmedi.

---

## 1. Proje Nedir

İki ayrı servis, tek repo:
- **Kök dizin** — Next.js 16 pazarlama sitesi (`vodafonepaycomtr`), App Router + Turbopack, Tailwind v4.
- **`cms/`** — Payload CMS 3.87 admin paneli, ayrı Docker container, Postgres + MinIO.

Docker Compose servisleri: `vodafonepaycomtr` (site, :3000), `vodafonepaycomtr-cms` (cms, :3010),
`vodafonepaycms-postgres`, `vodafonepaycms-minio`. Hepsi `docker compose -p vodafonepaycomtr` ile.

---

## 2. Tamamlananlar (özet — kronolojik değil, konu bazlı)

### 2.1 Güvenlik (P0 — hepsi kapandı)
- Gerçek RBAC: 4 rol (New Vertical Maker/Checker, Growth Maker/Checker), 4 test kullanıcısıyla canlı doğrulandı (`docs/TEST-USERS.MD` — asla commit edilmemesi gereken, sadece yerel referans bir dosya). 19.08.2026'dan itibaren rol DEĞERLERİ artık ham AccessPoint LDAP grup adı string'leri değil, kendi iç sözlüğümüz — AD grup adı → rol eşlemesi `cms/src/access/roleMapping.ts`'te ayrı bir dosyada (bkz. §2.7).
- Segregation of duties: Growth Maker kendi kampanyasını publish edemiyor (`denyMakerPublish`), Growth Checker/NV Checker publish edebiliyor ama create edemiyor — GROWTH_CHECKER'a kendi kampanyasını **oluşturma** izni sonradan eklendi (business'ın AccessPoint rol tablosuna göre; bkz. §2.6).
- Kimlik doğrulaması olmadan `?draft=true` ile yayınlanmamış içerik okunabiliyordu — `denyUnauthenticatedDraftRead` hook'uyla kapatıldı.
- `CMS_AUTO_LOGIN` bayrağının prod'da tanımlı olmaması gerektiği kod içinde büyük uyarıyla işaretli.
- Boot-time env doğrulaması (`cms/src/env.ts`) — prod'da dev-placeholder secret'larla ayağa kalkmayı reddediyor.
- `npm audit`: kök ve cms'de sıfıra yakın — tek istisna, rich text editörünün kök `package.json`'a eklenmesiyle (§2.6) gelen `undici` HIGH (CVE-2026-13697), `overrides` ile kapatıldı; xlsx paketi denendi, 2 düzeltilmemiş high-severity CVE'si olduğu görülüp hemen geri alındı (CSV+BOM export'a geçildi, bkz. §2.4).
- Docker image: **0 HIGH/CRITICAL** (Trivy) — her iki Dockerfile `node:24-alpine`, runner stage'den kullanılmayan `npm`/`npx`/`corepack` kaldırıldı.
- SonarQube: kök + cms projelerinde sıfır açık bulgu (bu turda — §2.6 — token/bağlantı sorunu nedeniyle taranamadı, **açık madde**, bkz. §3).

### 2.2 CMS entegrasyonu — site tarafı
- Pazarlama içeriğinin ~%100'ü artık CMS-editable (adım kartları, slaytlar, marka logoları, video rehberleri, SSS, kampanyalar, blog, kategoriler, ücret/limit tabloları, sayfa meta/breadcrumb). CMS erişilemezse her component `ContentUnavailable` (hata/boş durumu ayrı) gösteriyor — sahte/hardcoded fallback verisi maskelemez (bkz. §2.4/2.6, "fallback maskeleme denetimi").
- Kasıtlı olarak CMS'e taşınmayanlar: 5 legal sayfa gövdesi + 3 kurumsal sayfa (hukuki metin doğruluğu riski — bilinçli karar), `VideosWithTabs` (gerçek video içeriği yok).
- `src/lib/cms.ts`: her getter zod ile runtime doğrulama yapıyor, 8sn timeout, yapılandırılmış hata loglama.

### 2.3 CMS admin — RFP'nin tamamı (30/30 madde + LDAP planı)
- Draft/publish, maker-checker onay akışı, versiyon geçmişi/rollback, audit log, sürükle-bırak sıralama, zamanlanmış yayın/kaldırma, deeplink, canlı önizleme (livePreview), Pages/Blocks sayfa oluşturucu, i18n (TR/EN admin paneli), rol-farkında "Yardım" butonları — hepsi `docs/CMS-USER-TESTS.md`'nin Bölüm 1-3'ünde (30 madde) tek tek "Tamamlandı" olarak işaretli ve test edilmiş durumda.
- LDAP'ın kendisi bağlanmadı (kullanıcı kararı: "sadece rol simülasyonu") — ama gerçek LDAP geldiğinde izlenecek plan `docs/RFP-OPEN-ITEMS.md` §6'da yazılı.

### 2.4 İkinci tur kullanıcı geri bildirimi (14-15.08.2026, `CMS-USER-TESTS.md` Bölüm 4-5)
- Kampanya listesi en son oluşturulana göre sıralı; taslak kaydında zorunlu alanlar gerçekten zorunlu (`versions.drafts.validate: true`); Growth Maker için buton "Onaya Gönder" yazıyor.
- Yayınlama onayı modalındaki önizleme sadeleşti: sadece o kampanyanın kartı, `CardListCard` bileşeni gerçek liste sayfasıyla paylaşılıyor; site kendi sayfası bir CMS iframe'i içine gömüldüğünü algılayıp kendi scrollbar'ını gizliyor.
- Profil sayfası özel view ile yeniden yazıldı: e-posta/rol düz metin + sunucu tarafında kilitli, "Parolayı Değiştir"/"Hesabı Etkinleştir" kaldırıldı, avatar yükleme çalışıyor, tek dil değiştirici kaldı.
- Users + Campaigns listelerine Türkçe karakter destekli CSV export.
- Referans bütünlüğü (bağlı kayıt varken silme engellensin), kampanya filtresi/tarihi, hesap kilidi + kilit kaldırma ekranı, Content Management salt-okunur rapor sayfası (22 koleksiyon) — hepsi bu turda.

### 2.5 Test & Kalite altyapısı
- Kök: Vitest + Testing Library, **110 test** (9 dosya) — hepsi geçiyor (24.08 itibarıyla yeniden çalıştırılıp doğrulandı).
- `cms/`: Vitest, **153 test** (18 dosya) — hepsi geçiyor (24.08 itibarıyla yeniden çalıştırılıp doğrulandı).
- Her iki projede de `npm run check` (lint+typecheck+test+build) yeşil.
- SonarQube + Trivy her büyük değişiklikten sonra zorunlu adım (`AGENTS.md`'de yazılı) — Trivy bu turda da (rich text editörü kök `package.json`'a eklendiğinde) çalıştırıldı ve bulunan tek HIGH (`undici`) kapatıldı; **SonarQube bu turda çalıştırılamadı** (token yok/401 — bkz. §3).

### 2.6 Üçüncü tur kullanıcı geri bildirimi (17-18.08.2026, `CMS-USER-TESTS.md` Bölüm 6-9)
Bu turun ana teması: **Kategoriler'i gerçek, scope-farkında bir koleksiyona dönüştürmek**,
**rich text editörünü gerçek bir editöre çevirmek**, ve bulunan bir dizi canlı bug'ı kapatmak.

- **Kategori mimarisi (Bölüm 6):** Kampanyalar/Blog/SSS artık tek `Categories` koleksiyonunun
  üç ayrı `scope`'u — her birinin kendi filtre sekmeleri, kendi picker'ı (`filterOptions` ile
  sunucu tarafında da zorlanıyor), aynı slug iki scope'ta çakışmıyor (`scope+slug` compound
  unique index). Site tarafında `getCategories()`/`getFaqItems()` artık scope zorunlu parametre
  alıyor — canlı bulunan bir sızıntı bugı (SSS kategorileri `/kampanyalar` sekmelerine
  karışıyordu) bu sayede kapandı.
- **Sıra (order) UX (Bölüm 7, 9):** Her koleksiyonun `order` alanı artık boş bırakılınca
  otomatik sona ekleniyor VE bunu editöre canlı gösteren bir `LiveOrderField` bileşeni var
  ("Bu grupta N kayıt var — önerilen sıra: M") — FaqItems'tan başlayıp Kategoriler, İçerik
  Blokları, Özellik Kartları, Menü Linkleri, Adım Kartları'na genişletildi. Elle girilen bir
  sıra artık aynı gruptaki bir kardeşle çakışıyorsa reddediliyor (400, çakışan kaydın adıyla) —
  hem oluşturma hem güncellemede.
- **Sürükle-bırak (ReorderWidget, Bölüm 6, 7, 9):** Artık drop anında değil "Kaydet"e basınca
  kaydediyor (Vazgeç ile geri alınabiliyor), sunucudan dinamik grup/sayaç çekiyor (FaqItems +
  Kategoriler), ve kapanmayan bir bug düzeltildi: başarılı kayıttan sonra Kaydet/Vazgeç butonları
  artık kayboluyor, success/error toast'ı var.
- **Rich text editörü (Bölüm 7, 8, 9):** `lexicalEditor()` boş konfigürasyondan (sadece
  kalın/italik) gerçek bir editöre geçti — başlıklar, listeler, link, tablo
  (`EXPERIMENTAL_TableFeature`), görsel yükleme + boyut seçimi (küçük/orta/büyük/tam genişlik),
  sabit kırmızı "Vurgu" metin rengi (`TextStateFeature`), inline YouTube video gömme (özel bir
  Lexical Block, `youtube-nocookie.com` embed). Tek bir paylaşılan renderer
  (`src/components/RichText.tsx`, `@payloadcms/richtext-lexical/react` üzerine) üç kullanım
  yerinde de (BlogPosts.body, Campaigns.body/terms, Pages'in richText bloğu) aynı. Bu süreçte
  bulunan önemli bir altyapı bug'ı: `payload generate:importmap` bu ortamda kırık olduğu için
  richText alanının kendisi VE her bir lexical özelliği (kalın, başlık, tablo, Vurgu, araç
  çubukları...) elle `importMap.js`'e eklenmek zorunda — unutulursa hatasız, sessiz şekilde
  render olmuyor. Muhtemelen bu değişiklikten önce de böyleydi (hiç fark edilmemişti).
- **Blog düzeltmeleri (Bölüm 7, 9):** slug otomatik oluşuyor (Categories deseniyle), `excerpt`
  alanı tamamen kaldırıldı (kart özeti artık `body`'den otomatik türetiliyor, canlı sitedeki
  gibi karakterden sonra "..." ile kesiliyor), buton yazısı özelleştirilebilir (`ctaLabel`),
  title/içerik/görsel/kategori olmadan yayınlanamıyor.
- **Ücretler ve Limitler (bu tur):** Hardcoded fallback verisi tamamen kaldırıldı (kullanıcı
  sıfırdan kendi verisini giriyor), tablo stili canlı sitenin computed style'larına göre
  yeniden yazıldı (gri başlık, dönüşümlü satır rengi, kırmızı "Kimlik doğrulama yapılmış"
  sütunu, yeşil periyot metni).
- **CSV export:** Kategoriler ve Blog Yazıları'na eklendi (Campaigns/Users ile aynı paylaşılan
  bileşen, UTF-8 BOM).
- **Anasayfa bug'ı:** Video ve "öne çıkan özellikler" bölümü kod olarak hep vardı ama 8 CMS
  kaydı hiç yayınlanmamış (taslak) kalmıştı — yayınlandı. Bu sırada bulunan ayrı bir bug:
  "Kampanyalar" başlığı yanlışlıkla "öne çıkanlar" bölümünün içindeydi, o bölüm boşken tamamen
  ilgisiz olan bu başlık da kayboluyordu — ayrıldı.
- **Footer QR kutusu:** `fixed top-1/2` konumlandırması kısa sayfalarda footer'ın üzerine
  biniyordu (canlı sitede bu widget hiç yok, ama 24 sayfada kullanıldığı için kaldırmak yerine
  düzeltildi) — artık footer görününce `IntersectionObserver` ile kayboluyor.

### 2.7 Pages — Butterfly (referans vendor CMS) parity analizi (19.08.2026)
Kullanıcı `docs/PAGE-CREATE-PRODUCTION.MD`'ye (mevcut vendor'ın "Page oluşturma" akışını
belgeleyen, Laravel/Blade/MySQL referans dokümanı — kendi kodumuz değil) karşı bizim
`Pages` koleksiyonumuzu denetletti: "eksik olmamalı, fazla olabilir" hedefiyle. Amaç:
vendor'dan bağımsızlaşma testi — bu işlevi biz de üretebiliyor muyuz.

Zaten üstün olan: içerik tek `content` alanı yerine sürükle-bırak blok sistemi (Hero/Metin/
SSS/Kampanya Grid/Video/Logo Grid — vendor'ın sabit "template" seçiminden daha esnek),
draft/published + otomatik versiyon geçmişi (vendor'ın elle yazdığı `page_revisions`
tablosundan daha sağlam). Kapatılan gerçek eksikler: slug artık `turkishSlugify`/
`uniqueSlug` ile otomatik üretiliyor (BlogPosts/Categories'teki desenin aynısı, elle
girilen zorunlu alan değil), `createdBy` provenance alanı eklendi (Campaigns'teki desen).

Kullanıcıyla netleştirilip eklenen 2 yeni davranış: **`parent`** (basit üst-sayfa referansı
— breadcrumb'da "Ana Sayfa > Üst Sayfa > Bu Sayfa" gösterir, URL hâlâ düz `/{slug}`, kendi
kendinin üst sayfası olamaz — sunucu tarafında da zorlanıyor) ve **`visibility`**
(public/private — private+published bir sayfa yayın durumuna rağmen anonim ziyaretçiye asla
gösterilmez, `generateStaticParams`/sitemap'e hiç girmez; `pagesRead` özel access fonksiyonu
`publishedOrAuthenticated`'ın CMS-oturumu/preview-secret muafiyetini aynen kullanıp anonim
istekleri ayrıca `visibility=public` ile de kısıtlıyor). Kullanıcı kararıyla eklenmeyenler:
tam iç içe URL routing, şifre korumalı sayfa, `archived` 3. durumu, yazar-scope erişim
kısıtı (Butterfly'nin "Author sadece kendini görür" rolü bizim 4-rol modelimize uymuyor).

Canlı doğrulandı: API üzerinden üst+alt sayfa oluşturuldu, breadcrumb sitede doğru render
oldu (`Ana Sayfa > Kurumsal > Ekibimiz`), private sayfa hem public API'de (`docs: []`) hem
sitede (`404`) doğru şekilde gizlendi, kendi-kendinin-parent'ı olma denemesi 400 ile reddedildi.

**Şema migration'ı** (bu ortamda `push` prod container'da çalışmıyor — bkz. §5): `pages`/
`_pages_v` tablolarına elle eklendi:
```sql
CREATE TYPE enum_pages_visibility AS ENUM ('public', 'private');
CREATE TYPE enum__pages_v_version_visibility AS ENUM ('public', 'private');
ALTER TABLE pages ADD COLUMN parent_id integer;
ALTER TABLE pages ADD CONSTRAINT pages_parent_id_pages_id_fk FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE SET NULL;
CREATE INDEX pages_parent_idx ON pages (parent_id);
ALTER TABLE pages ADD COLUMN visibility enum_pages_visibility DEFAULT 'public';
ALTER TABLE pages ADD COLUMN created_by_id integer;
ALTER TABLE pages ADD CONSTRAINT pages_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX pages_created_by_idx ON pages (created_by_id);
ALTER TABLE _pages_v ADD COLUMN version_parent_id integer;
ALTER TABLE _pages_v ADD CONSTRAINT _pages_v_version_parent_id_pages_id_fk FOREIGN KEY (version_parent_id) REFERENCES pages(id) ON DELETE SET NULL;
CREATE INDEX _pages_v_version_version_parent_idx ON _pages_v (version_parent_id);
ALTER TABLE _pages_v ADD COLUMN version_visibility enum__pages_v_version_visibility DEFAULT 'public';
ALTER TABLE _pages_v ADD COLUMN version_created_by_id integer;
ALTER TABLE _pages_v ADD CONSTRAINT _pages_v_version_created_by_id_users_id_fk FOREIGN KEY (version_created_by_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX _pages_v_version_version_created_by_idx ON _pages_v (version_created_by_id);
```

### 2.8 Rol modelinin AD grubundan ayrıştırılması (19.08.2026)
`ROLES` sabitinin (`cms/src/access/roles.ts`) değerleri artık Vodafone AccessPoint'in ham LDAP
grup adı string'leri değil, kendi iç sözlüğümüz (`new_vertical_maker`, `new_vertical_checker`,
`growth_maker`, `growth_checker`). Yeni dosya `cms/src/access/roleMapping.ts`
(`LDAP_GROUP_TO_ROLE` + `resolveRoleFromLdapGroups()`) bugünün 4 AccessPoint grup adını bu 4 role
çeviriyor — henüz hiçbir auth stratejisinden çağrılmıyor (gerçek LDAP yok) ama gelecekteki
entegrasyonun tam olarak nereye bağlanacağı artık belli. Sonuç: bu 4 permission şeklinden birini
isteyen YENİ bir departman artık tek satır (`roleMapping.ts`'e AD grup adı → mevcut `ROLES.*`
değeri) ile eklenebiliyor, `roles.ts`/`rolePermissions.ts`/collection dosyalarına dokunmadan.
Sınır hâlâ aynı yerde: sıfırdan yeni bir permission ŞEKLİ (bu 4'ünden hiçbirine uymayan bir yetki
seti) hâlâ kod + deploy gerektiriyor — detay ve gerekçe `docs/RFP-OPEN-ITEMS.md` §7'de.
Bu turda ayrıca değerlendirilip KOD DEĞİŞİKLİĞİ olmadan kapatılan iki madde: Users'a
department/title/phone gibi LDAP-senkron alanlar eklenmedi (henüz senkronize edilecek bir LDAP
kaynağı yok — sahte placeholder eklemenin anlamı yok; `avatar`/`preferredLocale` zaten CMS'e özgü
tercihler olarak duruyor), ve bir "rol/izin yönetimi" admin ekranı (Butterfly'daki
`/settings`,`/roles/assign` gibi) bilinçli olarak ŞİMDİ kodlanmadı — local docker'da LDAP yok,
gerek yok; canlıya geçiş öncesi tekrar değerlendirilecek açık madde olarak işaretli
(`RFP-OPEN-ITEMS.md` §7).

### 2.9 Header/Footer menü yönetimi, sayfa envanteri, layout açıklamaları (19.08.2026)
Kullanıcı sorusu: "Ürünler" menüsündeki (header) ve footer'daki linkleri CMS'ten yönetebiliyor
muyuz — ekleyip çıkarabiliyor, sıralayabiliyor muyuz? Bulgu: kod zaten TAM olarak buna göre
yazılmıştı (`NavLinks` koleksiyonu, `section` alanı `header-products`/`header-main`/
`footer-kurumsal`/`footer-sss`/`footer-kampanyalar`/`footer-yasal`, sürükle-bırak
`ReorderWidget` zaten bağlı) — ama koleksiyon local DB'de **0 kayıtlıydı**, `Header.tsx`/
`Footer.tsx`'teki hardcoded fallback dizileri sahnenin tamamını oynatıyordu (kodun kendi
yorumu bunu zaten söylüyordu: "ZERO rows... this array IS what the site currently renders").
Yani kontrol MEVCUTTU ama hiç KULLANILMIYORDU — editör NavLinks'e bir satır eklese bile
göremeyecekti çünkü zaten gösterilen o hardcoded liste değildi (görünüşte aynı içerik
olduğu için fark edilmiyordu). Düzeltme: fallback dizilerdeki 32 satırın tamamı gerçek
`nav-links` kayıtları olarak oluşturulup yayınlandı (API üzerinden — ilk seferde `_status`
belirtilmediği için taslak kalıp hâlâ görünmez oldular, sonra hepsi `published`'a çekildi).
Canlı doğrulandı: bir satır silinince header'daki "Ürünler" menüsünden gerçekten kayboldu,
tekrar eklenince geri geldi — artık NavLinks admin ekranından gerçek zamanlı ekleme/çıkarma/
sıralama çalışıyor, kod değişikliği gerekmiyor.

**Sayfa envanteri:** "Kaç page var, hangileri" sorusuna kısmi cevap zaten vardı — İçerik
Yönetimi raporunun "Sayfalar" tab'ı `Pages` koleksiyonundaki editör-yapımı sayfaları zaten
listeliyordu. Eksik olan, site'nin ~20 geliştirici-yapımı rotasıydı (`/vodafone-pay-uygulama`
gibi src/app/*/page.tsx dosyaları — bunlar Payload dokümanı olmadığı için hiçbir API
sorgusu bunları listeyemez). İçerik Yönetimi'ne yeni bir "Site Sayfaları (geliştirici
yapımı)" sekmesi eklendi — elle bakımı yapılan statik bir referans tablosu (adres + hangi
menüde bağlantılı), API'den çekilmiyor, sadece bilgilendirme.

**Layout blok açıklamaları:** `Pages` koleksiyonunun 6 bloğunun (Hero/Metin/SSS/Kampanya
Grid/Video/Logo Grid) hepsine "ne zaman kullanılır" açıklaması eklendi — blok seviyesinde
Payload'ın `admin.description`'ı desteklemediği (sadece alan seviyesinde var, `tsc` ile
doğrulandı) için bu metin blok `labels.singular`'ına taşındı ("+ Blok Ekle" listesinde ve
blok başlığında görünüyor); her bloğun içindeki tek tek alanlara da (heading, category,
youtubeId vb.) iş birimi diliyle örnekli açıklamalar eklendi.

**Üst Sayfa (parent) seçici "çalışmıyor" şikayeti:** Bug değil — `pages` tablosu local DB'de
sıfır kayıtlıydı, seçilecek başka bir Page yoktu. Canlı kanıtlandı: bir "Kurumsal" Page
oluşturulup kaydedilince, yeni bir Page açıldığında Üst Sayfa alanında "Kurumsal" seçeneği
gerçekten çıktı (ekran görüntüsüyle doğrulandı). Alanın açıklaması da bunu netleştirecek
şekilde güncellendi: "ilk sayfanızı oluştururken liste boş görünür, bu bir hata değildir."

### 2.10 5 ürün sayfasının Pages'e göçü — pilot, 1/5 tamamlandı (19.08.2026)
Kullanıcı "bu 5 ürün sayfası zaten Pages'ten mi yaratılmalıydı" diye sordu — hayır, bunlar
Pages'ten önce var olan, kendi özel koleksiyonlarından (ProductHeroes/FeatureCards/StepCards)
beslenen elle yazılmış rotalar. Kullanıcı yine de bilinçli olarak "silelim, Pages ile sıfırdan
kuralım, eksik blok çıkarsa tamamlarız" dedi. Gap analizinde 4 yeni jenerik blok ihtiyacı
çıktı — İkonlu Kartlar, Adım Listesi, Görsel+Metin Slayt, Çoklu Video — hepsi `Pages.ts`'e
eklendi (+ manuel Postgres migration, prod container'da push çalışmıyor). 3 bileşen
(WhereCanIBuy, VideosWithTabs, LeadFormCta) blok olamıyor, bilinçli olarak dışarıda bırakıldı.
Pilot olarak "Vodafone Pay Uygulaması" tam göçürüldü ve canlı doğrulandı — hatta bu süreçte
gerçek bir iyileştirme bulundu: sayfanın "Ayrıcalıklar" slaytları CMS'te taslak halinde
kilitliydi, hiç görünmüyordu; göç bu içeriği ilk kez yayına aldı. Kalan 4 sayfa (aninda-bakiye,
faturana-yansit, vodafone-pay-kart, qr-ile-faturana-yansit) için kullanıcı onayı bekleniyor —
detay `docs/RFP-OPEN-ITEMS.md` §10.

### 2.11 Footer'daki Kampanyalar/Sık Sorulanlar — kaydın kendisinden yönetim (19.08.2026)
Kullanıcı isteği: footer'da en fazla 6'şar kampanya/soru, hangisinin gösterileceği doğrudan o
kampanyanın/sorunun kendi kaydından ("Footer'da Göster" kutusu) seçilsin, 1-6 arası sıra elle
girilebilsin ya da boş bırakılırsa otomatik boş slota otursun. `Campaigns`/`FaqItems`'a
`showInFooter`+`footerOrder` eklendi; yeni `assignFooterOrder` hook'u (mevcut sıralama
hook'larından farklı olarak) 1-6 arası BOŞ olan ilk slotu buluyor (gap-filling — bir kayıt
kaldırılırsa slot yeniden kullanılabilir olsun diye), doluysa/çakışıyorsa net hata veriyor.
`Footer.tsx`'in bu 2 sütunu artık NavLinks değil doğrudan bu iki koleksiyondan besleniyor,
**fallback'siz** — hiçbir şey işaretlenmemişse sütun boş başlıyor, tam istenen akış. §9'da
seedlenen 11 artık-gereksiz NavLinks satırı silindi. Ayrıca bu turda ilgisiz ama gerçek bir
altyapı sorunu bulunup düzeltildi: `next build` CMS ayakta değilken çalıştığı için anasayfanın
statik prerender'ı boş sonuçla donmuş, ISR'ın kendisi de aynı pencerede tekrar boş sonucu
kullanıyordu — elle `POST /api/revalidate` ile düzeltildi, detay ve kalıcı öneri
`docs/RFP-OPEN-ITEMS.md` §11'de. cms 153/153, root 110/110 test, canlı doğrulandı.

### 2.12 Footer Sırası — otomatik doldurma, buton yok (19.08.2026)
Kullanıcı önceki turdaki "N kayıt var — önerilen sıra: M [M kullan]" akışını istemedi:
"Footer'da Göster" işaretlenince M doğrudan alana yazılsın, buton tıklamaya gerek kalmasın,
editör dilerse elle değiştirsin. Mevcut `LiveOrderField` bilinçli olarak otomatik doldurma
yapmıyordu (elle girilmiş gibi görünüp `assignNextOrder`'ın koruma mantığını bozar diye) ve
algoritması zaten footer'ın 1-6 boşluk-doldurma ihtiyacına uymuyordu ("en yüksek+1" 6 dolup
boşaldıktan sonra `max:6`'yı ihlal eden bir "7" önerirdi). Yeni, amaca özel bir bileşen —
`FooterOrderField.tsx` — sunucudaki aynı boşluk-doldurma mantığını istemcide tekrarlayıp SADECE
alan boşken otomatik dolduruyor. Test sırasında ayrı, önceden var olan bir sınır bulundu:
neredeyse eşzamanlı iki kayıt aynı boş slotu görüp aynı sırayı alabiliyor (DB seviyesinde
atomik değil) — `hooks/ordering.ts`'e not düşüldü, çözülmedi (kapsam dışı, gerçek çözüm bir
unique constraint). Detay `docs/RFP-OPEN-ITEMS.md` §12'de.

### 2.13 Pages "Layout Ekle" ekranı gerçekten açıklayıcı hale getirildi (19.08.2026)
Kullanıcı bir ekran görüntüsüyle gösterdi: §9'da eklenen blok açıklamaları işe yaramamış — "+
Layout Ekle" modalında 10 kart hepsi aynı jenerik placeholder görseli taşıyor, başlıklar "…" ile
tam açıklamanın başladığı yerde kesiliyor. Kök neden: Payload'ın block picker'ı kart genişliği
~150px, uzun `labels.singular` değerleri orada gerçekte çalışmıyor. Çözüm: (1) Payload'ın
`admin.images.thumbnail` desteği kullanılarak her bloğa kendi düzenini gösteren küçük bir SVG
diyagram eklendi (`blockThumb()`, `Pages.ts`), etiketler kısa isme indirildi; (2) Pages'te zaten
var olan ama SADECE liste ekranında görünen `HelpButton`, `admin.components.edit.
beforeDocumentControls` ile create/edit formuna da eklendi; (3) `helpContent.ts`'teki `pages`
girdisi 7 adımlı, eksiksiz bir anlatıma yeniden yazıldı — "EN SIK KARIŞTIRILAN ADIM" olarak
işaretlenmiş, somut örnekli NavLinks bağlama talimatı dahil. Canlı doğrulandı. Detay
`docs/RFP-OPEN-ITEMS.md` §13'te.

### 2.14 CMS admin görsel/UX temizliği ve dashboard yeniden tasarımı (20-24.08.2026)

Bu turun teması: RFP maddesi kapatmak değil, panelin kendisinin "enterprise" hissetmesi —
kullanıcının kendi ifadesiyle "vibe coding app gibi durmasın".

- **Dashboard tamamen yeniden yazıldı:** Payload'ın varsayılan anasayfası (her koleksiyonu
  bir link kartı olarak listeleyen jenerik grid) `views.dashboard` extension point'i ile TAM
  değiştirildi (eski `beforeDashboard` sadece üste ekliyordu, kaldıramıyordu). Yeni anasayfa:
  KPI kartları (Toplam İçerik/Sayfalar/Kullanıcılar/SSS), role göre değişen aksiyon widget'ı
  (Checker'a "İncelemeni Bekleyen Kampanyalar", Maker'a "Taslaklarınız"+"Onay Bekleyen
  Taslaklar"), "Son Giriş Yapanlar" tablosu, "Son Güncellenen İçerikler" panelleri
  (Kampanyalar/Blog/Sayfalar, her birinde "+ Yeni" linki). Canlı olarak 4 rolün hepsiyle
  test edildi. Süreçte iki gerçek CSS bug'ı bulunup düzeltildi: `views.dashboard` Payload'ın
  KENDİ sardığı (Root view zaten `DefaultTemplate` içine alıyor) bir view tipi olduğu için
  bileşenin kendi içinde İKİNCİ bir `DefaultTemplate` sarmalaması çift sidebar/topbar
  üretiyordu; ve Payload'ın kendi `.card` sınıfının `display:flex` varsayılanı, üstüne
  bindirilen panel kartlarının başlığını listenin ortasına düşürüyordu (`flex-direction:
  column` ile düzeltildi) — ikisi de canlı ekran görüntüsüyle bulundu, koddan tahmin
  edilmedi.
- **Ücretler ve Limitler artık gerçekten tek erişim noktası:** `fee-rows`/`limit-tables`
  sidebar'da ayrı görünmüyor (`admin.hidden: true`), ama düzenleme/oluşturma
  `useDocumentDrawer` (Payload'ın modal-içi belge düzenleyicisi, `overrideEntityVisibility`
  varsayılan açık) üzerinden birleşik sayfadan çalışıyor — eski yaklaşım (`hidden`+normal
  link) collection'ın kendi düzenleme rotalarını da 404'letiyordu, kök neden bulunup drawer'a
  geçilerek çözüldü. Canlı doğrulandı: eski URL'ler gerçekten 404, birleşik sayfadan
  satıra tıklamak/yeni oluşturmak çalışıyor.
- **Tüm inline CSS temizlendi:** `cms/src/components/`'taki 11 dosyada kalan her
  `style={{...}}` `custom.css`'e class olarak taşındı (durum bağımlı stiller — HelpButton'ın
  açık/kapalı rengi, ReorderWidget'ın sürüklenen öğe saydamlığı — koşullu className'e
  çevrildi), projenin zaten var olan "CMS'de yeni inline style yok" kuralına uydurmak için.
- **"CMS Saha Rehberi" adında bir iç referans artifact'ı yayınlandı** (Claude Artifacts,
  bu oturuma özel bağlantı) — sidebar/topbar arayüz incelemesi (aşağıda), 22 koleksiyon +
  1 global'in tamamının gerçek kullanım örnekleri VE her biri için "hangi test kullanıcısıyla
  nasıl adım adım test edilir" tarifleri, ve kod okunurken bulunan 5 küçük tekrar/anomali
  notu (en somutu: `order` alanının ~15 satırlık açıklaması 9 koleksiyon dosyasında birebir
  kopyalanmış — merkezi bir `orderField()` fabrikasıyla toplanabilir).
- **Sidebar/topbar çift marka işareti — bulundu, ÇÖZÜLMEDİ, kullanıcı onayı bekliyor:**
  Sidebar'da tam "Vodafone | Pay" logosu VE topbar'da (Payload'ın standart StepNav
  ana-sayfa-ikonu, `AdminIcon.tsx` ile override edilmiş) ayrı, küçük, ikon-only bir "Pay"
  karesi aynı anda görünüyor — kod hatası değil (Payload'ın her kurulumda olan standart
  yapısı), ama iki farklı marka görselinin aynı ekranda tekrar etmesi tutarsız duruyor.
  Önerilen düzeltme (topbar ikonunu sadeleştirmek, tek dosya) rehberde belgelendi ama
  "varolan yapıyı çok değiştirmeyelim" talimatı gereği UYGULANMADI — bkz. §3.

### 2.15 RFP gap-analizi kapatma turu (24.08.2026)

`docs/RFP-GAP-ANALYSIS-2026-08-24.md` (bu turun başında yazılan, RFP'nin 19 bölümünün
tamamını satır satır kodla karşılaştıran taze analiz) kendi "hâlâ açık, kolayca kodla
kapatılabilir" listesinden 10 maddeyi aynı gün içinde kapattı:

- **CI/CD gerçekten çalışır hale geldi:** `.github/workflows/ci.yml` `branches: [master]`
  izliyordu, repo'nun varsayılan dalı `main` — pipeline muhtemelen HİÇ tetiklenmemişti.
  Düzeltildi + `cms/`'in kendi lint/typecheck/test/build'ini çalıştıran ikinci bir
  `cms-quality` job'ı eklendi (öncesinde CI yalnız kök paketi kontrol ediyordu).
- **Audit log'daki 4 gerçek boşluk kapatıldı:** (1) 5 CSV export butonunun kullanımı artık
  loglanıyor (yeni `/api/audit/export` endpoint'i). (2) Rol değişikliği artık genel
  "güncellendi" yerine ayrı bir `role_changed` kaydı olarak (eski/yeni rol adıyla)
  loglanıyor. (3) Hesap kilitlenme ANI artık loglanıyor (açılması zaten loglanıyordu) —
  süreçte gerçek bir üretim bug'ı bulundu: `error?.name === "AuthenticationError"` kontrolü
  production build'de minification yüzünden hiç eşleşmiyordu (`instanceof` kontrolüne
  çevrilip düzeltildi, canlı doğrulandı — eski kod 6 script'lenmiş başarısız girişte SIFIR
  audit satırı üretiyordu). (4) Reddedilen (403) yazma denemeleri artık loglanıyor
  (`auditForbiddenAttempt`, `payload.config.ts`'in kök seviyesindeki `afterError` hook'una
  bağlı — tüm koleksiyonları tek yerden kapsıyor).
- **Checker yetki devri (delegation) — RFP'nin literal isteği, artık var:** Bir Checker
  kendi Users kaydında bir vekil (+ opsiyonel bitiş tarihi) atayabiliyor;
  `hasActiveCheckerDelegate()` bunun tek doğruluk kaynağı, hem sunucu tarafında
  (`denyRolePublish`'in publish izni) hem dashboard'da (inceleme kuyruğu) hem istemci
  tarafında (yayınla butonunun görünmesi) kullanılıyor. Vekilin kendi `role` alanına
  dokunulmuyor — dar kapsamlı, geri alınabilir, zaman sınırlı bir yetki, gerçek bir rol
  değişikliği değil. Frontend'de canlı tıklama testiyle bir gerçek boşluk bulunup
  düzeltildi: backend izni açık olsa da `RoleAwarePublishButton` hâlâ sadece "Onaya Gönder"
  görünümünü gösteriyordu, buton hiç çıkmıyordu — düzeltildi.
- **Media dosya boyutu sınırı genelleştirildi:** Önceden yalnız kullanıcı avatarı 2MB'la
  sınırlıydı; artık tüm Media yüklemeleri görsel için 10MB, video için 100MB ile sınırlı.
- **Önizleme modalına masaüstü/mobil geçiş toggle'ı eklendi.**
- **`deeplink` alanı** BlogPosts/FaqItems/Pages/LegalPages'e eklendi — BlogPosts (yazı detay
  sayfası) ve FaqItems (paylaşılan `Faq.tsx` akordeonu + 8 çağrı noktası) tarafında tam
  bağlandı; Pages/LegalPages'te bilinçli olarak sadece alan var, render edilmiyor (her
  ikisinin de tek bir doğal render noktası yok — kendi koleksiyon yorumlarında gerekçeli).
- **Yeni alanlar için elle Postgres migration'ı** (bu ortamda `push: true` yalnız `next dev`
  üzerinden çalışıyor, prod build'de değil) uygulandı: `users.delegate_to_id`,
  `users.delegation_expires_at`, `enum_audit_logs_action`'a `denied`/`locked`/`role_changed`
  eklendi, deeplink kolonları.
- **Bu turda bulunan, DÜZELTİLMEMİŞ yeni bir üretim riski** — bkz. §3'teki ilk madde:
  sitenin statik build'i (`next build`), CMS henüz ayakta olmadığı bir Docker build
  aşamasında çalışıyor; her CMS-beslemeli statik sayfa (kampanyalar, blog, SSS, nav-links —
  bu turda dokunulmayanlar dahil TÜMÜ) container gerçekten ayağa kalkıp ilk revalidate
  gelene kadar BOŞ içerikle donmuş kalıyor. Build-time log'unda `[cms] fetch failed for
  "..."` satırlarıyla doğrulandı.

### 2.17 Cache/warm-up + 3 RFP maddesi kapatıldı (25.08.2026, ikinci tur)

- **Statik build CMS'e ulaşamıyor / warm-up — §3'ün "Yeni — önemli" tek satırı kapandı.**
  Kök sebep tam olarak §2.15'in son satırında not düşülen sorundu: sadece
  `Campaigns` collection'ı `revalidateTag` yanında `revalidatePath` de gönderiyordu
  (anında taze render), geri kalan HER collection sadece `revalidateTag`
  gönderiyordu (stale-while-revalidate — bir sonraki isteğe kadar eski/boş içerik
  servis ediliyordu). `cms/src/hooks/revalidate.ts`'teki her hook artık
  `revalidatePath("/", "layout")` da gönderiyor — Next'in kendi "revalidate all
  data" çağrısı, kök layout altındaki HER route'u tek seferde temizliyor (footer/
  nav her sayfada olduğu için tek tek path saymak yanlış araçtı). Ayrıca yeni
  `scripts/warm-cache.sh` (`npm run warm-cache`) — her `docker compose up -d
  --build app`'tan hemen sonra çalıştırılmalı, build-anı boş sayfaları ilk
  ziyaretçi beklemeden tazeler. Canlı doğrulandı: `x-nextjs-cache` header'ı
  `STALE`'den `MISS`'e (anlık taze render) döndü.
- **Footer sırası yarış durumu — DB-seviyesi unique constraint.**
  `Campaigns.footerOrder`/`FaqItems.footerOrder` alanlarına `unique: true`
  eklendi (NULL'lar çarpışmaz, sadece 1-6 arası gerçek değerler benzersiz kalır).
  Elle SQL: `ALTER TABLE campaigns/faq_items ADD CONSTRAINT ..._footer_order_unique
  UNIQUE (footer_order);` (R-10 — `push` prod build'de çalışmıyor). Canlı
  doğrulandı: 7 taslak FAQ kaydına eşzamanlı `showInFooter:true` PATCH'i
  gönderildi (6 slotu doldurmaya çalışan bilinçli bir yarış testi) — sadece 2'si
  başarılı oldu, diğer 5'i constraint tarafından reddedildi (aynı uygulamanın her
  yerde kullandığı standart "Lütfen geçersiz alanı düzeltin: X" hata kalıbıyla,
  yeni bir çirkinlik yok). Önceden bu durum sessizce aynı `footerOrder`'ı iki
  kayda yazabiliyordu.
- **Rich text'te iç sayfa linki (RFP §3.2).** `LinkFeature({ enabledCollections:
  [] })` → `["blog-posts", "campaigns", "pages"]` — bu üçü gerçek, sluglı, tek
  bir sayfa route'una karşılık gelen collection'lar (LegalPages/Categories
  bilinçli olarak dışarıda). Yeni `src/lib/internalLink.ts`
  (`resolveInternalDocHref`) collection→URL-prefix eşlemesinin TEK kaynağı;
  `src/components/RichText.tsx`'in `link` converter'ı artık `linkType ===
  "internal"` dalını da işliyor. Canlı doğrulandı: admin'de "Bağlantıyı Düzenle"
  drawer'ında gerçek doküman seçici çıktığı (Payload'ın kendi ücretsiz UI'ı),
  API'nin `depth=1`'de internal link'in hedef dokümanını `slug` dahil populate
  ettiği, ve sitede doğru `/kampanyalar/{slug}` gibi bir `href` render edildiği
  — var olan serbest-URL linkler (regresyon kontrolü) hiç bozulmadan çalışmaya
  devam ediyor.
- **Masaüstü/mobil ayrı URL (§3.2.2).** `NavLinks`'e opsiyonel `mobileHref`
  alanı — boşken (mevcut TÜM kayıtlar) site birebir eskisi gibi davranıyor,
  doluysa sadece mobil çekmece (`HeaderClient.tsx`'in `lg:hidden` bloğu) onu
  kullanıyor, masaüstü bar her zaman `href`'i kullanmaya devam ediyor. Elle SQL:
  `nav_links.mobile_href` + `_nav_links_v.version_mobile_href`. Canlı
  doğrulandı: masaüstü genişlikte eski `href`'e, mobil genişlikte
  (`resize_window` ile) yeni `mobileHref`'e gittiği; mevcut gerçek bir link
  (Kampanyalar) her iki görünümde de birebir aynı `href`'i kullandığı (regresyon
  yok).
- Her iki tarafta `tsc`/`eslint`/test (cms: 163, kök: 118) temiz, tüm test
  verisi (throwaway kampanya/SSS/nav-link kayıtları) temizlendi.

### 2.16 SEO/LegalPages, sidebar ikon, audit-trail gerçek boşlukları kapatıldı (25.08.2026)

- **Sidebar/topbar çift marka işareti düzeltildi ve canlı** — `AdminIcon.tsx` artık tema
  rengini takip eden yalın bir ev-ikonu SVG'si (marka kırmızısı değil), sidebar'ın kendi tam
  logosunun yanında ikinci bir "marka" görünmüyor. Commit `6835fc8`.
- **`docs/varnish-cache.md` repoya commit'lendi** (kullanıcı kararı: "Repoya commit'le") —
  sahibi/amacı hâlâ tam netleşmedi ama artık untracked değil. Commit `4fee8fa`.
- **LegalPages'in `intro` alanı gerçek rich text oldu** (§3.2 SEO maddesi) — önceden düz
  `textarea`'ydı, şimdi Lexical richText. 2 farklı kullanım şekli ayrı ayrı korundu: akan
  metin sayfaları (`cerez-politikasi`, `gizlilik-ve-guvenlik-politikasi`) `<RichText>` ile,
  satır-bazlı liste sayfaları (`sozlesmeler-ve-formlar`, `web-sitesi-hukum-ve-sartlari`,
  `bilgi-guvenligi`) yeni `richTextToLines()` yardımcısıyla render ediliyor. Süreçte gerçek
  bir üretim bulgusu ortaya çıktı: **5 `legal_pages` kaydının TAMAMI `draft` durumundaydı** —
  site aslında hardcoded fallback metniyle çalışıyordu, CMS içeriği hiç yayında değildi
  (metinler kelimesi kelimesine aynı olduğu için fark edilmemiş). Hepsi yayınlandı. Commit
  `73dde0c`.
- **Meta keywords alanı eklendi** (kullanıcı kararı: "ölü SEO pratiği ama yine de ekleyelim")
  — `seoKeywordsField` (`lib/seoFields.ts`, 4 koleksiyonda paylaşılan tek alan tanımı),
  `buildMetadata()` ve 22 sayfa/route'ta `<meta name="keywords">` üretimine bağlandı. Commit
  `5c8b795`.
- **Audit trail'in RFP §7'de hâlâ açık olan 3 maddesi kapatıldı:**
  - **Before/after diff** — `diffFields()` her gerçek güncellemede üst-seviye alan bazlı bir
    önce/sonra listesi üretiyor (uzun/iç içe alanlar kısaltılıyor), `audit-logs`'un yeni
    `changes` array alanında görünüyor. Backing tablo (`audit_logs_changes`) elle oluşturuldu
    (R-10 nedeniyle `payload migrate:create` çalışmıyor).
  - **SIEM/CEF export** — `lib/cef.ts`, spec-doğru CEF satırları üreten indirilebilir `.cef`
    dosyası (gerçek bir ArcSight/SIEM hedefi bu ortamda yok, CSV export'un "indir, gönderme"
    şeklinin aynısı). `AuditLogsCefExportButton` audit-logs listesine eklendi.
  - **userID karşılaştırma tabloları** — RFP metninin kendisi bile bu maddeyi açıklamıyor;
    kullanıcı kararıyla bir **rol × koleksiyon erişim matrisi** olarak yorumlandı. Yeni
    `/admin/access-matrix` görünümü (`AccessMatrixView`/`AccessMatrixApp`), `HelpButton`'ın
    zaten kullandığı `MATRIX`'ten üretiliyor (tek doğruluk kaynağı), CSV export'lu.
  - **Kapsam dışı bırakılan tek madde: dosya-indirme logu.** Media/Documents,
    `s3Storage()`'ın kendi `generateFileURL`'i ile DOĞRUDAN MinIO/S3 URL'i döndürüyor —
    gerçek dosya indirmeleri hiçbir Payload hook'undan geçmiyor. Bunu "loglamak" için ya bir
    proxy-endpoint yeniden tasarımı gerekir ya da admin sayfa-görüntülemesini indirme gibi
    göstermek gerekir (yanıltıcı olur) — bilinçli olarak yapılmadı, sahte bir çözümle
    kapatılmadı.
  - Docker'da canlı doğrulandı (before/after diff'in admin UI'da doğru göründüğü, CEF/CSV
    export'ların hatasız network akışı, matrix tablosunun doğru V/C/U/P/D bayrakları
    gösterdiği). `cms`: lint/typecheck/test(160)/build hepsi temiz. Commit'ler `4c458bf`,
    `3827c7a`.
- **CI:** gerçek bir push ile tetiklendi (yukarıdaki commit'ler `main`'e gitti) ama bu
  ortamda `gh` CLI/GitHub API erişimi yok — yeşil dönüp dönmediği bu oturumda doğrulanamadı.
  Kullanıcının Actions sekmesinden kontrol etmesi gerekiyor.
- **Dev container host izin hatası** — kullanıcı bu turda araştırmayı erteledi ("şimdilik
  atlayalım, sadece not düşelim"); bkz. §3'teki mevcut satır, hâlâ host-seviyesi/Docker
  Desktop dosya-paylaşımı sorunu, kod tarafında dokunulmadı.

---

## 3. Açık Kalan Riskler / Yapılacaklar

_Bu tablo 24.08.2026 itibarıyla yeniden gözden geçirildi — §2.15'te kapatılan 10 madde (CI,
4 audit boşluğu, delegation, media boyut sınırı, mobil önizleme, deeplink) buradan çıkarıldı._

| ID | Konu | Durum |
|---|---|---|
| ~~Yeni — önemli~~ | ~~Statik build CMS'e ulaşamıyor~~ — **25.08'de kapandı** (§2.17): her collection artık `revalidatePath("/", "layout")` da gönderiyor (tüm site tek seferde tazeleniyor, sadece Campaigns'in ayrıcalığı değil), + deploy-sonrası `scripts/warm-cache.sh` eklendi. | Kapandı |
| ~~Yeni~~ | ~~Sidebar/topbar çift marka işareti~~ — **25.08'de düzeltildi ve canlı** (§2.16), `AdminIcon.tsx` artık tema-uyumlu yalın bir ikon. | Kapandı |
| R-10 | `payload migrate:create`/`generate:importmap` çalışmıyor (`ERR_REQUIRE_ASYNC_MODULE`) — yeni collection/field/lexical özelliği eklemek elle `importMap.js` düzenlemesi gerektiriyor, unutulursa sessiz başarısızlık. **En kritik yapısal açık — bu ve önceki turlar boyunca defalarca elle düzeltildi, sonu gelmiyor.** | Açık |
| R-26 | Postgres native enum'lar, migration olmadan `select` seçenek değişikliğinde manuel `ALTER TYPE` istiyor — R-10'un somut bir belirtisi. 24.08'de yine elle SQL uygulandı (delegation/audit/deeplink alanları için). | Açık |
| Yeni | SonarQube taraması hâlâ çalıştırılamadı (token eksik/401) — bu turda da denenmedi. Bir sonraki oturumda token alınıp `scripts/sonar-scan.sh all` ile taranmalı. | Açık |
| ~~Yeni~~ | ~~Audit trail'de RFP §7'nin karşılamadığı alt maddeler~~ — **25.08'de 3'ü kapandı** (before/after diff, SIEM/CEF export, userID karşılaştırma tabloları → erişim matrisi, §2.16). "Hangi dosya indirildi/okundu" logu **26.08'de non-issue olarak kapandı** (aşağıdaki satır). | Kapandı |
| ~~Yeni~~ | ~~Dosya-indirme/okuma logu yok~~ — **26.08'de kullanıcı kararıyla "gerçek eksiklik değil" olarak kapandı.** Media ve Documents'ın ikisi de `access.read: () => true` — kasıtlı olarak herkese açık: Media genel sitede render olan kampanya/blog görselleri, Documents RFP'nin "Sözleşmeler ve Formlar" maddesi gereği ziyaretçinin indirmesi gereken PDF'ler. Bu dosyalar için "kim indirdi" logu anonim ziyaretçi trafiğini loglamak olurdu; RFP §7'nin kastettiği "CMS içinde kim ne yaptı" audit'i zaten `audit-logs` koleksiyonunda var (login/create/update/delete/export, hepsi kimliği doğrulanmış kullanıcılar için). Proxy-download-logging mimarisi kasıtlı olarak kurulmadı. | Kapandı (non-issue) |
| ~~Yeni~~ | ~~`assignFooterOrder`'ın boş-slot yarışı~~ — **25.08'de kapandı** (§2.17): `footerOrder` alanına `unique: true`, canlıda 7 eşzamanlı istekle yarış bilinçli tetiklendi, constraint doğru şekilde 5'ini reddetti. `LiveOrderField`'ın (genel `order`/`homepageOrder` alanları, sınırsız liste) kendi "önerilen sıra" yarışı AYRI ve hâlâ açık — o alanlar unique değil, aynı sayı iki kayıtta teknik olarak sorun yaratmaz (sadece ekranda geçici bir sıralama belirsizliği), footer'ın sabit-6-slotlu yapısındaki gibi bir veri bütünlüğü riski taşımıyor. | Footer'daki kısmı kapandı, genel `order` alanları bilinçli açık |
| Yeni | `EXPERIMENTAL_TableFeature`/`TextStateFeature` — paketin kendisinin "deneysel" işaretlediği API'ler; gelecekteki bir `@payloadcms/richtext-lexical` yükseltmesinde davranış değişebilir. | İzlenmeli |
| ~~Yeni~~ | ~~Rich text editöründe dahili sayfa linki kapalı~~ — **25.08'de kapandı** (§2.17): `blog-posts`/`campaigns`/`pages` için Payload'ın kendi doküman-seçici UI'ı açıldı, `src/lib/internalLink.ts` render tarafındaki slug→URL çözücü. | Kapandı |
| R-22 | 5 legal sayfa + 3 kurumsal sayfa gövdesi hâlâ hardcoded (bilinçli — hukuki doğruluk riski). | Bilinçli açık |
| R-23 | `VideosWithTabs` CMS'e bağlanmadı (gerçek video yok, ürün kararı bekliyor). | Bilinçli açık |
| R-15..R-21 | Yapısal/operasyonel P2'ler: şablon `package.json` kimliği, workspace ayrımı yok, Node/Next sürüm hizası, prod image domain'i, dev servisinin prod compose'da olması, `/api/health` yok, sitemap/robots/error sayfaları eksik. | Dokunulmadı |
| Yeni | 5 elle-yazılmış ürün sayfasından yalnız 1'i (`vodafone-pay-uygulama`) `Pages` koleksiyonuna göçürüldü (pilot, §2.10) — kalan 4 (aninda-bakiye, faturana-yansit, vodafone-pay-kart, qr-ile-faturana-yansit) kullanıcı onayı bekliyor. | Kullanıcı onayı bekliyor |
| Yeni | `docs/CMS_INTEGRATION_PLAN.md` Strapi öneriyor, proje Payload ile inşa edildi — bu sapmanın gerekçesi hiçbir yerde yazılı değil (dokümantasyon boşluğu, fonksiyonel değil). | Küçük, dokümantasyon-only |
| Yeni | `docker compose up`'taki `dev` servisi (port 3001, hot-reload) host tarafında bir Docker Desktop dosya-paylaşımı izin hatasıyla başlamıyor (`operation not permitted`) — kod/config sorunu değil, host ayarı (Docker Desktop → Settings → Resources → File Sharing). Ana CMS/site stack'i (postgres/minio/app/cms) etkilenmiyor. | Açık, host-seviyesi |
| ~~Yeni~~ | ~~`docs/varnish-cache.md` untracked duruyordu~~ — **25.08'de kullanıcı kararıyla commit'lendi** (§2.16, `4fee8fa`). Sahibi/amacı hâlâ tam belgelenmedi ama artık repo'nun bir parçası. | Kapandı (untracked sorunu) |
| CI | `.github/workflows/ci.yml` `main`'i izliyor + `cms/`'i de kontrol ediyor (24.08 düzeltmesi). 25.08'de gerçek commit'lerle `main`'e push edildi (bkz. §2.16) ama bu ortamda `gh` CLI/GitHub API erişimi olmadığından pipeline'ın yeşil dönüp dönmediği hâlâ doğrulanamadı. | Push edildi, yeşil dönüşü kullanıcı tarafından Actions sekmesinden teyit edilmeli |
| LDAP | Gerçek LDAP/AccessPoint bağlantısı kurulmadı (kullanıcı kararı). Plan hazır: `docs/RFP-OPEN-ITEMS.md` §6. | Kullanıcı kararıyla bekliyor |
| Analytics/Sentry/çoklu kanal | RFP'nin gerçek 3. parti hesap/altyapı gerektiren maddeleri (§3.2.10, §3.2.11, §4 hata izleme, §3.5.2-3.5.5 rol-özel raporlama ekranları) — gerçek hesap bilgisi olmadan sahte entegrasyon eklemek anlamsız. | Kapsam dışı (bilgi bekliyor) |
| ~~Masaüstü/mobil ayrı URL (§3.2.2)~~ | ~~Hiç alan yok~~ — **25.08'de kapandı** (§2.17): `NavLinks.mobileHref`, opsiyonel, sadece mobil çekmece kullanıyor. | Kapandı |
| Bilinçli açık (değişmedi) | SSO/LDAP gerçek entegrasyonu, ayrı test ortamı+promosyon akışı, içerik-seviyesi çok dillilik, RFP'nin 5 rol taksonomisi yerine mevcut 4 rol, meta `keywords` alanı — hepsi kullanıcı kararıyla bilinçli olarak kapsam dışı, teknik eksiklik değil. Detay: `docs/RFP-GAP-ANALYSIS-2026-08-24.md` §9. | Kullanıcı kararıyla kapsam dışı |

---

## 4. Zorunlu Kontrol Listesi (her büyük değişiklikten önce/sonra)

1. `npm run typecheck && npm run lint && npm run test` — hem kökte hem `cms/`'de.
2. `docker compose -p vodafonepaycomtr build <servis>` + `up -d <servis> --force-recreate` (ya da `up -d --build <servis>`).
3. Tarayıcıda gerçek test kullanıcılarıyla canlı doğrulama (rol bazlı) — ISR cache'i nedeniyle bir CMS değişikliğinden sonra sayfayı **iki kez** yenilemek gerekebilir (stale-while-revalidate: ilk istek eskiyi döndürüp arka planda tazeler).
4. `SONAR_TOKEN=<token> scripts/sonar-scan.sh all` (veya `web`/`cms`) — açık bulgu kalmamalı.
5. Dockerfile/dependency değiştiyse `scripts/trivy-scan.sh all`.
6. Commit → `main`'e push.
7. Yeni bir custom admin component/lexical özelliği eklendiyse (R-10) → `cms/src/app/(payload)/admin/importMap.js`'e elle eklenmediyse sessizce render olmaz — mutlaka kontrol et.

---

## 5. Ortam Notları

- **DB şeması elle yönetiliyor** (R-10 yüzünden): yeni kolon/enum değeri gerekiyorsa
  `docker exec vodafonepaycms-postgres psql -U payload -d vodafonepaycms` ile elle SQL
  uygulanıyor. Her round raporunun kendi "Copy-paste SQL" bölümü var (bkz. §6).
  Örnek: `ALTER TYPE enum_categories_scope ADD VALUE IF NOT EXISTS 'blog';`
- **Revalidate secret:** `docker exec vodafonepaycomtr printenv REVALIDATE_SECRET` ile
  container içinden okunabilir; `/api/revalidate`'e `x-revalidate-secret` header'ıyla
  gönderilerek belirli bir tag için ISR cache'i manuel tazelenebilir.
- **Test kullanıcıları:** `docs/TEST-USERS.MD` (4 rol, şifreleri dahil — asla commit edilmez,
  sadece bu repo'nun ana kopyasında).

---

## 6. Diğer Dokümanlar — Ne Zaman Bakılır

Bu dosya güncel genel durumu özetler; aşağıdakiler hâlâ duruyor çünkü belirli bir konuda
tarihsel/madde-madde detay taşıyorlar — silinmediler, sadece günlük takip için bu dosya yeterli.

### Durum/rapor dosyaları (kronolojik)
| Dosya | Ne için |
|---|---|
| `docs/RFP-GAP-ANALYSIS-2026-08-24.md` | **Güncel RFP uyum analizi** — 19 bölümün tamamı satır satır koda karşı yeniden doğrulandı, `docs/RFP-GAP-ANALYSIS.md`'nin (11.08) yerini alıyor. §9'daki "hâlâ açık" listesinin çoğu aynı gün §2.15'te kapatıldı — bu dosyanın §3'ü ikisinin birleşik/güncel hali. |
| `docs/RFP-GAP-ANALYSIS.md` | Orijinal RFP uyum analizi (11.08.2026) — artık tarihsel referans, yerini yukarıdaki 2026-08-24 versiyonu aldı. |
| `docs/T0-PRODUCTION-READINESS.md` | Detaylı risk kaydı (R-01..R-26), olgunluk skoru, fazlı yol haritası — bu dosyadaki §3 tablosunun kaynağı. |
| `docs/AUDIT-CONTENT-CMS.md` | İçerik parity + CMS yeterlilik denetimi — 5 paralel ajanın (canlı site envanteri, repo envanteri, CMS şema denetimi, hardcoded içerik taraması, teknik/SEO denetimi) bulgu sentezi. |
| `docs/BACKLOG-CONTENT-CMS.md` | Yukarıdaki denetimin P0/P1/P2 görev listesi — büyük ölçüde tamamlanmış işin orijinal planı. |
| `docs/CMS_INTEGRATION_PLAN.md` | CMS entegrasyonunun ilk planlama dokümanı (hangi koleksiyon, hangi site sayfası). |
| `docs/RFP-OPEN-ITEMS.md` | RFP'nin her maddesinin (§3.1-§7) bu repo'daki güncel karşılığı — ✅/🟡/❌/⬜ notasyonuyla. |
| `docs/DUZELTME-TURU-RAPORU.md` | "Düzeltme & İyileştirme Turu" (Faz 0/A-H) — kök-neden analizleri (`/kampanyalar` bug'ı, profil fotoğrafı, audit-logs matris), bilinçli yapılmayanlar, rol-rol doğrulama, açık riskler. |
| `docs/DUZELTME-TURU-3-RAPORU.md` | 3. düzeltme turu (CMS-USER-TESTS Bölüm 5, madde 5.1-5.12) — kök neden analizleri, tasarım kararları. |
| `docs/GUVENLIK-TARAMA-VE-ROL-TESTI.md` | 3. turdan sonraki güvenlik taraması + 4 rol × 4 akış uçtan uca test raporu — en kritik bulgu: `afterLogin` hook'unun kendi oturumunu silmesi. |
| `docs/KATEGORI-SSS-TURU-RAPORU.md` | Kategori/SSS/Blog scope ayrımı turu (CMS-USER-TESTS Bölüm 6) — `aninda-bakiye-2` kök neden kanıtı, karar/alternatif listesi, SQL. |
| `docs/RICHTEXT-SIRA-TURU-RAPORU.md` | Sıra UX + rich text editörü turu (CMS-USER-TESTS Bölüm 7) — renderer/renk kararları, canlı site karşılaştırması, SQL, açık riskler. |
| `docs/CMS-USER-TESTS.md` | **En ayrıntılı kayıt.** Kullanıcının CMS'i uçtan uca test ederken verdiği ham geri bildirimin birebir kaydı + her maddenin DoD/fix/test detayı — 9 bölüm, 60+ madde, sondaki İlerleme Özeti tablosu tek başına kronolojik bir changelog. |

### Rehber/referans dosyaları
| Dosya | Ne için |
|---|---|
| `docs/RUNBOOK.md` | Uçtan uca RBAC/collection test senaryoları — yeni bir rol/collection eklendiğinde nasıl test edileceği. |
| `docs/SSS-BLOG-REHBER.md` | Editörler için: SSS/Blog kategorisi nasıl oluşturulur, scope ne işe yarar. |
| `docs/TEST-USERS.MD` | 4 test kullanıcısının e-posta/şifresi — asla commit edilmemeli. |
| `docs/research/INSPECTION_GUIDE.md`, `PAGE_TOPOLOGY.md`, `BEHAVIORS.md` | Projenin en başındaki canlı site tersine mühendislik notları (`/clone-website` akışından kalma) — sayfa envanteri, tasarım token'ları, etkileşim kalıpları. Artık çoğunlukla tarihsel referans. |

### Kaynak prompt dosyaları (rapor değil — Claude'a verilen ham talimatlar)
| Dosya | Ne için |
|---|---|
| `docs/PRODUCTION_READINESS_PROMPT.md` | T0 analizi + production hazırlığı için verilen orijinal prompt (4 faz). |
| `docs/CONTENT-CMS-AUDIT-PROMPT.md` | İçerik parity denetimi için verilen orijinal prompt (`AUDIT-CONTENT-CMS.md`/`BACKLOG-CONTENT-CMS.md`'i üreten). |
| `docs/CLAUDE-CODE-PROMPT.md` … `CLAUDE-CODE-PROMPT-5.md` | Kullanıcının art arda verdiği yapılandırılmış Türkçe geri bildirim promptları — CMS-USER-TESTS.md'nin ilgili bölümlerinin ham kaynağı. Sırasıyla: kategori/SSS mimarisi, sıra UX + rich text editörü, en son (bu dosyanın da kaynağı olan) tur. |
