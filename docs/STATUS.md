# Genel Durum — Tek Takip Dosyası

_Son güncelleme: 18.08.2026, branch `main` (her adımda doğrudan `main`'e push edildi)._

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
- Kök: Vitest + Testing Library, **106 test** (9 dosya) — hepsi geçiyor.
- `cms/`: Vitest, **130 test** (16 dosya) — hepsi geçiyor.
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

---

## 3. Açık Kalan Riskler / Yapılacaklar

| ID | Konu | Durum |
|---|---|---|
| R-10 | `payload migrate:create`/`generate:importmap` çalışmıyor (`ERR_REQUIRE_ASYNC_MODULE`) — yeni collection/field/lexical özelliği eklemek elle `importMap.js` düzenlemesi gerektiriyor, unutulursa sessiz başarısızlık. **En kritik yapısal açık — bu tur boyunca defalarca elle düzeltildi.** | Açık |
| R-26 | Postgres native enum'lar, migration olmadan `select` seçenek değişikliğinde manuel `ALTER TYPE` istiyor — R-10'un somut bir belirtisi. | Açık |
| Yeni | SonarQube taraması bu turda çalıştırılamadı (token eksik/401) — bir sonraki oturumda token alınıp `scripts/sonar-scan.sh all` ile taranmalı. | Açık |
| Yeni | Eşzamanlı editör yarışı: `LiveOrderField`'ın "önerilen sıra"sı, iki editör aynı grupta aynı anda kayıt oluşturursa ikisine de aynı sayıyı önerebilir — `assignNextOrder` hook'unun zaten taşıdığı sınıfın bir uzantısı, çözülmedi. `assignFooterOrder`'da da aynı sınıf risk var, canlı test sırasında gerçekten tetiklendi (3 kayıt aynı slotu paylaştı) — gerçek çözüm bir DB unique constraint, bu turun kapsamı dışında. | Bilinçli açık |
| Yeni | `EXPERIMENTAL_TableFeature`/`TextStateFeature` — paketin kendisinin "deneysel" işaretlediği API'ler; gelecekteki bir `@payloadcms/richtext-lexical` yükseltmesinde davranış değişebilir. | İzlenmeli |
| Yeni | Rich text editöründe dahili sayfa linki (internal doc link) kapalı — sitenin slug→URL çözücüsü yazılmadığı için sadece özel URL girilebiliyor. | Bilinçli açık |
| R-22 | 5 legal sayfa + 3 kurumsal sayfa gövdesi hâlâ hardcoded (bilinçli — hukuki doğruluk riski). | Bilinçli açık |
| R-23 | `VideosWithTabs` CMS'e bağlanmadı (gerçek video yok, ürün kararı bekliyor). | Bilinçli açık |
| R-15..R-21 | Yapısal/operasyonel P2'ler: şablon `package.json` kimliği, workspace ayrımı yok, Node/Next sürüm hizası, prod image domain'i, dev servisinin prod compose'da olması, `/api/health` yok, sitemap/robots/error sayfaları eksik. | Dokunulmadı |
| CI | `.github/workflows/ci.yml` hâlâ `master`'ı izliyor, gerçek branch `main` — muhtemelen hiç çalışmıyor; `cms/`'i hiç doğrulamıyor. | Açık |
| LDAP | Gerçek LDAP/AccessPoint bağlantısı kurulmadı (kullanıcı kararı). Plan hazır: `docs/RFP-OPEN-ITEMS.md` §6. | Kullanıcı kararıyla bekliyor |
| Analytics/Sentry/çoklu kanal | RFP'nin gerçek 3. parti hesap/altyapı gerektiren maddeleri (§3.2.10, §3.2.11, §4 hata izleme, §3.5.2-3.5.5 rol-özel raporlama ekranları) — gerçek hesap bilgisi olmadan sahte entegrasyon eklemek anlamsız. | Kapsam dışı (bilgi bekliyor) |
| Masaüstü/mobil ayrı URL (§3.2.2) | Hiç alan yok — niş bir istek, modern responsive tasarımla zaten karşılanıyor. | Açık, düşük öncelik |

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
| `docs/RFP-GAP-ANALYSIS.md` | Orijinal RFP uyum analizi (11.08.2026) — PoC'un devredilebilir olup olmadığı sorusuna ilk cevap, tüm eksiklerin kaynak listesi. |
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
