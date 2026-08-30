# Claude Code Prompt — İçerik Parity & CMS Yeterlilik Denetimi

> Bu dosyanın amacı: "canlı vodafonepay.com.tr ile bizim sitemiz arasında ne fark var, CMS'imiz bu
> projeyi yönetmeye yetiyor mu, nerede hardcoded kalmışız?" sorularına kanıta dayalı cevap üretmek.
>
> `docs/PRODUCTION_READINESS_PROMPT.md` teknik borç/production hazırlığı odaklıdır. Bu dosya onun
> tamamlayıcısıdır ve **içerik + CMS yönetilebilirliği** eksenine odaklanır. İkisini aynı anda çalıştırma.

## Nasıl kullanılır

1. Aşağıdaki `PROMPT` bloğunun tamamını kopyala.
2. Repo kökünde `claude` başlat, prompt'u yapıştır.
3. Çıktı **iki dosya**: `docs/AUDIT-CONTENT-CMS.md` (rapor) ve `docs/BACKLOG-CONTENT-CMS.md` (P0/P1/P2 görev listesi).
4. Raporu oku, backlog'u sen önceliklendir, sonra görevleri **tek tek** ayrı oturumlarda ver.
5. Bu faz **kod yazmaz**. Kod yazma izni backlog onayından sonra.

---

## PROMPT

````
Bu repo, canlı vodafonepay.com.tr sitesinin AI ile klonlanmış bir PoC'udur. Aynı klasörde iki ayrı
Next.js uygulaması var:
- Kök dizin: public site (Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui)
- `cms/`: Payload CMS (Postgres + S3/MinIO), site `src/lib/cms.ts` üzerinden REST ile besleniyor

GÖREVİN: **Kod yazma, hiçbir dosyayı değiştirme.** Sadece denetle ve iki rapor dosyası üret.

Cevaplaman gereken üç soru:
  S1. Canlı sitede olup bizde olmayan (veya bizde olup canlıda olmayan) ne var?
  S2. Sitedeki hangi içerik CMS'ten geliyor, hangisi koda gömülü (hardcoded)?
  S3. Mevcut CMS bu siteyi teknik ekip olmadan yönetmeye yetiyor mu, nerede yetmiyor?

## Çalışma şekli — paralel ekip

AGENTS.md'deki kurala uy: her teammate kendi git worktree branch'inde çalışsın, sen orkestratör
olarak sonda hepsini birleştir. 5 paralel ajan aç:

- **A1 — Canlı Site Envanteri**: `https://www.vodafonepay.com.tr/sitemap.xml` ve `robots.txt` ile
  başla, tüm URL'leri çıkar. Her üst seviye sayfayı WebFetch ile çek; bölüm yapısını, başlıkları,
  SEO meta'sını (title/description/canonical/OG), breadcrumb'ı, CTA'ları, form alanlarını,
   3rd-party script'leri (OneTrust, analytics, Adjust deeplink) kaydet. Detay sayfalarından
  (`/kampanyalar/{slug}`, `/blog/{slug}`, `/temsilci/{id}`) her tipten 2-3 örnek çek ve
  **alan şemasını** çıkar (bir kampanya detay sayfasında hangi alanlar var: başlık, görsel, tarih,
  koşullar metni, katılım butonu, ilgili kampanyalar vs.).
- **A2 — Repo Route & İçerik Envanteri**: `src/app` altındaki her route için: hangi bölümler render
  ediliyor, metin/görsel nereden geliyor, `export const metadata` içeriği ne. `src/components`
  altındaki her bileşenin veri kaynağını (prop / CMS / dosya içi sabit) etiketle.
- **A3 — CMS Şema & Yönetilebilirlik Denetimi**: `cms/src/collections/*`, `cms/src/globals/*`,
  `cms/payload.config.ts` ve `cms/src/hooks/revalidate.ts`. Her collection için: alanlar, zorunluluk,
  `versions.drafts`, access control, admin UX (grup, useAsTitle, defaultColumns, Türkçe label),
  validation, ilişkiler. Ayrıca: rol modeli gerçekten uygulanıyor mu, medya yönetimi (alt text,
  boyutlar, focal point), preview/taslak akışı, seed/migration durumu.
- **A4 — Hardcoded İçerik Taraması**: repoda koda gömülü tüm içeriği bul ve envanterle. Aradıkların:
  TSX/TS içinde Türkçe metin literal'leri, `const fallback*` dizileri, `.ts` veri dosyaları
  (`cookieRows.ts` gibi), `public/images` altındaki sayfaya özel görseller, hardcoded URL'ler,
  telefon/adres/IBAN gibi kurumsal veriler. Her biri için: dosya:satır, içerik tipi, hangi CMS
  collection'ına ait olması gerekir (veya "kalıcı olarak kodda kalmalı" gerekçesi).
- **A5 — Teknik / SEO / Performans**: `sitemap.ts`/`robots.ts`/`manifest` var mı; canonical, OG,
  hreflang, JSON-LD; `next/image` kullanımı ve `next.config.ts` remotePatterns; a11y (heading
  hiyerarşisi, alt text, form label, focus, kontrast); ISR/revalidate akışının doğruluğu;
  `src/lib/cms.ts`'te hata yönetimi, timeout, tip doğrulama; `npm run check` her iki app için
  yeşil mi (çalıştır, düzeltme).

Her ajan bulgularını dosya:satır referansı veya canlı URL kanıtıyla versin. Kanıtsız iddia kabul etme.

## Aşağıdaki ön tespitler DOĞRULANACAK HİPOTEZLERDİR — doğru varsayma, teyit et veya çürüt

Bunlar bu prompt hazırlanırken yapılan hızlı incelemede çıktı. Her birini bağımsız olarak doğrula;
yanlışsa raporda "çürütüldü" diye işaretle.

**Eksik route'lar (parity)**
1. Canlı sitede `/kampanyalar/{slug}` kampanya detay sayfaları var (sitemap'te ~19 adet). Repoda
   dinamik route yok. `CardListGrid` içindeki kartlar `href="#"` ile render ediliyor ve
   `CardListItem` tipinde link alanı yok — yani kartlar hiçbir yere gitmiyor.
2. Canlı sitede `/blog/{slug}` blog detay sayfaları var (~25 adet). Repoda sadece `/blog` liste
   sayfası var. İlginç nokta: `BlogPosts` collection'ında `slug`, `body` (richText), `seoTitle`,
   `seoDescription` alanları ZATEN VAR — yani içerik CMS'te tutulabiliyor ama sitede gösterilecek
   sayfa yok. Ölü şema.
3. Canlı sitede `/temsilci/{id}` altında **~400 temsilcilik detay sayfası** var. Repoda tek bir
   `/temsilciliklerimiz` sayfası ve statik bir il/ilçe formu var; arkasında veri yok. CMS'te
   temsilcilik collection'ı hiç yok. Bu, envanterdeki en büyük tek boşluk.
4. Canlı `/kampanyalar` sayfası kategori filtresini `?kategori=aninda-bakiye` query param'ı ile
   yapıyor. Repodaki `FilterTabs` bileşeni sadece lokal `useState` tutuyor, hiçbir listeyi
   filtrelemiyor ve `hidden lg:flex` ile mobilde tamamen gizli — dekoratif bir kabuk. Ayrıca
   `Campaigns` collection'ındaki `category` alanı frontend'de hiç kullanılmıyor.

**CMS şema boşlukları**
5. `Campaigns` collection'ında `slug`, detay gövdesi (richText), kampanya koşulları ve SEO alanları
   yok → detay sayfası CMS'ten üretilemez. `startDate`/`endDate` alanları var ama `src/lib/cms.ts`
   sorgusunda kullanılmıyor → süresi dolmuş kampanya sitede kalmaya devam eder.
6. `versions.drafts` sadece 4 collection'da açık (Campaigns, BlogPosts, FaqItems, Announcements).
   FeeRows, LimitTables, NavLinks, ProductHeroes, FeatureCards, StepCards, LegalPages'te yok →
   editör kaydettiği anda canlıya basar, geri alma/onay akışı yok. Ücret ve limit tablosu gibi
   **yasal/finansal** içerikte bu risklidir.
7. `Users` collection'ında `role` select alanı var (admin/publisher/editor/viewer) ama hiçbir
   collection'ın `access` bloğunda kullanılmıyor — sadece `read: () => true` tanımlı. Yani rol ayrımı
   fiilen yok: "Editör" rolündeki bir kullanıcı da her şeyi silebiliyor. Payload'ın default'unu
   ve gerçek etkiyi doğrula.
8. `Media` collection'ında sadece `alt` var; `imageSizes`/responsive türevler, focal point, caption,
   dosya boyutu limiti yok.
9. `LegalPages` collection'ı sadece `title` + `intro` tutuyor. Asıl uzun hukuki metin sayfaların
   içinde hardcoded (ör. `src/app/gizlilik-ve-guvenlik-politikasi/page.tsx` ~246 satır). Hukuk
   ekibi metin güncellemesi istediğinde deploy gerekiyor.
10. Canlı anasayfada CMS'te karşılığı olmayan içerik tipleri var: hero spotlight (slider olabilir),
    tanıtım videosu (`.mp4`), marka logo grid'i (`BrandLogoGrid`/`WhereCanIBuy`), app-download
    Adjust deeplink URL'i.
11. `src/app/cerez-politikasi/cookieRows.ts` — çerez tablosu koda gömülü, CMS'te yok.

**Mimari / risk**
12. Neredeyse her sayfa `const fallback*` ile ikinci bir hardcoded içerik kopyası taşıyor. CMS
    erişilemezse site sessizce ESKİ içeriği gösteriyor, hiçbir uyarı/log yok (`cmsFetch` `catch {}`
    ile hatayı yutuyor). İki source-of-truth problemi + sessiz stale data riski. Bu davranışın
    kasıtlı mı yoksa PoC artığı mı olduğunu değerlendir, prod için ne yapılması gerektiğini öner.
13. `CMS_API_URL` default'u `http://localhost:3010/api` → prod'da env yanlış set edilirse hiçbir
    hata vermeden fallback içeriğe düşer. Fail-loud mu fail-silent mi olmalı, gerekçelendir.
14. `cmsFetch`'te timeout yok, response tip doğrulaması yok (`as T` cast). CMS bozuk JSON dönerse
    veya asılı kalırsa ne olur?
15. Repoda `sitemap.ts`, `robots.ts` yok. Canlı sitede ikisi de var (robots.txt AI training
    bot'larını engelliyor: GPTBot, CCBot, Google-Extended, Applebot-Extended, meta-externalagent,
    ClaudeBot). Bu politikanın klonda replike edilip edilmeyeceğini not et.

## Canlı site envanteri — doğrulanmış ground truth (2026-08-11)

Bunlar canlı siteden bu prompt hazırlanırken doğrudan çekildi, başlangıç noktası olarak kullan
ama sitemap'ten tam listeyi kendin yeniden çıkar.

**Header nav:** Ürünler (dropdown: Vodafone Pay Uygulaması, Vodafone Pay Kart, Faturana Yansıt,
Faturana Yansıt QR, Anında Bakiye), Kampanyalar, Blog, Ücretler ve Limitler, Sıkça Sorulan Sorular

**Footer kolonları:**
- Kurumsal: Temsilciliklerimiz, İletişim, Kurumsal Yönetim, Duyurular, Bilgi Toplum Hizmetleri
  (dış link: e-sirket.mkk.com.tr), LinkedIn ikonu
- Blog highlight (6 link), Kampanya highlight (3 link) — footer'da öne çıkan içerik seçimi var;
  bunun CMS'te "footer'da göster" gibi bir alanla yönetilip yönetilmediğini kontrol et
- Yasal: Site Haritası, Gizlilik ve Güvenlik Politikası, Çerez Politikası (`#cerez-politikasi`
  anchor'lı), Bilgi Güvenliği, Sözleşmeler ve Formlar, Web Sitesi Kullanımı Hüküm ve Şartları,
  Faydalı Bilgiler

**Anasayfa bölümleri (DOM sırası):** app-download banner (Adjust deeplink) → header → hero spotlight
("Vodafone Pay / Ödemenin Akıllı Hali") → "Vodafone Pay'de bizi neler bekliyor?" 5 ürünlü step-phones
(her biri "Keşfet" CTA'lı) → 3'lü özellik grid'i (Akıllı Ödeme Yöntemleri / Harcadıkça Kazandıran /
Size Özel Limit) → Ayrıcalıklar Dünyası görseli + **video** → Kampanyalar carousel (3 kart,
"Detayları gör" → detay sayfası) → SSS accordion (ilk madde bir **duyuru**: "18.08.2026 02:00-08:00
Planlı Altyapı Çalışması" — duyuru ile SSS aynı listede karışıyor, bunu incele) → footer

**Kampanyalar sayfası:** breadcrumb → H1 → filtre tabs (Tümü / Anında Bakiye / Faturana Yansıt /
Kart, `?kategori=` query param) → "Bu ayın favorileri" (3 kart) → "Tüm Kampanyalar" (18 kart) →
sayfaya özel SSS (1 madde) → footer. Her kart tıklanabilir ve detay sayfasına gidiyor.

**Sitemap'ten sayım:** ~19 kampanya detay, ~25+ blog detay, **~400 `/temsilci/{id}`** detay sayfası.
Sitemap URL'leri `/vodafonepay-cms/` namespace'i içeriyor (arka uçta ayrı bir CMS var).

**SEO:** her sayfada ayrı title/description/canonical + OG + Twitter card. Örnek:
`/kampanyalar` → "Nakit İade Kampanyaları | Pay'lilere Özel Fırsatlar | Vodafone Pay".
Repodaki `export const metadata` değerlerini canlıdakilerle birebir karşılaştır.

**Repo mevcut durumu (referans):** 21 route, 28 bileşen dosyası, 13 collection + 1 global (ContactInfo).
CMS'e bağlı sayfalar: 15 route + Header + Footer. Dinamik route: yok. `src/lib/cms.ts` 258 satır.

## Çıktı 1 — `docs/AUDIT-CONTENT-CMS.md`

Şu bölümlerle:

1. **Yönetici özeti** — 10 maddeyi geçmeyen, en kritik bulgular. "Bu haliyle prod'a gidebilir mi?"
   sorusuna net cevap ve gerekçe.
2. **Parity matrisi** — tablo: `Canlı URL | Repo route | Durum (var/eksik/kısmi) | Fark özeti`.
   Tüm canlı sitemap URL'lerini kapsa (detay sayfalarını tip bazında grupla, 400 satır yazma).
3. **İçerik kaynak matrisi** — tablo: `Sayfa | Bölüm | Veri kaynağı (CMS collection / hardcoded /
   ikisi birden) | Dosya:satır | Business ekibi düzenleyebilir mi?`. Bu tablo raporun kalbi;
   eksiksiz olsun.
4. **CMS yeterlilik değerlendirmesi** — her collection için: amaç, eksik alanlar, draft/versiyon
   durumu, access control, admin UX notu. Sonunda "CMS'te hiç karşılığı olmayan içerik tipleri"
   listesi ve önerilen yeni collection şemaları (Payload `CollectionConfig` taslağı olarak).
5. **Yönetilebilirlik/operasyon** — rol modeli, onay akışı, preview, medya yönetimi, seed/migration,
   yedekleme, revalidate zinciri. "İçerik editörü şunu yapmak isterse ne olur?" senaryolarıyla test et:
   (a) yeni kampanya ekleyip yayına alma, (b) süresi dolan kampanyayı kaldırma, (c) ücret tablosunda
   bir rakam düzeltme, (d) yeni blog yazısı yayınlama, (e) footer'a link ekleme, (f) yanlış
   yayınlanan bir içeriği geri alma. Her senaryo için: mümkün mü, kaç adım, teknik ekip gerekiyor mu.
6. **Teknik/SEO/performans bulguları** — A5'in çıktısı.
7. **Riskler** — sessiz fallback, tek kaynak ihlali, yasal içeriğin deploy'a bağlı olması vb.
8. **Kapsam dışı bıraktıklarım** — bakamadığın veya emin olamadığın şeyler. Bunu boş bırakma.

## Çıktı 2 — `docs/BACKLOG-CONTENT-CMS.md`

Her görev şu formatta, **tek başına bir Claude Code oturumuna verilebilecek** netlikte:

```
### [P0-01] Kampanya detay sayfası (/kampanyalar/[slug])
**Neden:** Canlı sitede 19 kampanya detay sayfası var, bizde hiç yok; kampanya kartları tıklanamıyor.
**Kapsam:** Campaigns collection'a slug/body/seo alanları; /kampanyalar/[slug]/page.tsx;
generateStaticParams + generateMetadata; CardListGrid'e href.
**Dokunulacak dosyalar:** cms/src/collections/Campaigns.ts, src/lib/cms.ts, src/app/kampanyalar/...
**Kabul kriteri:** Canlıdaki 3 örnek kampanya detay sayfası ile bölüm bazında eşleşiyor; npm run check yeşil.
**Tahmini efor:** S/M/L
**Bağımlılık:** yok
```

Öncelik tanımı:
- **P0** — parity kırığı veya business ekibinin işini yapmasını engelleyen boşluk
- **P1** — yönetilebilirlik/kalite/SEO iyileştirmesi, prod öncesi kapatılmalı
- **P2** — nice-to-have, sonraya bırakılabilir

Sonda bir "önerilen sıralama" bölümü koy: hangi görev hangisinden önce, neden.

## Kurallar

- **Hiçbir kaynak dosyayı değiştirme.** Sadece `docs/` altına iki yeni dosya yaz.
- Her iddiayı dosya:satır veya canlı URL ile kanıtla. "Muhtemelen", "büyük ihtimalle" yazma —
  emin değilsen "doğrulanamadı" yaz ve nedenini belirt.
- Yukarıdaki 15 hipotezin her birine raporda açıkça "doğrulandı / kısmen / çürütüldü" cevabı ver.
- Türkçe yaz. Kod/dosya adları/teknik terimler İngilizce kalabilir.
- Bitirmeden önce kendi raporunu bir doğrulama ajanına okut: parity matrisindeki route'lar repoda
  gerçekten var/yok mu, collection isimleri doğru mu, dosya:satır referansları tutuyor mu.
````

---

## Prompt sonrası

Rapor geldikten sonra backlog'u kendin gözden geçir, sonra görevleri tek tek ver. Aynı oturumda
birden fazla P0 çalıştırma — refactor ile feature aynı commit'te karışırsa neyin neyi bozduğu
kaybolur. Her görev sonunda `npm run check` yeşil olmalı ve ayrı branch/PR olmalı.
