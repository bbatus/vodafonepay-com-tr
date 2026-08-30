# Vodafone Pay CMS — Düzeltme & İyileştirme Turu Raporu

Bu rapor, "Vodafone Pay CMS — Düzeltme & İyileştirme Turu" briefinde istenen 8 bölümlük
(Faz 0, A–H) çalışmanın tamamlanma özetidir. Her faz kendi commit'i ile branch'e ve
`main`'e push edildi (bkz. §1 tablo). Kod, testler ve canlı doğrulama tamamlandı;
§3'te bilinçli olarak yapılmayan/ertelenen maddeler ve gerekçeleri var.

## 1) Fazlar, değişen dosyalar, neden bu yaklaşım

| Faz | Commit | Konu |
|---|---|---|
| 0 | `e864a24` | DB-destekli collection label/group sistemi (sidebar TR/EN bug'ı), paylaşılan CSV/IP yardımcıları |
| A | `6913c7a` | Users lastLogin alanları, AuditLogs IP kolonu, CSV export'lar |
| B | `5f445d0` | Checker rollerine profil fotoğrafı yükleme, AccountForm CSS temizliği, Çıkış Yap |
| C | `f067c2c` | Media mediaType/uploadedBy, kullanım yeri takibi, Tümü/Görseller/Videolar sekmeleri |
| D | `3481a0a` | Audit-logs matris düzeltmesi, role özel dashboard içeriği, WaitingApprovals kaldırma |
| E | `795707e` | Otomatik kategori slug'ı, dinamik FilterTabs, `/kampanyalar` + blog CMS-maskeleme düzeltmesi |
| F | `82669b3` | Login "beni hatırla" (sadece e-posta) |
| H | `a764168` | Admin arayüz denetimi — tablo yatay scroll, arama kutusu focus düzeltmesi |

### Faz 0 — Ortak altyapı
**Ne yapıldı:** `cms/src/lib/collectionLabels.ts`'e `dbLabel()`/`refreshLabelCache()` eklendi —
her collection'ın `labels` alanı artık statik string değil, `Translations` koleksiyonundan
okunan ve `payload.config.ts`'in `onInit`'inde + her `Translations` değişikliğinde
yenilenen bir `LabelFunction`. 22 collection dosyasında `labels`/`admin.group` bu sisteme
taşındı. `cms/src/lib/csv.ts` (CSV escape/BOM/indirme) ve `hooks/audit.ts`'teki
`ipOf`/`userAgentOf` paylaşılabilir hale getirildi.
**Neden:** Kullanıcının kök-neden talebi — sidebar'daki İngilizce collection isimleri
(`admin.group` sabit string, `labels` hiç tanımlı değildi) EN diline geçince
düzelmiyordu; DB-destekli sistem hem bunu çözüyor hem de gelecekte kod değişikliği
gerekmeden çeviri güncellemesi yapılmasını sağlıyor.

### Faz A — Kullanıcı & güvenlik
`Users.ts`'e `lastLoginAt/lastLoginIp/lastLoginUserAgent` (readOnly, sidebar) eklendi,
`afterLogin` hook'unda dolduruluyor. **Kritik prod-breaking bug ve düzeltmesi için
bkz. §2.1** (deadlock). `AuditLogs.ts`'in `defaultColumns`'una `ip` eklendi, tüm
alanlara gerçek Türkçe label verildi. `UsersExportButton.tsx` yeni `lib/csv.ts`'i
kullanacak şekilde yeniden yazıldı + Son Giriş/IP kolonları eklendi. Yeni
`AuditLogsExportButton.tsx` — ekrandaki filtre/sıralamayı export'a taşıyor.

### Faz B — Profil sayfası
**Kök neden ve düzeltme için bkz. §2.2.** `Users.ts`'e `/api/users/me/avatar` adında
dar kapsamlı bir endpoint eklendi — `mediaCreate` (Maker-only) genişletilmeden her rol
kendi fotoğrafını yükleyebiliyor. `AccountForm.tsx` bu endpoint'i kullanacak şekilde
güncellendi, istemci tarafı 2MB/mime-type ön doğrulaması eklendi, gerçek sunucu hata
mesajı toast'ta gösteriliyor (genel mesaj yerine). Inline style'lar `custom.css`'e
taşındı (Payload'ın `.field-type`/`.field-label` sınıflarıyla tutarlı). "Çıkış Yap"
butonu eklendi (`/admin/logout`).

### Faz C — Media
`mediaType` (image/video) `beforeChange` hook'unda mimeType'tan otomatik türetiliyor
(kullanıcı seçmiyor) — `MediaFilterTabs.tsx` bunu kullanarak Tümü/Görseller/Videolar
sekmelerini `useListQuery`/`handleWhereChange` ile gerçek filtreleme yapıyor. `uploadedBy`
(relationship→users, readOnly) yeni paylaşılan `hooks/ownership.ts`'teki
`setOwnerOnCreate` ile create'te otomatik dolduruluyor (Campaigns.ts'teki inline
`setCreatedBy` deseni buraya çıkarıldı). `usageUrl`/`usageNote` serbest metin alanları +
otomatik "Kullanıldığı Yerler" listesi (`MediaUsageField.tsx`, `type: "ui"` alan) —
10 collection'daki üst-seviye `relationTo: "media"` alanlarını tarıyor.
**Kapsam dışı bırakılan:** Pages'in `layout` bloklarındaki (Hero/LogoGrid vb.) medya
referansları — bkz. §3.

### Faz D — Dashboard & rota
**§2.3'te detaylandırılan matris↔access senkron bug'ı** düzeltildi — `rolePermissions.ts`
artık `AuditLogs.ts`'in gerçek `access.read` kuralıyla eşleşiyor (self-scoped read
herkese açık, sadece NV Maker'a değil), yeni bir test (`rolePermissions.test.ts`) bunu
doğrudan gerçek access fonksiyonunu çağırarak garanti altına alıyor. Checker rolleri
(ikisi de, sadece Growth Checker değil) artık dashboard'da "İncelemeni Bekleyen
Kampanyalar" listesini görüyor; Maker rolleri yeni "Taslaklarınız" widget'ıyla kendi
bekleyen/reddedilen taslaklarını görüyor (`lib/campaignApprovals.ts` — hem
`WaitingApprovalsView.tsx`'ten hem `DashboardWidgets.tsx`'in eski kopya mantığından
tek yere çıkarıldı). `WaitingApprovalsView.tsx`/`WaitingApprovalsNavLink.tsx` tamamen
silindi, `/admin/waiting-approvals` artık 404 veriyor (canlı doğrulandı). 4 rolün
tamamı `/admin`'e iniyor (canlı doğrulandı).

### Faz E — Kategori & kampanya (asıl raporlanan bug)
**§2.4'te detaylandırılan `/kampanyalar` güncellenmeme kök nedeni** düzeltildi.
`Categories.ts`'e Türkçe transliterasyon içeren otomatik slug üretimi eklendi
(`lib/slugify.ts`, `-2`/`-3` çakışma sonekli, birim testli) — `slug` artık readOnly.
`FilterTabs.tsx` artık hardcoded 4 kategori yerine CMS'ten (`getCategories()`, `order`'a
göre) dinamik besleniyor. `CardListGrid.tsx`'teki `key={item.title}` stabil `id`'ye
çevrildi (tüm çağıran yerlerde `id` alanı eklendi).

### Faz F — Login "beni hatırla"
Payload 3.x'te `views.login` diye bir override noktası olmadığından, yeni bir
`beforeLogin` slot bileşeni (`RememberEmailCheckbox.tsx`) gerçek login formuna
DOM-injection ile checkbox ekliyor; her DOM sorgusu sessizce başarısız olabiliyor
(login'i asla kıramaz). Sadece e-posta (`localStorage`) hatırlanıyor — şifre veya
oturum süresi (halen 12 saat, `Users.ts`) dokunulmadı. Canlı doğrulandı: işaretleyip
giriş yapmak e-postayı kalıcı kılıyor, sayfa yenilenince otomatik doluyor, işareti
kaldırmak `localStorage`'ı temizliyor.

### Faz H — Admin arayüz denetimi
Mobil (375px) + masaüstünde canlı gezinme: sidebar/hamburger/dashboard kart yığını
sorunsuz. İki gerçek bug bulundu ve DOM yapısı değiştirilmeden `custom.css` ile
düzeltildi: (1) dar ekranda liste tablosu görünüm alanının dışına taşıyor ve
Payload `body`'ye `overflow-x:hidden` verdiğinden taşan sütunlara ULAŞILAMIYORDU —
`.table-wrap`'e `overflow-x:auto` eklendi. (2) liste görünümündeki arama kutusunun
focus outline'ı Payload'ın kendi stilinde sıfırlanmış (WCAG 2.4.7 ihlali) —
`!important` ile hedefli override eklendi (gerekçe: yüklenen stylesheet'te Payload'ın
kuralı eşit specificity'de kazanıyordu, normal specificity ile yenilemez).

## 2) Kök-neden analizleri

### 2.1 — `afterLogin` deadlock (Faz A sırasında bulundu, prod'u kırardı)
`lastLoginAt/Ip/UserAgent` alanlarını dolduran ilk versiyon, login işleminin KENDİ
transaction'ının hâlâ açık olduğu `afterLogin` hook'u içinde AYNI kullanıcı satırına
`await req.payload.update(...)` çağırıyordu. Bu, satır kilidi bekleyen ikinci bir
transaction başlatıyor — dış transaction bu hook bitene kadar kilidi bırakamıyor, hook
da bu update bitene kadar dönemiyor: klasik deadlock. Canlı doğrulandı: her login
isteği süresiz asılı kaldı (`curl -m 15` timeout, `pg_stat_activity`'de "idle in
transaction" durumunda sıkışmış backend'ler). `disableTransaction: true` TEK BAŞINA
çözmedi (satır kilidi transaction üyeliğinden bağımsız). Gerçek düzeltme: `await`
kaldırıldı, write fire-and-forget + `.catch()` yapıldı — hook hemen döner, dış
transaction commit olur, kilit serbest kalır, arka plan write'ı milisaniyeler içinde
tamamlanır.

### 2.2 — Profil fotoğrafı yükleme hatası (Checker rolleri)
`Media.ts`'in `create` erişimi (`mediaCreate`, `access/roles.ts`) sadece
Maker rollerine açık. `AccountForm.tsx` doğrudan `POST /api/media`'ya istek atıyordu —
Checker rolleri için bu her zaman 403 döndü. `mediaCreate`'i genişletmek Checker'lara
genel medya oluşturma yetkisi verirdi (gerçek bir kapsam ihlali — Checker'lar
inceler, oluşturmaz). Çözüm: yeni `/api/users/me/avatar` endpoint'i, `overrideAccess:
true` ile medya oluşturup SADECE isteği atan kullanıcının kendi `avatar` alanına
bağlıyor — genel amaçlı medya oluşturmak veya başkasının avatarını değiştirmek için
kullanılamaz.

### 2.3 — Audit-logs izin matrisi yalanı
`rolePermissions.ts`'teki MATRIX, `audit-logs` kategorisi için NV Maker dışındaki her
role `view: false` diyordu ("bu bölümü göremezsiniz"). Gerçek `AuditLogs.ts`'in
`access.read` kuralı ise NV Maker'a `true`, diğer herkese `{ userEmail: { equals:
req.user.email } }` (kendi kayıtlarıyla sınırlı ama GÖRÜNÜR) dönüyordu — yani
Denetim Kayıtları sidebar'da her rol için listeleniyordu, sadece filtrelenmiş. Matris
3 roldeki kullanıcıya yanlış bilgi veriyordu. Düzeltildi + gerçek access
fonksiyonunu çağıran bir test eklendi (matris tekrar drift ederse test kırılır).

### 2.4 — `/kampanyalar` güncellenmiyor (asıl bildirilen bug)
İki ayrı, birleşen neden vardı:
1. **Maskeleme:** `kampanyalar/page.tsx` ve `blog/page.tsx`, CMS'e ulaşılamadığında
   19+3 (kampanya) / 12 (blog) adet HARDCODED sahte içerikle fallback yapıyordu.
   CMS ölse veya yavaşlasa bile ziyaretçi hep "bir şeyler" görüyordu — kimse fark
   etmiyordu. Kaldırıldı; `ContentUnavailable.tsx` artık gerçek durumu gösteriyor
   (fetch hatası vs. gerçekten boş liste ayrı mesajlarla).
2. **Stale cache:** `revalidateTag` tek başına, ISR ile prerender edilmiş bir
   sayfanın HTML kabuğunu, o tag'li fetch yeniden çalışana kadar bayat bırakıyor.
   Bu, publish sonrası sayfanın bir süre eski içerik göstermeye devam etmesine yol
   açıyordu. `revalidatePath` eklendi (yeni `revalidateCampaignPaths` hook'u,
   `/`, `/kampanyalar`, `/kampanyalar/{slug}` için) — `/api/revalidate`'e path
   allowlist'i eklendi (`ALLOWED_PATH_PATTERNS`, tag'ler gibi keyfi path kabul
   etmiyor).

## 3) Bilinçli yapılmayanlar ve gerekçeleri

- **8 sayfadaki FAQ/feature-card/step-card fallback dizileri** (duyurular,
  vodafone-pay-kart, vodafone-pay-uygulama, faturana-yansit, aninda-bakiye,
  qr-ile-faturana-yansit, sikca-sorulan-sorular, ve cerez-politikasi'nin cookie-rows
  fallback'i) `/kampanyalar` ile AYNI maskeleme desenini taşıyor — bir arka plan
  ajanıyla denetlendi (bkz. bu dosyanın sonundaki tam liste). Bunları da düzeltmek
  8 ayrı sayfada ~15+ fallback bloğunun kaldırılması, her birine `ContentUnavailable`
  eklenmesi ve her sayfanın canlıda tek tek doğrulanması demek — kendi başına ayrı
  bir iş turu gerektiren büyüklükte. Bu turda SADECE brief'te açıkça istenen
  `/kampanyalar` (ve aynı anda bulunan `blog`) düzeltildi; kalanı bilinçli olarak
  bir sonraki tura bırakıldı, aşağıda tam liste var.
- **`site-haritasi`'nin NavLinks fallback'i ve `cerez-politikasi`'nin cookie-rows
  fallback'i** — aynı desen ama gerçek/çalışan içerik (fake pazarlama metni değil,
  gerçek menü linkleri/çerez satırları) gösteriyor; etki daha düşük, aynı nedenle
  bu turda dokunulmadı.
- **Media Faz C'nin "Kullanıldığı Yerler" otomatik listesi**, Pages'in `layout`
  bloklarındaki (`HeroBlock`, `LogoGridBlock` vb.) medya referanslarını taramıyor —
  Payload'ın düz `where` sorgusu, polimorfik `blocks` dizisi içine güvenli şekilde
  hedef alamıyor; yanlış eşleşme riski almaktansa kapsam dışı bırakıldı (kod
  içindeki yorum bunu açıklıyor).
- **`next build`'in CMS'e build-time'da ulaşamadığında BAŞARISIZ olması** —
  değerlendirildi, bilinçli olarak YAPILMADI: mevcut davranış (loglanan hata +
  boş/hata durumuyla statik sayfa üretimi) bir CI/deploy'u geçici bir CMS kesintisi
  yüzünden bloklamıyor; asıl güvenlik ağı artık ISR + `revalidateTag`/`revalidatePath`
  + bu turda eklenen dürüst boş-durum. Build'i başarısız yapmak, tamamen ilgisiz bir
  değişiklik için deploy'u durdurabilirdi.

## 4) Ortam / config gereksinimleri

- **`SITE_REVALIDATE_URL`** (cms tarafı) — `cms/.env.example`'da zaten var; eksikse
  artık `cms/src/env.ts`'te boot'ta gürültülü bir `console.warn` veriyor (önceden
  sadece her `pingRevalidate` çağrısında sessizce loglanıyordu). Eksik olması build'i
  DURDURMUYOR — sadece publish sonrası anlık revalidate yerine sitenin normal 1 saatlik
  ISR aralığına düşülüyor.
- **`REVALIDATE_SECRET`** — hem site hem cms `.env.example`'ında var, ikisinde de
  aynı olmalı (zaten mevcut bir gereksinimdi, değişmedi).
- Yeni DB kolonları (`Users.lastLoginAt/Ip/UserAgent`, `Media.mediaType/uploadedBy/
  usageUrl/usageNote`) `payload migrate:create`'in bu ortamda hâlâ bozuk olması
  nedeniyle (R-10, `ERR_REQUIRE_ASYNC_MODULE`) belgelenen "host Postgres'e karşı
  `next dev` çalıştır" workaround'uyla push edildi — prod deploy'da aynı adım
  gerekecek, ya da `payload migrate:create` düzelene kadar bu döngü devam edecek.

## 5) Rol-rol manuel doğrulama adımları

| Rol | Doğrulanan | Sonuç |
|---|---|---|
| Growth — Checker | Avatar yükleme (`/api/users/me/avatar`) | 200, `mediaType`/`uploadedBy` doğru dolduruldu |
| Growth — Maker | Media create → `mediaType`/`uploadedBy` otomatik | Doğrulandı |
| New Vertical — Checker | `/admin` iniş, "İncelemeni Bekleyen Kampanyalar" widget'ı, Audit Logs (self-scoped) | Doğrulandı |
| New Vertical — Maker | `/admin` iniş, "Taslaklarınız" widget'ı, Audit Logs (tüm kayıtlar) | Doğrulandı |
| (hepsi) | `/admin/waiting-approvals` → 404 | Doğrulandı |
| (hepsi) | Kategori oluşturma → otomatik slug + `-2` çakışma soneki | Doğrulandı (Türkçe karakterli test kategorisiyle) |
| Site ziyaretçisi | `/kampanyalar` filtre sekmeleri gerçek CMS kategorilerini gösteriyor ve filtreliyor | Doğrulandı |
| Site ziyaretçisi | Manuel `/api/revalidate` çağrısı (`paths` dahil) → sayfa güncelleniyor | Doğrulandı |
| (login) | "E-postamı hatırla" işaretle → giriş yap → sayfa yenile → e-posta dolu + işaretli | Doğrulandı |

## 6) Açık kalan riskler / teknik borç

1. **`payload migrate:create` hâlâ bozuk** (R-10) — her yeni DB kolonu için manuel
   `next dev`-against-host-Postgres workaround'u gerekiyor. Payload/tsx'in bir üst
   sürümü bu ESM/CJS interop sorununu çözebilir.
2. **8 sayfadaki fallback maskeleme deseni** (bkz. §3) düzeltilmedi — aynı sınıf
   bug, düşük-orta risk (CMS ölürse bu sayfalar da sahte içerik göstermeye devam
   eder). Aşağıda tam liste.
3. **Faz H'nin focus-ring düzeltmesi** bu ortamın tarayıcı otomasyonunda piksel
   seviyesinde doğrulanamadı (otomasyon aracı, script-tetiklemeli focus'ta gerçek
   `:focus` state'ini güvenilir yansıtmıyor) — CSS cascade/specificity analiziyle
   doğru olduğu teyit edildi, ama gerçek bir tarayıcıda manuel Tab-tuşu testi
   önerilir.
4. **`.env.example`'daki `SITE_REVALIDATE_URL` deploy ortamında gerçekten ayarlı mı**
   kontrol edilmeli — local Docker Compose'da doğru (`http://app:3000/api/revalidate`),
   ama prod/staging farklı bir compose/orkestrasyon kullanıyorsa manuel doğrulama
   gerekir.

## Ek: Faz E denetiminde bulunan, bu turda düzeltilmeyen "fallback maskeleme" dosyaları

| Dosya | Ne maskeliyor |
|---|---|
| `src/app/duyurular/DuyurularAccordion.tsx` | 3 sahte duyuru |
| `src/app/vodafone-pay-kart/page.tsx` | 5 sahte FAQ |
| `src/app/vodafone-pay-uygulama/page.tsx` | 6 sahte FAQ |
| `src/app/faturana-yansit/page.tsx` | 12 sahte FAQ + 3 sahte özellik kartı |
| `src/app/aninda-bakiye/page.tsx` | 17 sahte FAQ + 3 kart + 6 adım |
| `src/app/qr-ile-faturana-yansit/page.tsx` | 6 sahte FAQ + 3 kart + 6 adım |
| `src/app/sikca-sorulan-sorular/FaqCategoryFilter.tsx` | ~18 sahte FAQ (6 kategori) |
| `src/app/cerez-politikasi/page.tsx` (cookieRows) | Çerez tablosu (gerçek içerik, düşük risk) |
| `src/app/site-haritasi/page.tsx` (fallbackGroups) | Menü linkleri (gerçek içerik, düşük risk) |
