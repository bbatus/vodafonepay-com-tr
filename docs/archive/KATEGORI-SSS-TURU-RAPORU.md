# Kategori & SSS Turu — Rapor (17.08.2026)

Bu tur, kullanıcının kod tabanını inceleyip yazdığı detaylı prompt (`docs/CLAUDE-CODE-PROMPT-3.md`) üzerine yapıldı. Madde numaraları o promptun §2/§3 numaralandırmasına karşılık geliyor; CMS-USER-TESTS.md'deki karşılıkları Bölüm 6 (6.1–6.6).

## `aninda-bakiye-2` — kesin kök neden

Üç ihtimal vardı: (1) bayat Postgres index'i, (2) bayat veri, (3) `data.scope` boşluğu.

**Kanıt:**
```sql
-- Şu an DB'de tek index var (eski tek-kolonlu unique index yok):
SELECT indexname, indexdef FROM pg_indexes WHERE tablename='categories';
--  categories_scope_slug_idx | CREATE UNIQUE INDEX categories_scope_slug_idx ON public.categories USING btree (scope, slug)
```
`data.scope` her create çağrısında açıkça gönderiliyordu (test edildi) — 3. ihtimal de değil.

**Sonuç: #2, bayat veri.** Kayıt, scope-farkında `generateSlug` düzeltmesi (bu oturumun önceki bir turunda) devreye girmeden önce oluşturulmuştu. Düzeltme sonrası satır elle `aninda-bakiye`'ye geri döndürüldü ve şu an DB'de "-2" sonekli hiçbir kayıt yok. Bunu `cms/src/collections/__tests__/categories.test.ts`'de regresyon testiyle de kapattım (aynı isim iki farklı scope'ta soneksiz slug alıyor mu).

## Madde madde ne yapıldı

### 6.1 — Kategori scope ayrımı
**Neden:** Kategoriler tek koleksiyon ama iki bağımsız taksonomi (Kampanya/Blog vs SSS) besliyor; aynı isim ("Anında Bakiye") her ikisinde de gerçek ve geçerli, ama "Kart" (kampanya) ile "Vodafone Pay Kart" (SSS) tamamen farklı kavramlar. Ayrım olmadan biri diğerinin kategorisini yanlışlıkla seçebiliyordu.

**Değişen dosyalar:**
- `cms/src/collections/Categories.ts` — `scope` alanı (`select`, zorunlu, `CATEGORY_SCOPES` sabiti), `indexes: [{fields:["scope","slug"], unique:true}]`, `generateSlug` artık `scope`'a göre benzersizlik kontrolü yapıyor, sıralama scope'a göre grupluyor (`assignNextOrder("categories", ["scope"])`)
- `cms/src/collections/Campaigns.ts`, `BlogPosts.ts`, `FaqItems.ts` — `category` ilişki alanlarına `filterOptions: () => ({ scope: { equals: ... } })`
- `cms/src/access/__tests__/roles.test.ts`, `cms/src/collections/__tests__/categories.test.ts` (yeni)

**Neden bu yaklaşım (alternatif: ayrı iki koleksiyon):** İki ayrı koleksiyon (`CampaignCategories`/`FaqCategories`) da düşünüldü ama reddedildi — `blockDeleteIfReferenced`, `ReorderWidget`, admin liste/yardım altyapısının tamamı tek "Categories" kavramı üzerine kurulu; ikiye bölmek her yeri iki kere yazmak demekti. `scope` alanı + `filterOptions` aynı garantiyi (yanlış listeden seçilememe, sunucu tarafında da) çok daha az kod değişikliğiyle veriyor.

### 6.2 — Site tarafı scope sızıntısı (canlı bug)
**Neden:** `getCategories()`/`getFaqItems()` scope filtrelemiyordu — CMS tarafındaki ayrım siteye yansımamıştı. `/kampanyalar` sekmelerinde "Anasayfa" (salt SSS kategorisi) ve tekrarlanan "Anında Bakiye" görünüyordu (canlı olarak yeniden üretip ekran görüntüsüyle doğruladım).

**Değişen dosyalar:**
- `src/lib/cms.ts` — `getCategories(scope)` artık zorunlu parametre alıyor; `getFaqItems` her zaman `where[category.scope][equals]=faq` ekliyor
- `src/app/kampanyalar/page.tsx`, `src/app/blog/page.tsx`, `src/app/sikca-sorulan-sorular/page.tsx` — çağrılar güncellendi
- `src/lib/__tests__/cms.test.ts` — yeni testler

### 6.3 — SSS sayfası: tüm kategoriler sekme olsun
**Değişen dosyalar:** `src/app/sikca-sorulan-sorular/page.tsx` (`usedSlugs` filtresi kaldırıldı), `FaqCategoryFilter.tsx` (boş durum mesajı: "Bu kategoride henüz soru yok.")

### 6.4 — Anasayfa SSS: `showOnHomepage`
**Karar:** "Anasayfa" kategorisini koru + `showOnHomepage` ekle (elenen alternatif: kategoriyi kaldırıp tamamen `showOnHomepage`'e geçmek — reddedildi çünkü SSS sayfasındaki "Anasayfa" sekmesini de birlikte götürürdü, gereksiz kayıp).

**Değişen dosyalar:**
- `cms/src/collections/FaqItems.ts` — `showOnHomepage` (checkbox), `homepageOrder` (sayı, sadece işaretliyken görünür, `order`'dan bağımsız çünkü farklı kategorilerin `order` değerleri anasayfada karşılaştırılamaz), `assignNextHomepageOrder` hook'u
- `src/lib/cms.ts` — `getHomepageFaqItems()`
- `src/app/page.tsx` — `getFaqItems("anasayfa")` yerine `getHomepageFaqItems()`
- Veri migrasyonu (aşağıda SQL): mevcut "Anasayfa" kategorisindeki tek soruya (`id=31`) `showOnHomepage=true` atandı

**Not:** Kullanıcının "kategoriye bağlı olmamalı, sınır olmamalı" varsayımı gerçek siteyle karşılaştırıldığında kısmen yanlış çıktı — her ürün sayfası (anasayfa dahil) kendi kategorisiyle sınırlı bir SSS bloğu gösteriyor, bu tasarım gereği. Asıl haklı olduğu nokta ayrıydı: "kategori" ile "anasayfada göster" aynı sinyal olmamalıydı — o ayrıldı.

### 6.5 — "Tümü" sekmesi
**Karar:** Translations anahtarı (`filterTabs.all`), üç akış (Kampanya/Blog/SSS) için tek ortak isim (elenen alternatif: akış başına ayrı anahtar — reddedildi, gerçek site üçünde de aynı kelimeyi kullanıyor, ekstra esneklik karşılığı yok).

**Değişen dosyalar:**
- `cms/src/collections/Translations.ts` — `revalidateTag("translations")`/`revalidateTagOnDelete` eklendi
- `src/app/api/revalidate/route.ts` — `ALLOWED_TAGS`'e `"translations"` eklendi
- `src/lib/cms.ts` — `getTranslation(key, fallback)`
- `src/components/FilterTabs.tsx` — `allLabel` prop (varsayılan hâlâ "Tümü", CMS'te satır yoksa/erişilemezse buna düşer)
- 3 wrapper (`CampaignsFilterableList`, `BlogFilterableList`, `FaqCategoryFilter`) + 3 page.tsx

**Elenen alternatif (Category kaydı):** Reddedildi — bir Category kaydı olsaydı `blockDeleteIfReferenced`, reorder gruplama ve "hep ilk sırada, silinemez" kuralı için özel-durum kodu gerekirdi. Translations satırı zaten silinemez/sürüklenemez çünkü kategori listesinin parçası değil.

### 6.6 — Sürükle-bırak: biriktir + Kaydet/Vazgeç
**Karar:** Ardışık sürüklemeleri biriktirip tek Kaydet/Vazgeç (elenen alternatif: her drop'ta ayrı Evet/Hayır onayı — reddedildi, kullanıcının kendi ikinci mesajında da "yorucu olur" dediği seçenek).

**Draft/publish sorusu (kullanıcının promptunda §2.5/§3.6):** Test edildi, çıplak PATCH (`?draft=true` yok) yayındaki kaydı **doğrudan** güncelliyor, `_faq_items_v`'de yeni bir `published` versiyon satırı oluşuyor. Yani sürükle-bırak zaten canlıya anında yansıyordu — maker/checker onay akışıyla çelişki yok, çünkü bu bir `_status` geçişi değil (o ayrı, `denyMakerPublish` onu koruyor), var olan published kaydın bir alanının güncellenmesi.

**Değişen dosyalar:** `cms/src/components/ReorderWidget.tsx` (drop artık sadece yerel state, Kaydet/Vazgeç butonları, `.ok` kontrolü, kısmi hata mesajı, grup değiştirmeyi kaydedilmemiş değişiklik varken engelleme), `cms/src/lib/translationDefaults.ts` (yeni metinler)

## Manuel uygulanan SQL (bu oturumda çalıştırıldı, kopyala-yapıştır)

```sql
-- 6.1 — Categories.scope
BEGIN;
CREATE TYPE enum_categories_scope AS ENUM ('campaign', 'faq');
ALTER TABLE categories ADD COLUMN scope enum_categories_scope NOT NULL DEFAULT 'campaign';
COMMIT;

-- Slug benzersizliğini akış bazlı yap
BEGIN;
DROP INDEX categories_slug_idx;
CREATE UNIQUE INDEX categories_scope_slug_idx ON categories (scope, slug);
COMMIT;

-- 6.4 — FaqItems.showOnHomepage / homepageOrder
BEGIN;
ALTER TABLE faq_items ADD COLUMN show_on_homepage boolean NOT NULL DEFAULT false;
ALTER TABLE faq_items ADD COLUMN homepage_order numeric;
ALTER TABLE _faq_items_v ADD COLUMN version_show_on_homepage boolean DEFAULT false;
ALTER TABLE _faq_items_v ADD COLUMN version_homepage_order numeric;

-- Mevcut "Anasayfa" kategorisindeki soruyu anasayfa bloğuna da bağla
UPDATE faq_items SET show_on_homepage = true, homepage_order = 1
  WHERE id IN (
    SELECT fi.id FROM faq_items fi
    JOIN categories c ON c.id = fi.category_id
    WHERE c.slug = 'anasayfa' AND c.scope = 'faq'
  );
COMMIT;
```

Bu ortamda hâlihazırda uygulandı (yedekler `scratchpad/pre-catscope.dump`, `scratchpad/pre-catslugscope.dump`, `scratchpad/pre-showonhomepage.dump`). Başka bir ortama taşırken sırayla ve aynı sırayla çalıştırılmalı.

## Bilinçli yapılmayanlar, açık riskler, teknik borç

- **§3.7 (admin Categories liste görünümüne akış sekmesi — MediaFilterTabs deseni):** Yapılmadı. Payload'ın kendi `scope` sütunu için ürettiği otomatik quick-filter dropdown'u (liste başlığında) zaten "campaign"/"faq" filtrelemesini sağlıyor — ayrı bir özel sekme bileşeni eklemek şu an marjinal fayda/efor oranı düşük görünüyor. Kullanıcı isterse ayrı bir iş olarak alınabilir.
- **Sürükle-bırak UI'ı tarayıcıdan uçtan uca test edilmedi:** Native HTML5 drag-and-drop, bu oturumdaki tarayıcı otomasyon aracıyla güvenilir simüle edilemedi. Kod incelemesiyle (drop → sadece state, Kaydet → PATCH + `.ok` kontrolü, Vazgeç → reset) ve draft/publish davranışının API seviyesinde canlı doğrulanmasıyla güvence altına alındı, ama gerçek bir fare sürüklemesiyle elle denenmesi öneriliyor.
- **"Tümü" (`filterTabs.all`) admin panelden gerçek bir yeniden adlandırma denemesi yapılmadı** — sadece `getTranslation`'ın DB-değer/fallback mantığı test edildi. CMS admin panelde Translations koleksiyonuna `filterTabs.all` anahtarıyla bir satır oluşturup değiştirmek, isteyen için bir sonraki adım.
- **`getFaqItems`'ın `limit=200` sınırı gözden geçirilmedi** — şu an içerik hacmiyle (birkaç düzine soru) sorun değil, SSS sayısı ciddi büyürse limit artırılmalı.
- **`Kart` (kampanya kategorisi) ile `Vodafone Pay Kart` (SSS kategorisi) arasındaki isim benzerliği** — teknik olarak artık çakışmıyor (ayrı scope) ama editör kafası karışabilir; Kategoriler listesinde Akış sütunu ve oluşturma formundaki açıklama bunu netleştiriyor, ekstra bir uyarı eklenmedi.
- **§3.7'nin bir parçası olan "yeni kategori oluştururken akış seçiminin ne işe yaradığı net olsun" kısmı** field `admin.description` metniyle çözüldü, ayrı bir onboarding/tooltip eklenmedi.

## Doğrulama

- `npm run check` — kök: 90 test, `cms/`: 127 test, ikisi de temiz (lint/typecheck/build)
- SonarQube (`scripts/sonar-scan.sh all`) — `vodafonepaycomtr` ve `vodafonepaycomtr-cms` ikisi de 0 açık bulgu
- Docker `app`+`cms` bu turun tüm değişiklikleriyle yeniden build edilip ayakta
- Canlı doğrulananlar: scope çakışması (400), aynı isim iki scope'ta temiz slug, boş SSS kategorisi sekmesi + boş durum mesajı, `showOnHomepage` + kategori paralel çalışması, `/kampanyalar` sekmelerinden SSS kategorisi sızıntısının kalktığı
