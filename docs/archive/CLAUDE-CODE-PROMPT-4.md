# Vodafone Pay CMS — Sıralama, SSS ve Blog Editörü Turu

> Bu dosyanın tamamını Claude Code'a tek prompt olarak ver.

---

## 0. Bağlam

`vodafonepaycomtr` monorepo'su:

- **Site:** repo kökü — Next.js 16 App Router + React 19 + Tailwind v4, `localhost:3000`
- **CMS:** `cms/` — Payload CMS 3.x + Postgres + MinIO (S3), admin `localhost:3010/admin`
- **Güncel kod `main` branch'inde, repo kökünde.** `.claude/worktrees/selam-login-disable-temp-725fb7/` **bayat** — oraya bakma. `git log --oneline -5` ile en son commit'i teyit et.

Roller (`cms/src/access/roles.ts`): `NEW_VERTICAL_MAKER` (tam yetki), `NEW_VERTICAL_CHECKER` (create yok), `GROWTH_MAKER` (sadece Campaigns, publish yok), `GROWTH_CHECKER` (sadece Campaigns, onaylar).

Geçmiş: `docs/CMS-USER-TESTS.md` (takip edilen ana geri bildirim dosyası), `docs/STATUS.md`, `docs/RFP-OPEN-ITEMS.md`, önceki tur raporları.

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

## 2. Ön analiz — mevcut durum ve tespitlerim

Önceki tur şunları **zaten** getirdi, sıfırdan yazma — üzerine inşa et:

- `Categories` → `scope` alanı (`campaign` / `faq`), scope'a göre unique slug, `assignNextOrder("categories", ["scope"])`.
- `FaqItems` → `category` artık `relationship` (FAQ scope'una `filterOptions`'la daraltılmış), `showOnHomepage` checkbox'ı, `homepageOrder` alanı, `order` alanı, `defaultSort: "order"`.
- `cms/src/hooks/ordering.ts` → `assignNextOrder()` (create'te `max(order)+1`, scope alanlarına göre).
- `cms/src/hooks/referentialIntegrity.ts` → `REFERENCE_MAP` + `blockDeleteIfReferenced()`, 409 `APIError`, edit linkli hata mesajı.
- `ReorderWidget` → `GroupedReorder` (grup seçme dropdown'ı) + Kaydet/Vazgeç onay adımı.
- `src/lib/cms.ts` → `getCategories(scope)`, `getTranslation("filterTabs.all", …)`.
- `BlogPosts.category` → `relationship`, ama **kampanya scope'una** bağlı.

Aşağıdakileri kodda teyit et, körlemesine uygulama.

### 2.1 `order` alanı formda ölü bir sayı kutusu

`assignNextOrder` **sadece sunucuda, sadece create'te** çalışıyor. Editör formda şunu görüyor: boş bir "Sıra" kutusu ve bir açıklama satırı. Kategori dropdown'ından "Anında Bakiye" seçtiğinde hiçbir şey olmuyor — o kategoride kaç soru olduğunu, sıranın kaç olacağını kaydedene kadar bilmiyor. Kullanıcının istediği tam olarak bu geri bildirim.

Aynısı `homepageOrder` için de geçerli: "Anasayfada listele"yi işaretlediğinde, anasayfada hâlihazırda kaç soru olduğunu ve bunun kaçıncı sırada olacağını görmüyor.

`min: 1` alanda tanımlı ama **iki şeyi ayrı ayrı doğrula:** (a) Payload'ın `min`'i REST/GraphQL üzerinden gelen bir `order: -5` isteğini sunucu tarafında gerçekten reddediyor mu, yoksa sadece number input'un spinner'ını mı sınırlıyor; (b) `assignNextOrder`'ın `data.order > 0` guard'ı 0 ve negatifi "atanmamış" sayıp üzerine yazıyor mu, yoksa negatif değer olduğu gibi mi kaydediliyor.

### 2.2 SSS listesinin sıralaması: iki istek çelişiyor

Önceki turda `FaqItems.defaultSort: "order"` yapıldı ("order'a göre listelensin"). Şimdiki istek: *"sık sorulan sorular kısmındaki liste en son create edilene göre orderlansın."*

Bunlar aynı liste için farklı iki kural. Tutarlı okuma şu — **uygulamadan önce teyit et:**

- **Admin liste görünümü** (editörün çalışma listesi): en son oluşturulan üstte → `defaultSort: "-createdAt"`. Editör yeni eklediğini aramak zorunda kalmasın.
- **Site render'ı** (ziyaretçinin gördüğü sıra): `order` alanına göre → `getFaqItems` zaten `sort=order` kullanıyor, değişmesin.

Yani `order` "sitede nasıl görünsün" için, `createdAt` "admin panelinde ne zaman eklendi" için. `createdAt` Payload'da zaten otomatik tutuluyor — yeni kolon gerekmez, sadece `defaultColumns`'a ekleyip `defaultSort`'u değiştirmek yeterli. Bunu doğrula.

### 2.3 `ReorderWidget` verinin tamamını çekiyor ve sessizce kesiyor

```ts
fetch(`/api/${collection}?depth=1&limit=200&sort=order`, …)
```

Tüm dokümanlar tek seferde çekilip **istemcide** gruplanıyor. Üç sonucu var:

1. **Sessiz kesilme.** 200'den fazla SSS olduğunda fazlası hiç gelmiyor — sürükle-bırak eksik bir liste üzerinde çalışıyor ve kaydettiğinde görünmeyen kayıtların sırasını bozabilir. Hiçbir uyarı yok.
2. Kullanıcının istediği davranış değil: dropdown'dan kategori seçildiği anda **o kategorinin** kayıtlarının DB'den çekilmesi isteniyor.
3. `groups.filter(([, , items]) => items.length >= 2)` — içinde tek kayıt olan kategori dropdown'da hiç görünmüyor. Sürüklenecek bir şey olmasa da kategorinin orada olması ve "bu kategoride 1 kayıt var" demesi daha dürüst.

Ayrıca dropdown yalnızca `groups.length > 1` iken render ediliyor; tek kategori varsa doğrudan liste açılıyor. Tutarlılık için karar ver.

### 2.4 Kategori silme koruması SSS'i zaten kapsıyor — ama doğrulanmadı

`REFERENCE_MAP.categories` içinde `{ collection: "faq-items", path: "category", blocking: true }` satırı **var**. Yani kodda koruma mevcut. Kullanıcı hâlâ istiyorsa ya (a) bu tur henüz deploy edilmemiş, ya (b) 409 hatası admin UI'da okunabilir şekilde **gösterilmiyor** (konsola düşüyor veya jenerik "silinemedi" toast'ı çıkıyor).

Bunu tahmin etme — admin panelinde bir SSS kategorisini fiilen silmeye çalış, ekranda ne çıktığını gör. Hata mesajı Payload'ın toast'ında satır satır ve edit linkleriyle görünmüyorsa asıl iş orada.

### 2.5 Blog kategorileri kampanya taksonomisine bağlı

`BlogPosts.category` → `filterOptions: () => ({ scope: { equals: CATEGORY_SCOPES.CAMPAIGN } })`. Yani blog, kampanyalarla **aynı** kategori listesini paylaşıyor. Koddaki yorum bunu "canlı site de öyle" diye gerekçelendiriyor, ama kullanıcı bunun tesadüf olduğunu düşünüyor ve blogun kendi yönetilebilir kategori listesini istiyor.

### 2.6 Blog gövdesi tüm biçimlendirmeyi kaybediyor — asıl büyük iş

`src/lib/cms.ts` → `richTextToParagraphs()` bir **düz metin düzleştiricisi**: lexical ağacındaki her bloğun metin parçalarını birleştirip `string[]` döndürüyor. `src/app/blog/[slug]/page.tsx` bunu alıp hepsini aynı `<p className="text-base text-gray-700">` içine basıyor.

Sonuç: başlıklar, kalın/italik, renkli metin, linkler, listeler, **tablolar**, gövde içi görseller — hepsi siliniyor. Kullanıcının canlı `vodafonepay.com.tr/blog/...` sayfasında gördüğü tablo, kırmızı vurgulu başlıklar ve linkler bu mimariyle **imkânsız**.

İki ayrı eksik var:
1. **Editör tarafı:** `cms/payload.config.ts` → `editor: lexicalEditor()` — hiçbir özellik konfigürasyonu yok, yani varsayılan feature seti. Tablo ve metin rengi varsayılanda yok.
2. **Render tarafı:** düzleştirici yerine gerçek bir lexical→React render'ı gerekiyor.

Aynı düzleştirici `Campaigns.body`/`terms` için de kullanılıyor (`src/app/kampanyalar/[slug]/page.tsx`) ve `[...slug]` sayfa-builder'ındaki `richText` bloğunda da aynı sorun olabilir — tek yerde çözüp hepsine uygula.

Fontlar zaten doğru: `src/app/layout.tsx` Vodafone Regular/Light/Bold'u `localFont` ile yüklüyor ve `globals.css` bunları `--font-sans`/`--font-bold`/`--font-light` olarak bağlıyor. Yani font uyuşmazlığı font dosyasından değil, gövdedeki her şeyin `<p>`'ye indirgenmesinden kaynaklanıyor — başlık `<h2>` olamayınca başlık fontunu/boyutunu da alamıyor.

---

## 3. Yapılacak işler

### 3.1 `order` ve `homepageOrder` alanlarına canlı geri bildirim

Kullanıcının isteği: *"kategori seçildiği an en uygun id'yi vermeli, kaç tane varsa onu da göstermeli, kullanıcı isterse 1000 girer ama 0/-1/-2 giremesin."*

- `FaqItems`'ın `order` alanı için custom bir admin field bileşeni yaz. Bu bileşen:
  - Formdaki `category` alanının **anlık** değerini izlesin (Payload'ın `useField`/`useFormFields` hook'ları — form state'i, kaydedilmiş doküman değil).
  - Kategori değiştiği anda o kategorideki kayıt sayısını ve en yüksek `order`'ı çeksin, `order` alanını `max+1` ile **önceden doldursun**.
  - Yardımcı metin göstersin: "Bu kategoride N soru var — bu soru varsayılan olarak N+1. sıraya eklenecek."
  - Editör elle değer girerse ona dokunmasın (kullanıcı 1000 yazabilmeli). Ama editör hiç dokunmadan kategoriyi değiştirirse öneri güncellensin.
- Aynısını `homepageOrder` için yap: "Anasayfada listele" işaretlendiğinde "Anasayfada şu an N soru var — bu N+1. olacak" desin.
- **0 ve negatif engellensin:** hem istemcide (input `min`, anlık hata mesajı) hem **sunucuda** (`validate` fonksiyonu — `min: 1`'in REST üzerinden gerçekten koruduğunu doğrula, korumuyorsa açık bir `validate` yaz). Boş bırakmak geçerli kalsın (otomatik sona ekleme).
- Sunucudaki `assignNextOrder` mevcut davranışını koru — bu bileşen onun yerine geçmiyor, onu görünür kılıyor. İkisinin aynı sonucu ürettiğini doğrula (bileşen N+1 önerip sunucu farklı bir şey yazarsa bu tek başına bir bug).
- Yarış durumu: iki editör aynı anda aynı kategoriye soru eklerse ikisi de aynı `order`'ı alır. Bunun kabul edilebilir olup olmadığına karar ver, değilse çöz, kararı raporda yaz.
- Bu desen `order` alanı olan diğer koleksiyonlarda da işe yarar (`FeatureCards`, `StepCards`, `NavLinks`, `Categories`, …). Bileşeni tek bir yerde jenerik yaz ve mümkün olduğunca çok koleksiyona bağla — SSS'e özel tek kullanımlık bir şey yapma.

### 3.2 SSS admin listesi: oluşturulma tarihi

- §2.2'deki ayrımı uygula: **admin listesi** en son oluşturulana göre (`defaultSort: "-createdAt"`), **site** `order`'a göre.
- `createdAt`'i `defaultColumns`'a ekle ve okunabilir biçimde göster.
- Payload'ın otomatik `createdAt`'inin yeterli olduğunu doğrula — ayrı bir kolon eklemen gerekmemeli. Gerekiyorsa nedenini yaz.
- Bu değişiklik önceki turdaki "order'a göre listelensin" kararını **geçersiz kılıyor** — `docs/CMS-USER-TESTS.md`'deki ilgili maddeye not düş ki gelecekte biri geri almasın.
- `order` alanı hâlâ liste kolonu olarak görünsün (editör sırayı görebilmeli), sadece varsayılan sıralama değişsin.
- Aynı mantığın diğer koleksiyonlar için de geçerli olup olmadığını değerlendir; SSS dışına genişletiyorsan gerekçelendir.

### 3.3 `ReorderWidget`: kategoriye göre sunucudan çek

- Dropdown'dan bir grup (SSS'te kategori, Categories'te akış) seçildiği **anda** o grubun kayıtlarını sunucudan çek — hepsini önden çekip istemcide gruplama.
- Grup listesinin kendisi de sunucudan gelsin (SSS için: FAQ scope'undaki kategoriler + her birinin kayıt sayısı). Dropdown'da sayı görünsün: "Anında Bakiye (7)".
- İçinde 0 veya 1 kayıt olan kategori de dropdown'da görünsün; seçildiğinde sürüklenecek bir şey olmadığını açıkça söylesin.
- **`limit=200` sessiz kesilmesini bitir:** ya sayfalama yap, ya toplam sayıyı kontrol edip aşıldığında görünür bir uyarı ver. Sessizce eksik liste üzerinde sıralama kaydetmek kabul edilemez.
- Mevcut Kaydet/Vazgeç onay adımını ve önizlemeyi koru.
- Kısmi kaydetme hatası (bazı PATCH'ler başarısız) hâlâ görünür şekilde raporlanıyor mu doğrula.
- SSS'te sürükle-bırak sonucunun **canlı sitede** gerçekten değiştiğini teyit et. `faq-items` `versions.drafts` kullanıyor — `?draft=true` olmadan atılan PATCH yayındaki kaydı mı taslağı mı güncelliyor, fiilen test et. Taslağa gidiyorsa sıralama sitede hiç değişmiyor demektir.

### 3.4 Kategori silme korumasını uçtan uca doğrula

- Admin panelinde bir SSS kategorisini, altında SSS varken silmeye çalış. Beklenen: silme engellenir ve ekranda **hangi SSS'lerin** engellediği, edit linkleriyle görünür.
- Görünmüyorsa Payload'ın delete akışının 409 `APIError` mesajını nasıl gösterdiğini incele ve mesajın kullanıcıya ulaşmasını sağla. Çok satırlı mesaj toast'ta kırpılıyorsa modal/liste gibi uygun bir sunum seç.
- Aynı testi liste görünümünün toplu silme (bulk delete) yolundan da yap — tekil edit sayfasından farklı bir kod yolu.
- Aynı testi kampanya kategorisi ve medya için de tekrarla (aynı guard, farklı `REFERENCE_MAP` satırları).
- Bu davranış için, sadece unit test değil, gerçek akışı kapsayan bir test yaz.

### 3.5 Blog'a kendi kategori akışı

- `CATEGORY_SCOPES`'a üçüncü bir değer ekle (`blog`). `Categories.scope` select'ine "Blog" seçeneğini ekle — bu bir Postgres enum değişikliği, gereken `ALTER TYPE` DDL'ini raporda ver.
- `BlogPosts.category.filterOptions` blog scope'una baksın.
- `src/app/blog/page.tsx` → `getCategories("blog")`.
- **Veri migrasyonu:** mevcut blog yazıları kampanya scope'undaki kategorilere bağlı. Blog scope'unda karşılıklarını oluşturup yazıları taşımak mı, yoksa mevcut bağları bırakıp yeni yazılardan itibaren blog scope'u kullanmak mı — karar ver, gerekçelendir, uygula. `blog_posts` tablosunun gerçekten boş olup olmadığını **DB'den kontrol et** (kod yorumu "verified EMPTY" diyor ama o bir önceki turun tespiti).
- `REFERENCE_MAP.categories` blog satırı zaten var — scope değişince hâlâ doğru çalıştığını doğrula.
- `ReorderWidget` Categories'te `groupField: "scope"` ile bağlı; üçüncü akış dropdown'da çıkmalı.
- Kullanıcı `/blog` için şunu net söyledi: **anasayfada blog gösterilmeyecek.** Yani blog'a `showOnHomepage` benzeri bir şey ekleme. "Tümü"de tüm kartlar, kategori seçilince o kategori — mevcut davranış bu, doğrula.
- `/blog` şu an `usedSlugs` ile boş kategorileri gizliyor. SSS'te bu filtre kaldırıldı (boş kategoriler de sekme oluyor). İki sayfa arasında tutarlılık kur — hangisini seçersen seç gerekçelendir.

### 3.6 Gerçek blog içerik editörü ve render'ı — bu turun en büyük işi

**Önce canlı siteye bak.** `https://www.vodafonepay.com.tr/blog` ve en az iki blog detay sayfasını (örn. `/blog/ulasim-karti-bakiye-yukleme-yollari-vodafone-pay`) tarayıcıyla aç ve **fiilen incele**. Şunları çıkar: hangi başlık seviyeleri kullanılıyor, hangi tipografi (boyut/ağırlık/renk/satır aralığı), tablolar nasıl görünüyor (kenarlık, başlık satırı, zebra, mobilde davranış), kırmızı vurgulu metin nerede ve nasıl, linkler nasıl stillenmiş, gövde içi görseller var mı, tarih ve kategori nerede duruyor, sayfanın üstündeki blog kartı/hero nasıl. Ekran görüntüsü al ve karşılaştırma yaparak ilerle — tahminle değil.

**Editör tarafı (`cms/payload.config.ts`):**
- `lexicalEditor()`'ı açık bir feature listesiyle konfigüre et. Gereken en az: başlıklar (h2/h3/h4 — h1 sayfa başlığı, gövdede olmamalı), kalın/italik/altı çizili, sıralı/sırasız liste, link (iç/dış), **tablo**, alıntı, yatay çizgi, gövde içi görsel (Media'dan upload).
- **Metin rengi** (kırmızı vurgu) Payload'ın varsayılan lexical feature setinde yok. Seçeneklerini araştır: özel bir lexical feature mi, yoksa daha kontrollü bir yaklaşım mı — örneğin "Vurgu" adında bir inline stil/mark. Serbest renk seçici vermek marka tutarlılığını bozar; Vodafone kırmızısı gibi sınırlı bir palet daha doğru olabilir. Kararını gerekçelendir.
- Tablo feature'ının bu Payload sürümünde deneysel/kararlı durumunu kontrol et ve riski raporda yaz.
- Editör alanındaki yeni feature'lar Türkçe etiketlerle gelsin (Payload'ın `tr` çevirisi kapsamıyorsa nasıl çözdüğünü yaz).

**Render tarafı:**
- `richTextToParagraphs()`'i gerçek bir lexical→React render'ıyla değiştir. `@payloadcms/richtext-lexical` (v3, kurulu) kendi React render bileşenini sağlıyor — **önce onu değerlendir**, elle JSX üreteci yazmadan önce. Kendi renderer'ını yazacaksan nedenini gerekçelendir.
- Bilinmeyen/desteklenmeyen node tipinde çökmesin — sessizce atlasın ve geliştirme ortamında uyarsın.
- **Güvenlik:** render edilen HTML editör girdisinden geliyor. `dangerouslySetInnerHTML` kullanacaksan sanitizasyon şart; lexical node'larından JSX üretmek daha güvenli — hangisini seçersen seç riski değerlendir ve yaz.
- Site tarafında bu içeriğe uygulanacak tipografi stillerini tek bir yerde tanımla (Tailwind utility'lerle, canlı siteyle eşleşen ölçülerde). Blog, kampanya `body`/`terms` ve `[...slug]` sayfa-builder'ının `richText` bloğu **aynı** stil kaynağını kullansın — üç ayrı kopya olmasın.
- Tablolar dar ekranda yatay scroll'la erişilebilir olsun (masaüstünde taşmasın, mobilde kesilmesin).
- Gövde içi görseller için `next/image` ve `next.config.ts`'teki MinIO `remotePatterns` kurulumuna dikkat et (`unoptimized: true` mevcut, nedeni dosyadaki yorumda).
- **Blog detay sayfasının düzenini canlı siteyle hizala:** blog kartı/hero, oluşturulma (veya yayın) tarihi, kategori, gövde. Şu an sayfa `excerpt`'i gövdenin üstünde ayrı bir paragraf olarak basıyor — canlı sitede öyle mi, kontrol et.
- Kampanya detay sayfasını da aynı render'a geçir; tek bir düzleştirici kalmasın.

**Migrasyon riski:** mevcut kayıtlı `body` içerikleri düz metin olarak lexical'de duruyor. Yeni render bunları bozmamalı — mevcut bir blog/kampanya içeriğini render edip önce/sonra karşılaştır.

---

## 4. Çalışma şekli

1. **Keşif:** §2'deki bulguları kodda ve canlı DB'de teyit et. Canlı `vodafonepay.com.tr` blog sayfalarını tarayıcıyla incele. Katılmadığın yeri gerekçesiyle söyle.
2. **Plan:** §3'ü bağımlılıklarına göre sırala ve bana onaylat. §2.2 (sıralama çelişkisi), §3.5 (blog scope migrasyonu) ve §3.6 (renderer + metin rengi yaklaşımı) için kararını **uygulamadan önce** anlat.
3. **Uygulama:** mantıksal gruplu, her biri tek başına derlenebilen commit'ler. §3.6 tek başına birkaç commit'lik bir iş — editör konfigürasyonu, renderer, tipografi, sayfa düzeni ayrı ayrı.
4. **Doğrulama:** `npm run check` hem kökte hem `cms/`'te. Yeni mantık için test.
5. **Kendi kendini doğrula — "kod doğru görünüyor" yeterli değil.** Fiilen dene:
   - Yeni SSS formunda kategori değiştir → sıra önerisi ve sayaç anında güncelleniyor.
   - `order: 0` ve `order: -1`'i hem formdan hem doğrudan API'den göndermeyi dene → ikisi de reddediliyor.
   - Yeni SSS oluştur → admin listesinde en üstte.
   - Reorder dropdown'ından kategori seç → sadece o kategori DB'den geliyor, sayı doğru.
   - Sürükle → Kaydet → **canlı sitede** sıra değişmiş.
   - Altında SSS olan kategoriyi sil → engelleniyor ve hangi SSS'ler olduğu ekranda görünüyor.
   - Blog scope'unda kategori oluştur → `/blog` sekmelerinde çıkıyor, `/kampanyalar`'da çıkmıyor.
   - Tablo, kırmızı başlık, link ve liste içeren bir blog yazısı yaz → `/blog/<slug>` canlı sitedeki gibi render ediliyor. Ekran görüntüsüyle karşılaştır.

---

## 5. İstenen çıktı

1. `docs/CMS-USER-TESTS.md`'ye bu turun maddelerini dosyanın mevcut formatında ekle (`### N.M`, `> alıntı`, **Durum**, **DoD**, **Nasıl fixlendi**, **Test edildi mi**, **Yorumlarım:** boş) ve "İlerleme Özeti" tablosunu güncelle. §2.2'deki karar önceki bir maddeyi geçersiz kılıyor — o maddeye de not düş.
2. `docs/` altına bu turun Türkçe raporunu yaz:
   - Madde madde ne yapıldı, hangi dosyalar değişti, neden o yaklaşım.
   - §2.2 / §3.5 / §3.6'da verilen tasarım kararları ve elenen alternatifler — özellikle renderer seçimi ve metin rengi yaklaşımı.
   - Canlı `vodafonepay.com.tr` blog sayfasıyla yapılan karşılaştırmanın bulguları: neyi birebir eşledin, neyi kasten farklı bıraktın.
   - Manuel uygulanması gereken SQL (yeni enum değeri, kolon, index, veri düzeltmesi) — kopyala-yapıştır çalışır halde.
   - Bilinçli yapılmayanlar, açık riskler, teknik borç.
