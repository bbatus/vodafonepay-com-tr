# Rich Text + Sıra Turu Raporu (17.08.2026)

Bu tur, `docs/CLAUDE-CODE-PROMPT-4.md`'deki geri bildirimlerin (§2.1 sıra alanı canlı geri bildirim, §2.2 admin sıralama çakışması, §3.3 sürükle-bırak sunucu-taraflı, §3.4 kategori silme koruması doğrulaması, §3.5 blog kategori scope ayrımı, §3.6 rich text editörü) ve oturum sırasında gelen ek blog geri bildiriminin (slug otomasyonu, kart taşması, excerpt netliği) uygulanmasını kapsar. Karşılık gelen `docs/CMS-USER-TESTS.md` girdileri: Bölüm 7 (7.1–7.9).

## 1. Değişen dosyalar ve neden

| Dosya | Ne değişti | Neden |
|---|---|---|
| `cms/src/components/LiveOrderField.tsx` (yeni) | `order`/`homepageOrder` için canlı "N kayıt var, önerilen: M" + "M kullan" butonu | §2.1 — editör grubu seçtiği an sırayı görsün, ama otomatik doldurma `assignNextOrder`'ın "elle mi yazıldı" kontrolünü bozmasın diye sadece tıklamayla dolduruluyor |
| `cms/src/collections/FaqItems.ts` | `order`/`homepageOrder`'a `LiveOrderField` bağlandı; `defaultSort: "-createdAt"` | §2.1, §2.2 |
| `cms/src/components/ReorderWidget.tsx` | `groupsFrom` prop'u + `ServerGroupedReorder` | §3.3 — dropdown artık sunucudan gerçek kategori listesi + sayaç çekiyor, 200 kaydı çekip client'ta gruplamıyor |
| `cms/payload.config.ts` | `editor: lexicalEditor({ features: [...] })` — başlık/liste/link/tablo/görsel/`TextStateFeature` | §3.6 — editör gerçek biçimlendirme araçlarına sahip oldu |
| `src/components/RichText.tsx` (yeni) | `@payloadcms/richtext-lexical/react`'in `RichText`'i + özelleştirilmiş converter'lar | §3.6 — tek renderer, 3 kullanım noktası (blog/kampanya/sayfa bloğu) |
| `src/app/globals.css` | `.lexical-table-container` için `overflow-x:auto` | §3.6 — tablo dar ekranda sayfayı genişletmesin |
| `src/lib/cms.ts` | `richTextToParagraphs()` silindi | Artık kullanılmıyor, `RichText` bileşeni onun yerini aldı |
| `src/app/blog/[slug]/page.tsx`, `kampanyalar/[slug]/page.tsx`, `[...slug]/page.tsx` | `richTextToParagraphs` → `<RichText />` | §3.6 |
| `cms/src/collections/BlogPosts.ts` | `generateSlug` hook, `slug` readOnly; `excerpt`'e `maxLength:200` + açıklama; `coverImage`'a oran açıklaması; `body` label "İçerik" | §7.5 (scope), §7.7 (slug), §7.8 (excerpt/kart) |
| `src/components/CardListGrid.tsx` | Açıklama paragrafına `line-clamp-3` | §7.8 |
| `cms/src/lib/translationDefaults.ts` | `liveOrder.*` anahtarları | §2.1 |
| `cms/src/app/(payload)/admin/importMap.js` | `LiveOrderField` elle eklendi | Bkz. §4 — `generate:importmap` bu ortamda kırık |
| `package.json` (kök) | `@payloadcms/richtext-lexical@3.87.0` bağımlılığı + `overrides.undici` | §3.6 renderer'ı; Trivy'nin bulduğu HIGH'ı (undici) düzeltmek için |

## 2. Onaylanan kararlar ve reddedilen alternatifler

### 2.1 — Rich text renderer seçimi
**Onaylanan:** `@payloadcms/richtext-lexical`'ın kendi `RichText` React bileşeni (`/react` alt-yolu) + özel `JSXConvertersFunction`.

**Değerlendirilen alternatif — sıfırdan kendi renderer'ımızı yazmak:** Reddedildi. Lexical'ın JSON şeması (node tipleri, `format` bit alanları, `textState`'in `"$"` node-state anahtarı gibi iç detaylar) resmi olarak dokümante edilmiyor ve versiyonlar arası değişebiliyor; kendi renderer'ımız her editör güncellemesinde kırılma riski taşırdı. Paketin kendi renderer'ı tam olarak aynı sürümün ürettiği JSON'u okuyacağı garantili.

**Kabul edilen risk:** `@payloadcms/richtext-lexical`'ı kök `package.json`'a eklemek, paketin `package.json`'ındaki peer dependency'leri (`payload`, `@payloadcms/next`, `@payloadcms/ui`) `npm install` sırasında ağaca çekiyor — bunlar CMS admin'e özgü, halka açık site için anlamsız paketler (`monaco-editor` dahil). Doğrulandı: gerçekte kullandığımız `/react` alt-yolunun import grafiği (17 dosya) bu paketlerden hiçbirini içermiyor, yani gerçek site bundle'ı şişmiyor — ama `npm install` seviyesinde hâlâ `node_modules`'a giriyorlar ve Trivy'nin bağımlılık taramasında görünüyorlar (bkz. §4).

### 2.2 — "Vurgu" (renkli vurgu) implementasyonu
**Onaylanan:** Sabit tek renk — `TextStateFeature({ state: { color: { vurgu: { css: { color: "#e60000" }, label: "Vurgu" } } } })`. Editör serbest renk seçemiyor, sadece "Vurgu" işaretleyip işaretini kaldırabiliyor.

**Değerlendirilen alternatif — serbest renk paleti:** Reddedildi. Canlı sitede tutarlı biçimde tek bir vurgu rengi (marka kırmızısı) kullanılıyor, rastgele renkler yok; serbest seçici editörlerin marka dışı renkler üretmesine kapı açardı.

**Risk notu:** `TextStateFeature` paketin kendi JSDoc'unda `@experimental` (API'de kırılma olabilir) olarak işaretli — kabul edilen, dokümante edilmiş bir risk.

### 2.3 — Tablo desteği
Paketin sunduğu TEK tablo implementasyonu literal olarak `EXPERIMENTAL_TableFeature` adını taşıyor. Alternatif yok (üçüncü parti bir tablo eklentisi araştırılmadı — kapsam dışı bırakıldı). Kabul edilen risk olarak not ediliyor.

### 2.4 — Admin sıralama (§2.2, 5.5 ile çakışma)
**Onaylanan (kullanıcının önerdiği ayrım):** Admin listesi `-createdAt` (yeni kayıt en üstte), site `order` (5.5'teki gibi, değişmedi). Bu 5.5'i iptal etmiyor, sadece "sırala" kelimesinin admin ve site için farklı anlamlara geldiğini netleştiriyor.

## 3. Canlı site karşılaştırması bulguları

`vodafonepay.com.tr/blog/ulasim-karti-bakiye-yukleme-yollari-vodafone-pay` üzerinde ölçülen:
- `h2`: `font-size: 20px`, `font-weight: 400` (kalın DEĞİL), `color: #333`, `margin-bottom: 16px` → `RichText.tsx`'in `heading` converter'ına birebir uygulandı.
- Tablo hücresi kenarlığı: `1px solid #d9d9d9` → `globals.css`'teki `.lexical-table-cell` kuralına uygulandı.
- Liste (`<ol>`) `list-style: none` — ancak bu görsel taraması sırasında sayfa gövdesinde bulunan bir `<ol>` idi, makale içeriğine ait olduğu doğrulanmadı; bilinçli olarak taklit EDİLMEDİ — `RichText.tsx`'in liste stilleri standart `list-disc`/`list-decimal` kullanıyor (daha evrensel okunabilir).
- Body metin rengi: sayfa genelinde `#333` — `RichText.tsx`'in paragraf/liste converter'larına uygulandı.
- **Bilinçli olarak eşleştirilmeyen:** Canlı sitenin "Geri Dön" linki gibi UI-chrome elemanlarında görülen `rgb(185,28,28)` (Tailwind red-700 benzeri) rengi — bu makale gövdesine ait değil, sayfa şablonuna ait; "Vurgu" rengi olarak alınmadı, onun yerine sitenin kendi `--color-vf-red` (`#e60000`) değeri kullanıldı.

## 4. Bilinen ortam kısıtı: `payload generate:importmap` kırık

`cms/src/app/(payload)/admin/importMap.js`'in başındaki not (R-10 ile aynı sınıf hata, artık `payload.config.ts`'in doğrudan `@payloadcms/richtext-lexical` import etmesiyle de tetikleniyor):

```
Error [ERR_REQUIRE_ASYNC_MODULE]: require() cannot be used on an ESM graph with top-level await.
```

**Sonuç:** Yeni bir custom admin component (`admin.components.*`) eklendiğinde, `importMap.js`'e ELLE eklenmezse component'in adı loglanıyor ("PayloadComponent not found in importMap") ama **hiçbir hata fırlatılmıyor** — alan sessizce boş kalıyor. Bu turda `LiveOrderField` eklenirken tam olarak bu şekilde canlıda tespit edildi (bkz. CMS-USER-TESTS 7.1). Gelecekte yeni bir custom component eklenirken bu adım unutulmamalı.

## 5. Copy-paste SQL

Bu turda uygulanan tek şema değişikliği (§7.5, Blog kategori scope'u):

```sql
ALTER TYPE enum_categories_scope ADD VALUE IF NOT EXISTS 'blog';
```

`order`/`homepageOrder` canlı geri bildirimi (§2.1), sürükle-bırak sunucu-taraflı fetch (§3.3) ve rich text editör konfigürasyonu (§3.6) tamamen kod/config değişikliği — **hiçbir DB şema değişikliği gerektirmedi** (richText alanları zaten JSONB, editör konfigürasyonu sadece o JSONB'nin editördeki nasıl düzenlendiğini belirliyor).

Kusurlu test kaydının (id 9) verisi düzeltmesi (§7.8) SQL ile değil, Payload API üzerinden (`PATCH /api/blog-posts/9`) yapıldı — `body` alanının karmaşık iç içe JSONB yapısını elle SQL ile güncellemek riskli olurdu; API, `beforeChange`/`afterChange` hook'larının (revalidate, audit log) doğru çalışmasını da garantiliyor.

### 5.1 — Ek tur: excerpt kaldırma + ctaLabel (§7.10–7.12)

```sql
BEGIN;
ALTER TABLE blog_posts ADD COLUMN cta_label character varying DEFAULT 'Detayları gör';
ALTER TABLE _blog_posts_v ADD COLUMN version_cta_label character varying;
UPDATE blog_posts SET cta_label = 'Detayları gör' WHERE cta_label IS NULL;
ALTER TABLE blog_posts DROP COLUMN excerpt;
ALTER TABLE _blog_posts_v DROP COLUMN version_excerpt;
COMMIT;
```

`body`/`category`'nin `required: true` olması (§7.12) uygulama seviyesinde bir doğrulama — mevcut satırlarda bu iki kolon zaten nullable `NOT NULL` kısıtı eklenmedi (Payload'ın kendisi de required alanlar için DB seviyesinde NOT NULL uygulamıyor, taslaklar/versiyon satırları eksik alanlarla var olabiliyor), dolayısıyla bu madde için ek bir şema değişikliği gerekmedi.

## 6. Doğrulama

- `npm run check` (kök): lint + typecheck + test (97/97) + build — temiz.
- `cms/npm run check`: lint (4 önceden var olan `<img>` uyarısı, ilgisiz) + typecheck + test (127/127) + build — temiz.
- Yeni testler: `src/components/__tests__/RichText.test.tsx` (7 test — boş içerik, paragraf, başlık, Vurgu rengi, düz metin).
- `scripts/trivy-scan.sh all`: bağımlılık taramasında `undici@7.28.0` (HIGH, CVE-2026-13697) bulundu — kök `package.json`'a `overrides: { "undici": "^7.29.0" }` eklenerek düzeltildi, `npm ls undici` ile tekrar doğrulandı (7.29.0'a dedupe oldu). Trivy'nin container imajı taramasında (app + cms) sıfır bulgu.
- Docker: `app` ve `cms` imajları yeniden build edildi, container'lar healthy.
- Canlı doğrulama listesi (CMS-USER-TESTS Bölüm 7'de madde madde): sıra canlı öneri + "kullan" butonu, admin -createdAt sıralaması, sürükle-bırak dropdown'unun sunucudan sayaçlı kategori çekmesi, kategori silme koruması (409 + toast), Blog scope kategorisinin sadece `/blog` sekmelerinde çıkması, blog slug otomatik oluşturma, rich text (başlık/liste/Vurgu) canlı render, kart truncation + CTA.

## 6b. Eksik kalan zorunlu adım: SonarQube taraması

AGENTS.md, büyük bileşen/kod değişikliğinden sonra commit/push öncesi SonarQube taraması zorunlu kılıyor. Bu turda `SONAR_TOKEN` ortam değişkeni bu oturumda mevcut değildi ve varsayılan `admin:admin` kimlik bilgileriyle token üretme denemesi 401 ile reddedildi (önceki bir oturumda şifre değiştirilmiş). **Bu adım tamamlanmadı** — commit/push öncesi elle çalıştırılmalı:

```bash
# http://localhost:9002 -> Hesabım -> Güvenlik -> Token üret, sonra:
SONAR_TOKEN=<token> scripts/sonar-scan.sh all
```

## 7. Bilinçli yapılmayanlar, açık riskler, teknik borç

1. **`EXPERIMENTAL_TableFeature`** — paketin resmi olarak "deneysel" işaretlediği tek tablo implementasyonu. Gelecekteki bir `@payloadcms/richtext-lexical` sürüm yükseltmesinde API değişebilir.
2. **`TextStateFeature`** — paketin JSDoc'unda `@experimental` işaretli.
3. **Eşzamanlı editör yarışı (race condition):** `LiveOrderField`'ın gösterdiği "önerilen sıra", iki editör aynı kategoride aynı anda yeni kayıt oluşturursa ikisine de aynı sayıyı önerebilir — çözülmedi, mevcut `assignNextOrder` hook'unun zaten taşıdığı aynı sınıf yarışın bir uzantısı (bu turdan önce de vardı, LiveOrderField sadece onu daha görünür kılıyor).
4. **`@payloadcms/richtext-lexical`'ın kök `package.json`'a eklenmesi** — `npm install` seviyesinde admin'e özgü ağır paketleri (`payload`, `@payloadcms/ui`, `monaco-editor`) `node_modules`'a çekiyor (gerçek bundle'a girmiyor, doğrulandı — §2.1). Trivy'nin bağımlılık taramasında bu paketlerin CVE'lerini görünür kılmaya devam edecek; bu turda bulunan tek gerçek HIGH (undici) `overrides` ile kapatıldı, ama gelecekteki yeni CVE'ler için bu paket ağacı düzenli taranmaya devam etmeli.
5. **`payload generate:importmap` kırık** (bkz. §4) — her yeni custom component elle `importMap.js`'e eklenmeli; unutulursa sessiz başarısızlık (component render olmaz, hata fırlamaz).
6. **İnternal doc linking editörde kapalı** (`LinkFeature({ enabledCollections: [] })`) — sitenin slug→URL çözücüsü yazılmadığı için. Editör sadece özel URL girebiliyor; ileride bir "dahili sayfaya bağla" özelliği istenirse `internalDocToHref` fonksiyonu yazılıp hem editör hem renderer güncellenmeli.
7. **`excerpt`'in Notion-tarzı rich text olması** — kullanıcıya soruldu, "hayır, düz kısa metin kalsın" diye onaylandı (`body` zaten rich text olduğu için). Karar olarak kapatıldı, açık iş değil.
