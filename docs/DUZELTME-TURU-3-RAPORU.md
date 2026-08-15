# Vodafone Pay CMS — 3. Düzeltme Turu Raporu

Bu rapor, `docs/CMS-USER-TESTS.md` Bölüm 5'teki 12 maddenin (5.1–5.12) nasıl
kapatıldığını, kök neden analizlerini, verilen tasarım kararlarını ve bilinçli
olarak yapılmayanları içerir.

**Çalışma kopyası:** `.claude/worktrees/selam-login-disable-temp-725fb7`
(branch `claude/selam-login-disable-temp-725fb7`).

---

## 1) Özet: ne yapıldı

| # | Konu | Sonuç |
|---|---|---|
| 5.1 | Referans bütünlüğü (silme guard'ı) | Tamamlandı — jenerik `blockDeleteIfReferenced()` + tek referans haritası |
| 5.2 | Kampanya filtresi | Tamamlandı — tek kaynaktan türetilen liste |
| 5.3 | Kampanya tarihi | Tamamlandı — paylaşılan `CampaignDate` bileşeni |
| 5.4 | Yayındaki kampanyayı düzenleme | Tamamlandı — `_status` üzerinden unpublish akışı |
| 5.5 | `order` sıralaması | Tamamlandı — 9 koleksiyona `defaultSort`, 1-tabanlı, otomatik atama |
| 5.6 | Hesap kilidi | Tamamlandı — **önceki tespit yanlıştı, aşağıda §2.3** |
| 5.7 | Dil / içerik locale | Tamamlandı — `localization` kapatıldı |
| 5.8 | "Remember me" | Tamamlandı |
| 5.9 | Content Management raporu | Tamamlandı — 22 koleksiyon, salt okunur |
| 5.10 | Login ekranı metinleri | Tamamlandı |
| 5.11 | Campaigns CSV export | Tamamlandı — 20 sütun + ortak export altyapısı |
| 5.12 | Fallback maskeleme + UI denetimi | Kısmen — §4'te ne kaldığı ve nedeni |

**Commit'ler:** `b42388c` (site tarafı), `e38a7ca` (CMS tarafı) + dokümantasyon.

---

## 2) Kök neden analizleri

### 2.1 — Referans bütünlüğü: `beforeDelete` diye bir şey hiç yoktu (5.1)

Bildirilen vaka (kategori silinince ona bağlı kampanyanın sessizce kalması) tek
bir alanın sorunu değildi. `cms/src/` altında **`beforeDelete` sıfır kez**
geçiyordu — hiçbir koleksiyon, silinmek istenen kaydın referans alınıp
alınmadığını kontrol etmiyordu.

Postgres de arkada durmuyordu. Canlı DB'ye bakıldığında Payload/drizzle'ın
ürettiği **17 FK'nin tamamı `ON DELETE SET NULL`**:

```
campaigns.category_id     -> categories   SET NULL
campaigns.image_id        -> media        SET NULL
blog_posts.cover_image_id -> media        SET NULL
feature_cards.icon_id     -> media        SET NULL
...
```

Yani `Campaigns.category` alanı `required: true` olduğu halde, kategori
silinince kampanya **kategorisiz** kalıyor, `_status` hâlâ `published` olduğu
için sitede duruyor, ama hiçbir kategori filtresine düşmüyordu. Site
tarafındaki zod şeması da `category`'yi `nullable()` kabul ettiği için hiçbir
katmanda uyarı çıkmıyordu.

**Çözüm yaklaşımı — neden jenerik:** 17 koleksiyona 17 ayrı hook yazmak, bir
sonraki ilişki eklendiğinde aynı hatanın tekrarlanacağı anlamına gelirdi.
Bunun yerine `cms/src/hooks/referentialIntegrity.ts` içinde **tek bir
`REFERENCE_MAP`** ("kim kimi işaret ediyor") ve bunu okuyan **tek bir
`blockDeleteIfReferenced()` factory'si** var. Yeni ilişki = haritaya tek satır.

**Önceki turun bir varsayımı çürütüldü.** `Pages.layout` gibi polimorfik
`blocks` dizilerindeki medya referansları, "Payload'ın düz `where` sorgusu
bunları güvenilir hedefleyemiyor" gerekçesiyle kapsam dışı bırakılmıştı.
Canlıda ölçtüm — test verisi oluşturup sorguladım:

```
where[layout.image][equals]=65        -> totalDocs = 1   ✅
where[layout.logos.logo][equals]=65   -> totalDocs = 1   ✅
```

Çalışıyor. Dolayısıyla bu iki referans "belki kullanılıyordur" uyarısı olarak
değil, tam kapsamda guard'a dahil edildi. Aynı bulgu `MediaUsageField`'ın
"Kullanıldığı Yerler" listesini de genişletti.

**Engelleyen vs. engellemeyen ayrımı.** `users` hedefine giden üç referans
(`campaigns.createdBy`, `campaigns.rejectedBy`, `media.uploadedBy`) bilinçli
olarak **engellemiyor**: bunlar içerik bağımlılığı değil, "kim yaptı" bilgisi.
Engelleseydik, sisteme bir kez dokunmuş hiçbir kullanıcının hesabı asla
kapatılamazdı. Bunun yerine silme sırasında hangi alanların boşaldığı audit
log'a yazılıyor — sessizce geçmiyor.

**Probe hatası → kapalı düşüş.** Bir kontrol sorgusu çalışamazsa (DB hatası
vb.) engelleyici bir referans için guard silmeyi **reddediyor**. Sessizce izin
vermek, bu modülün önlemek için var olduğu bug'ın aynısı olurdu.

### 2.2 — Kampanya filtresinde gizli ikinci bug (5.2)

Bildirilen davranışın (kategori seçilince favoriler bloğunun kalması) altında
ikinci bir bug vardı: `CampaignsFilterableList` **önceden ayrılmış iki dizi**
alıyordu (`favorites` = featured, `allCampaigns` = geri kalan). Favori bir
kampanya sadece `favorites` dizisinde olduğu için, sadece favoriler bloğunu
kaldırmak o kampanyaları sayfadan **tamamen** yok ederdi.

Bileşen artık `featured` bayrağını taşıyan tek bir liste alıp iki görünümü de
ondan türetiyor — bir kampanyanın hiçbir listede olmaması yapısal olarak
imkânsız.

### 2.3 — Hesap kilidi: brief'teki tespit yanlıştı (5.6)

Hem `Users.ts`'teki yorum ("see auth.maxLoginAttempts, not configured") hem de
bu turun brief'i (§3.4), lockout'un hiç olmadığını ve sonsuz yanlış parola
denenebildiğini söylüyordu.

**Bu doğru değil.** Payload'ın `addDefaultsToAuthConfig`'i
(`payload/dist/collections/config/defaults.js`) **her** auth config'e — obje
formuna da — şunları uyguluyor:

```js
auth.lockTime = auth.lockTime ?? 600000;      // 10 dakika
auth.maxLoginAttempts = auth.maxLoginAttempts ?? 5;
```

Kanıt: `login_attempts` ve `lock_until` kolonları canlı DB'de mevcut — bu
alanlar Payload tarafından **yalnızca `maxLoginAttempts > 0` iken** ekleniyor
(`auth/getAuthFields.js`). Ayrıca yanlış parola denemesi sayacı gerçekten
artırıyor (test sırasında doğrulandı).

Yani lockout zaten çalışıyordu — sadece **görünmüyordu** ve kimse
kaldıramıyordu. Bu turda yapılan iş "lockout'u açmak" değil, politikayı açıkça
yazmak (5 deneme / 15 dakika), kilidi görünür kılmak ve kaldırılabilir hale
getirmek oldu.

**Ayrıca:** başarısız girişlerin loglanamayacağı tespiti de kısmen yanlıştı.
Login hook'ları için doğru — Payload `AuthenticationError`'ı
`beforeLogin`/`afterLogin` çalışmadan önce fırlatıyor
(`auth/operations/login.js`, `if (!authResult)` dalı). Ama `afterError` hook'u
bunu görüyor; `login_failed` audit kaydı artık oradan yazılıyor.

### 2.4 — Dil: iki mekanizma tek şey sanılıyordu (5.7)

Panelde iki ayrı "dil" kavramı vardı:

1. **Admin arayüz dili** — `i18n`, `payload-lng` cookie'si, profildeki
   "Dil Tercihi".
2. **İçerik locale'i** — `localization` bloğu; Payload bunun için üst bara
   kendi locale seçicisini basıyor.

Kullanıcının "sayfaların locals değerleri hiç değişmiyor" gözlemi (2) ile
ilgiliydi ve **tamamen haklıydı**: `localization` açıktı ama tüm CMS'te
`localized: true` olan **tek alan `Pages.title`**'dı. Üst bardaki seçici hiçbir
ekranda hiçbir şeyi değiştirmiyordu.

### 2.5 — `defaultSort` sadece bir koleksiyonda vardı (5.5)

`defaultSort` yalnızca `Campaigns.ts`'te tanımlıydı. `order` alanı olan diğer
**9 koleksiyonun tamamı** Payload'ın varsayılan sırasında listeleniyordu — yani
`ReorderWidget` ile kaydedilen sıra, onu kontrol etmesi gereken listede hiç
görünmüyordu. Sürükle-bırak özelliği pratikte işlevsizdi.

Buna ek olarak `ReorderWidget` dizi indeksini yazıyordu: ilk öğe hep `0`
oluyordu, ki `0` eski `defaultValue: 0`'ın ürettiği "atanmamış" değerle
ayırt edilemezdi.

---

## 3) Tasarım kararları

### 3.1 — 5.4: "Pasife çekme" `_status` mi, `campaignStatus` mü?

**Karar: `_status` (Payload'ın kendi unpublish'i).** Kullanıcıyla teyit edildi.

İkisi farklı şeyler:

| | `_status: draft` | `campaignStatus: expired` |
|---|---|---|
| Anlamı | Yayında değil, düzenlenebilir | Kampanya bitti |
| Site etkisi | Sayfadan kalkar (taslak) | Liste sayfalarından **kalıcı** kalkar |
| Onay akışı | `reviewStatus` makinesi devrede | Hiçbir akışa bağlı değil |

`campaignStatus`'ü seçmek "açıklamasında yazım hatası düzelteceğim" senaryosunu
"bu kampanya bitti" olarak işaretlemek olurdu — site tarafındaki
`getCampaigns()` filtresini de bozardı. `_status` ise zaten aranan semantiği
taşıyor ve mevcut `reviewStatus`/`RoleAwarePublishButton` makinesine doğrudan
oturuyor; **ikinci bir paralel onay sistemi kurulmadı.**

**Rol bazlı akış:**

| Rol | Yayından kaldırabilir mi? | Ne görüyor |
|---|---|---|
| NV Maker | Evet, doğrudan | "Yayından Kaldır ve Düzenle" |
| NV Checker | Evet, doğrudan | "Yayından Kaldır ve Düzenle" |
| Growth Checker | Evet, doğrudan | "Yayından Kaldır ve Düzenle" |
| Growth Maker | Hayır | "Yayından Kaldırma Talebi Oluştur" |

Gerekçe: "yayınlayabilen, yayından da kaldırabilir." Onay adımı zaten bu üç rol
tarafından veriliyor; Growth Maker'ın talebi, bir Checker'ın yayından kaldırma
işlemiyle onaylanmış oluyor.

**`createdAt` korunuyor.** Payload bu alanı sadece INSERT'te yazıyor; unpublish
→ düzenle → yeniden yayınla döngüsü ona hiç dokunmuyor. Bir birim testi bunu
doğruluyor (`publishedEditGuard.test.ts` → "never touches createdAt").

**Alternatif neden elendi:** "Yayındaki kampanyada düzenlemeye izin ver, ama
kaydederken uyar" — bu, checker onayını atlatmanın yolu olurdu ve zaten
`denyMakerPublish`'in kapatmaya çalıştığı deliğin aynısını açardı.

### 3.2 — 5.7: İçerik locale'i kapatılsın mı, gerçekten uygulansın mı?

**Karar: kapatıldı.** Kullanıcıyla teyit edildi.

CSS ile gizlemek yerine `localization` bloğu tamamen kaldırıldı. Gerekçe:
gizlemek `?locale=en`'i URL'den erişilebilir bırakır ve yarım konfigürasyonu
yerinde tutardı — kullanıcının "en kötüsü" dediği durum tam olarak buydu.

**Bunu şimdi yapmak güvenliydi**, çünkü ilgili tabloların boş olduğu
doğrulandı:

```sql
SELECT count(*) FROM pages;            -- 0
SELECT count(*) FROM pages_locales;    -- 0
SELECT count(*) FROM _pages_v_locales; -- 0
```

`Pages.title` ana tabloya geri taşındı. Kaybolan içerik yok.

**Alternatif (gerçekten uygulamak) neden elendi:** İlgili alanları
`localized: true` yapmak, gerçek İngilizce içerik girilmesini ve incelenmiş bir
veri migrasyonunu gerektirir. Önceki turun bulgusu hâlâ geçerli: mevcut veri +
`versions.drafts` geçmişi olan bir koleksiyonda bunu yapmak drizzle-kit'in
schema push'unu interaktif bir "rename mi yeni kolon mu?" prompt'unda
kilitliyor. Site tarafı da uçtan uca Türkçe (locale routing yok), yani
downstream'de bunu bekleyen bir şey de yoktu.

### 3.3 — 5.9: Content Management'ta hangi koleksiyonlar sekme almadı?

Özet tablosunda **22 koleksiyonun tamamı** var. Detay sekmesi **20** tanesinde;
kalan ikisi ve gerekçeleri:

- **`audit-logs`** — kendi ekranı, kendi CSV export'u ve kendi rol bazlı okuma
  kapsamı olan append-only güvenlik kaydı. Satır satır kopyalamak o ekranı
  tekrar eder ve raporlaması gereken içeriği gömerdi.
- **`translations`** — panelin kendi arayüz metinleri (`key`/`tr`/`en`). Site
  içeriği değil, altyapı; bir içerik raporunda denetlenecek bir şey değil.

İkisinin de **sayıları özet tablosunda görünüyor** — yani "hangi
koleksiyonlarımız var" sorusu eksiksiz cevaplanıyor.

### 3.4 — 5.11: Richtext alanları export'a dahil mi?

**Dahil**, düz metne indirgenmiş halde. Gerekçe: "ne değerlerimiz varsa tüm
sütunlarla" denince editörün beklediği şey kampanyanın asıl gövde metnidir;
onu atlamak export'u eksik bırakırdı. Son iki sütuna konuldu ki taranabilir
meta veri kaydırmadan görünsün. Satır sonları boşluğa çevriliyor — hücre içi
satır sonu bazı Excel sürümlerinde bozuk çok satırlı kayıt olarak görünüyor.

---

## 4) Bilinçli yapılmayanlar ve gerekçeleri

### 4.1 — Kalan fallback'ler (5.12)

Fallback denetimini tahminle değil **canlı veriyle** yaptım: her fallback'in
arkasındaki koleksiyonun DB'de kaç satırı olduğuna baktım. Kural basit:

- **Koleksiyon dolu** → fallback normal işleyişte hiç çalışmıyor, sadece CMS
  çökünce devreye giriyor → **maskeleme, kaldırıldı.**
- **Koleksiyon boş** → fallback'in kendisi sitede görünen içerik →
  **kaldırmak çalışan bir bölümü boşaltır, bırakıldı.**

**Kaldırılanlar:** `Faq` bileşeninin gömülü 4 soruluk varsayılanı, anasayfanın
adım/öne çıkan/kampanya/SSS listeleri, 4 ürün sayfasının SSS dizileri,
duyurular, SSS kategori filtresi, `/kampanyalar` SSS'i.

**Bırakılanlar** (her birinin dosyasında gerekçe yorumu var):

| Fallback | Koleksiyon | DB satır |
|---|---|---|
| `fallbackCards` (3 sayfa) | `feature-cards` | 0 |
| `fallbackSteps` (2 sayfa) | `step-cards` | 0 |
| `PricesAndLimits` fee/limit | `fee-rows`, `limit-tables` | 0 |
| `cerez-politikasi` çerez tablosu | `cookie-rows` | 0 |
| `Header`/`Footer`/`site-haritasi` | `nav-links` | 0 |
| ProductHero varsayılanları | `product-heroes` | 0 |
| Hukuki doküman listeleri | `legal_pages_documents` | 0 |
| `iletisim`/`kurumsal-yonetim` | `ContactInfo` global | — |
| `faturana-yansit` SSS | `faq-items` (bu kategori) | 0 |

**Bunların doğru kapanışı:** ilgili koleksiyonları gerçek içerikle seed etmek,
sonra aynı değişiklikte fallback'i kaldırmak. Bu bir içerik girişi işi, kod
işi değil — bu turun kapsamı dışında bırakıldı.

### 4.2 — 0-tabanlı mevcut `order` değerleri normalize edilmedi

`sort=order` artan sıralama olduğu için karışık 0/1-tabanlı değerler **yanlış
sıra üretmiyor**; sadece görüntülenen sayı 0'dan başlıyor. İlgili listede bir
kez sürükle-bırak yapmak o koleksiyonu 1-tabanlıya çeviriyor. İstenirse tek
seferlik normalize:

```sql
-- Örnek: faq_items, kategori bazında 1'den yeniden numaralandırma
WITH renumbered AS (
  SELECT id, row_number() OVER (PARTITION BY category ORDER BY "order", id) AS n
  FROM faq_items
)
UPDATE faq_items f SET "order" = r.n FROM renumbered r WHERE f.id = r.id;
```

### 4.3 — `published_locale` kolonları DB'de bırakıldı

`localization` kapatılınca Payload artık bu kolonlara hiç dokunmuyor; hepsi
nullable olduğu için insert/select'i bozmuyorlar. Silmek ek risk taşırdı,
fayda getirmezdi. Temizlik gerekirse ayrı bir bakım işi.

---

## 5) Şema değişiklikleri (R-10 notu)

`payload migrate:create` bu ortamda hâlâ bozuk. Belgelenen "host Postgres'e
karşı `next dev`" workaround'u bu turda **çalışmadı** — drizzle-kit tam olarak
R-10'da tarif edilen interaktif prompt'ta kilitlendi:

```
Is enum_campaigns_unpublish_request enum created or renamed from another enum?
❯ + enum_campaigns_unpublish_request      create enum
  ~ _locales › enum_campaigns_unpublish_request   rename enum
  ...
```

(Sebep: `localization` kaldırılınca tüm `*_published_locale` enum'ları düşüyor,
aynı anda yeni bir enum ekleniyor — drizzle hangisinin hangisi olduğunu
soruyor.)

**Nasıl çözüldü:** önce `pg_dump -Fc` ile tam yedek alındı, sonra DDL elle,
tek transaction içinde uygulandı:

```sql
BEGIN;
CREATE TYPE enum_campaigns_unpublish_request AS ENUM ('none','pending');
ALTER TABLE campaigns
  ADD COLUMN unpublish_request enum_campaigns_unpublish_request DEFAULT 'none',
  ADD COLUMN unpublish_requested_by_id integer,
  ADD COLUMN unpublish_requested_at timestamp(3) with time zone;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_unpublish_requested_by_id_users_id_fk
  FOREIGN KEY (unpublish_requested_by_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX campaigns_unpublish_requested_by_idx ON campaigns (unpublish_requested_by_id);

CREATE TYPE enum__campaigns_v_version_unpublish_request AS ENUM ('none','pending');
ALTER TABLE _campaigns_v
  ADD COLUMN version_unpublish_request enum__campaigns_v_version_unpublish_request DEFAULT 'none',
  ADD COLUMN version_unpublish_requested_by_id integer,
  ADD COLUMN version_unpublish_requested_at timestamp(3) with time zone;
ALTER TABLE _campaigns_v ADD CONSTRAINT _campaigns_v_version_unpublish_requested_by_id_users_id_fk
  FOREIGN KEY (version_unpublish_requested_by_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX _campaigns_v_version_version_unpublish_requested_by_idx
  ON _campaigns_v (version_unpublish_requested_by_id);

ALTER TABLE pages ADD COLUMN title character varying;
ALTER TABLE _pages_v ADD COLUMN version_title character varying;
DROP TABLE pages_locales;
DROP TABLE _pages_v_locales;
COMMIT;
```

Ayrıca R-26 gereği (Payload `select` alanları native Postgres enum):

```sql
ALTER TYPE enum_audit_logs_action ADD VALUE IF NOT EXISTS 'unlock';
```

**Prod deploy'da aynı DDL gerekecek.** R-10 çözülene kadar bu manuel adım
devam edecek — ve bu tur, workaround'un kendisinin de her zaman çalışmadığını
gösterdi.

---

## 5b) Canlı doğrulama sırasında bulunan 3 gerçek bug

Bu üçü kod yazılırken değil, **çalışan panelde tek tek denerken** çıktı.

### 5b.1 — `translationDefaults.ts`'i değiştirmek hiçbir işe yaramıyordu

5.10'un yeni login metnini yazdım, paneli açtım, ekranda **eski metin** duruyordu.
Kök neden: `onInit`'teki seed yalnızca **eksik** anahtarları INSERT ediyordu.
Bir anahtar bir kez seed edildikten sonra koddaki varsayılanı değiştirmek
tamamen sessiz bir no-op'tu — kod bir şey söylüyor, ekran başka bir şey
gösteriyordu. Bu, önceki turda kurulan DB-destekli çeviri sisteminin
belgelenmemiş bir sonucuydu ve bundan sonraki **her** metin değişikliğini de
etkileyecekti.

**Düzeltme:** `onInit` artık koddaki varsayılanla hâlâ eşleşen satırları da
güncelliyor. Editörün elle değiştirdiği satırlar korunuyor — ayırt edici yeni
`isCustomized` bayrağı: seed `overrideAccess` ile ve kullanıcısız yazıyor,
panelden/API'den gelen her kayıt ise `req.user` taşıyor.

### 5b.2 — Growth Maker kendi "Yayından Kaldırma Talebi"ni oluşturamıyordu

5.4'ün butonu Growth Maker'da **403** veriyordu. `denyMakerPublish`, "sonucu
yayında olan hiçbir kaydı yazamaz" şeklinde yazılmıştı; bu, zaten yayında olan
ve yayın durumu **değişmeyen** kayıtlara yapılan yazımları da yakalıyordu — yani
talebi dosyalamanın kendisini.

**Düzeltme:** kural asıl anlamına indirildi — "bu rol bir dokümanı yayına
ALAMAZ", yani sadece taslak → yayın geçişi. Yayındaki içeriği düzenlemeyi zaten
`guardPublishedEdit` aynı zincirde daha önce reddediyor. Düzeltmeden sonra 4
davranış da canlı doğrulandı: taslağı yayınlama **403**, yayındaki içeriği
düzenleme **409**, tek başına yayından kaldırma **403**, talep oluşturma **200**.

### 5b.3 — Content Management giriş yapmamış ziyaretçiye açıktı

Payload, kendi koleksiyon görünümlerinin aksine, üst seviye **custom view**'lara
gelen anonim ziyaretçiyi login'e yönlendirmiyor. `/admin/content-management`
hiçbir oturum çerezi olmadan tüm koleksiyon özetini render etti. Sayıların
hepsi erişim kontrollü API çağrılarından geldiği için gizli veri sızmadı
(Kullanıcılar ve Denetim Kayıtları "yetkiniz yok" dedi, yayınlanmamış içerik
görünmedi) — ama giriş yapmamış birini karşılayan bir rapor sayfası istenen şey
değildi. Artık giriş zorunlu.

---

## 5c) Manuel doğrulama — ne, hangi rolle, ne sonuç

Doğrulama, kaynak koddan çalışan bir dev CMS'te (`localhost:3011`) ve ona bağlı
bir site dev sunucusunda (`localhost:3002`) yapıldı — Docker imajı yeniden
build edilemedi, bkz. §6.7.

| Madde | Rol | Ne denendi | Sonuç |
|---|---|---|---|
| 5.1 | NV Maker | 18+ kampanyası olan "Genel" kategorisini sil | **Engellendi.** Onay kutusu kaydı adıyla sordu; onaylayınca hata: *""Genel" (Kategori) silinemedi — 23 kayıt hâlâ buna bağlı*" + 3 kampanya adı ve edit linki + "…ve 20 kayıt daha" |
| 5.2 | Ziyaretçi | `/kampanyalar` → "Genel" sekmesi | Tek liste, başlık "Genel", **favoriler bloğu yok**; favori kampanyalar da listede |
| 5.3 | Ziyaretçi | Kart altındaki tarih | "Kampanya Tarihi 27.08.2026 - 28.08.2026"; tarihsiz kartta hiç blok yok; aynı satırdaki kartların yüksekliği (412/412/412) ve CTA hizası (364/364/364) eşit |
| 5.4 | NV Maker | Yayındaki kampanyayı düzenleyip yayınla | **409**, tam yönlendirme mesajıyla |
| 5.4 | NV Maker | "Yayından Kaldır ve Düzenle" → düzenle → yeniden yayınla | Durum Taslak → İnceleme Durumu otomatik "İncelemede" → yeniden yayın. **`Oluşturma tarihi` değişmedi (13 Ağustos)** ve kampanya listede **7. sırada kaldı**, en üste çıkmadı |
| 5.4 | Growth Maker | Yayındaki kampanya | Buton "**Yayından Kaldırma Talebi Oluştur**"; talep 200, `unpublish_request='pending'` |
| 5.4 | Growth Maker | Taslağı yayınla / yayındakini düzenle / tek başına yayından kaldır | **403 / 409 / 403** — görev ayrımı korunuyor |
| 5.5 | NV Maker | Kategoriler listesi | `order`'a göre sıralı; "SIRA" kolonu; alan açıklaması "1'den başlar…" |
| 5.6 | NV Maker | Kilitli hesap → "Kilidi Kaldır" | Kilit kalktı; DB'de `login_attempts=0`, `lock_until=NULL`; audit log'a `unlock` kaydı (kim, kimi) |
| 5.6 | Growth Maker | `/admin/locked-accounts` | Sidebar linki **yok**; sayfa "sadece New Vertical Maker rolündeki kullanıcılar içindir" |
| 5.7 | Hepsi | Üst bar | İçerik locale seçicisi **yok** |
| 5.8 | Ziyaretçi | Login ekranı | "**Remember me**" + altında "Sadece e-posta adresiniz bu tarayıcıda hatırlanır — parolanız hiçbir zaman saklanmaz." |
| 5.9 | NV Maker | İçerik Yönetimi | 22 koleksiyonun tamamı özet tabloda; 20 detay sekmesi; **hiçbir ekle/düzenle/sil butonu yok** |
| 5.9 | Growth Maker | İçerik Yönetimi | Sayfa açılıyor; Kullanıcılar ve Denetim Kayıtları satırları **sayı bile göstermeden** "Bu koleksiyonu görüntüleme yetkiniz yok" diyor |
| 5.10 | Ziyaretçi | Login ekranı | "Sitenizin tek kumanda merkezi." + vodafonepay.com.tr'yi adıyla anan alt metin |
| 5.11 | NV Maker | Campaigns listesi | "Dışa Aktar (CSV)" butonu yerinde |
| Faz 0 | — | `afterLogin` tutarlılığı | Giriş yapan 5 hesabın hepsinde `lastLoginAt`/`Ip`/`UserAgent` dolu, logda **0** "failed to stamp" hatası |
| 5.12 | — | Yeni ekranlar dar viewport'ta | Sayfa gövdesinde yatay taşma **yok**; her iki tablo da `.table-wrap` içinde yatay kaydırılabiliyor; sekme dokunma hedefi **44px** |

**Yan bulgu:** Campaigns listesinde iki kampanya `<Category yok>` görünüyor —
bunlar guard eklenmeden ÖNCE `ON DELETE SET NULL` ile kategorisi boşaltılmış
kayıtlar, yani bildirilen bug'ın halihazırda bıraktığı hasar. Guard bundan
sonrasını engelliyor ama bu ikisi elle bir kategoriye bağlanmalı.

---

## 6) Açık kalan riskler / teknik borç

1. **`payload migrate:create` hâlâ bozuk (R-10)** — bu turda belgelenen
   workaround'un da yetmediği ilk vaka yaşandı (§5). Öncelik yükselmeli.
2. **Kalan fallback'ler (§4.1)** — 9 koleksiyon seed edilmeden kaldırılamaz.
   Orta vadede gerçek risk: CMS ölürse bu bölümler hâlâ sahte içerik gösterir.
3. **0-tabanlı `order` değerleri** (§4.2) — kozmetik, normalize SQL'i hazır.
4. **`published_locale` artık kolonları** (§4.3) — zararsız, temizlenmedi.
5. **`payload generate:importmap` hâlâ bozuk** — bu turda eklenen 4 bileşen
   (`LockedAccountsView`, `LockedAccountsNavLink`, `LockedAccountsBanner`,
   `CampaignsExportButton`) `importMap.js`'e elle eklendi. Unutulursa bileşen
   sessizce render edilmez.
6. **`ContentManagementApp`'in özet tablosu koleksiyon başına 2-3 istek atıyor**
   (toplam ~50 istek). Küçük bir kurulumda sorun değil ama koleksiyon sayısı
   büyürse tek bir toplu endpoint'e taşınmalı.
7. **Docker imajı bu oturumda yeniden build EDİLEMEDİ.** Docker daemon'ın
   registry erişimi askıda kalıyor — düz bir `docker pull node:24-alpine` bile
   (temel imaj yerelde mevcut ve `curl` ile registry erişilebilir olduğu halde)
   dönmüyor. BuildKit `resolve` adımında %0 CPU ile takılıyor; build cache
   temizlendikten sonra da aynı. Ortamsal bir sorun, bu turun kodundan
   bağımsız. Doğrulama bu yüzden kaynaktan çalışan dev sunucularla yapıldı
   (§5c). **Yapılması gereken:** `docker compose -p vodafonepaycomtr build cms`
   (veya BuildKit takılırsa `DOCKER_BUILDKIT=0 docker build --pull=false`) ile
   imaj yeniden üretilip container restart edilmeli.
8. **Şu an container ile DB şeması uyumsuz.** Şema elle güncellendiği için
   (§5) `3010`'daki ESKİ kod `pages_locales` tablosunu arıyor ve
   `/api/pages` **500** dönüyor. Diğer koleksiyonlar etkilenmiyor. Madde 7'deki
   rebuild bunu çözer — **bu yapılana kadar container'daki Sayfalar koleksiyonu
   çalışmaz.** DB yedeği alındı:
   `scratchpad/pre-schema-push.dump` (`pg_restore` ile geri alınabilir).
9. **SonarQube taraması yapılamadı** — `scripts/sonar-scan.sh` bir `SONAR_TOKEN`
   istiyor, bu oturumda yoktu. Yerine ESLint (kökte ve `cms/`'te sıfır hata) ve
   `npm run check` (ikisinde de temiz) çalıştırıldı; ayrıca tarama muhtemelen
   bulacağı iki duplication proaktif olarak giderildi: üç CSV export butonu tek
   bir `CsvExportButton`'a, 9 koleksiyonun silme/sıralama mantığı da tek bir
   `blockDeleteIfReferenced()`/`assignNextOrder()` factory'sine indirildi.
