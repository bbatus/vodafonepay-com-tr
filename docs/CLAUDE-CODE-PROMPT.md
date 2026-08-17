# Vodafone Pay CMS — Düzeltme & İyileştirme Turu

> Bu dosyanın tamamını Claude Code'a tek prompt olarak ver.

---

## 0. Bağlam

`vodafonepaycomtr` monorepo'su üzerinde çalışıyorsun:

- **Site (frontend):** repo kökü — Next.js 16 App Router + React 19 + Tailwind v4 + shadcn/ui, `localhost:3000`
- **CMS:** `cms/` — Payload CMS 3.x + Postgres + MinIO (S3), admin paneli `localhost:3010/admin`
- **Aktif çalışma kopyası:** `.claude/worktrees/selam-login-disable-temp-725fb7/` (bu turdaki tüm CMS bileşenleri burada; `main` branch'ine henüz merge edilmemiş). Önce `git worktree list` ile doğrula, hangi kopyanın canlı olduğunu teyit et ve **tüm değişiklikleri o kopyada** yap.

Rollere `cms/src/access/roles.ts` içinden bak. 4 rol var:

| Sabit | Anlamı |
|---|---|
| `NEW_VERTICAL_MAKER` | Her şeyde tam CRUD + publish, kullanıcı yönetimi |
| `NEW_VERTICAL_CHECKER` | Her şeyde update + publish, create yok |
| `GROWTH_MAKER` | Sadece Campaigns; create/update var, **publish yok** |
| `GROWTH_CHECKER` | Sadece Campaigns; onaylar/reddeder |

---

## 1. Uyman gereken repo kuralları (AGENTS.md'den — pazarlık yok)

1. **`payload generate:importmap` bu ortamda bozuk** (`ERR_REQUIRE_ASYNC_MODULE`). Eklediğin/sildiğin her custom admin bileşenini `cms/src/app/(payload)/admin/importMap.js` içinde **elle** ekle/çıkar. importMap'te olmayan bileşen sessizce render edilmez — hata da vermez.
2. **Her custom Payload admin bileşeni** UI metinlerini `useAdminLocale()` + `useDbStrings()` (client) veya `loadDbStrings()` (server) üzerinden basmak zorunda. Türkçe/İngilizce string hardcode etme. Yeni metinleri `cms/src/lib/translationDefaults.ts`'e ekle — `onInit` bunları Translations koleksiyonuna seed'liyor.
3. Next.js 16 bu modelin eğitim verisinden farklı. Emin olmadığın API için `node_modules/next/dist/docs/` altındaki rehberi oku.
4. TypeScript strict, `any` yok. Named export, PascalCase bileşen, camelCase util, 2 space, Tailwind utility (site tarafı), inline style yok (site tarafı).
5. Büyük değişiklikten sonra: `npm run check` (lint + typecheck + test + build) hem kökte hem `cms/` içinde. Coverage'ı düşürme — yeni access/hook/transform mantığı için Vitest testi yaz.
6. Dockerfile veya bağımlılık değişirse `scripts/trivy-scan.sh all`; büyük komponent/refactor sonrası SonarQube taraması (`tools/sonarqube/docker-compose.yml` + `scripts/sonar-scan.sh`).
7. Yeni npm paketi eklemekten kaçın. Zorundaysan bilinen açığı olmadığını doğrula (repo'nun sıfır-bilinen-açık politikası var — bu yüzden `xlsx`/SheetJS reddedildi, export'lar CSV).

---

## 2. Ben zaten inceledim — bulgularım

Bunları yeniden araştırmana gerek yok, ama **her birini kodda teyit et**, körlemesine uygulama.

### 2.1 `/kampanyalar` güncellenmiyor bug'ı — kök neden bulundu

Üç ayrı kusur üst üste biniyor:

**(a) Build-time fallback sayfaya gömülmüş.**
`src/app/kampanyalar/page.tsx` içinde `fallbackFavorites` (3 kart) ve `fallbackAllCampaigns` (19 kart) diye hardcoded diziler var. `getCampaigns()` `null` dönerse bunlar kullanılıyor. Kanıt:

```
.next/server/app/kampanyalar.html
  → /images/camp-01 … /images/camp-19  (hardcoded fallback)
  → localhost:9000 (MinIO) URL sayısı: 0
```

Yani `next build` sırasında CMS'e ulaşılamamış, sayfa 19 sahte kampanyayla statik olarak render edilmiş ve `initialRevalidateSeconds: 3600` ile öyle donmuş. Kullanıcının gördüğü "hiç değişmeyen liste" tam olarak bu dizi. Fallback, CMS arızasını **görünmez** hale getiriyor — asıl tasarım hatası bu.

**(b) Revalidate webhook'u CMS Docker dışında çalışırken sessizce devre dışı.**
`cms/src/hooks/revalidate.ts` → `pingRevalidate()` `SITE_REVALIDATE_URL` veya `REVALIDATE_SECRET` yoksa `console.warn` basıp **return** ediyor. `SITE_REVALIDATE_URL` sadece `docker-compose.yml`'de `cms` servisine veriliyor (`http://app:3000/api/revalidate`); kök `.env`'de yok ve `cms/.env.local` **boş**. CMS'i `cd cms && npm run dev` ile çalıştırırsan hiçbir revalidate isteği gitmez.

**(c) Cache tag'leri aslında doğru bağlı** — yani sorun tag'lerde değil:
```
.next/server/app/index.meta       → x-next-cache-tags: … campaigns,faq-items,…
.next/server/app/kampanyalar.meta → x-next-cache-tags: … campaigns,faq-items,…
```

**Yapılacak:**
- `page.tsx`'teki `fallbackFavorites` / `fallbackAllCampaigns` dizilerini **sil**. CMS boş/erişilemez ise sahte içerik değil, dürüst bir boş durum (veya hata) göster. Aynı denetimi diğer sayfalardaki hardcoded fallback'ler için de yap (`src/app/**` içinde `fallback` ile grep'le) ve hangilerinin gerçek "henüz içerik girilmedi" fallback'i, hangilerinin "CMS öldü, kimse fark etmesin" maskesi olduğunu ayır — ikincileri kaldır.
- `src/app/api/revalidate/route.ts`'e `revalidatePath` desteği ekle: body `{ tag?: string, paths?: string[] }` kabul etsin, `paths` da tıpkı `ALLOWED_TAGS` gibi bir allowlist'ten geçsin. `cms/src/hooks/revalidate.ts`'i hem tag hem ilgili path'leri (`/`, `/kampanyalar`, `/kampanyalar/{slug}`) gönderecek şekilde genişlet. Tag ile route cache arasındaki bağ kopsa bile sayfa yenilensin.
- `SITE_REVALIDATE_URL`'i `.env.example` + `cms/.env.example`'a ekle ve `cms/src/env.ts`'te eksikse **boot'ta gürültülü uyarı** ver (sessizce yutma).
- Ayrıca `src/lib/cms.ts` → `cmsFetch` null dönerken sadece `console.error` basıyor; build sırasında CMS erişilemezse `next build`'in **başarısız olması** daha doğru olabilir — bunu değerlendir ve kararını raporda gerekçelendir.

**Bonus, aynı dosyada bulunan iki bug:**
- `src/components/FilterTabs.tsx` → `filterCategories` ve `CMS_CATEGORY_TO_FILTER` **hardcoded** (`"aninda-bakiye" | "faturana-yansit" | "kart"`). Categories koleksiyonu tam da bunu düzeltmek için yapılmıştı ama site tarafı hâlâ sabit — CMS'ten yeni kategori eklenince filtre sekmesi çıkmıyor. Filtre sekmelerini CMS'teki Categories'ten (`order`'a göre sıralı) dinamik besle.
- `src/components/CardListGrid.tsx` → `key={item.title}` kullanıyor; fallback listesinde birebir aynı başlıklı kayıtlar var ("1 TL'ye Hayat Su Kapında!" iki kez vb.), gerçek veride de olabilir. Stabil `id` bazlı key'e geçir.

### 2.2 Profil fotoğrafı "yüklenemedi" — en olası kök neden

`cms/src/components/AccountForm.tsx` → `handleAvatarChange`:

```ts
const mediaRes = await fetch("/api/media", { method: "POST", … });
if (!mediaRes.ok) throw new Error(String(mediaRes.status));  // ← gövde hiç okunmuyor
…
} catch { toast.error(t("accountForm.avatarError")); }        // ← "Fotoğraf yüklenemedi."
```

Sunucunun döndürdüğü gerçek hata mesajı tamamen atılıyor; kullanıcı her koşulda aynı jenerik metni görüyor. Asıl sebep büyük ihtimalle şu:

`cms/src/access/roles.ts` → `mediaCreate` **sadece** `NEW_VERTICAL_MAKER` ve `GROWTH_MAKER`'a izin veriyor. Yani `NEW_VERTICAL_CHECKER` veya `GROWTH_CHECKER` olarak giriş yapan biri `POST /api/media` çağrısında **403** alır ve kendi profil fotoğrafını asla yükleyemez. Önce hangi rolle test edildiğini teyit et.

Diğer aday sebepler (sırayla ele):
1. MinIO erişilemiyor / bucket yok → 500.
2. `Media.alt` `required: true`; `_payload` JSON'u doğru gitmezse "Lütfen geçersiz alanı düzeltin: Alt".
3. `cms/src/collections/Users.ts` → `enforceAvatarSizeLimit` 2MB üstünde düz `Error` fırlatıyor; istemci bunu okumadığı için Türkçe mesaj kayboluyor.
4. `Media.upload.mimeTypes: ["image/*","video/*"]` — jpg geçmeli, ama dosya uzantısı/mimetype uyuşmazlığı ihtimalini ele.

**Yapılacak:**
- Hata yolunu düzelt: yanıt gövdesini oku (`json.errors?.[0]?.message`) ve toast'ta **gerçek sebebi** göster; console'a da tam yanıtı bas.
- Yükleme öncesi istemcide doğrula: 2MB limiti, izinli mime tipleri — sunucuya gitmeden anlamlı mesaj ver.
- İzin sorununu **Media create erişimini genişletmeden** çöz: profil fotoğrafı için ayrı bir Payload custom endpoint (örn. `POST /api/users/me/avatar`) yaz; `overrideAccess: true` ile media dokümanını oluşturup sadece istekte bulunan kullanıcının `avatar` alanına bağlasın. Böylece bir Checker içerik medyası yükleyemez ama kendi fotoğrafını yükleyebilir. Bu endpoint için access testi yaz.

### 2.3 Sidebar TR/EN değişmiyor — kök neden bulundu

`cms/src/collections/*.ts` dosyalarının **hiçbirinde `labels` tanımı yok**. Payload bu durumda slug'dan İngilizce etiket türetiyor ("Faq Items", "Blog Posts", "Nav Links"). Ayrıca her koleksiyonda `admin.group` **sabit Türkçe string** (`"İçerik"`, `"Sistem"`) — dil değişince asla değişmiyor.

Buna karşılık `ContentManagementNavLink` gibi custom bileşenler `useDbStrings()` kullandığı için **çeviriliyor**. Kullanıcının gözlemlediği tutarsızlık tam olarak bu ayrım.

**Yapılacak:**
- Her koleksiyona `labels: { singular, plural }` ve `admin.group` değerlerini locale-farkında ver. Payload `StaticLabel`'ı `Record<languageCode, string>` olarak kabul eder (`{ tr: "…", en: "…" }`) — en basit ve en sağlam yol bu.
- Kullanıcı bunların **DB'den** gelmesini istedi. Bunu şöyle kur: `onInit`'te Translations koleksiyonunu modül seviyesinde bir cache'e yükle, `labels`/`group` alanlarını `LabelFunction` olarak yaz ve cache'ten oku; cache'te yoksa `translationDefaults.ts`'teki statik TR/EN değerine düş. Translations koleksiyonuna `afterChange` hook'u ekleyip cache'i tazele. **Asla** DB erişilemediğinde sidebar'ı boş/`undefined` etiketle bırakma.
- `cms/src/lib/collectionLabels.ts` içindeki `COLLECTION_LABELS` haritası ile bu yeni kaynağı tek bir doğruluk kaynağında birleştir — iki ayrı hardcoded liste kalmasın (dashboard ve İçerik Yönetimi sekmeleri de oradan besleniyor).
- Sidebar'daki grup başlıkları, custom nav linkleri, dashboard başlıkları, İçerik Yönetimi sekme adları — hepsi dil değiştirince değişmeli. Bitirdikten sonra panelde TR→EN geçip **sidebar'da kalan tek bir Türkçe string olmadığını** doğrula.

### 2.4 Diğer tespitler

- `cms/src/collections/AuditLogs.ts` → `ip` alanı **var** ama `admin.defaultColumns` içinde **yok**; alanların `label`'ı da eksik (`userEmail`, `ip` vb. İngilizce slug görünüyor).
- `cms/src/collections/Users.ts` → kullanıcı kaydında `lastLoginIp`/`lastLoginAt` gibi bir alan **yok**. `loginHistory` sadece `type: "ui"` bir alan; AuditLogs'u sorguluyor. Bu yüzden `UsersExportButton` CSV'sine IP koyacak veri kaynağı yok.
- `cms/src/collections/Media.ts` → alan seti sadece `alt` + `caption`. Ne tip ayrımı, ne yükleyen kullanıcı, ne kullanım linki var.
- `cms/src/lib/rolePermissions.ts` → `audit-logs` matrisi "sadece NV_MAKER görebilir" diyor ama `AuditLogs.access.read` artık her kullanıcıya kendi kayıtlarını açıyor. Matris ile gerçek access kuralı **senkron değil**; HelpButton yanlış bilgi veriyor. Düzelt.

---

## 3. Yapılacak işler

### A — Kullanıcı & güvenlik

**A1. Son giriş IP'sini kullanıcı kaydında tut**
`Users` koleksiyonuna mevcut alanları bozmadan ekle: `lastLoginAt` (date), `lastLoginIp` (text), `lastLoginUserAgent` (text) — hepsi `readOnly`, `admin.position: "sidebar"`. `hooks.afterLogin` içinde `writeAuditLog` çağrısının yanında bu alanları da güncelle (IP çıkarımı için `cms/src/hooks/audit.ts` → `ipOf()` yardımcısını tekrar kullan, kopyalama). `loginHistory` UI alanı (son 10 giriş tablosu) **kalsın** — bu ona ek.

**A2. Kullanıcı CSV export'una IP sütunu**
`UsersExportButton.tsx` başlığına **Son Giriş** ve **Son Giriş IP** sütunlarını ekle. Mevcut format korunsun: `;` ayraç + UTF-8 BOM (Türkçe-locale Excel için), tarihler `tr-TR`. Sütunlar: E-posta · Rol · Dil Tercihi · Son Giriş · Son Giriş IP · Oluşturulma · Güncellenme.

**A3. Audit Logs'a IP sütunu**
`AuditLogs.admin.defaultColumns`'a `ip` ekle. Tüm alanlara TR/EN `label` ver. `userAgent` liste görünümünde taşmasın.

**A4. Audit Logs CSV export**
`UsersExportButton` ile aynı desende bir `AuditLogsExportButton` yaz (`beforeList` slot'una tak). Türkçe karakter garantisi için aynı BOM + `;` yaklaşımı. **Önemli:** listede uygulanmış filtreleri/aramayı export'a taşı — kullanıcı 10.000 satırın hepsini değil, ekranda gördüğünü indirmek ister. Ortak CSV mantığını (`csvEscape`, BOM'lu blob, indirme) iki bileşenin de kullanacağı bir `cms/src/lib/csv.ts`'e çıkar; kopyala-yapıştır yapma.

### B — Profil / hesap sayfası

**B1. Profil fotoğrafı yükleme hatasını çöz** — bkz. §2.2. Gerçek hata mesajı + istemci ön-doğrulama + izin sorununun dar kapsamlı çözümü.

**B2. Hesap sayfası UI/UX'i sistemin geri kalanıyla aynı dile getir**
`AccountForm.tsx`'te ham `<input type="file">` ve ham `<select>` kullanılıyor — panelin geri kalanı Payload'ın `.btn`, `.field-type`, `.btn--style-primary` sınıflarını ve `cms/src/styles/custom.css`'teki Vodafone temasını kullanıyor. Bunları hizala:
- Dosya seçimi: gizli `<input type="file">` + Payload `.btn--style-secondary` görünümlü gerçek buton, seçili dosya adı ve yükleme durumu görünsün.
- Dil dropdown'u: Payload'ın kendi select stilini (`.field-type.select`) ya da custom.css'e eklenecek eşdeğer bir stili kullansın; kenarlık/radius/odak halkası diğer inputlarla birebir aynı olsun.
- Bu sayfadaki inline `style={{}}` bloklarının çoğunu `custom.css`'e taşı — tema değişikliği tek yerden yönetilebilsin.

**B3. Profil sekmesine "Çıkış Yap" butonu**
`AccountForm`'un altına, `.btn--style-secondary` (veya danger) görünümlü bir logout butonu. Payload'ın kendi logout route'unu kullan (`/admin/logout`) — kendi session temizleme mantığını yazma. Metin `translationDefaults`'tan gelsin.

### C — Media

**C1. Görsel / Video ayrımı**
`Media`'ya `mediaType` (select: `image` | `video`) alanı ekle, `beforeChange` hook'unda dosyanın `mimeType`'ından **otomatik** doldur (kullanıcı elle seçmesin, ama filtrelenebilir olsun). Liste görünümünün üstüne "Tümü / Görseller / Videolar" sekmeleri koy (mevcut `beforeList` slot'u + Payload'ın `where` query parametresi). Mevcut aktif sütun ve filtreler kalsın — bu onların üstüne bir üst seviye ayrım.

**C2. "Nerede kullanılıyor" alanı**
`usageUrl` (text, URL doğrulamalı) + `usageNote` (text) alanları ekle: "bu görsel hangi kampanyada/sayfada kullanılıyor". Açıklama metni net olsun.
**Ayrıca değerlendir ve raporda gerekçelendir:** Payload zaten hangi dokümanın bu medyayı referans aldığını biliyor (relationship/upload alanları). Elle link girmek yerine gerçek kullanım yerlerini otomatik listeleyen bir `type: "ui"` alanı (ilgili koleksiyonlarda `where[image][equals]=<mediaId>` sorgusu) çok daha değerli olur — elle girilen link bayatlar. İkisini birden yap: otomatik "Kullanıldığı yerler" listesi + elle girilebilen serbest not/link.

**C3. Yükleyen kullanıcı**
`uploadedBy` (relationship → users, readOnly) alanı ekle, `beforeChange`'de `operation === "create"` iken `req.user.id`'den doldur (`Campaigns.ts`'teki `setCreatedBy` hook'unun birebir aynısı — o mantığı ortak bir yardımcıya çıkar). `defaultColumns`'a ekle. **Mevcut kayıtlar için boş kalacak** — bunu raporda belirt, geriye dönük doldurma yok.

### D — Dashboard & rota

**D1. Rol bazlı dashboard**
Şu an `DashboardWidgets` `beforeDashboard` slot'unda; Payload'ın varsayılan koleksiyon kartları altta duruyor. Her rol için gerçekten anlamlı bir dashboard istiyoruz:

- **Tüm roller (ortak):** son giriş yapanlar tablosu (kullanıcı · rol · tarih · IP) + farklı kullanıcı sayısı. Bu zaten var, koru.
- **Tüm roller (ortak):** CMS içerik özeti — kaç içerik yönetiliyor, kaç tanesi yayında, kaç taslak, **kaç onay almış**, **kaç reddedilmiş**. Onaylanan/reddedilen sayıları `audit-logs`'tan (`action: publish` / `action: rejected`) geliyor — `WaitingApprovalsView.tsx` → `loadCounts()` bunu zaten yapıyor, o mantığı dashboard'a taşı.
- **Checker rolleri:** "üzerinde bekleyen onaylar" — incelemesini bekleyen taslakların canlı listesi, her satırda açan kullanıcı + doğrudan incele linki.
- **Maker rolleri:** kendi kaydedip onaya gönderdiği, hâlâ bekleyen taslaklar + reddedilenler (red sebebiyle birlikte).

Sidebar zaten ilgili yerlere yönlendirdiği için dashboard **sayı + kısayol** odaklı olsun, içerik yönetimi ekranını kopyalamasın.

`beforeDashboard` slot'unda kalmak yerine `admin.components.views.dashboard.Component` ile tam override etmenin daha temiz olup olmadığını değerlendir; kararını raporda gerekçelendir.

**D2. "Bekleyen Onaylar" sayfasını tamamen kaldır**
Karar verildi: sayfa **komple silinecek**, içeriği dashboard'a taşınacak.
- Sil: `cms/src/components/WaitingApprovalsView.tsx`, `cms/src/components/WaitingApprovalsNavLink.tsx`
- `payload.config.ts`'ten `views.waitingApprovals` ve `afterNavLinks` içindeki `WaitingApprovalsNavLink` kaydını çıkar
- `importMap.js`'ten ilgili iki import + iki map girdisini çıkar
- `translationDefaults.ts`'teki `waitingApprovals.*` anahtarlarını dashboard'ın kullanacağı anahtarlara taşı (silinen anahtarların DB'de bıraktığı yetim satırlar için ne yapılacağını raporda belirt)
- `/admin/waiting-approvals` route'unun gerçekten 404 verdiğini doğrula

**D3. Her rol login'den sonra dashboard'a gitsin**
Hangi rolle girilirse girilsin ilk açılan ekran `/admin` (dashboard) olsun. Şu an bir rolün ilk gördüğü ekranın koleksiyon listesi veya yetkisiz bir sayfa olmadığını **4 rolün her biriyle** doğrula. Payload'ın login redirect davranışını (`redirect` query parametresi, `admin.routes`) incele; gerekiyorsa yönlendirmeyi açıkça sabitle.

**D4. Rol izin matrisini gerçekle senkronla**
`cms/src/lib/rolePermissions.ts` → `audit-logs` satırı gerçek `AuditLogs.access.read` kuralını yansıtmıyor (bkz. §2.4). Tüm matrisi koleksiyonların gerçek `access` bloklarına karşı satır satır denetle, sapmaları düzelt ve matrisi doğrulayan bir test yaz (matris ile access fonksiyonlarının aynı sonucu vermesi).

### E — Kategori & kampanya

**E1. Kategori slug'ını otomatikleştir**
Karar verildi: **otomatik üret + gizle.**
Gerçek kampanya URL'i kategori içermiyor (`https://www.vodafonepay.com.tr/kampanyalar/pazaramada-50-indirim`), dolayısıyla kullanıcıdan "Kart" kategorisi için slug istemek kafa karıştırıyor.
- Kullanıcı sadece `label` girsin ("Kart"). `slug` bir `beforeValidate` hook'unda label'dan otomatik türetilsin — **Türkçe karakter transliterasyonu şart** (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u, İ→i), küçük harf, boşluk→tire, tekilleştirilmiş tire, baştaki/sondaki tire kırpılmış.
- `slug` formda `readOnly` + `admin.position: "sidebar"` teknik alan olarak kalsın; açıklaması "site filtre sekmelerinin teknik anahtarı, URL'de görünmez" desin.
- Mevcut slug'lar **değişmesin** (kayıtlıysa yeniden türetme) — site tarafındaki filtre eşlemesini kırar.
- Çakışma durumunu ele: aynı label'dan aynı slug çıkarsa `-2` gibi bir sonek ver, `unique` ihlaliyle 500 atma.
- Transliterasyon + çakışma mantığı için birim testi yaz.

**E2. Site filtre sekmelerini CMS'e bağla** — bkz. §2.1 bonus. `FilterTabs` artık Categories'ten beslensin.

**E3. `/kampanyalar` bug'ı** — bkz. §2.1. Fallback dizilerini kaldır, `revalidatePath` desteği ekle, `SITE_REVALIDATE_URL` eksikliğini gürültülü hale getir.

### F — Login

**F1. "Beni hatırla" checkbox'ı**
Karar verildi: **sadece e-posta hatırlansın.**
Login formuna checkbox ekle; işaretliyse e-posta `localStorage`'a yazılsın ve sonraki açılışta e-posta alanı dolu gelsin, checkbox işaretli görünsün. İşaret kaldırılırsa kayıt silinsin. **Şifre asla saklanmaz.** Payload'ın httpOnly oturum cookie'sine veya JWT süresine dokunma — `Users.auth.tokenExpiration` (12 saat) olduğu gibi kalsın; nedeni `Users.ts`'teki yorumda yazıyor, o kararı bozma.
Uygulama notu: `beforeLogin` slot'u login formunun **öncesinde** render oluyor. Checkbox'ı forma yerleştirmek için DOM'a müdahale etmen gerekirse bunu kırılgan bir seçici zinciriyle değil, mümkün olan en dayanıklı şekilde yap ve seçici bozulursa **sessizce devre dışı kalsın**, login'i kırmasın. Alternatif olarak Payload'ın kendi login view override mekanizmasını değerlendir ve tercihini raporda gerekçelendir.

### G — i18n

**G1. Sidebar ve tüm koleksiyon etiketlerini DB destekli TR/EN yap** — bkz. §2.3. Bu maddede "tamamlandı" demeden önce paneli TR ve EN'de yan yana aç, sidebar/topbar/grup başlıkları/dashboard/İçerik Yönetimi sekmelerinde **çevrilmeyen tek bir string kalmadığını** teyit et.

### H — Admin chrome UI/UX

**H1. Sidebar / header / topbar / alt bar gözden geçirmesi**
Kullanıcı **yapıyı değiştirmemizi istemiyor** — sadece kullanım ve görünüm kusurlarını istiyor. Sadece renk/stil değil, gerçek kullanılabilirlik sorunlarını ara:

- **Responsive:** dar ekranda (< 1024px, < 768px) sidebar davranışı, taşmalar, yatay scroll, dokunma hedefi boyutları. `custom.css` login panelini 960px altında gizliyor ama nav/tablolar için benzer bir düşünce yok.
- **Sidebar:** uzun koleksiyon adlarında metin taşması/kırpılması, aktif durum görünürlüğü, grup başlığı hiyerarşisi, çok sayıda koleksiyonda scroll davranışı, custom nav linklerin (`ContentManagementNavLink`) yerleşiminin Payload'ın kendi nav gruplarıyla hizası.
- **Topbar / breadcrumb:** uzun başlıklarda davranış, sticky olup olmaması, dil değiştirici ve avatar ikonunun hizası/tıklama alanı.
- **Tablolar:** geniş koleksiyonlarda yatay scroll, sütun taşması, `userAgent` gibi uzun metin alanları.
- **Boş durumlar / yükleniyor durumları:** custom bileşenlerin (`DashboardWidgets`, `ContentManagementApp`, `LoginHistoryField`) boş ve yükleniyor halleri tutarlı mı.
- **Erişilebilirlik:** klavye ile gezinme, odak halkaları (`custom.css` odak halkasını sadece `.field-type input` için tanımlıyor), buton/label eşleşmeleri, kontrast.

Bulduğun her sorunu **önce listele**, sonra düzelt. Yapıyı (DOM ağacını, Payload'ın kendi bileşen yerleşimini) değiştirme; düzeltmeler `custom.css` ve custom bileşenlerin kendi içinde kalsın.

---

## 4. Çalışma şekli

1. Önce **keşif**: yukarıdaki bulguları kodda teyit et, katılmadığın yeri gerekçesiyle söyle. Bulgularım yanlışsa düzelt — körü körüne uygulama.
2. Sonra **plan**: maddeleri bağımlılıklarına göre sırala ve bana onaylat.
3. Sonra **uygulama**: mantıksal olarak gruplanmış commit'ler halinde ilerle. Her commit tek başına derlenebilir olsun.
4. Ajan takımı kullanacaksan **her ajan kendi worktree branch'inde** çalışsın, sonunda merge conflict'leri sen çöz (AGENTS.md kuralı).
5. Bitirmeden önce: `npm run check` hem kökte hem `cms/`'te temiz geçsin. Yeni access/hook/transform mantığı için test yaz.
6. **Kendi kendini doğrula:** CMS'i ve siteyi ayağa kaldır, 4 rolün her biriyle giriş yap ve şunları fiilen dene — profil fotoğrafı yükleme, kullanıcı CSV export, audit log CSV export, dashboard içeriği, TR/EN geçişi, kampanya ekle/sil sonrası `/kampanyalar`'ın güncellenmesi. "Kod doğru görünüyor" yeterli değil.

---

## 5. İstenen çıktı

Tüm iş bittiğinde `docs/` altına Türkçe bir markdown raporu yaz. İçermesi gerekenler:

- **Madde madde ne yapıldı** — her başlık için değişen dosyalar ve neden o yaklaşımın seçildiği.
- **Kök neden analizleri** — özellikle `/kampanyalar` bug'ı ve profil fotoğrafı hatası için: gerçek sebep neydi, nasıl doğrulandı, tekrar olmaması için ne yapıldı.
- **Bilinçli olarak yapılmayanlar** ve gerekçeleri (örn. "beni hatırla" neden oturum süresini uzatmıyor, mevcut Media kayıtlarında `uploadedBy` neden boş).
- **Ortam/konfigürasyon gereksinimleri** — `SITE_REVALIDATE_URL` gibi, yanlış kurulduğunda sessizce bozulan her şey.
- **Manuel doğrulama adımları** — bir sonraki kişinin bu değişiklikleri nasıl test edeceği, rol rol.
- **Açık kalan riskler / teknik borç.**
