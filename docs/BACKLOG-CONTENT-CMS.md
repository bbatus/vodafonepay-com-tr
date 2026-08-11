# Backlog — İçerik Parity & CMS Yeterlilik

Kaynak: [`docs/AUDIT-CONTENT-CMS.md`](./AUDIT-CONTENT-CMS.md). Her görev tek bir Claude Code
oturumuna verilebilecek netlikte yazıldı. **Aynı oturumda birden fazla P0 çalıştırma** — refactor
ile feature aynı commit'te karışırsa neyin neyi bozduğu kaybolur. Her görev sonunda `npm run check`
yeşil olmalı ve ayrı branch/PR olmalı.

Öncelik tanımı:
- **P0** — parity kırığı veya business ekibinin işini yapmasını engelleyen boşluk
- **P1** — yönetilebilirlik/kalite/SEO iyileştirmesi, prod öncesi kapatılmalı
- **P2** — nice-to-have, sonraya bırakılabilir

---

## P0

### [P0-01] Campaigns collection'a slug/body/terms/SEO alanları ekle
**Neden:** Kampanya detay sayfası kurulamaz çünkü CMS şemasında slug, gövde, katılım koşulları,
SEO alanı yok. Bu, P0-02'nin ön koşulu.
**Kapsam:** `cms/src/collections/Campaigns.ts`'e `slug` (unique, required), `body` (richText),
`terms` (richText, katılım koşulları), `seoTitle`, `seoDescription`, `status` (select:
active/expired) alanları ekle. `denyMakerPublish` ve mevcut access mantığını koru.
**Dokunulacak dosyalar:** `cms/src/collections/Campaigns.ts`, `cms/src/collections/__tests__/collections.test.ts` (yeni alanları kapsayacak şekilde güncelle).
**Kabul kriteri:** Yeni bir kampanya CMS admin panelinden slug/body/terms/SEO ile oluşturulup
publish edilebiliyor; mevcut testler + yeni alan testleri geçiyor; `npm run check` (cms) yeşil.
**Tahmini efor:** S
**Bağımlılık:** yok

### [P0-02] Kampanya detay sayfası (`/kampanyalar/[slug]`)
**Neden:** Canlı sitede 18 kampanya detay sayfası var, bizde hiç yok; `CardListGrid` kartları
tıklanamıyor (çıplak `<button>`, `href`/`onClick` yok).
**Kapsam:** `src/lib/cms.ts`'e `getCampaignBySlug(slug)` getter'ı (zod şema ile); yeni
`src/app/kampanyalar/[slug]/page.tsx` — `generateStaticParams` + `generateMetadata`
(seoTitle/seoDescription kullanarak); `CardListGrid`'e (veya kampanya listesindeki karta) gerçek
`<Link href={`/kampanyalar/${slug}`}>` ekle.
**Dokunulacak dosyalar:** `src/lib/cms.ts`, `src/app/kampanyalar/[slug]/page.tsx` (yeni),
`src/app/kampanyalar/page.tsx`, `src/components/CardListGrid.tsx`.
**Kabul kriteri:** CMS'te oluşturulan 1 test kampanyasının detay sayfası doğru render ediyor;
kampanya listesindeki kart tıklanıp detay sayfasına gidiyor; `npm run check` yeşil.
**Tahmini efor:** M
**Bağımlılık:** P0-01

### [P0-03] Blog detay sayfası (`/blog/[slug]`)
**Neden:** `BlogPosts` collection'ında `slug`/`body`(richText)/`seoTitle`/`seoDescription` **zaten
var** ama hiçbir route bu veriyi göstermiyor — ölü şema. Canlıda 20 blog detay sayfası var.
**Kapsam:** `src/lib/cms.ts`'e `getBlogPostBySlug(slug)` getter'ı; yeni
`src/app/blog/[slug]/page.tsx` — `generateStaticParams` + `generateMetadata`; `CardListGrid`'e
(blog listesindeki karta) gerçek link ekle.
**Dokunulacak dosyalar:** `src/lib/cms.ts`, `src/app/blog/[slug]/page.tsx` (yeni),
`src/app/blog/page.tsx`, `src/components/CardListGrid.tsx` (P0-02 ile ortak component, aynı PR'da
değilse dikkatli merge edilmeli).
**Kabul kriteri:** CMS'te oluşturulan 1 test blog yazısının detay sayfası richText body'yi doğru
render ediyor; liste sayfasındaki kart tıklanıp detay sayfasına gidiyor; `npm run check` yeşil.
**Tahmini efor:** M
**Bağımlılık:** yok (schema zaten hazır)

### [P0-04] `CardListGrid` bileşenine gerçek link deste��i ekle
**Neden:** Bileşen şu an `<button type="button">` render ediyor, `href`/`onClick` hiç yok — hem
kampanya hem blog kartları bu bileşeni paylaşıyor. P0-02/P0-03 bu bileşene bağımlı; onlardan önce
tek başına düzeltilirse iki paralel oturumun çakışmasını önler.
**Kapsam:** `CardListItem` tipine opsiyonel `href` alanı ekle; bileşen `href` varsa `next/link`
`<Link>`, yoksa mevcut `<button>` render etsin (geriye dönük uyumluluk için).
**Dokunulacak dosyalar:** `src/components/CardListGrid.tsx`, ilgili tip tanımı (muhtemelen aynı
dosyada veya `src/types/`).
**Kabul kriteri:** Var olan tüm `CardListGrid` kullanım yerleri (blog/kampanya liste sayfaları)
hâlâ doğru render ediyor; `href` verilen bir item gerçek link olarak render ediliyor; `npm run check` yeşil.
**Tahmini efor:** S
**Bağımlılık:** yok — **bunu P0-02/P0-03'ten önce, tek başına yap.**

### [P0-05] Temsilcilik (dealer) veri modeli + `/temsilci/[id]` detay sayfası
**Neden:** Canlı sitede 525 temsilcilik sayfası var; repoda hiç veri/route yok, sadece bir
il/ilçe formu Google Maps'e yönlendiriyor. Envanterdeki en büyük tek boşluk.
**Kapsam:** Yeni `cms/src/collections/Representatives.ts` (businessName, repCode,
activityDescription, phone, mersisNo, address, province, district, authorizedPerson, qrCode
upload) — role bazlı access (mevcut `newVerticalCreate`/`newVerticalReadWrite`/`isNewVerticalMaker`
desenini uygula), `read: () => true`. `src/lib/cms.ts`'e `getRepresentatives(province?, district?)`
ve `getRepresentativeById(id)`. Yeni `src/app/temsilci/[id]/page.tsx`. Mevcut
`TemsilciliklerimizForm`'u gerçek veriye bağla: il/ilçe seçilince Google Maps yerine (veya onunla
birlikte) CMS'ten filtrelenmiş temsilcilik listesini göster, her sonuç `/temsilci/[id]`'ye linklensin.
**Dokunulacak dosyalar:** `cms/src/collections/Representatives.ts` (yeni),
`cms/payload.config.ts` (collection'ı kaydet), `src/lib/cms.ts`,
`src/app/temsilci/[id]/page.tsx` (yeni), `src/app/temsilciliklerimiz/TemsilciliklerimizForm.tsx`.
**Kabul kriteri:** CMS'te oluşturulan test kayıtları il/ilçe filtresiyle bulunabiliyor, detay
sayfası doğru render ediyor; migration/schema-push adımı R-10'daki bilinen workaround ile
uygulanıp doğrulanıyor; `npm run check` (her iki proje) yeşil.
**Tahmini efor:** L
**Bağımlılık:** yok

### [P0-06] `FilterTabs`'ı gerçek filtreleme yapar hale getir
**Neden:** Şu an sadece local `useState` tutuyor, hiçbir listeyi filtrelemiyor, `hidden lg:flex`
ile mobilde/tablette hiç görünmüyor. Canlıda `/kampanyalar` ve `/blog` gerçek `?kategori=`
query-param filtrelemesi kullanıyor; CMS'teki `category` alanı hiç kullanılmıyor.
**Kapsam:** `FilterTabs`'a `categories`/`active`/`onChange` prop'ları ekle (veya `useSearchParams`
ile `?kategori=` senkronize et); `/kampanyalar` ve `/blog` sayfalarında listeyi seçili kategoriye
göre filtrele; `hidden lg:flex` sınıfını kaldırıp mobilde de göster (responsive tasarımı koru).
**Dokunulacak dosyalar:** `src/components/FilterTabs.tsx`, `src/app/kampanyalar/page.tsx`,
`src/app/blog/page.tsx`.
**Kabul kriteri:** Bir kategoriye tıklandığında hem kampanya hem blog listesi gerçekten filtreleniyor
(tarayıcıda doğrulanmalı); mobil genişlikte tabs görünür; `npm run check` yeşil.
**Tahmini efor:** M
**Bağımlılık:** yok

---

## P1

### [P1-01] FeeRows/LimitTables'a `versions.drafts` ekle
**Neden:** Yasal/finansal içerik draft'sız — editör kaydettiği an canlıya basıyor, geri alma yok.
**Kapsam:** `cms/src/collections/FeeRows.ts` ve `LimitTables.ts`'e `versions: { drafts: true }`
ekle; `read` access'inin `publishedOrAuthenticated` deseniyle uyumlu olduğunu doğrula (veya
`denyUnauthenticatedDraftRead` hook'unu bu iki collection'a da uygula — R-02'deki desenle aynı).
**Dokunulacak dosyalar:** `cms/src/collections/FeeRows.ts`, `cms/src/collections/LimitTables.ts`,
ilgili testler.
**Kabul kriteri:** Draft kaydedilen bir FeeRow yayınlanmadan sitede görünmüyor; publish edilince
görünüyor; testler geçiyor.
**Tahmini efor:** S
**Bağımlılık:** yok

### [P1-02] Kalan collection'lara `versions.drafts` ekle
**Neden:** NavLinks, ProductHeroes, FeatureCards, StepCards, LegalPages, ContentBlocks'ta da
draft/geri alma yok — düşük risk ama tutarsız.
**Kapsam:** Aynı deseni bu 6 collection'a uygula.
**Dokunulacak dosyalar:** `cms/src/collections/{NavLinks,ProductHeroes,FeatureCards,StepCards,LegalPages,ContentBlocks}.ts`.
**Kabul kriteri:** Testler geçiyor, mevcut sayfa render'ları bozulmuyor (draft eklemek published
okumanın davranışını değiştirmemeli).
**Tahmini efor:** M
**Bağımlılık:** P1-01 (aynı deseni referans alır, birlikte gözden geçirmek daha tutarlı olur)

### [P1-03] `sitemap.ts` + `robots.ts` ekle
**Neden:** Repoda ikisi de yok; canlıda ikisi de var (robots AI botlarını engelliyor).
**Kapsam:** `src/app/sitemap.ts` — statik route'lar + (P0-02/P0-03/P0-05 tamamlandıysa) dinamik
slug'lar için CMS'ten `generateSitemaps`/tekil sitemap. `src/app/robots.ts` — canlıdaki politikayı
(GPTBot/CCBot/Google-Extended/Applebot-Extended/meta-externalagent/ClaudeBot disallow) repo için
uygun şekilde replike et veya bilinçli olarak farklılaştır (kullanıcıya sor).
**Dokunulacak dosyalar:** `src/app/sitemap.ts` (yeni), `src/app/robots.ts` (yeni).
**Kabul kriteri:** `/sitemap.xml` ve `/robots.txt` doğru içerikle serve ediliyor; `npm run check` yeşil.
**Tahmini efor:** S
**Bağımlılık:** İdealde P0-02/03/05'ten sonra (dinamik URL'leri kapsaması için), ama statik
sayfalarla da tek başına yapılabilir.

### [P1-04] Sayfa metadata'larına OpenGraph/Twitter/canonical ekle
**Neden:** Hiçbir sayfada `openGraph`/`twitter`/`alternates`/JSON-LD yok, sadece `title`+`description`.
`/` ve `/sikca-sorulan-sorular`'da `metadata` export'u hiç yok.
**Kapsam:** Ortak bir `buildMetadata()` helper'ı yaz (title/description/canonical/OG/Twitter'ı tek
yerden üretsin), her `page.tsx`'te kullan; `/` ve `/sikca-sorulan-sorular`'a eksik `metadata`
export'unu ekle.
**Dokunulacak dosyalar:** yeni `src/lib/metadata.ts` (helper), tüm `src/app/**/page.tsx`.
**Kabul kriteri:** Her sayfanın `<head>`'inde canonical + OG + Twitter card tag'leri var (tarayıcıda
doğrulanmalı); `npm run check` yeşil.
**Tahmini efor:** M
**Bağımlılık:** yok

### [P1-05] Eksik `<h1>` bug'ını düzelt
**Neden:** `ProductHero.tsx:25` ve `Hero.tsx:16-22` başlığı `<p>` render ediyor — 7 sayfada hiç
`<h1>` yok (`/`, `/vodafone-pay-kart`, `/ucretler-ve-limitler`, `/faturana-yansit`,
`/vodafone-pay-uygulama`, `/aninda-bakiye`, `/qr-ile-faturana-yansit`, `/sikca-sorulan-sorular`).
**Kapsam:** `ProductHero`/`Hero` component'lerinde başlık elemanını `<h1>`'e çevir; sayfa içinde
başka bir `<h1>` olup olmadığını kontrol et (duplicate `<h1>` oluşmasın).
**Dokunulacak dosyalar:** `src/components/ProductHero.tsx`, `src/components/Hero.tsx`.
**Kabul kriteri:** 7 sayfanın hepsinde tam olarak 1 `<h1>` var (grep/testle doğrula); görsel
stil değişmiyor (Tailwind class'ları taşınır, sadece etiket değişir).
**Tahmini efor:** S
**Bağımlılık:** yok

### [P1-06] Kurumsal iletişim verisini `ContactInfo` etrafında tekilleştir
**Neden:** Adres/telefon/KEP e-postası `kurumsal-yonetim`, `gizlilik-ve-guvenlik-politikasi`,
`bilgi-guvenligi`, `faturana-yansit` sayfalarında ayrı ayrı hardcoded ve birbirinden farklı (3
farklı adres yazımı tespit edildi).
**Kapsam:** Gerekirse `ContactInfo` global'ine eksik alanları (KVKK e-postası, TCMB bilgileri zaten
var mı kontrol et) ekle; bu 4 sayfadaki hardcoded literal'leri `getContactInfo()` çağrısına bağla.
**Dokunulacak dosyalar:** `cms/src/globals/ContactInfo.ts` (gerekirse alan ekle),
`src/app/kurumsal-yonetim/page.tsx`, `src/app/gizlilik-ve-guvenlik-politikasi/page.tsx`,
`src/app/bilgi-guvenligi/page.tsx`, `src/app/faturana-yansit/page.tsx`.
**Kabul kriteri:** 4 sayfa da aynı `ContactInfo` kaydını gösteriyor; adres/telefon tek yerden
değiştirilince hepsi güncelleniyor (tarayıcıda doğrulanmalı); `npm run check` yeşil.
**Tahmini efor:** M
**Bağımlılık:** yok

### [P1-07] `cookieRows.ts`'i CMS'e taşı
**Neden:** Çerez tablosu (~55 satır, 3rd-party tracker'lar dahil) koda gömülü; KVKK açısından
hassas ve sık değişebilir bir içerik türü.
**Kapsam:** Yeni `cms/src/collections/CookieRows.ts` (name, provider, party: first/third,
category, description, duration) veya `LegalPages`'e `cookieRows` array alanı — hangisinin daha
uygun olduğuna karar ver (ayrı collection önerilir, çünkü tablo satır sayısı büyük ve büyüyebilir).
`src/lib/cms.ts`'e getter, `cerez-politikasi/page.tsx`'i CMS'ten okuyacak şekilde güncelle.
**Dokunulacak dosyalar:** `cms/src/collections/CookieRows.ts` (yeni), `src/lib/cms.ts`,
`src/app/cerez-politikasi/page.tsx`, `src/app/cerez-politikasi/cookieRows.ts` (fallback olarak
kalabilir veya kaldırılabilir — CMS boşsa fallback deseni korunmalı).
**Kabul kriteri:** CMS'te eklenen bir çerez satırı sitede görünüyor; CMS boşsa mevcut 55 satır
fallback olarak render ediliyor; `npm run check` yeşil.
**Tahmini efor:** M
**Bağımlılık:** yok

### [P1-08] Ücret/limit rakamlarını CMS'e taşı (business-critical)
**Neden:** `PricesAndLimits`'in fallback'i 16+15 satırlık gerçek TL/% rakamı taşıyor, arkasında
hiçbir collection yok — `FeeRows`/`LimitTables` var ama sitede kullanılan asıl veri bu fallback.
**Kapsam:** Mevcut `FeeRows`/`LimitTables` collection'larının gerçek prod verisiyle dolu olduğunu
doğrula (muhtemelen boş/eksik — seed edilmesi gerekiyor); `PricesAndLimits.tsx`'in fallback'e değil
CMS verisine güvendiğini doğrula/düzelt.
**Dokunulacak dosyalar:** `src/components/PricesAndLimits.tsx`, gerekirse
`cms/src/collections/{FeeRows,LimitTables}.ts` seed script'i.
**Kabul kriteri:** CMS'teki bir ücret satırı değiştirildiğinde sitede rakam güncelleniyor
(tarayıcıda doğrulanmalı); `npm run check` yeşil.
**Tahmini efor:** M
**Bağımlılık:** P1-01 (aynı collection'lara draft eklenmesiyle birlikte gözden geçirmek mantıklı)

### [P1-09] Media collection'a imageSizes/focal point/caption ekle
**Neden:** Şu an sadece `alt`; responsive türevler, focal point, caption, dosya boyutu limiti yok.
**Kapsam:** `cms/src/collections/Media.ts`'e Payload'ın `upload.imageSizes`, `focalPoint: true`,
opsiyonel `caption` (richText), `upload.mimeTypes` yanında dosya boyutu limiti ekle.
**Dokunulacak dosyalar:** `cms/src/collections/Media.ts`.
**Kabul kriteri:** Yeni yüklenen bir görsel için tanımlı boyut türevleri MinIO'da oluşuyor; mevcut
görseller bozulmuyor; `npm run check` yeşil.
**Tahmini efor:** S
**Bağımlılık:** yok

### [P1-10] `cms/package.json`'a `check` script'i ekle
**Neden:** Root projede `npm run check` (lint+typecheck+test+build) var, `cms/`'de yok — tutarsız,
CI/otomasyonda tek komutla doğrulama yapılamıyor.
**Kapsam:** `cms/package.json`'a `"check": "npm run lint && npm run typecheck && npm run test && npm run build"` ekle.
**Dokunulacak dosyalar:** `cms/package.json`.
**Kabul kriteri:** `cd cms && npm run check` çalışıyor (env değişkenleri set edilmişse build da
geçiyor, yoksa beklenen şekilde `env.ts` hata veriyor — bu bir regresyon değil).
**Tahmini efor:** S
**Bağımlılık:** yok

### [P1-11] `Users.read` erişimini daralt
**Neden:** Şu an herhangi bir authenticated kullanıcı (rolü ne olursa olsun) tüm CMS
kullanıcılarının e-postalarını listeleyebiliyor.
**Kapsam:** `cms/src/collections/Users.ts`'te `read` access'ini `isNewVerticalMaker` (veya "kendi
kaydı + admin" deseni) ile daralt; kullanıcıların kendi profillerini görebildiğinden emin ol.
**Dokunulacak dosyalar:** `cms/src/collections/Users.ts`, `cms/src/access/__tests__/roles.test.ts`.
**Kabul kriteri:** Maker olmayan bir rol `/api/users` listesini göremiyor ama kendi kaydını
görebiliyor; testler geçiyor.
**Tahmini efor:** S
**Bağımlılık:** yok

### [P1-12] Hâlâ tam CMS'e bağlı olmayan homepage component'lerini `ContentBlocks`'a taşı
**Neden:** `FeatureHighlights`, `StepPhones`, `BrandLogoGrid`, homepage `Campaigns` carousel'i prop
alıyor ama gerçek bir CMS kaynağı hiçbir sayfa tarafından bu component'lere iletilmiyor — hep
fallback render ediliyor.
**Kapsam:** İlgili sayfalarda (`src/app/page.tsx` vb.) bu component'lere `getContentBlocks(...)`
üzerinden gerçek veri geçir (mevcut `ContentBlocks` collection'ının `blockType` enum'una uygun
kayıtlar seed'lenmeli).
**Dokunulacak dosyalar:** `src/app/page.tsx`, ilgili component prop'ları, gerekirse
`cms/src/collections/ContentBlocks.ts` seed verisi.
**Kabul kriteri:** CMS'te bu bölümler için içerik oluşturulup sitede göründüğü tarayıcıdan
doğrulanıyor; `npm run check` yeşil.
**Tahmini efor:** M
**Bağımlılık:** yok

---

## P2

### [P2-01] `kurumsal-yonetim` sayfasını CMS'e taşı
**Neden:** %100 hardcoded, ~180 satır (yönetim kurulu bioları, sicil bilgileri, denetim yılları) —
hukuki/kurumsal içerik, deploy olmadan güncellenemiyor.
**Kapsam:** Yeni bir collection (`CorporateGovernance` veya benzeri) tasarla: misyon maddeleri
(array), sicil bilgileri (yapılandırılmış alanlar — `ContactInfo` ile çakışmayacak şekilde),
yönetim kurulu üyeleri (array: isim, unvan, bio, foto), denetim yılları (array). Hukuk ekibiyle
alan yapısını doğrulamadan uygulamaya alma — R-22'deki gerekçeyle aynı, tek oturumda bitirilmemeli.
**Dokunulacak dosyalar:** yeni collection, `src/app/kurumsal-yonetim/page.tsx`.
**Kabul kriteri:** İçerik CMS'ten geliyor, mevcut hardcoded veriyle bire bir eşleşiyor.
**Tahmini efor:** L
**Bağımlılık:** Hukuk/kurumsal ekiple alan onayı (teknik değil, süreç bağımlılığı)

### [P2-02] `site-haritasi` sayfasını `NavLinks`'ten dinamik üret
**Neden:** Şu an Header/Footer'dan ayrı, hardcoded bir kopya — nav güncellenince burası
güncellenmiyor (drift riski).
**Kapsam:** `getNavLinks()`'i kullanarak `site-haritasi/page.tsx`'i dinamik hale getir.
**Dokunulacak dosyalar:** `src/app/site-haritasi/page.tsx`.
**Kabul kriteri:** Header/Footer'a eklenen yeni bir link otomatik olarak site haritasında da görünüyor.
**Tahmini efor:** S
**Bağımlılık:** yok

### [P2-03] `sozlesmeler-ve-formlar`'daki buton listesini gerçek indirilebilir linke çevir
**Neden:** CMS'ten liste geliyor ama gerçek PDF/ses dosyası linki yok, sadece işlevsiz `<button>`.
**Kapsam:** `LegalPages` (veya yeni bir alt-collection) belgelere `fileUrl`/`upload` alanı ekle;
sayfada gerçek `<a href download>` render et.
**Dokunulacak dosyalar:** `cms/src/collections/LegalPages.ts`,
`src/app/sozlesmeler-ve-formlar/page.tsx`.
**Kabul kriteri:** Butona tıklayınca gerçek bir dosya indiriliyor/açılıyor.
**Tahmini efor:** M
**Bağımlılık:** yok

### [P2-04] `page` serbest metin alanlarını enum/select'e çevir
**Neden:** `FeeRows`/`StepCards`/`FeatureCards`/`ProductHeroes`/`ContentBlocks`'taki `page` alanı
düz `text` — typo bir kaydı hiçbir sayfaya bağlanmayan "hayalet" içerik haline getirebilir.
**Kapsam:** Bu alanı kullanılan gerçek sayfa anahtarlarından oluşan bir `select` enum'una çevir;
mevcut veriyi migration ile taşı (R-10'daki migration-tooling kısıtına dikkat).
**Dokunulacak dosyalar:** ilgili tüm collection dosyaları.
**Kabul kriteri:** Geçersiz bir `page` değeri admin panelinde artık girilemiyor; mevcut kayıtlar
bozulmuyor.
**Tahmini efor:** M
**Bağımlılık:** R-10 (migration tooling) çözülmeden riskli — önce ona bakılmalı

### [P2-05] Kampanya/blog'a "aktif/pasif" durum alanı ekle
**Neden:** Canlıda sitemap'te olup liste sayfasında görünmeyen içerik örüntüsü var (18/15,
20/12) — muhtemelen bir durum alanı kullanılıyor, bizde yok.
**Kapsam:** `Campaigns`/`BlogPosts`'a `status: select (active/expired)` ekle, liste sorgularını
bu alana göre filtrele, detay sayfası `status: expired` olsa bile erişilebilir kalsın (sitemap'te
olması gibi).
**Dokunulacak dosyalar:** `cms/src/collections/{Campaigns,BlogPosts}.ts`, `src/lib/cms.ts`.
**Kabul kriteri:** `expired` işaretlenen bir kayıt liste sayfasından kayboluyor ama detay
sayfasından hâlâ erişilebiliyor.
**Tahmini efor:** S
**Bağımlılık:** P0-01/P0-02/P0-03 (slug/detay altyapısı olmadan bu alanın anlamı sınırlı)

---

## Önerilen Sıralama

1. **P0-04** (CardListGrid link desteği) — tek başına, küçük, diğer her şeyin önünü açıyor.
2. **P0-01 → P0-02** (Campaigns şema + detay sayfası) ve **P0-03** (Blog detay sayfası) —
   paralel çalıştırılabilir (farklı collection'lar, P0-04'ten sonra dosya çakışması minimal).
3. **P0-05** (Temsilcilik) — en büyük efor, bağımsız başlanabilir, erken başlamak toplam süreyi kısaltır.
4. **P0-06** (FilterTabs) — P0-01/02/03'ten bağımsız ama aynı sayfaları (`kampanyalar`, `blog`)
   değiştirdiği için onlarla aynı anda DEĞİL, öncesinde veya sonrasında ayrı bir oturumda yapılmalı.
5. **P1-01 → P1-02** (draft/versions) — güvenlik/veri-kaybı riski taşıyan en öncelikli P1'ler.
6. **P1-06, P1-07, P1-08** (veri tekilleştirme/CMS'e taşıma) — birbirinden bağımsız, paralel olabilir.
7. **P1-03, P1-04, P1-05** (SEO/a11y) — düşük risk, herhangi bir sırada yapılabilir, P0'lardan
   sonra (sitemap dinamik URL'leri kapsasın diye).
8. **P1-09, P1-10, P1-11, P1-12** — bağımsız, düşük öncelik sırasına göre doldurulabilir.
9. **P2 grubu** — hiçbiri acil değil; P2-04 özellikle R-10 (migration tooling) çözülene kadar
   ertelenmeli.
