# İçerik Parity & CMS Yeterlilik Denetimi

Bu rapor `docs/PRODUCTION_READINESS_PROMPT.md`'un tamamlayıcısıdır ve teknik borç değil, **içerik
parity'si** ve **CMS'in bu projeyi yönetmeye yeterliliği** eksenine odaklanır. 5 paralel ajan
(canlı site envanteri, repo route/component envanteri, CMS şema denetimi, hardcoded içerik
taraması, teknik/SEO denetimi) tarafından üretilen bulgular sentezlenmiştir. Her iddia dosya:satır
veya canlı URL ile kanıtlanmıştır.

---

## 1. Yönetici Özeti

1. **Site, canlının küçük bir alt kümesi.** Canlı sitemap'te 563 dinamik URL var (525 temsilci,
   20 blog, 18 kampanya detayı); repoda **tek bir dinamik route (`[slug]`/`[id]`) yok**. Bu,
   parity açısından tek başına en büyük boşluk.
2. **Kampanya/blog kartları tıklanamıyor.** `CardListGrid` kartları `href` bile değil, hiçbir
   `onClick`/`href` içermeyen çıplak `<button>` — dead-end UI.
3. **`FilterTabs` tamamen dekoratif** — local state tutuyor, hiçbir listeyi filtrelemiyor,
   `hidden lg:flex` ile mobilde/tablette hiç görünmüyor. Canlıda hem `/kampanyalar` hem `/blog`
   gerçek `?kategori=` query-param filtrelemesi kullanıyor.
4. **RBAC hipotezi kısmen çürütüldü** — `Users.role` dekoratif değil; gerçek, rol bazlı
   access-control (`RL_VODAFONEPAY_CMS_*`) her collection'da uygulanmış durumda. Tek gerçek
   boşluk: herhangi bir authenticated kullanıcı `Users.read` üzerinden tüm kullanıcı e-postalarını
   görebiliyor.
5. **`cms.ts` hipotezi de çürütüldü** — timeout, zod runtime doğrulama, yapılandırılmış hata
   loglama zaten var (önceki bir oturumda R-08 kapsamında düzeltilmiş). Doğrulanan tek gerçek risk:
   `CMS_API_URL` yanlış/unset olursa site **sessizce** eski/fallback içeriğe düşüyor, kullanıcıya
   veya operasyona hiçbir sinyal gitmiyor.
6. **8 collection'da draft/versiyon yok** (FeeRows, LimitTables, NavLinks, ProductHeroes,
   FeatureCards, StepCards, LegalPages, ContentBlocks) — editör kaydettiği an canlıya basıyor,
   geri alma yok. FeeRows/LimitTables **yasal/finansal** içerik olduğu için bu risklidir.
7. **Kurumsal veri 3 farklı yerde, 3 farklı biçimde tekrarlanıyor** — `ContactInfo` global'i var ve
   `/iletisim`'de doğru kullanılıyor, ama aynı adres/telefon/KEP e-postası `kurumsal-yonetim`,
   `gizlilik-ve-guvenlik-politikasi`, `bilgi-guvenligi` sayfalarında ayrı ayrı hardcoded ve
   **birbirinden farklı** (adresin 3 farklı yazımı tespit edildi).
8. **Ücret/limit rakamları (business-critical) hiç CMS'te değil** — `PricesAndLimits`'in
   fallback'i 16+15 satırlık gerçek TL/% rakamı taşıyor, arkasında hiçbir collection yok.
9. **`kurumsal-yonetim` sayfası %100 hardcoded** — yönetim kurulu bioları, sicil bilgileri, denetim
   yılları dahil ~180 satır; hiç CMS import'u yok.
10. Yeni bulgu (A5): **7 sayfada hiç `<h1>` yok** — `ProductHero`/`Hero` component'leri başlığı
    `<p>` olarak render ediyor. Küçük ama gerçek bir a11y/SEO bug'ı.
11. `sitemap.ts`/`robots.ts` repoda yok; canlıda ikisi de var (ve AI botlarını engelliyor).
12. **Sonuç:** Bu haliyle prod'a gidemez — hem parity (400+ eksik sayfa) hem yönetilebilirlik
    (draft yok, fiyat/ücret verisi kodda) açısından PoC seviyesinde. Kod kalitesi ve güvenlik
    ekseninde (bkz. T0 raporu) durum iyi; asıl açık bu oturumun konusu olan **içerik modeli ve
    CMS kapsamı**.

---

## 2. Parity Matrisi

### 2.1 Statik üst seviye sayfalar (21/21 route var, ama içerik sadakati değişken)

| Canlı sayfa | Repo route | Durum | Fark özeti |
|---|---|---|---|
| `/` | `/` | Kısmi | Hero başlık `<p>`, `<h1>` yok; CMS bağlı ama bazı bölümler (marka logo grid, homepage kampanya carousel) fallback'e sabit |
| Ürünler (5 alt sayfa) | `/vodafone-pay-uygulama`, `/vodafone-pay-kart`, `/qr-ile-faturana-yansit`, `/faturana-yansit`, `/aninda-bakiye` | Var | CMS bağlı (ProductHero/FeatureCards/StepCards/FaqItems); ProductHero `<h1>` değil `<p>` |
| `/kampanyalar` | `/kampanyalar` | Kısmi | Liste var, filtre dekoratif, kartlar tıklanamıyor, detay sayfası yok |
| `/blog` | `/blog` | Kısmi | Liste var, filtre dekoratif, kartlar tıklanamıyor, detay sayfası yok |
| `/ucretler-ve-limitler` | `/ucretler-ve-limitler` | Var (veri kaynağı riskli) | CMS'e bağlı ama arkasında collection yok, tamamen fallback rakamlar |
| `/sikca-sorulan-sorular` | `/sikca-sorulan-sorular` | Var | CMS bağlı, kategori filtresi gerçekten çalışıyor (tek çalışan filtre örneği); `metadata` export'u yok |
| `/web-sitesi-hukum-ve-sartlari` | `/web-sitesi-hukum-ve-sartlari` | Var | Path doğru eşleşiyor (önceki hipotezdeki "kullanimi" farkı yanlış varsayımdı) |
| `/temsilciliklerimiz` | `/temsilciliklerimiz` | Kritik eksik | Sadece il/ilçe formu var, arkasında veri/collection yok — Google Maps aramasına yönlendiriyor |
| `/iletisim` | `/iletisim` | Var | `ContactInfo` global'i doğru kullanılıyor |
| `/kurumsal-yonetim` | `/kurumsal-yonetim` | Kritik eksik | %100 hardcoded, CMS import'u yok, `ContactInfo` ile veri çelişkisi var |
| `/duyurular` | `/duyurular` | Var | CMS bağlı |
| `/site-haritasi` | `/site-haritasi` | Kısmi | Hardcoded link listesi, `NavLinks`'ten üretilmiyor, drift riski |
| `/gizlilik-ve-guvenlik-politikasi` | aynı | Kısmi | Sadece giriş paragrafı CMS'ten, ~150 satır hukuki metin + adres/e-posta hardcoded |
| `/cerez-politikasi` | aynı | Kısmi | Giriş CMS'ten, tablo (`cookieRows.ts`) ve "çerez ayarlarına git" butonu (canlıda var) hardcoded/eksik |
| `/bilgi-guvenligi` | aynı | Kısmi | Liste CMS'ten, giriş paragrafı ve telefon numarası hardcoded |
| `/sozlesmeler-ve-formlar` | aynı | Kısmi | CMS'ten liste geliyor ama gerçek PDF/ses linki yok, sadece `<button>` |
| `/faydali-bilgiler` | aynı | Kritik eksik | %100 hardcoded tek accordion maddesi; canlıda PDF+QR ile "cüzdan kodu yükleme" rehberi var |

### 2.2 Dinamik içerik (repo: 0 route)

| Tip | Canlı sayım | Repo'da route | Durum |
|---|---|---|---|
| Kampanya detay `/kampanyalar/{slug}` | 18 (sitemap) / 15 (liste sayfasında görünen) | **0** | Route yok, `Campaigns` collection'ında slug/body/SEO alanı da yok |
| Blog detay `/blog/{slug}` | 20 (sitemap) / 12 (liste sayfasında görünen) | **0** | Route yok — ama `BlogPosts` collection'ında `slug`/`body`(richText)/`seoTitle`/`seoDescription` **zaten var**, kullanılmıyor ("ölü şema") |
| Temsilci detay `/temsilci/{id}` | **525** (ID aralığı 918–1480, seyrek) | **0** | Route yok, CMS'te hiç dealer/temsilcilik collection'ı yok — envanterdeki en büyük tek boşluk |

### 2.3 Altyapı

| Öğe | Canlı | Repo |
|---|---|---|
| `sitemap.xml` | Var (563 dinamik URL, statik sayfalar dahil değil) | Yok |
| `robots.txt` | Var, AI eğitim botlarını (GPTBot, CCBot, Google-Extended, Applebot-Extended, meta-externalagent, ClaudeBot) engelliyor | Yok |

---

## 3. İçerik Kaynak Matrisi

`✓` = business ekibi CMS'ten düzenleyebilir · `△` = kısmen (bir kısmı hardcoded) · `✗` = hayır, deploy gerekir

| Sayfa | Bölüm | Kaynak | Dosya:satır | Editör düzenleyebilir mi? |
|---|---|---|---|---|
| `/` | Hero, marka logo grid, homepage kampanya carousel | Bileşen prop + fallback | `Hero.tsx` (tam hardcoded), `Campaigns.tsx:8` `fallbackCampaigns`, `BrandLogoGrid.tsx:8` | ✗ Hero / △ diğerleri (fallback var ama gerçek kaynak yok) |
| `/`, ürün sayfaları | Adım kartları, özellik grid'i, video rehberi | `ContentBlocks` | `StepPhones.tsx:5`, `FeatureHighlights.tsx:11`, `VideoGuideSection.tsx:6` | ✓ (CMS boşsa fallback'e düşer) |
| Tüm ürün sayfaları | Hero başlık/görsel, özellik kartları, adım kartları, SSS | `ProductHeroes`/`FeatureCards`/`StepCards`/`FaqItems` | `src/lib/cms.ts` getter'ları | ✓ |
| `/kampanyalar`, `/blog` | Liste kartları | `Campaigns`/`BlogPosts` | wired | ✓ liste / ✗ detay (yok) |
| `/kampanyalar`, `/blog` | Filtre tabs | Hardcoded, işlevsiz | `FilterTabs.tsx:5,8,11` | ✗ |
| `/ucretler-ve-limitler` | Ücret/limit tabloları | Fallback'e sabit, CMS collection yok | `PricesAndLimits.tsx:5,32` | ✗ **(business-critical, en riskli madde)** |
| `/iletisim` | Kurumsal iletişim bilgileri | `ContactInfo` global | `iletisim/page.tsx:29` | ✓ |
| `/kurumsal-yonetim` | Misyon, sicil bilgileri, yönetim kurulu, denetim yılları | %100 hardcoded | `kurumsal-yonetim/page.tsx:13-183` | ✗ |
| `/duyurular` | Duyuru listesi | `DuyurularAccordion` fallback + (sayfa CMS'i çağırıyor ama component'in kendi fallback'i de var) | `DuyurularAccordion.tsx:11` | △ |
| `/site-haritasi` | Nav link grupları | Hardcoded, `NavLinks`'ten değil | `site-haritasi/page.tsx:14-54` | ✗ (drift riski: Header/Footer güncellenince burası güncellenmiyor) |
| `/gizlilik-ve-guvenlik-politikasi` | Giriş paragrafı | `LegalPages.intro` | `page.tsx:14` `fallbackIntro`, CMS'ten geliyor | ✓ giriş / ✗ gövde (~150 satır hardcoded) |
| `/cerez-politikasi` | Çerez tablosu | Hardcoded data dosyası | `cookieRows.ts` (60 satır, ~55 satır) | ✗ — KVKK açısından hassas, sık değişebilir |
| `/bilgi-guvenligi` | Güvenlik ipuçları listesi | `LegalPages` üzerinden (intro alanına 22 madde encode edilmiş gibi) | `bilgi-guvenligi/page.tsx:14` `fallbackTips` | ✓ (CMS'e bağlı) |
| `/sozlesmeler-ve-formlar` | Belge listesi | `LegalPages` | wired, ama gerçek link yok | △ (metin ✓, gerçek indirme linki ✗) |
| `/faydali-bilgiler` | İçerik | %100 hardcoded | `FaydaliBilgilerAccordion.tsx:6-28` | ✗ |
| Header/Footer | Nav linkleri | `NavLinks` | Header/Footer kendi kendine `getNavLinks()` çağırıyor | ✓ |
| Footer | MKK/LinkedIn dış linkleri | Hardcoded | `Footer.tsx:25` (MKK), `Footer.tsx:110` (LinkedIn — **yanlış**, gerçek şirket sayfası değil, LinkedIn ana sayfası) | ✗ |
| Tüm hukuki sayfalar | Telefon/adres/KEP | Hardcoded, 3 farklı yerde 3 farklı biçimde | `kurumsal-yonetim`, `gizlilik-ve-guvenlik-politikasi:161-165`, `bilgi-guvenligi:30-32`, `faturana-yansit:82,102` | ✗ — `ContactInfo` var ama kullanılmıyor |
| `/temsilciliklerimiz` | Temsilcilik verisi | Yok — form sadece il/ilçe listesiyle Google Maps araması açıyor | `TemsilciliklerimizForm.tsx` | ✗ — CMS'te collection bile yok |

---

## 4. CMS Yeterlilik Değerlendirmesi

### 4.1 Collection bazlı özet

| Collection/Global | Drafts | Access (create/update/delete) | Not |
|---|---|---|---|
| Campaigns | ✓ | Rol bazlı (gerçek) | slug/body/SEO/conditions alanı yok — detay sayfası bu şemadan üretilemez; `startDate`/`endDate` var ama hiçbir yerde okunmuyor |
| BlogPosts | ✓ | Rol bazlı | `slug`+richText `body`+SEO alanları **zaten var**, kullanılmıyor |
| FaqItems | ✓ | Rol bazlı | — |
| Announcements | ✓ | Rol bazlı | — |
| FeeRows | ✗ | Rol bazlı | **Draft yok + yasal/finansal içerik** — editör kaydettiği an canlıya basıyor |
| LimitTables | ✗ | Rol bazlı | Aynı risk |
| NavLinks | ✗ | Rol bazlı | Draft yok ama düşük risk (linkler) |
| ProductHeroes | ✗ | Rol bazlı | Draft yok |
| FeatureCards | ✗ | Rol bazlı | Draft yok, `page` serbest metin (typo → orphan içerik riski) |
| StepCards | ✗ | Rol bazlı | Aynı `page` serbest metin riski |
| LegalPages | ✗ | Rol bazlı | Sadece `title`+`intro`; kendi `admin.description`'ında gövdenin bilinçli olarak kodda kaldığı belirtiliyor |
| ContentBlocks | ✗ | Rol bazlı | `page` serbest metin riski burada da var |
| Media | n/a | Rol bazlı | Sadece `alt`; imageSizes/focal point/caption/boyut limiti yok |
| Users | n/a | Rol bazlı, ama `read: Boolean(user)` | Herhangi bir authenticated kullanıcı tüm kullanıcı e-postalarını listeleyebiliyor |
| ContactInfo (global) | n/a | Rol bazlı | Doğru tasarlanmış ama sadece `/iletisim`'de kullanılıyor, diğer 4 sayfada tekrar hardcoded |

**RBAC hakkında düzeltme:** Önceki hipotez, `Users.role`'ün dekoratif olduğu ve tüm collection'ların
`read: () => true` olduğu yönündeydi. Bu **kısmen çürütüldü**: `read` gerçekten herkese açık (kamuya
dönük pazarlama sitesi için bilinçli tasarım), ama `create`/`update`/`delete` gerçek, rol bazlı
kontrol altında (`cms/src/access/roles.ts`) — 4 LDAP rolü (`RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW`,
`RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW`, `ROLE_VODAFONEPAY_CMS_CHECKER_RO`, `ROLE_VODAFONEPAY_CMS_MAKER_RW`)
her collection'a doğru şekilde uygulanmış, artı `Campaigns` için `denyMakerPublish` ile gerçek bir
maker-checker segregation-of-duties akışı var. Tek gerçek boşluk yukarıda belirtilen `Users.read`.

### 4.2 CMS'te hiç karşılığı olmayan içerik tipleri

- **Temsilcilik/bayi verisi** (525 kayıt) — hiç collection yok.
- **Ücret/limit rakamları** — `FeeRows`/`LimitTables` var ama gerçek prod verisiyle senkron değil,
  fallback'te kalmış (bkz. §3).
- **Çerez tablosu** (`cookieRows.ts`) — collection yok.
- **Kurumsal yönetim verisi** (yönetim kurulu, sicil bilgileri, denetim yılları) — collection yok.
- **App-store/Play-store deeplink URL'i** — hiçbir alanda saklanmıyor.
- **Footer'da öne çıkan blog/kampanya seçimi** (curated picks) — `NavLinks` düz link tutuyor,
  `BlogPosts`/`Campaigns`'e ilişki (relationship) alanı yok; canlıda bu seçim ayrı yönetiliyor gibi
  görünüyor (footer linkleri güncel sitemap'le uyuşmuyor — muhtemelen manuel/gecikmeli güncelleniyor).
- **Kampanya/blog "aktif/pasif" durumu** — canlı sitemap'te olup liste sayfasında görünmeyen içerik
  örüntüsü (18 sitemap / 15 liste, 20 sitemap / 12 liste) CMS'te bir "durum" alanı olabileceğine
  işaret ediyor; bizim şemamızda böyle bir alan yok.

### 4.3 Önerilen yeni collection taslakları

```ts
// cms/src/collections/Representatives.ts (temsilcilik — en kritik boşluk)
{
  slug: "representatives",
  fields: [
    { name: "businessName", type: "text", required: true },
    { name: "repCode", type: "text" },          // "835343KGSM" gibi
    { name: "activityDescription", type: "textarea" },
    { name: "phone", type: "text" },
    { name: "mersisNo", type: "text" },
    { name: "address", type: "textarea", required: true },
    { name: "province", type: "text", required: true },
    { name: "district", type: "text", required: true },
    { name: "authorizedPerson", type: "text" },
    { name: "qrCode", type: "upload", relationTo: "media" },
  ],
}

// Campaigns'e eklenecek alanlar (detay sayfası için)
{ name: "slug", type: "text", required: true, unique: true },
{ name: "body", type: "richText" },
{ name: "terms", type: "richText" },            // katılım koşulları
{ name: "seoTitle", type: "text" },
{ name: "seoDescription", type: "text" },
{ name: "status", type: "select", options: ["active", "expired"] },
```

---

## 5. Yönetilebilirlik/Operasyon — "Editör şunu yapmak isterse ne olur?"

| Senaryo | Mümkün mü? | Adım | Not |
|---|---|---|---|
| (a) Yeni kampanya ekleyip yayına alma | Kısmen | CMS'te oluştur → publish (maker-checker akışıyla) | Ama detay sayfası olmadığı için kart hiçbir yere gitmiyor; kampanya sadece resim+başlık düzeyinde "yayında" |
| (b) Süresi dolan kampanyayı kaldırma | Hayır (otomatik) | `endDate` alanı var ama hiçbir sorguda kullanılmıyor | Editör elle silmek/unpublish etmek zorunda; otomatik süre-bazlı gizleme yok |
| (c) Ücret tablosunda bir rakam düzeltme | **Hayır** | — | `PricesAndLimits` verisi kodda, CMS'te collection yok — **teknik ekip + deploy gerekiyor** |
| (d) Yeni blog yazısı yayınlama | Kısmen | CMS'te oluştur (slug/body/SEO alanları zaten var) → publish | Ama site'de gösterecek `/blog/[slug]` route'u yok — içerik CMS'te var, kullanıcı hiç göremiyor |
| (e) Footer'a link ekleme | Evet | `NavLinks`'e `section: "footer-*"` ile satır ekle | Çalışıyor, ama `site-haritasi` sayfası ayrı hardcoded olduğu için oradan görünmeyecek (drift) |
| (f) Yanlış yayınlanan içeriği geri alma | Collection'a göre değişir | Campaigns/BlogPosts/FaqItems/Announcements'ta draft/versiyon var → geri alınabilir. FeeRows/LimitTables/LegalPages/ContentBlocks/StepCards/FeatureCards/ProductHeroes/NavLinks'te **yok** → canlıya basılan hata sadece manuel düzeltmeyle geri alınabilir |

---

## 6. Teknik/SEO/Performans Bulguları

- **`sitemap.ts`/`robots.ts` yok** (repoda) — canlıda ikisi de var, AI eğitim botlarını
  (`GPTBot`, `CCBot`, `Google-Extended`, `Applebot-Extended`, `meta-externalagent`, `ClaudeBot`)
  engelliyor.
- **Hiçbir sayfada `openGraph`/`twitter`/`alternates`/JSON-LD yok** — sadece `title`+`description`.
  `/` (anasayfa) ve `/sikca-sorulan-sorular`'da `metadata` export'u hiç yok, root layout'un genel
  başlığına düşüyorlar.
- **7 sayfada `<h1>` yok** — `ProductHero.tsx:25` ve `Hero.tsx:16-22` başlığı `<p>` olarak
  render ediyor: `/`, `/vodafone-pay-kart`, `/ucretler-ve-limitler`, `/faturana-yansit`,
  `/vodafone-pay-uygulama`, `/aninda-bakiye`, `/qr-ile-faturana-yansit`, `/sikca-sorulan-sorular`.
- `next/image` `alt` kapsamı: **eksik yok** (~20 dosya tarandı, hepsi `alt` içeriyor).
- Form label'ları: tek gerçek form (`TemsilciliklerimizForm`) doğru `htmlFor`/`id` eşleşmesine sahip.
- **ISR/revalidate zinciri sağlam ve tutarlı** — CMS hook'larının kullandığı 13 tag ile
  `/api/revalidate`'in `ALLOWED_TAGS`'i birebir örtüşüyor, orphan tag yok.
- `src/lib/cms.ts` (356 satır): timeout (8sn), zod validation, yapılandırılmış hata loglama **zaten
  var** (önceki R-08 çalışmasından) — bu eksende hipotez çürütüldü. Gerçek risk `CMS_API_URL`
  default'unun (`localhost:3010`) prod'da yanlış set edilirse sessizce fallback'e düşmesi (sadece
  `console.error`, kullanıcıya/operasyona sinyal yok).
- `npm run check`: **root'ta yeşil** (lint+typecheck+71 test+build). `cms/`'de `check` script'i
  **yok** (`package.json`'da tanımlı değil) — lint/typecheck/test ayrı ayrı çalıştırıldığında
  hepsi yeşil; `build` ise env değişkenleri olmadığı için (beklenen şekilde) `cms/src/env.ts`'in
  kendi boot-time kontrolüyle reddediyor — bu aslında doğru davranış (fail-loud), CMS tarafı site
  tarafının aksine sessiz değil.
- `next.config.ts` `images.remotePatterns` sadece `localhost:9000`/`minio` — gerçek prod medya
  domaini (S3/CDN) tanımlanmamış; local/dev bağlamda doğru ama prod deploy öncesi güncellenmeli.

---

## 7. Riskler

1. **Sessiz fallback / iki source-of-truth** — ~30 dosyada `fallback*` verisi var; CMS boşsa/erişilemezse
   site eski/statik içeriği sessizce gösteriyor. Kasıtlı bir güvenlik ağı olarak başladı ama artık
   asıl veri kaynağı haline gelmiş durumda (özellikle `PricesAndLimits`, `kurumsal-yonetim`,
   `cookieRows.ts`).
2. **Kurumsal veri tutarsızlığı** — aynı adres 3 farklı yazımla 3 farklı dosyada; bir gün biri
   güncellenir diğerleri güncellenmez.
3. **Yasal/finansal içerikte geri alma yok** — FeeRows/LimitTables draft'sız, editör hatası
   doğrudan canlıya yansır.
4. **`page` alanının serbest metin olması** (FeatureCards/StepCards/ProductHeroes/ContentBlocks) —
   typo bir kaydı hiçbir sayfaya bağlanmayan "hayalet" içerik haline getirebilir, hiçbir uyarı yok.
5. **525 temsilcilik sayfası + kampanya/blog detayları** — bu iş, mevcut CMS şemasının en büyük
   tek eksiği; hiçbir editör bu içeriği bugün yönetemez çünkü site'de gösterecek yer yok.

---

## 8. Kapsam Dışı Bıraktıklarım

- Canlı sitenin `<head>` meta etiketleri (canonical/OG/Twitter) WebFetch ile güvenilir şekilde
  doğrulanamadı — sadece görünür `<title>` metinleri teyit edildi. Pixel-seviye SEO parity için
  ayrı bir `curl`+`grep` geçişi gerekir.
  Canlı sitede analytics/GTM script'leri (client-render edildiği için) WebFetch'e görünmedi; bu
  bir tarayıcı/network-tab kontrolü gerektirir.
- Canlı sitenin gerçek CMS'i (`cms.vodafone.com.tr`) erişilemez/incelenemez — sadece medya
  URL yapısından varlığı çıkarıldı.
- Canlı `/kampanyalar`, `/blog`, `/duyurular` sayfalarında pagination/infinite-scroll davranışı
  doğrulanamadı (JS-render edilmiş olabilir).
- Footer'daki blog/kampanya cross-link'lerinin canlı sitemap'le neden uyuşmadığı (muhtemelen
  gecikmeli/manuel güncelleme veya "öne çıkan" ayrı bir seçim mekanizması) kesin olarak
  doğrulanamadı — sadece örüntü olarak not edildi.
- Load/performans testi yapılmadı (Lighthouse/WebPageTest gibi bir araçla ölçülmedi).
- Erişilebilirlik denetimi statik kod incelemesiyle sınırlı kaldı; gerçek ekran okuyucu/kontrast
  testi yapılmadı.
