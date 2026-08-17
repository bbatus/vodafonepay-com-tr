# Vodafone Pay CMS — Kategori & SSS Turu

> Bu dosyanın tamamını Claude Code'a tek prompt olarak ver.

---

## 0. Bağlam

`vodafonepaycomtr` monorepo'su:

- **Site:** repo kökü — Next.js 16 App Router + React 19 + Tailwind v4, `localhost:3000`
- **CMS:** `cms/` — Payload CMS 3.x + Postgres + MinIO (S3), admin `localhost:3010/admin`
- **Güncel kod `main` branch'inde, repo kökünde.** `.claude/worktrees/selam-login-disable-temp-725fb7/` **bayat** — orada çalışma, oradaki dosyalara bakıp karar verme. Önce `git log --oneline -5` ile en son commit'i teyit et.

Roller (`cms/src/access/roles.ts`): `NEW_VERTICAL_MAKER` (tam yetki), `NEW_VERTICAL_CHECKER` (create yok), `GROWTH_MAKER` (sadece Campaigns, publish yok), `GROWTH_CHECKER` (sadece Campaigns, onaylar).

Geçmiş: `docs/CMS-USER-TESTS.md` (kullanıcı geri bildirim geçmişi — takip edilen ana dosya), `docs/STATUS.md`, `docs/RFP-OPEN-ITEMS.md`, önceki tur raporları.

---

## 1. Uyman gereken repo kuralları (AGENTS.md — pazarlık yok)

1. **`payload generate:importmap` bozuk** (`ERR_REQUIRE_ASYNC_MODULE`). Yeni/silinen custom admin bileşenini `cms/src/app/(payload)/admin/importMap.js` içine **elle** ekle/çıkar. importMap'te olmayan bileşen sessizce render edilmez, hata da vermez.
2. **`payload migrate:create` de bozuk** (R-10). Yeni DB kolonu/index'i için `docs/`'ta belgelenen "host Postgres'e karşı `next dev`" workaround'unu kullan; hangi DDL'in manuel uygulanması gerektiğini raporda **çalıştırılabilir SQL olarak** yaz.
3. Her custom admin bileşeni UI metinlerini `useAdminLocale()` + `useDbStrings()` (client) veya `loadDbStrings()` (server) üzerinden basar. Yeni metinler `cms/src/lib/translationDefaults.ts`'e eklenir. Hardcode TR/EN yok.
4. Koleksiyon isimleri/grupları `cms/src/lib/collectionLabels.ts`'teki `dbLabel()` üzerinden gelir.
5. TypeScript strict, `any` yok. Site tarafında Tailwind utility, inline style yok. CMS tarafında yeni inline style ekleme — `cms/src/styles/custom.css` kullan.
6. Bitirmeden: `npm run check` hem kökte hem `cms/` içinde temiz geçsin. Yeni hook/transform/access mantığı için Vitest testi yaz.
7. Next.js 16 bu modelin eğitim verisinden farklı; emin olmadığın API için `node_modules/next/dist/docs/` altındaki rehberi oku.

---

## 2. Ön analiz — benim tespitlerim

Kategori/scope ayrımının **kodu zaten yazılmış** (`cms/src/collections/Categories.ts` → `CATEGORY_SCOPES`, `scope` alanı, `indexes: [{ fields: ["scope","slug"], unique: true }]`, scope'a göre filtreleyen `generateSlug`; `FaqItems.category` artık `filterOptions` ile FAQ scope'una daraltılmış bir `relationship`). Yani tasarım doğru yerde. Sorun **kod ile veritabanının/verinin uyuşmaması** ve bu ayrımın **site tarafına yarım yansımış** olması.

Aşağıdakileri kodda ve **canlı DB'de** teyit et — körlemesine uygulama.

### 2.1 `aninda-bakiye-2` neden oluştu

Kullanıcı haklı: iki farklı akıştaki (Kampanya / SSS) kategoriler asla aynı URL'de sorgulanmıyor, dolayısıyla aynı slug'ı taşıyabilmeliler. Kod bunu zaten destekliyor. Muhtemel sebepler, sırayla ele:

1. **Bayat Postgres index'i.** `slug` alanı daha önce `unique: true` idi; Payload bunu `categories.slug` üzerinde tek kolonluk bir UNIQUE index olarak yaratmıştı. Config'ten `unique: true`'yu kaldırmak **mevcut index'i düşürmez** — hele `migrate:create` bozukken şema drizzle push ile ilerlerken. `\d categories` / `pg_indexes` ile **gerçek index listesine bak**. Tek kolonluk unique index hâlâ duruyorsa `generateSlug` scope'a göre "çakışma yok" dese bile DB insert'i patlar ya da önceki denemede `-2`'ye düşmüştür.
2. **Bayat veri.** `-2` kaydı scope-aware düzeltme inmeden önce yaratılmış olabilir. Bu durumda kodda yapacak bir şey yok, **veriyi** düzeltmek gerekiyor.
3. **`data.scope` beforeValidate'te boş olabilir.** `generateSlug` `where: { and: [{ slug ... }, { scope: { equals: data.scope } }] }` kuruyor. Payload `defaultValue`'ları bu hook'a göre hangi sırada uyguluyor — `scope` gelen payload'da yoksa `data.scope` `undefined` olur ve where clause anlamsızlaşır. Bunu fiilen test et (scope göndermeden create) ve `undefined` ihtimalini savun (scope'u normalize et veya scope yoksa hata ver).

**Yapılacak:** üç ihtimali de kapat, `-2` kaydını temizle (aşağıda §2.2'deki canlı bug yüzünden bu şart), ve "aynı slug iki farklı scope'ta yaşayabilir" durumunu doğrulayan bir test yaz.

### 2.2 `-2` yüzünden şu an CANLI bir bug var

`src/app/aninda-bakiye/page.tsx` → `getFaqItems("aninda-bakiye")`. `getFaqItems` (`src/lib/cms.ts`) şöyle sorguluyor:

```
/faq-items?depth=1&limit=200&sort=order&where[category.slug][equals]=aninda-bakiye
```

**Scope filtresi yok.** SSS akışındaki "Anında Bakiye" kategorisinin slug'ı `aninda-bakiye-2` olduğu için, o kategoriye bağlı SSS'ler bu sorguya **düşmüyor** — Anında Bakiye ürün sayfasının SSS bloğu boş kalıyor (ya da yanlışlıkla kampanya scope'undaki kategoriyi eşleştiriyor). Aynı risk `getFaqItems("<slug>")` çağıran her ürün sayfasında var: `vodafone-pay-kart`, `vodafone-pay-uygulama`, `faturana-yansit`, `qr-ile-faturana-yansit`, `kampanyalar`, ve `[...slug]` sayfa-builder'ındaki `faqList` bloğu.

Ayrıca `getCategories()` de scope'suz:

```ts
export async function getCategories(): Promise<CmsCategory[] | null> {
  const data = await cmsFetch("/categories?depth=0&limit=100&sort=order", ...);
}
```

`/kampanyalar` bu listeyi doğrudan `FilterTabs`'a veriyor → **kampanya filtre sekmelerinde SSS kategorileri de çıkıyor**. `/sikca-sorulan-sorular` ise `usedSlugs` filtresiyle kazara bundan kurtuluyor ama slug çakışırsa orada da sızar.

**Yapılacak:** `getFaqItems` ve `getCategories`'i scope-farkında yap (`getCategories(scope)` ya da `getCampaignCategories()`/`getFaqCategories()`). Her çağıran sayfayı gözden geçir. Bunun bir regresyon testi olsun.

### 2.3 Boş kategoriler SSS sayfasında sekme üretmiyor

`src/app/sikca-sorulan-sorular/page.tsx`:

```ts
const usedSlugs = new Set(items.map((i) => i.category).filter(Boolean));
const categories = (cmsCategories ?? []).filter((c) => usedSlugs.has(c.slug)) ...
```

Yani "altında en az bir SSS olan" kategoriler sekme oluyor. Kullanıcı bunun tersini istiyor: **kişi kaç kategori tanımlarsa hepsi sekme olarak açılsın**, altında henüz soru olmasa bile. Boş sekmeye tıklandığında ne görüneceğine karar ver (boş durum mesajı — sessiz boşluk değil).

### 2.4 "Tümü" sekmesi hardcoded ve sıralanamıyor

`src/components/FilterTabs.tsx`:

```ts
const tabs = [{ label: "Tümü", slug: ALL_FILTER }, ...categories];
```

"Tümü" kod içinde sabit bir Türkçe string. Kullanıcı bunun **CMS'ten yeniden adlandırılabilir** olmasını, ama **her zaman ilk sırada çakılı** kalmasını ve silinememesini istiyor. Ayrıca `FilterTabs` üç ayrı sayfada kullanılıyor (`/kampanyalar`, `/blog`, `/sikca-sorulan-sorular`) — "Tümü" etiketi akış başına ayrı mı yönetilecek, tek mi, karar ver.

### 2.5 Sürükle-bırak anında kaydediyor, onay yok

`cms/src/components/ReorderWidget.tsx` → `handleDrop` bırakma anında `PATCH /api/<collection>/<id>` atıyor. Ara adım, önizleme, geri alma yok.

Ek olarak **doğrulanması gereken kritik bir şey var:** `faq-items` (ve `campaigns`, `nav-links` vb.) `versions.drafts` kullanıyor. Drafts açık bir koleksiyonda `?draft=true` olmadan atılan bir PATCH'in yayındaki kaydı mı yoksa yeni bir taslağı mı güncellediğini **fiilen test et**. Kullanıcının isteği net: onay verildikten sonra **canlı sitede sıra değişmeli**. Şu an taslağa yazılıyorsa sürükle-bırak sitede hiçbir şey değiştirmiyor demektir — bu tek başına bir bug.

### 2.6 Anasayfa SSS'i kategoriye bağlı

`src/app/page.tsx` → `getFaqItems("anasayfa")`. Yani "anasayfada göster" bugün bir **kategori** ile ifade ediliyor. Bu, bir sorunun hem "Anında Bakiye" kategorisinde olup hem anasayfada görünmesini imkânsız kılıyor — kullanıcının istediği tam olarak bu esneklik.

---

## 3. Yapılacak işler

### 3.1 Kategori scope ayrımını uçtan uca tamamla

- §2.1'deki üç ihtimali kapat: gerçek Postgres index'lerini denetle, bayat tek-kolonluk unique index varsa düşür (DDL'i raporda ver), `generateSlug`'daki `data.scope` boşluk ihtimalini savun.
- Mevcut `aninda-bakiye-2` (ve varsa benzeri `-N` sonekli) kayıtları temizle. **Dikkat:** `FaqItems.category` bir relationship (ID ile bağlı), yani slug'ı düzeltmek bağlantıyı bozmaz — ama slug'ı sorgulayan site kodu (`getFaqItems("...")`) etkilenir. Önce §3.2'yi yap, sonra veriyi düzelt, ikisini birlikte doğrula.
- Kampanya kategorisi ile SSS kategorisi **aynı slug'ı taşıyabilmeli**. Bunu test et: iki scope'ta da "Anında Bakiye" oluştur, ikisinin de slug'ı `aninda-bakiye` olsun, çakışma hatası olmasın.
- Aynı scope içinde gerçekten çakışma olursa (`Kart` iki kez) `-2` soneki doğru davranış — bunu koru ve testle.
- Silme koruması (`blockDeleteIfReferenced`) scope'a göre doğru sayıyor mu kontrol et: bir SSS kategorisini silmeye çalışırken hata mesajı SSS'leri saymalı, kampanyaları değil.

### 3.2 Site tarafını scope-farkında yap

- `src/lib/cms.ts` → `getCategories()`'i scope parametreli hale getir. Şema ve tipler de scope taşısın.
- `getFaqItems(slug)` sorgusuna FAQ scope kısıtı ekle — bir kampanya kategorisiyle aynı slug'a sahip SSS kategorisi karışmasın.
- `/kampanyalar` ve `/blog` sadece `campaign` scope'undaki kategorileri sekme yapsın; `/sikca-sorulan-sorular` sadece `faq` scope'unu.
- `getFaqItems("<slug>")` çağıran **her** sayfayı tek tek aç ve SSS bloğunun gerçekten dolduğunu doğrula: `aninda-bakiye`, `vodafone-pay-kart`, `vodafone-pay-uygulama`, `faturana-yansit`, `qr-ile-faturana-yansit`, `kampanyalar`, ve `[...slug]`'daki `faqList` bloğu.
- Bu sayfalardaki kategori slug'ları koda gömülü (`getFaqItems("aninda-bakiye")`). Kullanıcı CMS'ten o kategoriyi silerse/yeniden adlandırırsa sayfa sessizce boşalır. Bunu ya dayanıklı hale getir ya da en azından belgelendir + CMS tarafında o kategorilerin silinmesini engelle. Kararını gerekçelendir.

### 3.3 SSS'e "Anasayfada listele" seçeneği

- `FaqItems`'a `showOnHomepage` (checkbox) alanı ekle, açıklaması net olsun: "İşaretlenirse bu soru, kendi kategorisine ek olarak anasayfadaki SSS bloğunda da görünür."
- `src/lib/cms.ts`'e bunu okuyan bir getter ekle; `src/app/page.tsx` artık `getFaqItems("anasayfa")` yerine bunu kullansın.
- Anasayfada kaç soru gösterileceğine ve sıralamasına karar ver (`order` alanı kategori bazlı atanıyor — anasayfa listesi birden çok kategoriden soru toplayacağı için sıralama karışabilir). Anasayfa için ayrı bir sıra alanı mı gerekiyor, yoksa `order` + kategori sırası kombinasyonu mu yeter — karar ver ve gerekçelendir.
- **Mevcut "Anasayfa" kategorisi ne olacak?** Ya bırakılıp `showOnHomepage` ile birlikte yaşayacak (iki mekanizma = kafa karışıklığı), ya migrate edilip kaldırılacak. Bir seçim yap, gerekçelendir, ve seçtiğin yolun veri migrasyonunu (mevcut "Anasayfa" kategorisindeki sorulara `showOnHomepage: true` atamak gibi) uygula.
- Admin liste görünümünde bu alan bir kolon olsun ve filtrelenebilsin.

### 3.4 SSS sayfası: tüm kategoriler sekme olsun, "Tümü" her şeyi göstersin

- §2.3'teki `usedSlugs` filtresini kaldır — `faq` scope'undaki **her** kategori sekme olsun, altında soru olmasa bile.
- Boş kategori sekmesine tıklandığında anlamlı bir boş durum göster ("Bu kategoride henüz soru yok").
- "Tümü" sekmesi tanımlı **tüm** SSS'leri listelesin. Bunu fiilen doğrula: CMS'te toplam kaç yayınlanmış SSS varsa, "Tümü" altında o kadarı görünmeli. Kategorisi silinmiş/boş kalmış (`category: null`) kayıtların "Tümü"den düşmediğinden emin ol — `getFaqItems`'ın zod şeması `category`'yi `nullable()` kabul ediyor, bu kayıtlar hiçbir kategori sekmesine düşmez ama "Tümü"de görünmeli.
- `limit=200` yeterli mi kontrol et; SSS sayısı büyürse sessizce kesilmesin.

### 3.5 Kategori sırası ve çakılı "Tümü"

- Kategorilerin sırası CMS'ten (sürükle-bırak + `order`) yönetilebilsin ve **site sekmelerine birebir yansısın**. `getCategories` zaten `sort=order` ile çekiyor — uçtan uca doğrula: CMS'te "Kart"ı 2. sıraya al, `/kampanyalar` sekmelerinde 2. sırada göründüğünü gör.
- `ReorderWidget` Categories'te `groupField: "scope"` ile bağlı — iki akışın sırası birbirinden bağımsız olmalı. Doğrula.
- **"Tümü" sekmesi:**
  - Her zaman **1. sırada** olsun, sürüklenerek yerinden oynatılamasın.
  - **Silinemesin.**
  - Ama **adı değiştirilebilsin** (TR ve EN ayrı ayrı).
  - Uygulama şeklini sen seç ve gerekçelendir. İki makul yol var: (a) `Translations` koleksiyonunda akış başına bir anahtar (`filterTabs.all.campaign`, `filterTabs.all.faq`) — yanlışlıkla silinmesi/sıralanması imkânsız, mevcut `dbLabel`/`useDbStrings` altyapısıyla uyumlu; (b) rezerve slug'lı özel bir Category kaydı — sürükle-bırakta ve silmede özel-durum kodu gerektirir. (a) daha temiz görünüyor ama sen değerlendir.
  - `FilterTabs` üç sayfada kullanılıyor — akış başına ayrı etiket mi tek etiket mi, karar ver.

### 3.6 Sürükle-bırak: önizleme + onay adımı

`ReorderWidget`'ın bırakma anında kaydeden davranışını değiştir:

- Sürükleme bittiğinde **hemen kaydetme**. Yeni sıralamayı önizleme olarak göster: "Yeni sıralama şu şekilde olacak" + numaralı liste (eski sıra → yeni sıra farkı görünür olsun).
- Evet / Hayır onayı iste. "Hayır"da liste eski haline dönsün, hiçbir PATCH atılmasın.
- "Evet"te kaydet ve **canlı sitede sıranın gerçekten değiştiğini** doğrula — §2.5'teki drafts sorusunu burada çöz. Kayıt taslağa gidiyorsa yayına da uygulanması gerekiyor; bunu mevcut maker/checker onay akışıyla nasıl bağdaştıracağını düşün (bir Checker'ın sıralaması doğrudan yayına gidebilir, bir Maker'ınki onaya düşmeli olabilir — mevcut `denyMakerPublish` mantığıyla çelişme).
- Birden fazla öğe arka arkaya sürüklenirse her seferinde onay sormak yorucu olur — birden çok değişikliği biriktirip tek onayla kaydetmeyi değerlendir ("Kaydet" / "Vazgeç" butonları). Hangisini seçersen seç gerekçelendir.
- Kaydetme sırasında ve sonrasında durum geri bildirimi net olsun (kaydediliyor / kaydedildi / hata). Şu an `handleDrop` içindeki `Promise.all` bazı PATCH'ler başarısız olursa **sessizce** kısmi kaydediyor — `.ok` kontrolü yok. Bunu düzelt: kısmi başarısızlıkta kullanıcıya söyle ve mümkünse geri al.
- Tüm yeni metinler `translationDefaults.ts`'e.

### 3.7 Admin tarafı kullanılabilirlik

- Categories liste görünümünde "Akış" kolonu var ama iki akış iç içe listeleniyor — kullanıcı ekran çıktısında kampanya ve SSS kategorilerini karışık görüyor. Media'daki "Tümü / Görseller / Videolar" sekmeleri deseninde, Categories listesine de **akışa göre sekme/filtre** ekle (`MediaFilterTabs.tsx`'i örnek al, mantığı ortaklaştırabiliyorsan ortaklaştır).
- Yeni kategori oluştururken "Akış" seçiminin ne işe yaradığı formda net olsun; yanlış akış seçmek sessiz bir hataya yol açıyor (kategori hiçbir yerde görünmüyor).
- Yeni eklediğin her ekran/tabloyu 375px, 768px ve 1280px'te fiilen aç ve bak.

---

## 4. Çalışma şekli

1. **Keşif:** §2'deki bulguları kodda **ve canlı DB'de** teyit et (`pg_indexes`, gerçek kategori satırları). Katılmadığın yeri gerekçesiyle söyle.
2. **Plan:** §3'ü bağımlılıklarına göre sırala ve bana onaylat. §3.3 (Anasayfa kategorisinin akıbeti), §3.5 ("Tümü" nasıl saklanacak) ve §3.6 (drafts + onay akışı) için kararını **uygulamadan önce** anlat.
3. **Uygulama:** mantıksal gruplu, her biri tek başına derlenebilen commit'ler.
4. **Doğrulama:** `npm run check` hem kökte hem `cms/`'te. Yeni mantık için test.
5. **Kendi kendini doğrula — "kod doğru görünüyor" yeterli değil.** CMS'i ve siteyi ayağa kaldır ve fiilen dene:
   - İki scope'ta aynı isimde kategori oluştur → ikisinin de slug'ı sonektsiz.
   - Boş bir SSS kategorisi oluştur → `/sikca-sorulan-sorular`'da sekmesi çıkıyor.
   - Bir SSS'i "Anasayfada listele" yap → `/` anasayfada görünüyor, kendi kategorisinde de duruyor.
   - CMS'te kategori sırasını değiştir → onay ver → sitedeki sekme sırası değişiyor.
   - Sürükle-bırakta "Hayır" de → hiçbir şey değişmiyor.
   - `getFaqItems("<slug>")` çağıran 6 sayfanın hepsinde SSS bloğu dolu.

---

## 5. İstenen çıktı

1. `docs/CMS-USER-TESTS.md`'ye bu turun maddelerini dosyanın mevcut formatında ekle (`### N.M`, her biri için `> alıntı`, **Durum**, **DoD**, **Nasıl fixlendi**, **Test edildi mi**, **Yorumlarım:** boş) ve "İlerleme Özeti" tablosunu güncelle. Kullanıcının takip ettiği dosya bu — formatı bozma.
2. `docs/` altına bu turun Türkçe raporunu yaz:
   - Madde madde ne yapıldı, hangi dosyalar değişti, neden o yaklaşım.
   - `aninda-bakiye-2`'nin **gerçek** kök nedeni (bayat index mi, bayat veri mi, `data.scope` boşluğu mu) — hangisi olduğunu kanıtıyla yaz.
   - §3.3 / §3.5 / §3.6'da verilen tasarım kararları ve elenen alternatifler.
   - Manuel uygulanması gereken SQL (index düşürme, veri düzeltme, yeni kolon) — kopyala-yapıştır çalışır halde.
   - Bilinçli yapılmayanlar, açık riskler, teknik borç.
