# Layout Denkliği — Canlı Site vs Bizim Blok Kütüphanesi

_Son güncelleme: 28.08.2026_

Bu dosya tek bir soruya cevap verir: **canlı vodafonepay.com.tr'deki her bölüm bizde
var mı, ve stili birebir aynı mı?**

## 1. Araştırma nasıl yapıldı

Canlı site her bölümünü DOM'da kendi adıyla etiketliyor:

```html
<div class="widget widget_VpayApp_NasilKazanirim" data-widget="VpayApp\NasilKazanirim">
```

17 canlı sayfa tarandı ve `data-widget` değerleri toplandı. Bu, tahmine değil sitenin
**kendi isimlendirmesine** dayanan tam bir envanter veriyor: **33 widget**.

Her widget için canlıda `getComputedStyle` ile ölçüm yapıldı (renk, radius, gölge,
font boyutu, hizalama, genişlik, padding) ve bizim karşılığımızla karşılaştırıldı.

## 2. Sonuç özeti

| | Adet |
|---|---|
| Canlıdaki toplam widget | 33 |
| Site altyapısı (blok değil) | 6 |
| Blok karşılığı olan | 21 widget → 16 blok |
| **Blok karşılığı OLMAYAN** | **6** |

**Cevap: Hayır, hepsi tamamlanmadı.** 6 widget'ın hâlâ blok karşılığı yok (§4).
Stil tarafında ise ölçülen tüm bloklar canlıyla hizalandı (§3).

## 3. Blok karşılığı olanlar — stil denkliği

Bir widget birden fazla isimle aynı şekli kullanabiliyor (örn. hero 3 farklı isimle
geçiyor); o yüzden 21 widget 16 bloğa karşılık geliyor.

| Blok | Canlı widget | Stil durumu |
|---|---|---|
| `hero` | `Homepage\VpaySpotlight`, `VpayApp\VpayAppSpotlight`, `VpayOtherSpotlight` | ✅ Ölçüldü + düzeltildi — masaüstünde metin görselin üstüne beyaz overlay, gri şerit YOK; `lg` altında overlay gizlenip `#f3f4f6` şerit çıkıyor. 1030×322, radius 12px |
| `richText` | `TextareaAndContent` | 🟡 Ölçüldü. Canlı içeriği `bg-white rounded-2xl px-5 py-4` karta sarıyor; bizde düz. Beyaz zemin üstünde beyaz kart olduğu için **görünür fark yok**, bilinçli bırakıldı |
| `faqList` | `General\FAQs`, `AllFaqs` | ✅ Ölçüldü + düzeltildi — kart stili zaten birebirdi; çerçeve yanlıştı: zemin rengi kaldırıldı, kartlar 768px→**1030px**, boşluk 12→20px, başlık ortalı 30px → **sola dayalı 28px** |
| `campaignGrid` | `Homepage\VpayKampanya`, `Campaigns` | ✅ Ölçüldü + düzeltildi — çerçeve (361px, `rounded-md`, `shadow-md`, p-5) zaten doğruydu; görsel 240px `object-cover` → **321×180 `object-contain`, köşesiz**, başlık 18px siyah → **20px #333** |
| `video` | — | ⬜ Canlıda tek başına video bölümü yok (video `PhysicalCardUsed`/`VideosWithTabs` içinde). Bu blok bizim eklediğimiz genel bir blok; sitenin token'larıyla uyumlu |
| `logoGrid` | `WhereCanIUse` | ✅ Ölçüldü + düzeltildi — **en büyük sapma buydu**: bizde 80×40 logo, 64px sıra, **marka adı hiç yoktu**. Canlı: 1400px beyaz kart (gölgesiz) + **140×140 şeffaf `rounded-2xl` tile + altında marka adı**. Ayrıca blok (gri) ile bileşen (beyaz+gölge) birbirinden de sapmıştı |
| `iconCards` | `CardsTitleSubtitle` | ✅ Ölçüldü + düzeltildi — düz `#F2F2F2` `rounded-md` tile, **kırmızı 28px başlık** (bizde beyaz+gölgeli kart, siyah 16px başlıktı) |
| `steps` | `PhoneSteps`, `Homepage\VpayStepPhones` | ✅ Ölçüldü + düzeltildi — `h-[226px] rounded-xl p-5` kutular, aktif kutu kırmızı dolu, 368px telefon görseli (bizde kırmızı yuvarlak rozet + 160px küçük görsel vardı) |
| `imageTextSlides` | `EarnWithCard` | ✅ Ölçüldü + düzeltildi — görsel+slayt tek **`#F2F2F2 rounded-md` panel** içinde (bizde beyaz zeminde dağınıktı, her tile ayrı gri) |
| `videoList` | `VideosWithTabs` | ✅ Ölçüldü + düzeltildi — şerit `bg-white`, **aktif sekme `#0D0D0D` dolgulu beyaz yazı 286px** (bizde beyaz-üstü-gri çip, gri pasif yazı) |
| `howToEarn` | `VpayApp\NasilKazanirim` | ✅ Ölçüldü — `lg:ml-[165px]` offset, mobil/masaüstü sıra değişimi, 72px ikonlar, bağlayıcı çizgi. **Bu blok bu turda eklendi** (kullanıcının "görsel var sağında yazı var" örneği) |
| `imageWithText` | `WhereCanIBuy` | ✅ Ölçüldü — `max-w-[574px]` görsel kutusu, 434px görsel, 24/28px başlık, 370px'e sınırlı metin. **Bu turda eklendi**; `WhereCanIBuy.tsx` de aynı bileşenden render oluyor |
| `pricesAndLimits` | `PricesAndLimits` | ✅ Ölçüldü + düzeltildi — tablo zebra deseni zaten doğruydu; **sekme şeridi** `videoList` ile aynı yanlışı taşıyordu, düzeltildi |
| `blogGrid` | `Blogs` | ✅ `campaignGrid` ile aynı `CardListGrid`'i kullanıyor, o da ölçülüp düzeltildi. **Bu turda eklendi** |
| `featureHighlights` | `Homepage\VpayAyricaliklarDunyasi`, `VpayApp\VpayAyricalikliDunyasi` | ✅ Ölçüldü — 1/3 kolon ikon+başlık+metin, kalan alanda medya. **Bu turda eklendi**, medyası CMS'ten gelebilir hale getirildi |
| `profileGrid` | `BoardOfDirectors` | ✅ Ölçüldü — 1/2/3 kolon grid, `max-w-[331px] p-5 rounded-md` kart, 291×200 `object-cover` fotoğraf. **Bu turda eklendi** |

## 4. HÂLÂ EKSİK — blok karşılığı olmayan 6 widget

| Canlı widget | Nerede | Durum / neden |
|---|---|---|
| `PhysicalCardUsed` | /vodafone-pay-kart | ❌ **Gerçek eksik.** Arka plan görselli panel + beyaz başlık/metin + gömülü video. Bizde ne bileşen ne blok var |
| `Representatives` | /temsilciliklerimiz | ❌ Sayfa olarak var (`Representatives` koleksiyonu + elle yazılmış rota) ama **blok değil** — editör başka bir sayfaya temsilci listesi koyamaz |
| `ContractsAndFormsContent` | /faydali-bilgiler, /sozlesmeler-ve-formlar | ❌ Sayfa olarak var (`Documents` koleksiyonu) ama **blok değil** |
| `FooterPages\ContactInfo` | /iletisim | ❌ Sayfa olarak var (`ContactInfo` global) ama **blok değil** |
| `StyledTable` | /site-haritasi | ❌ Bu turda fark edildi. Stil verilmiş tablo bloğu; bizde karşılığı yok |
| `LeadForm` | /faturana-yansit | 🔒 **Bilinçli.** Bileşeni var (`LeadFormCta.tsx`) ama içeriği hardcoded; gerçek form altyapısı/entegrasyonu olmadan CMS'e bağlamak anlamsız |

Ayrıca `VideosWithTabs` bloğu var ama içeriği hâlâ hardcoded — R-23 gereği (gerçek
video içeriği yok) bilinçli olarak CMS'e bağlanmadı.

## 5. Blok yapılmayan ama kapsanan site altyapısı (6)

Bunlar sayfa bloğu değil, sitenin her yerinde çalışan parçalar — karşılıkları var:

| Canlı widget | Bizdeki karşılığı |
|---|---|
| `Header` | `Header.tsx` / `HeaderClient.tsx` |
| `Footer` | `Footer.tsx` |
| `General\Breadcrumb` | `Breadcrumb.tsx` |
| `DownloadVpayApp` | `AppDownloadBanner.tsx` (site genelinde) |
| `StickyQR` | ❌ Yok — masaüstünde sağda sabit duran QR paneli |
| `EnableVarnishCache` | Altyapı, görsel karşılığı yok |

## 6. Kalan iş listesi

1. **Anasayfanın Pages'ten yönetilmesi** — kullanıcının açık talebi, henüz yapılmadı.
   Anasayfa şu an `src/app/page.tsx` içinde sabit bir bileşen dizisi. Taşımak için
   `StepPhones` ve anasayfa `Campaigns` varyantının da blok olması, sonra `/`
   rotasının Pages'ten okuması gerekiyor.
2. §4'teki 5 gerçek eksik bloğun eklenmesi (`PhysicalCardUsed`, `Representatives`,
   `ContractsAndFormsContent`, `ContactInfo`, `StyledTable`).
3. `StickyQR` bileşeninin eklenmesi (§5).
4. Kullanıcı testi: `Layout Test Sayfasi` masaüstü + mobilde gözden geçirilmeli.

## 7. Doğrulama durumu

- Test sayfasında 16 bloğun tamamı ekli. Masaüstü 1440: beklenmeyen genişlik 0, boş
  bölüm 0 (`faqList` 1030px, `logoGrid` 1400px, kalanlar 1030px). Mobil 375: yatay
  taşma 0.
- Site 372 test, CMS 449 test; tsc/lint/build temiz.

---

# SEO Durumu (28.08.2026)

RFP'nin **§3.2'si zaten "SEO-Specific Functionalities"** başlıklı, 15 maddelik.
Aşağıdaki tablo kodun GÜNCEL hâline karşı doğrulandı — `docs/RFP-GAP-ANALYSIS-2026-08-24.md`
tablosunun iki satırı bayattı, düzeltildi.

## RFP §3.2 — madde madde

| # | RFP maddesi | Durum | Kanıt |
|---|---|:--:|---|
| 3.2.1 | SEO-dostu URL taksonomisi | ✅ | `turkishSlugify` + `uniqueSlug`, Pages/BlogPosts/Campaigns'te otomatik |
| 3.2.2 | Ayrı masaüstü/mobil URL | ✅ | `NavLinks.mobileHref` (25.08'de eklendi — eski dokümanda ❌ yazıyordu, bayattı) |
| 3.2.3 | Düzenlenebilir breadcrumb | ✅ | `PageMeta.breadcrumbLabel` + `Pages.parent` |
| 3.2.4 | SEO metin alanları | ✅ | `seoTitle`/`seoDescription` 4 koleksiyonda |
| 3.2.5 | Zengin metin | 🟡 | `lexicalEditor` kurulu; `LegalPages.intro` bilinçli düz textarea |
| 3.2.6 | Meta title/description/**keywords** | ✅ | `seoKeywordsField` **4 koleksiyonda da var** (eski dokümanda "hiçbir yerde yok" yazıyordu, bayattı) |
| 3.2.7 | Dinamik meta | ✅ | boş bırakılınca `title`/`description`'a düşüyor |
| 3.2.8 | Open Graph (+Twitter) | ✅ | `buildMetadata()` — og + `summary_large_image`, `locale: tr_TR` |
| 3.2.9 | Versiyonlama / rollback | ✅ | tüm içerik koleksiyonlarında `versions.drafts` |
| 3.2.10 | SEO auditing / analitik | ❌ | **Açık.** GA4/GTM entegrasyonu yok — gerçek hesap/tracking ID gerekiyor |
| 3.2.11 | Çoklu kanal yayınlama | 🟡 | REST/GraphQL var, tasarlanmış "kanal" kavramı yok |
| 3.2.12 | Önizleme (mobil+masaüstü) | ✅ | `admin.preview` + yayın öncesi iframe. Mobil/masaüstü geçiş toggle'ı yok |
| 3.2.13 | Sürükle-bırak sayfa tasarımı | ✅ | Pages blocks — **16 blok** |
| 3.2.14 | Çok dilli İÇERİK | 🟡 | Admin TR/EN tam; içerik lokalizasyonu bilinçli kapsam dışı |
| 3.2.15 | Çoklu veritabanı yönetimi | ⬜ | İster net değil, netleştirilmeli |

**Skor: 10 ✅ · 3 🟡 · 1 ❌ · 1 ⬜**

## RFP'de olmayan ama yapılan teknik SEO

| Ne | Durum | Not |
|---|:--:|---|
| `sitemap.xml` | ✅ | 39 URL, **tekrar eden 0**. 27.08'de gerçek bir bug kapatıldı: `getPages()` `depth=0` isteyip nesne şeması doğruladığı için görsel içeren her sayfa listeyi `null`'a düşürüyordu → **editörün yaptığı hiçbir sayfa sitemap'e girmiyordu** |
| `robots.txt` | ✅ | `/api/` kapalı, sitemap bildirimi var, AI-eğitim botları (GPTBot/CCBot/Google-Extended/Applebot-Extended/meta-externalagent/ClaudeBot) engelli — canlı sitenin kendi politikasıyla aynı |
| Canonical URL | ✅ | her sayfada `alternates.canonical` |
| **Yapısal veri (JSON-LD)** | ❌ | **Gerçek boşluk.** Sitede hiç `application/ld+json` yok. RFP açıkça istemiyor ama Organization / BreadcrumbList / FAQPage / Article şemaları bizim içerik tiplerimizle (SSS, blog, kampanya) doğrudan eşleşiyor ve zengin arama sonucu kazandırırdı |

## SEO'da kalan iş

1. **JSON-LD yapısal veri** eklenmesi (en yüksek getirili açık madde).
2. **§3.2.10 analitik** — GA4/GTM hesabı/tracking ID bekliyor (kullanıcı kararı).
3. §3.2.12 önizlemeye mobil/masaüstü geçiş toggle'ı.
