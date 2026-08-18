# Vodafone Pay CMS — Video Render, Kategori Filtresi, Reorder Feedback, CSV, Order Validation, Fiyat/Limit ve Anasayfa Turu

> Bu dosyanın tamamını Claude Code'a tek prompt olarak ver.

---

## 0. Bağlam

`vodafonepaycomtr` monorepo'su:

- **Site:** repo kökü — Next.js 16 App Router + React 19 + Tailwind v4, `localhost:3000`
- **CMS:** `cms/` — Payload CMS 3.x + Postgres + MinIO (S3), admin `localhost:3010/admin`
- **Güncel kod `main` branch'inde, repo kökünde.** `.claude/worktrees/selam-login-disable-temp-725fb7/` **bayat** — oraya bakma (o branch zaten merge edildi, `main` ondan ileride). `git log --oneline -5` ile en son commit'i teyit et.

Roller (`cms/src/access/roles.ts`): `NEW_VERTICAL_MAKER` (tam yetki), `NEW_VERTICAL_CHECKER` (create yok), `GROWTH_MAKER` (sadece Campaigns, publish yok), `GROWTH_CHECKER` (sadece Campaigns, onaylar).

Geçmiş: `docs/CMS-USER-TESTS.md` (takip edilen ana geri bildirim dosyası — **formatını bozmadan** ekle, değiştirme), `docs/STATUS.md`, `docs/RFP-OPEN-ITEMS.md`, önceki tur raporları (`docs/DUZELTME-TURU-RAPORU.md` ve sonrakiler).

---

## 1. Uyman gereken repo kuralları (AGENTS.md — pazarlık yok)

1. **`payload generate:importmap` bozuk** (`ERR_REQUIRE_ASYNC_MODULE`). Yeni/silinen custom admin bileşenini `cms/src/app/(payload)/admin/importMap.js` içine **elle** ekle/çıkar. importMap'te olmayan bileşen sessizce render edilmez, hata da vermez.
2. **`payload migrate:create` de bozuk** (R-10). Yeni kolon/index için belgelenen "host Postgres'e karşı `next dev`" workaround'unu kullan; gereken DDL'i raporda **çalıştırılabilir SQL** olarak ver.
3. Her custom admin bileşeni UI metinlerini `useAdminLocale()` + `useDbStrings()` (client) / `loadDbStrings()` (server) üzerinden basar. Yeni metinler `cms/src/lib/translationDefaults.ts`'e. Hardcode TR/EN yok.
4. Koleksiyon isimleri/grupları `cms/src/lib/collectionLabels.ts` → `dbLabel()` üzerinden gelir.
5. TypeScript strict, `any` yok. Site tarafında Tailwind utility, inline style yok. CMS tarafında yeni inline style ekleme — `cms/src/styles/custom.css` kullan.
6. Bitirmeden `npm run check` hem kökte hem `cms/` içinde temiz geçsin. Yeni hook/transform/access mantığı için Vitest testi yaz.
7. Next.js 16 bu modelin eğitim verisinden farklı; emin olmadığın API için `node_modules/next/dist/docs/` altındaki rehberi oku.
8. Yeni npm paketi eklemekten kaçın; zorundaysan bilinen açığı olmadığını doğrula (sıfır-bilinen-açık politikası).

---

## 2. Ön analiz — bu turda ben zaten kodu okuyup teyit ettim

Aşağıdakiler **kod okuyarak doğrulanmış tespitler**, tahmin değil. Her maddede tam dosya yolu ve satır/işlev referansı var — sıfırdan araştırma, üzerine inşa et. İki madde de var ki "zaten yapılmış, dokunma" diyorum — onlara da güven, tekrar test etme diye kod yazma.

### 2.1 ZATEN TAMAM — dokunma: blog render, fiyat/limit renk kodlaması

Önceki turların isteklerinden ikisi **kodda tam** ama kullanıcı hâlâ eksik zannediyor çünkü test ettiği ortamda veri/CMS içeriği farklı görünüyor olabilir:

- `src/app/blog/[slug]/page.tsx` → `RichText` bileşenini (`src/components/RichText.tsx`) kullanıyor, eski `richTextToParagraphs()` flattener'ı **kullanmıyor**. Blog yazıcısının tablo/başlık/renk desteği zaten bu sayfaya bağlı.
- `src/components/PricesAndLimits.tsx` → Limitler tablosunun "Periyot" sütunu `text-[#008a00]` (yeşil), "Kimlik doğrulama yapılmış" sütunu `bg-[#e60000] text-white` (kırmızı pill), header `bg-[#f2f2f2]`, satırlar `#fafafa`/`#fff` alterne — canlı sitenin computed style'larından **birebir** alınmış (kod içi yorumda bu açıkça yazıyor). Kullanıcının gönderdiği 3-4 numaralı ekran görüntülerindeki "renksiz" hâl, muhtemelen bu component'in yayınlanmadığı/deploy edilmediği bir an ya da tarayıcı cache'i — **kodu tekrar yazma**, `git log -p -- src/components/PricesAndLimits.tsx` ile bu değişikliğin gerçekten `main`'de olduğunu doğrula ve `npm run dev` ile canlı halini tekrar ekran görüntüsü al, kullanıcıya "kod zaten böyle, şu commit'te" diye raporla.

Gerçek, kodda hâlâ doğrulanan sorun: `LimitTables.rows.period` alanı düz `text` (`cms/src/collections/LimitTables.ts`, `rows` array field, `period` = `{ type: "text", required: true }`). Bu, editörün "Günlük" yazması gerekirken "1" gibi anlamsız bir değer girebilmesine izin veriyor — kullanıcının gördüğü "1" hücresi büyük olasılıkla bir veri girişi hatası, render hatası değil. **Bunu düzelt:** `period` alanını serbest metinden `select` alanına çevir, sabit seçenekler ver (`Günlük`, `Aylık`, `Tek Seferlik` gibi — mevcut canlı sitedeki periyot etiketlerini birebir tarayarak çıkar, tahmin etme), böylece bir daha rastgele sayı girilemesin. Var olan satırlardaki hatalı "1" değerini de düzelt (migration/data-fix olarak).

### 2.2 Video, rich-text upload converter'ında link olarak render ediliyor — kanıtlı

`node_modules/@payloadcms/richtext-lexical/dist/features/converters/lexicalToJSX/converter/converters/upload.js`, paketin **varsayılan** `UploadJSXConverter`'ı:

```js
if (!uploadDoc.mimeType.startsWith('image')) {
  return /*#__PURE__*/_jsx("a", { href: url, rel: "noopener noreferrer", children: uploadDoc.filename });
}
```

Yani mimeType `image/*` değilse (örn. `video/mp4`) **her zaman** düz bir `<a href>{dosya adı}</a>` linki üretiyor. `Media` koleksiyonu (`cms/src/collections/Media.ts`) `upload.mimeTypes: ["image/*","video/*"]` ile video yüklemeyi zaten meşru bir tip olarak destekliyor, yani bu senaryo gerçek bir kullanım.

`src/components/RichText.tsx`'teki override bunu çözmüyor:

```tsx
upload: (args) => {
  const rendered = (defaultConverters.upload as (a: typeof args) => ReactNode)(args);
  if (!rendered) return null;
  const width = (args.node.fields as { width?: string } | undefined)?.width;
  const widthClass = UPLOAD_WIDTH_CLASSES[width ?? "large"] ?? UPLOAD_WIDTH_CLASSES.large;
  return <span className={cn("mb-4 block", widthClass)}>{rendered}</span>;
},
```

— `defaultConverters.upload`'ı çağırıp sonucu sarmalıyor, mimeType'a göre hiç dallanmıyor. **Düzelt:** `args.node.value` (upload node'un populated hali, `depth>=1`'de obje; `{ mimeType, url, filename, alt, width, height }` alanlarını taşıyor — bkz. paketin kendi `UploadJSXConverter` kaynağı) tipini kontrol et; `typeof value === "object" && value.mimeType?.startsWith("video/")` ise `defaultConverters.upload`'ı çağırmadan doğrudan:

```tsx
<video
  className={cn("mb-4 block h-auto w-full rounded-md", widthClass)}
  src={value.url}
  controls
  playsInline
  preload="metadata"
/>
```

gibi inline bir `<video>` döndür (otomatik oynatma/loop homepage'deki `feature-loop.mp4` gibi sessiz bir arka plan videosu değil, editörün blog/kampanya içeriğine gömdüğü bir video olduğu için `controls` ile — kullanıcı "youtube olmasa bile inline oynayacak, başlatılabilecek" dedi, otomatik+sessiz+loop olması şart değil, ama karar senin: otomatik oynatma istersen `autoPlay muted loop` ekle, ikisi de kabul edilebilir, hangisini seçtiğini raporda söyle). Image dalı aynen kalsın.

`uploadDoc` populate edilmemişse (id string olarak geldiyse, `depth: 0`) mimeType'a erişilemez — bu durumda var olan `defaultConverters.upload` davranışına düş (link), ama bunun ne zaman olabileceğini (RichText'in çağrıldığı her yerde `depth` kaç?) kontrol et ve raporda not et.

### 2.3 Categories admin liste tablosu scope'a göre filtrelenemiyor — hazır bir örnek pattern var

`cms/src/collections/Categories.ts`'in `admin.components.beforeList`'inde `ReorderWidget` zaten `groupField: "scope"` ile grup bazlı çalışıyor, ama **liste tablosunun kendisi** (üstteki Payload doküman listesi, sürükle-bırak widget'ının değil) kampanya/blog scope'lu kategorilerle FAQ scope'lu kategorileri karışık gösteriyor — kullanıcının şikayeti bu.

Hazır pattern: `cms/src/components/MediaFilterTabs.tsx` — `Media` koleksiyonunda `Tümü / Görseller / Videolar` sekmelerini `useListQuery()`'nin `handleWhereChange`/`query.where` çifti üzerinden `mediaType` alanına göre filtreliyor, `beforeList`'e `"/components/MediaFilterTabs#default"` olarak eklenmiş (bkz. `cms/src/collections/Media.ts` satır ~34-36).

**Yap:** Aynı pattern'i birebir kopyala — `CategoryScopeFilterTabs.tsx` (veya benzer isim), `Tümü / Kampanyalar ve Blog / Sıkça Sorulan Sorular` sekmeleri, `scope` alanına göre `handleWhereChange`. `Categories.ts`'in `beforeList`'ine `ReorderWidget`'tan **önce** ekle (kullanıcı önce filtreleyip sonra sıralamalı). `importMap.js`'e kaydet, `translationDefaults.ts`'e TR/EN etiketlerini ekle (`MediaFilterTabs` neyi kullanıyorsa aynı `t("...")` yaklaşımı).

### 2.4 ReorderWidget: kaydet başarılı ama buton/geri bildirim yanlış — kök sebep kesin

`cms/src/components/ReorderWidget.tsx`'in üst seviye veri-çekme `useEffect`'i şu bağımlılıklarla çalışıyor: `[canReorder, collection, strings.loadError]`. `handleSave()`'in başarı yolu sadece `onSaved()` (parent'ta `router.refresh()`) çağırıyor — ama `router.refresh()` bu üç bağımlılığın **hiçbirini** değiştirmiyor, dolayısıyla `useEffect` yeniden çalışmıyor, `initialDocs` hiç güncellenmiyor, `dirty` (`docs.some((doc,i)=>doc.id!==initialDocs[i]?.id)`) hep `true` kalıyor ve Kaydet/Vazgeç butonları kaybolmuyor. DB güncellemesi gerçekten başarılı (`.ok`-checked `Promise.all` PATCH'ler) — sadece UI state senkron değil. Ayrıca başarı/hata durumunda hiçbir toast/mesaj yok.

**Düzelt:**
1. Başarılı save sonrası `initialDocs`'u (ve `docs`'u) **doğrudan** kaydedilen sıraya set et (server'a tekrar gitmeden — zaten elindeki `docs` state'i doğru sıra), böylece `dirty` hemen `false` olur ve butonlar kaybolur, `router.refresh()`'e bağlı kalma.
2. Başarı için "Kaydedildi" (TR) / "Saved" (EN) şeklinde kısa bir toast/inline mesaj (2-3 sn görünüp kaybolan bir banner yeterli, yeni bir toast kütüphanesi ekleme — var olan bir UI pattern'i kullan ya da basit bir `useState` + `setTimeout` ile local mesaj göster).
3. Herhangi bir PATCH `.ok` değilse mevcut `dirty` state korunmalı (kullanıcı kaybolmuş değişikliği tekrar kaydedebilsin) ve "Kaydedilemedi, tekrar deneyin" mesajı gösterilmeli — şu an başarısız PATCH'lerde ne olduğunu kodda teyit et, sessizce yutuluyorsa düzelt.

### 2.5 Categories ve BlogPosts için CSV export yok

`cms/src/lib/csv.ts` (`csvEscape`, `buildCsv`, `downloadCsv`, `formatDateTr`, `richTextToPlainText`) ve `CsvExportButton.tsx` zaten generic. `CampaignsExportButton.tsx` tam kullanılabilir bir şablon: `depth: 1` fetch, TR/EN `HEADER`/`LABELS` map'leri, `richTextToPlainText` ile body/terms flatten.

**Yap:** `CategoriesExportButton.tsx` (label, scope, slug, order, oluşturulma/güncellenme) ve `BlogPostsExportButton.tsx` (title, slug, category, status, seoTitle/seoDescription, body — flatten edilmiş, createdBy, created/updated) — `CampaignsExportButton.tsx` ile aynı yapı, aynı BOM+`;` CSV formatı. `beforeList`'e ekle, `importMap.js`'e kaydet.

### 2.6 Sıra (order) alanı: sadece 0/negatif değil, **duplicate** değer de reddedilmeli — kanıtlı gap

`cms/src/hooks/ordering.ts`'teki `assignNextOrder`:

```ts
if (operation !== "create") return data;
if (typeof data.order === "number" && data.order > 0) return data;
```

İki kesin gap var:
1. **Update'te hiçbir kontrol yok** — `operation !== "create"` ise hook direkt `data`'yı döndürüyor. Bir kaydı düzenlerken `order`'ı manuel olarak var olan başka bir kaydın değeriyle çakışacak şekilde değiştirebilirsin, hiç engellenmiyor.
2. **Create'te de, açıkça pozitif bir sayı girildiyse, o sayı başka bir kayıtta zaten kullanılıyor olsa bile hiç kontrol edilmeden kabul ediliyor** — kullanıcının tam olarak şikayet ettiği senaryo: "1 2 3 doluysa kullanıcı 1 yaparsa hata almalı."

**Yap:** `assignNextOrder`'ı genişlet (veya yanına ayrı bir `beforeValidate`/`beforeChange` hook ekle — `rejectDuplicateOrder(collection, scopeFields)` gibi) ve **hem create hem update'te**, açıkça girilen bir `order` değeri scope içinde (kendi id'si hariç) zaten kullanılıyorsa Payload `ValidationError` fırlat (bilingual mesaj: "Bu sıra numarası zaten kullanılıyor: <label/id>. Farklı bir sayı seçin." / "This order number is already in use..."). 0 ve negatif değerler için de aynı `ValidationError` yolu kullanılsın — şu an create'te sessizce "1"e çevriliyor, update'te ise hiç kontrol yok; ikisinde de kullanıcı **hata almalı**, sessiz düzeltme olmamalı (kullanıcının notu: "0 -1 -2 girememesini sağlamalıyız", örtük atama değil, engelleme istiyor).

Bunu `assignNextOrder` çağrılan **her** koleksiyonda uygula — şu an şu koleksiyonlarda `order` alanı var: `Announcements`, `FaqItems`, `FeeRows`, `ContentBlocks`, `LimitTables`, `FeatureCards`, `Categories`, `StepCards`, `NavLinks` (`grep -rl "name: \"order\"" cms/src/collections/` ile teyit ettim). Hepsinde `assignNextOrder(...)` zaten `hooks.beforeChange`'de çağrılıyor, yeni validasyonu oraya ekleyince hepsi otomatik kapsanır.

### 2.7 Canlı sıra önerisi (`LiveOrderField`) sadece FaqItems'ta — genişletilmeli

`cms/src/components/LiveOrderField.tsx` şu an **sadece** `FaqItems.ts`'in `order`/`homepageOrder` alanlarına bağlı. 2.6'da listelenen diğer 8 koleksiyonun (Announcements, FeeRows, ContentBlocks, LimitTables, FeatureCards, Categories, StepCards, NavLinks) hiçbirinde yok — kullanıcının "her yeni eklenen şey için sıra önerisi olmalı, sadece SSS değil" isteği bunun tam karşılığı.

**Yap:** `LiveOrderField`'i her koleksiyonun `order` alanına tak. `watchPath`/`mode` parametreleri koleksiyona göre değişir:
- Scope'suz olanlar (`FeeRows`, `LimitTables` — `assignNextOrder(collection)` çağrısında `scopeFields` boş) için `watchPath` gerekmez, direkt "şu an N kayıt var, önerilen: N+1" göster.
- Scope'lu olanlar (`Categories` → `scope`; `NavLinks` → muhtemelen `section`; `StepCards`/`FeatureCards`/`ContentBlocks` → `page` — her birinin gerçek scope alanını `assignNextOrder(...)` çağrısındaki `scopeFields` argümanından oku, tahmin etme) için `watchPath`/`mode` FaqItems'takiyle aynı mantıkla ayarlanır.

`LiveOrderField`'in kendi kod yorumundaki "concurrent-editor race condition çözülmedi" notu geçerliliğini koruyor — bunu her yeni koleksiyonda da aynı şekilde dokümante et, çözmeye çalışma (kapsam dışı).

### 2.8 `StickyQr` — canlı sitede bu sayfalarda YOK, muhtemelen kaldırılmalı

`src/components/StickyQr.tsx`:

```tsx
<div className="fixed left-0 top-1/2 z-[1000] hidden -translate-y-1/2 xl:block">
  <Image src="/images/sticky-qr.png" ... />
</div>
```

24 sayfada kullanılıyor (`grep -rl "StickyQr" src` — `ucretler-ve-limitler`, `blog`, `kampanyalar`, `sikca-sorulan-sorular` dahil çoğu iç sayfa), **homepage'de (`src/app/page.tsx`) hiç kullanılmıyor.**

Canlı `vodafonepay.com.tr/ucretler-ve-limitler` ve `vodafonepay.com.tr/` sayfalarını tarayıcıdan kontrol ettim (ekran görüntüsü + sol kenar zoom) — **hiçbirinde böyle sabit/sol-ortalanmış bir QR widget'ı yok.** Yani bu component canlı sitenin bir parçası değil; kullanıcının "footerdan taşıyor, responsive değil, her sayfadan fırlıyor" şikayeti muhtemelen doğru ama düzeltilecek bir "canlı siteyle eşleştirme" hedefi yok — çünkü canlıda karşılığı yok.

Kesin teknik sorunlar (canlıda olsun olmasın, kod olarak da hatalı): `fixed` + `top-1/2 -translate-y-1/2` viewport'a göre **her zaman düşey ortada** durur, sayfa içeriği kısa olduğunda (örn. seed verisi az olan `ucretler-ve-limitler`) bu, viewport ortasında kalan footer'ın üzerine biner — `z-[1000]` her şeyin üstünde. `xl:block` ile sadece büyük ekranlarda görünüyor ama o aralıkta da genişlik/konum sabit, hiç responsive değişken yok.

**Karar senden bekleniyor — kullanıcıya sor ya da en azından raporda net söyle, körlemesine seçme:**
- **Seçenek A (önerim):** Bu component'i tüm iç sayfalardan kaldır — canlı sitede yok, "bozuk bir şeyi düzeltmek" yerine "olmayan bir şeyi kaldırmak" doğru yaklaşım.
- **Seçenek B:** Component'i tut ama düzelt — `fixed` yerine sayfa içeriğine göre pozisyonlanan (`sticky` veya footer'dan önce `absolute` ile durdurulan), footer'la çakışmayan bir versiyon yap.

Ben A'yı öneriyorum ama bu bir ürün kararı, sen (Claude Code) `docs/CMS-USER-TESTS.md`'ye not düşüp kullanıcıdan onay ister gibi raporda açık şekilde belirt, hangisini uyguladığını gerekçeyle yaz.

### 2.9 Homepage video: kod zaten var, veri eksikliği ihtimali yüksek

`src/components/FeatureHighlights.tsx` **zaten** inline, otomatik oynayan bir video içeriyor:

```tsx
{features.length === 0 ? null : (...
  <video className="h-[340px] w-full object-cover" src="/videos/feature-loop.mp4" autoPlay muted loop playsInline />
...)}
```

`public/videos/feature-loop.mp4` dosyası da diskte mevcut. Component `features.length === 0` olduğunda **tüm section'ı** (video dahil) `null` döndürüyor — yani video kaybolmuşsa muhtemel sebep, `getContentBlocks("anasayfa-highlights")` (`src/app/page.tsx` satır ~31) CMS'te şu an boş dönüyor, kod regresyonu değil.

**Yap:**
1. CMS admin'de `anasayfa-highlights` slug'lı content block'un dolu olup olmadığını kontrol et (`ContentBlocks` koleksiyonu). Boşsa, en az 1 satır seed'le ki section (ve video) görünsün.
2. Canlı `vodafonepay.com.tr` anasayfasını tarayıcıdan uçtan uca gez (ben bu turda scroll ederek baktım: Hero → "Vodafone Pay'de bizi neler bekliyor" → Uygulama tanıtımı → Faturana Yansıt → QR ile Faturana Yansıt bölümleri gördüm) ve mevcut `src/app/page.tsx`'teki bölüm listesiyle (`AppDownloadBanner, Header, Hero, StepPhones, FeatureHighlights, Campaigns, Faq, Footer`) karşılaştır — canlıda gördüğün ama kodda karşılığını bulamadığın bir bölüm varsa (örn. "Faturana Yansıt" tanıtım bloğu, "QR ile Faturana Yansıt" bloğu gibi ürün-özellik anlatım kartları) listele ve hangisinin CMS-driven bir content block'a mı yoksa yeni bir component'e mi ihtiyaç duyduğunu belirt. **Var olan homepage'i bozmadan, sadece eksik olanı ekle** — kullanıcı bunu özellikle istedi.
3. Bu karşılaştırmayı raporda ekran görüntüsü + madde madde eşleştirme tablosuyla belgele (hangi canlı bölüm hangi component'e karşılık geliyor / hangisi eksik).

---

## 3. Beklenen çalışma sırası

1. §2.1'i doğrula (kod zaten doğru, sadece raporla), `period` alanını select'e çevir.
2. §2.2 video converter fix.
3. §2.3 Categories scope filtre sekmeleri.
4. §2.4 ReorderWidget save-feedback fix.
5. §2.5 CSV export butonları (Categories, BlogPosts).
6. §2.6 duplicate-order validasyonu (tüm 9 koleksiyon) + §2.7 LiveOrderField genişletme (8 koleksiyon) — bunlar aynı hook'a dokunduğu için birlikte yapılsın, ikisi de test edilsin.
7. §2.8 StickyQr kararı + uygulama.
8. §2.9 homepage canlı karşılaştırması + eksik bulunanların eklenmesi.

Her adımda `npm run check` (kök + `cms/`) temiz geçsin. Yeni/değişen hook mantığı (özellikle §2.6 duplicate-order) için Vitest testi yaz.

---

## 4. İstenen çıktı

1. `docs/CMS-USER-TESTS.md`'ye bu turun maddelerini dosyanın mevcut formatında ekle (`### N.M`, `> alıntı`, **Durum**, **DoD**, **Nasıl fixlendi**, **Test edildi mi**, **Yorumlarım:** boş) ve "İlerleme Özeti" tablosunu güncelle. §2.1'deki "zaten tamamdı" bulgularını da ayrı bir madde olarak ekle (durum: "Zaten tamamlanmış, bu turda doğrulandı").
2. `docs/` altına bu turun Türkçe raporunu yaz:
   - Madde madde ne yapıldı, hangi dosyalar değişti, neden o yaklaşım.
   - §2.8'de verilen A/B kararı ve hangisini seçtiğin, gerekçeyle.
   - §2.9'daki canlı-anasayfa karşılaştırmasının tam bulgu listesi (ekran görüntüleriyle).
   - Manuel uygulanması gereken SQL (yeni select alanı, `period` veri düzeltmesi, varsa yeni kolon/index) — kopyala-yapıştır çalışır halde.
   - Bilinçli yapılmayanlar, açık riskler, teknik borç (özellikle §2.7'nin concurrent-editor kısıtı ve §2.4'ün toast implementasyonu için hangi UI pattern'i seçtiğin).
