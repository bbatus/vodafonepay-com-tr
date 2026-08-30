# Vodafone Pay CMS — 3. Düzeltme Turu

> Bu dosyanın tamamını Claude Code'a tek prompt olarak ver.

---

## 0. Bağlam

`vodafonepaycomtr` monorepo'su:

- **Site:** repo kökü — Next.js 16 App Router + React 19 + Tailwind v4, `localhost:3000`
- **CMS:** `cms/` — Payload CMS 3.x + Postgres + MinIO (S3), admin `localhost:3010/admin`
- **Aktif çalışma kopyası:** `.claude/worktrees/selam-login-disable-temp-725fb7/` — bu turdaki tüm kod burada. `git worktree list` ile doğrula, değişiklikleri **orada** yap.

Roller (`cms/src/access/roles.ts`): `NEW_VERTICAL_MAKER` (tam yetki + kullanıcı yönetimi), `NEW_VERTICAL_CHECKER` (create yok), `GROWTH_MAKER` (sadece Campaigns, publish yok), `GROWTH_CHECKER` (sadece Campaigns, onaylar).

Geçmiş: `docs/CMS-USER-TESTS.md` (kullanıcı geri bildirim geçmişi, 4 bölüm), `docs/DUZELTME-TURU-RAPORU.md` (bir önceki turun raporu), `docs/STATUS.md`, `docs/RFP-OPEN-ITEMS.md`.

---

## 1. Uyman gereken repo kuralları (AGENTS.md — pazarlık yok)

1. **`payload generate:importmap` bu ortamda bozuk** (`ERR_REQUIRE_ASYNC_MODULE`). Eklediğin/sildiğin her custom admin bileşenini `cms/src/app/(payload)/admin/importMap.js` içinde **elle** ekle/çıkar. importMap'te olmayan bileşen sessizce render edilmez, hata da vermez.
2. **`payload migrate:create` de bozuk** (aynı sebep, R-10). Yeni DB kolonu ekliyorsan `docs/`'ta belgelenen "host Postgres'e karşı `next dev`" workaround'unu kullan ve raporda hangi kolonların manuel push gerektirdiğini yaz.
3. Her custom admin bileşeni UI metinlerini `useAdminLocale()` + `useDbStrings()` (client) veya `loadDbStrings()` (server) üzerinden basar. Yeni metinler `cms/src/lib/translationDefaults.ts`'e eklenir. Hardcode TR/EN string yok.
4. Koleksiyon isimleri/grupları `cms/src/lib/collectionLabels.ts`'teki `dbLabel()` üzerinden gelir. Yeni koleksiyon/alan eklersen aynı desene uy.
5. Next.js 16 bu modelin eğitim verisinden farklı. Emin olmadığın API için `node_modules/next/dist/docs/` altındaki rehberi oku.
6. TypeScript strict, `any` yok. Site tarafında Tailwind utility, inline style yok. CMS tarafında yeni inline style ekleme — `cms/src/styles/custom.css` kullan.
7. Bitirmeden: `npm run check` hem kökte hem `cms/` içinde temiz geçsin. Yeni access/hook/transform mantığı için Vitest testi yaz.
8. Yeni npm paketi eklemekten kaçın; zorundaysan bilinen açığı olmadığını doğrula (repo'nun sıfır-bilinen-açık politikası — bu yüzden `xlsx`/SheetJS reddedildi, export'lar CSV).
9. Ajan takımı kullanacaksan her ajan kendi worktree branch'inde çalışsın, merge'i sen yap.

---

## 2. Faz 0 — Önceki turun eksiklerini kapat

Bir önceki tur (`docs/DUZELTME-TURU-RAPORU.md`) çoğunlukla tamamlandı ama üç açık kalem var. Yeni işlere başlamadan bunları kapat:

**2.1 — Fallback maskeleme deseni (raporun §3'ünde "sonraki tura bırakıldı" denmiş).**
`/kampanyalar` ve `/blog` düzeltildi ama aynı sınıf bug 8 sayfada daha duruyor. `src/app/` altında hâlâ `fallback` içeren dosyalar: `duyurular/DuyurularAccordion.tsx`, `vodafone-pay-kart`, `vodafone-pay-uygulama`, `faturana-yansit`, `aninda-bakiye`, `qr-ile-faturana-yansit`, `sikca-sorulan-sorular/FaqCategoryFilter.tsx`, `cerez-politikasi`, `site-haritasi`, `iletisim`, `bilgi-guvenligi`, `sozlesmeler-ve-formlar`, `gizlilik-ve-guvenlik-politikasi`, `web-sitesi-hukum-ve-sartlari`, `kurumsal-yonetim`.
Her birini tek tek incele ve **iki gruba ayır**:
- CMS erişilemediğinde sahte içerik gösteren (maskeleme) → `/kampanyalar`'daki gibi kaldır, `ContentUnavailable` kullan.
- Gerçekten "henüz içerik girilmedi" için makul varsayılan olan → dokunma, ama raporda neden bıraktığını yaz.
`/kampanyalar/page.tsx`'te hâlâ duran `fallbackFaqs` da bu denetime dahil.

**2.2 — `afterLogin` fire-and-forget riski.**
Rapor §2.1'de deadlock'ı çözmek için `lastLoginAt/Ip/UserAgent` write'ı `await`siz + `.catch()` yapılmış. Bu doğru yön ama şu iki şeyi doğrula: (a) write gerçekten tutarlı biçimde tamamlanıyor mu — ardışık 10 login atıp 10'unda da alanların güncellendiğini gör; (b) hata durumunda sessizce yutulmuyor, en azından loglanıyor mu. Users CSV export'u bu alanlara bağlı, sessizce boş kalması fark edilmez.

**2.3 — Faz H (admin arayüz denetimi) yüzeysel kaldı.**
Raporda sadece 2 bulgu var (tablo yatay scroll, arama kutusu focus). Bu turda §4'teki işleri yaparken karşılaştığın her responsive/kullanılabilirlik kusurunu da not al ve düzelt; §4.11'de tekrar ele alınıyor.

---

## 3. Ön analiz — benim tespitlerim

Bunları yeniden araştırmana gerek yok, ama **kodda teyit et**, körlemesine uygulama.

### 3.1 Referans bütünlüğü: CMS'te tek bir `beforeDelete` hook'u yok

`cms/src/` altında `beforeDelete` **sıfır** kez geçiyor. Yani hiçbir koleksiyon, silinmek istenen kaydın başka bir kayıt tarafından referans alınıp alınmadığını kontrol etmiyor.

Kullanıcının yaşadığı senaryo: bir Category oluşturdu → o kategoride bir Campaign yarattı → Category'yi sildi, hiçbir uyarı almadı. `Campaigns.category` `required: true` bir `relationship` — yani veri modeli bunun boş olamayacağını söylüyor, ama silme bunu deliyor. Postgres tarafında Payload/drizzle bu FK'yi genelde `ON DELETE SET NULL` ile kuruyor, dolayısıyla kampanya sessizce **kategorisiz** kalıyor. Site tarafında `src/lib/cms.ts` → `campaignSchema.category` `nullable()` olduğu için zod da bunu kabul ediyor, kampanya hiçbir filtre sekmesine düşmüyor ve kimse fark etmiyor.

Bu tek bir alanın sorunu değil — **18 ilişki alanı** aynı korumasızlıkta:

| Hedef koleksiyon | Referans alan yerler |
|---|---|
| `categories` | `Campaigns.category` (**required**) |
| `media` | `Campaigns.image` (**req**), `BlogPosts.coverImage` (**req**), `FeatureCards.icon` (**req**), `StepCards.image` (**req**), `ProductHeroes.image` (**req**), `Pages.layout` blokları (hero.image **req**, logoGrid.logo **req**), `ContentBlocks.image`, `PageMeta.ogImage`, `Pages.ogImage`, `Representatives.qrCode`, `Users.avatar` |
| `documents` | `LegalPages.documents[].file` (**req**) |
| `users` | `Campaigns.createdBy`, `Campaigns.rejectedBy`, `Media.uploadedBy` |

Ayrıca kullanıcı "silerken emin misiniz kutusu çıkmadı" diyor. Payload'ın kendi edit-view'ındaki "Sil" bir onay modalı gösterir; **`ContentManagementApp.tsx`** ise `window.confirm` kullanıyor. Kullanıcının hangi yoldan sildiğini tespit et — muhtemelen onay çıkan ama **sonuç** vermeyen bir yol, ya da onaysız üçüncü bir yol var. Tüm silme yollarını (Payload edit view, Payload liste bulk-delete, ContentManagementApp, ReorderWidget) tek tek dene.

### 3.2 `defaultSort` sadece Campaigns'te var

`cms/src/collections/*.ts` içinde `defaultSort` yalnızca `Campaigns.ts`'te (`-createdAt`). `FaqItems` ve `order` alanı olan diğer tüm koleksiyonlar (`FeeRows`, `LimitTables`, `NavLinks`, `FeatureCards`, `StepCards`, `ContentBlocks`, `Announcements`, `Categories`, `CookieRows`) admin listesinde `order`'a göre değil, Payload'ın varsayılanına göre sıralanıyor. Kullanıcı `ReorderWidget` ile sürükleyip sıraladığında liste o sırayı yansıtmıyor — sürükle-bırak özelliğini pratikte işlevsiz kılıyor.

Ayrıca `order` alanlarının `defaultValue: 0` — kullanıcı 1'den başlamasını istiyor.

### 3.3 Dil değiştirici: iki farklı şey birbirine karışmış

Panelde **iki ayrı** dil kavramı var ve kullanıcı bunları tek şey sanıyor:

1. **Admin UI dili** — `payload.config.ts` → `i18n: { supportedLanguages: { tr, en } }`, `payload-lng` cookie'si. Profil sayfasındaki "Dil Tercihi" ve `LocalePreferenceSync.tsx` bunu yönetiyor.
2. **İçerik locale'i** — `payload.config.ts` → `localization: { locales: ["tr","en"] }`. Payload bunun için liste/doküman görünümlerinin üstüne **ayrı bir locale seçici** basıyor. Kullanıcının "topbardaki üstteki seçenek" dediği büyük ihtimalle bu.

Kritik nokta: `localization` açık ama **neredeyse hiçbir alan `localized: true` değil**. `payload.config.ts`'teki yoruma göre `Pages.title` dışında hiçbir şey localize edilmemiş; Campaigns/BlogPosts bilinçli olarak dışarıda bırakılmış (mevcut veri + `versions.drafts` geçmişi yüzünden drizzle schema push interaktif prompt'ta kilitleniyor). Yani içerik locale seçicisi bugün **hiçbir işe yaramıyor** — kullanıcının "locals değerleri hiç değişmiyor" gözlemi tam olarak bu.

Bu bir tasarım kararı gerektiriyor, §4.9'da ele alınıyor.

### 3.4 Hesap kilidi diye bir şey henüz yok

`cms/src/collections/Users.ts` → `auth: { tokenExpiration: 60 * 60 * 12 }`. `maxLoginAttempts`/`lockTime` **konfigüre edilmemiş**. Payload'ın `loginAttempts`/`lockUntil` alanları auth-enabled koleksiyonlarda şemada var ama lockout mekanizması `maxLoginAttempts` verilmeden devreye girmez. Dosyadaki yorum da bunu doğruluyor ("see auth.maxLoginAttempts, not configured"). Yani şu an yanlış şifreyle sonsuz deneme yapılabiliyor — hem güvenlik açığı hem de kullanıcının istediği "kilidi kaldır" ekranının dayanağı yok.

### 3.5 Kampanya filtresi: kategori seçilince favoriler bloğu kalıyor

`src/app/kampanyalar/CampaignsFilterableList.tsx` → `visibleFavorites` sadece kategoriye göre filtreleniyor, ama "Bu ayın favorileri" başlığı `visibleFavorites.length > 0` olduğu sürece render ediliyor. Kullanıcı "Anında Bakiye" seçtiğinde o kategorideki favori kampanyalar hâlâ ayrı bir "Bu ayın favorileri" bloğunda ve ayrıca "Tüm Kampanyalar"da **görünmüyor** (favoriler `!featured` filtresiyle ayrılmış) — yani ekranda iki başlık, dağınık bir sonuç.

### 3.6 Kampanya tarihi kart altında değil, detay sayfasında

`src/app/kampanyalar/[slug]/page.tsx` başlangıç/bitiş tarihini detay sayfasında `14.07.2026 – 15.08.2026` biçiminde basıyor. `CardListGrid.tsx`'teki kart bileşeninde tarih **hiç yok**. Gerçek site (`vodafonepay.com.tr`) tarihi kampanya kartının altında "Kampanya Tarihi 14.07.2026 - 15.08.2026" etiketiyle gösteriyor.

---

## 4. Yapılacak işler

### 4.1 Referans bütünlüğü + silme onayı (genel denetim)

Kullanıcının isteği tek bir kategori vakası değil: *"Böyle çalışmayan bu componentin eksik olduğu ve olması gereken yerler varsa analiz et ve bunları fixle."* Yani **sistemik** çöz.

- §3.1'deki 18 ilişki alanının tamamı için, hedef koleksiyona `beforeDelete` guard'ı ekle: silinmek istenen kayda referans veren doküman varsa silmeyi **engelle** ve hata mesajında *kaç kayıt* engellediğini ve *hangileri* olduğunu (ilk birkaçının başlığı + edit linki) söyle. "Silinemedi" yetmez — kullanıcı neyi önce silmesi gerektiğini görmeli.
- Bu guard'ı her koleksiyona kopyalama: `cms/src/hooks/` altında, "şu koleksiyonlardaki şu alanlar bu koleksiyonu referans alıyor" tanımından beslenen tek bir jenerik `blockDeleteIfReferenced()` factory'si yaz. Referans haritasını tek bir yerde tut ki yeni ilişki eklendiğinde tek satır değişsin.
- `Pages.layout` gibi polimorfik `blocks` dizilerindeki medya referanslarını da kapsamaya çalış. Payload'ın düz `where` sorgusu bunları güvenilir hedefleyemiyorsa (önceki tur `MediaUsageField` için bu sebeple kapsam dışı bırakmış), en azından **uyar** ("bu medya bir sayfa bloğunda kullanılıyor olabilir, kontrol edin") — sessizce geçme.
- Postgres tarafındaki gerçek FK davranışını **doğrula**: `ON DELETE SET NULL` mı, `CASCADE` mi, `RESTRICT` mi? DB'ye bak, tahmin etme. Uygulama katmanı guard'ı ile DB davranışının çeliştiği yer varsa raporda yaz.
- Tüm silme yollarını dene ve her birinde onay diyaloğu olduğunu garanti et: Payload edit view "Sil", liste görünümü bulk-delete, `ContentManagementApp.tsx`, `ReorderWidget`. Eksik olan varsa ekle. Onay metni ne silineceğini **adıyla** söylesin ("'Kart' kategorisini silmek üzeresiniz").
- Engellenen silme, kullanıcıya **admin UI'da okunabilir bir hata** olarak dönsün — konsola düşen ham 500 değil. Payload'ın `APIError` tipini kullan, HTTP status'ü anlamlı olsun (409 Conflict).
- Bu guard için gerçek testler yaz: referanslı sil → engellenir, referanssız sil → geçer, referans kaldırıldıktan sonra sil → geçer.

### 4.2 Kampanya filtresi: kategori seçilince favoriler bloğu kalkmalı

`ALL_FILTER` aktifken mevcut davranış doğru (üstte "Bu ayın favorileri", altında favori olmayanlar). Belirli bir kategori seçildiğinde: **tek bir liste** göster — o kategorideki tüm kampanyalar (favori olsun olmasın), ayrı favoriler bloğu olmadan. Başlık da ona göre olsun (örn. seçili kategori adı veya sade "Kampanyalar").

Şu anki bug'ı da düzelt: kategori seçiliyken favori kampanyalar `allCampaigns`'te olmadığı için, favoriler bloğu kaldırılırsa tamamen kaybolurlar. Filtreleme mantığını iki ayrı diziyi filtrelemek yerine tek kaynaktan türetecek şekilde yeniden yaz.

### 4.3 Kampanya tarihini kartın altında göster

Gerçek sitedeki desene uy: kampanya kartının altında "Kampanya Tarihi 14.07.2026 - 15.08.2026". Önce `https://www.vodafonepay.com.tr/kampanyalar/pazaramada-50-indirim` ve `/kampanyalar` listesine **fiilen bak** (tarayıcıyla), etiketin tam metnini, konumunu, tipografisini ve tek tarihli/tarihsiz durumdaki davranışını gör; sonra uygula.

- `CardListItem`'a tarih alanlarını taşı, `CardListGrid.tsx`'teki karta ekle.
- Tarihsiz kampanyada blok hiç render edilmesin (boş alan bırakma).
- Sadece başlangıç veya sadece bitiş varsa ne yazacağını belirle.
- Detay sayfasındaki mevcut tarih gösterimini de aynı etiketle ("Kampanya Tarihi") tutarlı hale getir.
- Kartların yüksekliği tarihli/tarihsiz karışık listede bozulmasın (grid hizası).

### 4.4 Yayındaki kampanyayı düzenleme akışı

**İstenen davranış:** Yayında (`_status: published`) bir kampanya doğrudan düzenlenemesin. Kullanıcı düzenlemeye kalkıştığında net bir yönlendirme görsün: *"Yayındaki bir kampanyayı düzenlemek için önce yayından kaldırmalısınız."* Yayından kaldırma bir onaydan geçsin (kim onaylıyorsa mevcut maker/checker ayrımına uygun şekilde), onay verilince düzenleme açılsın, düzenleme bitince normal onay akışıyla tekrar yayına gitsin.

**Kritik kısıt:** Bu döngü kampanyanın liste sırasını **bozmamalı**. 3 ay önce yayınlanmış bir kampanya, açıklaması güncellenip yeniden yayınlandığında listenin en üstüne çıkmamalı — orijinal `createdAt` korunmalı.

Yapılacaklar:
- Önce mevcut durumu **ölç**: bir kampanyayı unpublish → edit → republish yap ve `createdAt`'in gerçekten değişmediğini, hem admin listesinde (`defaultSort: "-createdAt"`) hem site tarafında (`getCampaigns()` → `sort=-createdAt`) sıranın korunduğunu doğrula. Değişiyorsa asıl bug bu — önce onu düzelt.
- Akışı tasarla ve **uygulamadan önce bana anlat**: "pasife çekme" `_status`'ü mü (unpublish), yoksa `campaignStatus` (active/expired) alanını mı kullanacak? İkisi farklı şeyler ve şu an ikisi de var — hangisinin bu akışa doğru eşlendiğini gerekçelendir. Yanlış olanı seçmek "süresi dolmuş kampanya" semantiğini bozar.
- Onay adımını mevcut `reviewStatus`/`RoleAwarePublishButton`/`SaveOrSubmitButton` makinesine **entegre et**, paralel ikinci bir onay sistemi kurma.
- 4 rolün her biri için davranışı netleştir: NV Maker doğrudan yayınlayabiliyor (rol tablosu gereği), Growth Maker hiç yayınlayamıyor. "Yayından kaldırma onayı"nı kim verebilir?
- Rol bazlı akış için test yaz.

### 4.5 Liste sıralaması: `order`'a göre ve 1'den başlayarak

- `order` alanı olan **her** koleksiyona `defaultSort: "order"` ekle (§3.2'deki liste). Sık Sorulanlar özellikle isteniyor ama sorun genel.
- `order` alanlarının `defaultValue`'sunu 1 yap ve yeni kayıtta mevcut en yüksek `order + 1` atansın — kullanıcı elle sayı düşünmek zorunda kalmasın.
- `ReorderWidget`'ın yazdığı sıra değerlerinin de 1'den başladığını doğrula (0-tabanlı yazıyorsa düzelt).
- Mevcut kayıtlardaki 0-tabanlı `order` değerleri için ne yapacağını karar ver ve raporda yaz (tek seferlik normalize script'i mi, olduğu gibi mi bırakılacak).
- Site tarafındaki `sort=order` sorguları bundan etkilenmemeli — regresyon olmadığını doğrula.

### 4.6 Hesap kilidi: lockout mekanizması + NV Maker'a kilit yönetimi ekranı

- `Users.auth`'a `maxLoginAttempts` ve `lockTime` ekle. Değerleri seç ve gerekçelendir (örn. 5 deneme / 15 dakika) — çok agresif olursa gerçek kullanıcıyı kilitler, çok gevşek olursa brute-force'a açık kalır.
- Kilitli kullanıcıları görünür yap: `Users` listesinde kilit durumu bir kolon olarak görünsün, kilitliler filtrelenebilsin.
- **Sadece `NEW_VERTICAL_MAKER`** kilidi kaldırabilsin. Payload'ın `unlock` operasyonu ya da `loginAttempts`/`lockUntil` alanlarının sıfırlanması üzerinden bir "Kilidi Kaldır" aksiyonu ekle. Erişim kontrolünü **sunucu tarafında** zorla — butonu gizlemek yeterli değil.
- Bu iş için ayrı bir ekran/görünüm iste(niy)or: `Users` koleksiyonu altında kilitli hesapları listeleyen, tek tıkla kilit açan bir görünüm. Sidebar'da nereye oturacağına karar ver (ayrı nav linki mi, Users listesinin üstünde bir sekme mi) ve gerekçelendir.
- Her kilit açma işlemi **audit log'a** yazılsın (`writeAuditLog`, yeni bir `action` değeri, örn. `unlock`). `AuditLogs.action` select'ine yeni seçeneği eklemeyi unutma.
- Başarısız login denemelerinin kendisi de loglanabiliyorsa logla (`AuditLogs` zaten `login_failed` seçeneğini tanımlıyor ama `Users.ts`'teki yoruma göre Payload bunun için hook açmıyor — `maxLoginAttempts` açıldıktan sonra tekrar değerlendir, mümkünse bağla).
- Access testleri yaz: NV Maker açabilir, diğer 3 rol açamaz (API seviyesinde de).

### 4.7 Kampanyalar CSV export

`Campaigns` listesine, `UsersExportButton`/`AuditLogsExportButton` ile aynı desende bir export butonu ekle:
- Ortak `cms/src/lib/csv.ts` altyapısını kullan (UTF-8 BOM + `;` ayraç — Türkçe Excel için).
- **Tüm anlamlı sütunlar** çıksın: başlık, slug, açıklama, kategori (label), durum (`_status`), inceleme durumu, kampanya durumu, öne çıkan mı, başlangıç/bitiş tarihi, CTA metni/linki, SEO başlık/açıklama, oluşturan kullanıcı, oluşturulma/güncellenme tarihi. Richtext alanları (`body`, `terms`) için düz metne indirgeme yap ya da kapsam dışı bırak — kararını gerekçelendir.
- Ekrandaki filtre/arama/sıralama export'a taşınsın (`AuditLogsExportButton`'daki desen).
- Tarihler `tr-TR`, boolean'lar "Evet/Hayır" gibi okunabilir değerler.
- İlişki alanları ham ID değil, insan-okunabilir değer (kategori label'ı, kullanıcı e-postası) olarak çıksın.

### 4.8 Content Management sayfasını salt-okunur rapor sayfasına çevir

Sekmeli yapı **kalsın**, ama:
- **Her rol** bu sayfayı görebilsin.
- **Hiçbir rol** buradan düzenleme/silme/oluşturma yapamasın — "Yeni Ekle", "Düzenle", "Sil", "Seçilenleri Sil" aksiyonlarını kaldır.
- Sayfa, sistemdeki **tüm** koleksiyonların özetini versin: hangi koleksiyonlar var, her birinde kaç kayıt, yayında/taslak dağılımı, son güncellenme, ve o koleksiyonun altındaki kayıtların temel alanları.
- Şu an `cms/src/lib/contentManagementTabs.ts` sadece 7 koleksiyon listeliyor (campaigns, blog-posts, faq-items, announcements, representatives, media, pages). **Eksik olan koleksiyonları da ekle** — kullanıcı "olmayan gereken tableri ekleyelim" diyor. Sistemdeki 22 koleksiyonun tamamını gözden geçir, rapor sayfasında anlamlı olmayanı (ör. `audit-logs` — kendi sayfası var, `translations` — teknik) dışarıda bırakırsan gerekçesini yaz.
- Her koleksiyon için gösterilecek sütunlar o koleksiyona anlamlı olsun (tek bir "title/status/updated" şablonunu 22 koleksiyona zorlama).
- Salt-okunur olsa da erişim kontrolü hâlâ gerçek olsun: bir rolün göremeyeceği koleksiyonun içeriği bu sayfadan sızmasın. `read` access'i olmayan koleksiyon için satır sayısı bile göstermemelisin — Payload'ın kendi access kurallarına bırak, `overrideAccess: true` kullanma.
- İlgili kayda gitmek için Payload'ın kendi edit sayfasına link ver (düzenleme orada, kendi yetki kontrolüyle yapılsın).

### 4.9 Dil: topbar seçicisini kapat, profilden yönet, içerik locale'ini karara bağla

§3.3'ü oku — burada iki ayrı mekanizma var, ikisini karıştırma.

**(a) Admin UI dili:** Sadece profil sayfasındaki "Dil Tercihi" değiştirebilsin. Topbar'daki/başka yerdeki her dil değiştiriciyi kaldır. `LocalePreferenceSync.tsx`'in davranışını gözden geçir — "geçici topbar değişikliği" diye bir şey kalmayacağına göre `sessionStorage` flag mantığı sadeleşebilir.

**(b) İçerik locale seçicisi (`localization`):** Bugün fiilen işe yaramıyor çünkü neredeyse hiçbir alan `localized: true` değil. İki seçenek var, **birini seç ve gerekçelendir**:
- *Kapat/gizle:* `localization` seçicisini admin UI'dan kaldır (veya `localization`'ı tamamen devre dışı bırak). Dürüst ve basit — ama EN içerik girme yolu kapanır.
- *Gerçekten uygula:* İlgili alanları `localized: true` yap. **Dikkat:** `payload.config.ts`'teki yorum, mevcut veri + `versions.drafts` geçmişi olan bir koleksiyonda bunun drizzle-kit schema push'unu interaktif bir "rename mi yeni kolon mu?" prompt'unda kilitlediğini söylüyor (canlı doğrulanmış). Bu yolu seçersen gerçek bir veri migrasyonu planla, `migrate:create` bozukken bunu nasıl yapacağını çöz ve **önce bana anlat**.

Kullanıcının asıl şikayeti "sayfaların locals değerleri hiç değişmiyor" — yani mevcut yarım durum en kötüsü. Hangi yolu seçersen seç, sonuç *tutarlı* olsun: ya her yerde çalışsın ya hiç görünmesin.

**(c)** Bu iş bittiğinde paneli TR ve EN'de yan yana aç; sidebar, topbar, grup başlıkları, dashboard, Content Management, tüm custom bileşenler — çevrilmeyen tek string kalmasın.

### 4.10 Küçük metin düzeltmeleri

**(a)** "Beni hatırla" checkbox'ının etiketi TR'de de **"Remember me"** olsun. `translationDefaults.ts` → `rememberEmail.label` şu an `{ tr: "E-postamı hatırla", en: "Remember my email" }`. Kullanıcı her iki dilde de "Remember me" istiyor. Ancak yanına, sadece e-postanın saklandığını açıklayan küçük bir yardım metni koy — kullanıcı şifresinin saklandığını sanmasın.

**(b)** Login ekranı hero metni. Şu an:
> Tüm içeriğin tek platformda. / One platform for all your content.
> Kampanyaları, sayfaları ve tüm site içeriğini tek panelden yönet. Approval workflows, roles, and audit trails built in — no migration, no lock-in.

Kullanıcı EN başlığın **"One platform for all your need"** yönünde olmasını beğendi ve alt metnin daha somut, "vodafonepay.com.tr web siteniz altındaki ...'leri daha kolay yönetin" tonunda olmasını istiyor. Kreatif ol, birkaç alternatif üret ve bana sun; TR ve EN **birbirinin motamot çevirisi olmasın**, her biri kendi dilinde doğal dursun. Metinler `translationDefaults.ts`'te (`loginBrandPanel.headline` / `loginBrandPanel.subheadline`).

### 4.11 Admin arayüz denetimi (devam)

§2.3'te belirtildiği gibi, önceki turun UI denetimi yüzeysel kaldı. Bu turdaki işleri yaparken:
- Her yeni/değişen ekranı 375px, 768px, 1280px ve 1920px'te fiilen aç ve bak.
- Yeni eklediğin her tablo/liste (kilitli kullanıcılar, Content Management raporu) dar ekranda erişilebilir olsun — önceki turda bulunan `.table-wrap` overflow bug'ının aynısını tekrarlama.
- Yeni eklediğin her butonun focus ring'i, klavye erişimi ve dokunma hedefi boyutu doğru olsun.
- Bulduğun ama bu turun kapsamı dışında kalan kusurları raporda listele — sessizce geçme.

---

## 5. Çalışma şekli

1. **Keşif:** §3'teki bulgularımı kodda teyit et. Katılmadığın yeri gerekçesiyle söyle — körü körüne uygulama.
2. **Plan:** §4'ü bağımlılıklarına göre sırala ve bana onaylat. §4.4 (kampanya düzenleme akışı) ve §4.9(b) (içerik locale'i) için tasarım kararını **uygulamadan önce** anlat.
3. **Uygulama:** mantıksal olarak gruplanmış, her biri tek başına derlenebilen commit'ler.
4. **Doğrulama:** `npm run check` hem kökte hem `cms/`'te. Yeni mantık için test.
5. **Kendi kendini doğrula — "kod doğru görünüyor" yeterli değil.** CMS'i ve siteyi ayağa kaldır, **4 rolün her biriyle** giriş yap ve fiilen dene: kategori silme engeli, kampanya filtresi, kart üzerindeki tarih, yayındaki kampanyayı düzenleme akışı, FAQ sıralaması, hesap kilidi + kilit açma, kampanya CSV export, Content Management raporu, TR/EN geçişi, "Remember me".

---

## 6. İstenen çıktı

Tüm iş bittiğinde:

1. `docs/CMS-USER-TESTS.md`'nin sonundaki "Yeniler" bölümünü, dosyanın mevcut **Bölüm/madde formatına** dönüştür (`### 5.1`, `### 5.2` … her biri için `> alıntı`, **Durum**, **DoD**, **Nasıl fixlendi**, **Test edildi mi**, **Yorumlarım:** boş) ve "İlerleme Özeti" tablosunu yeni maddelerle güncelle. Kullanıcının takip ettiği dosya bu — formatı bozma.
2. `docs/` altına bu turun Türkçe raporunu yaz. İçermesi gerekenler:
   - Madde madde ne yapıldı, hangi dosyalar değişti, neden o yaklaşım seçildi.
   - Kök neden analizleri — özellikle referans bütünlüğü (§4.1) ve dil/locale karmaşası (§4.9) için.
   - §4.4 ve §4.9(b)'de verilen tasarım kararları ve alternatiflerin neden elendiği.
   - Bilinçli yapılmayanlar ve gerekçeleri.
   - Manuel doğrulama adımları, rol rol.
   - Açık kalan riskler / teknik borç — önceki turdan devreden maddeler dahil.
