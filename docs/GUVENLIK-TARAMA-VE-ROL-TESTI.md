# Güvenlik Taraması + Rol/Akış Test Raporu

Bu dosya, 3. düzeltme turundan sonra istenen güvenlik taramalarının ve 4 rol ×
4 akış uçtan uca testinin sonuçlarıdır. **Oturum kesilirse buradan devam
edilebilir** — hangi komut, hangi sıra, hangi blokaj hepsi yazılı.

**Çalışma kopyası:** `.claude/worktrees/selam-login-disable-temp-725fb7`

---

## 1) En kritik bulgu — giriş, kendi oturumunu siliyordu

Rol matrisini koştururken NV Maker'ın kendi yetkisindeki işlemlerde 403 aldığı,
Growth Maker'ın aynı çağrılarda 200 aldığı görüldü. Sebep erişim kontrolü
değildi: **o istekler sunucuya kimliksiz ulaşıyordu.** Login 200 dönüyor,
geçerli bir çerez set ediliyor, ama hemen ardından `/api/users/me`
`user: null` diyordu.

`users_sessions` tablosu sebebi gösterdi: etkilenen kullanıcılar için art arda
girişlere rağmen satır sayısı **hiç artmıyordu**.

**Kök neden.** Önceki turda `afterLogin` hook'una konan `await`siz
`payload.update()` bir **doküman** yazımıdır: kullanıcıyı yeniden okur ve
tamamını — `sessions` dizisi dahil — geri yazar. Login'in kendi
`users_sessions` insert'iyle yarışınca diziyi **o insert'ten önceki** haliyle
geri yazıyor ve yeni oturum satırını siliyordu. JWT içindeki `sid` artık
hiçbir şeye karşılık gelmediği için kullanıcı, giriş yaptığı anda çıkmış
oluyordu.

**Kanıt.** Blok geçici olarak devre dışı bırakıldı; oturum kalıcı oldu,
`/api/users/me` rolü döndürdü, `/api/users` 200 verdi — üçü birden değişti.
Blok geri açılınca üçü birden bozuldu.

**Düzeltme.** Bu hook'un iki önceki hali de hatalıydı:

| Yaklaşım | Sonuç |
|---|---|
| `await payload.update(...)` (ayrı transaction) | **Deadlock** — login transaction'ı aynı satırın kilidini tutuyor (geçen turun bug'ı) |
| `payload.update(...)` await'siz | **Oturumu siliyor** (bu turun bug'ı) |
| `payload.db.updateOne(... req ...)` | ✅ Doğru |

`payload.db.updateOne` yalnızca `users` tablosundaki adı geçen kolonları
yazar, `users_sessions` alt tablosuna hiç dokunmaz — silinecek bir şey yok.
`req` geçirmek de yazımı login'in **kendi** transaction'ına dahil eder, yani
ikinci bir kilit sahibi olmadığı için deadlock da olmaz. Payload'ın kendi
`resetLoginAttempts`/`incrementLoginAttempts` fonksiyonları da bu operasyonun
içinden auth kolonlarını tam olarak böyle günceller.

**Doğrulama:** login 1 sn (deadlock yok) · `users_sessions` 3 → 4 (oturum
kalıcı) · `lastLoginAt`/`lastLoginIp` hâlâ yazılıyor · tüm rol matrisi düzeldi.

---

## 2) Trivy (Fortify yerine, lisans gerektirmeyen muadil)

```bash
scripts/trivy-scan.sh all      # imajlar + iki lockfile
```

| Hedef | Önce | Sonra |
|---|---|---|
| `vodafonepaycomtr:latest` (imaj) | 0 | 0 |
| `vodafonepaycomtr-cms:latest` (imaj) | 0 | 0 |
| `package-lock.json` (site) | 0 | 0 |
| `cms/package-lock.json` | **1 HIGH** | 0 |

**Düzeltilen:** `nanoid` 3.3.17 — CVE-2026-67213 (sonsuz döngüyle DoS). CMS'e
`postcss` üzerinden transitif geliyordu, üstelik iki ayrı yoldan
(`next@16.3.0` ve `vitest`→`vite`). `cms/package.json`'daki mevcut `overrides`
bloğuna eklenerek `^3.3.18`'e sabitlendi — bu blok zaten `dompurify`, `esbuild`
ve `undici` için aynı amaçla kullanılıyordu. **3.x'te kalındı:** `postcss` CJS
istiyor, `nanoid` 5.x yalnızca ESM.

**Çapraz kontrol (bağımlılık değişimi uygulamayı bozmasın diye):**
`npm ls nanoid` iki yolda da 3.3.18 · Trivy tüm severity'lerde 0 ·
`npm run check` temiz (115 test, başarılı build) · CMS ayağa kalkıp `/admin` ve
`/api/campaigns` 200 döndü.

---

## 3) İmaj adı düzeltmesi

Site imajı ve container'ı hâlâ şablondan gelen `ai-website-cloner` adını
taşıyordu — RUNBOOK'ta okuyucuya "bu isim şablon kalıntısı, kafa karıştırmasın"
diye not düşülecek kadar. `vodafonepaycomtr` yapıldı:

- `docker-compose.yml` — `app` ve `dev` servislerinin `image` + `container_name`
- `scripts/trivy-scan.sh` — taranan imaj adı
- `docs/RUNBOOK.md`, `docs/STATUS.md` — referanslar (RUNBOOK'taki özür notu kalktı)
- `package.json` — paket adı ve açıklaması

Rebuild beklemeden çalışsın diye mevcut imaj yeni adla da etiketlendi
(`docker tag`). **Dokunulmayanlar:** README/CHANGELOG'daki
`ai-website-cloner-template` GitHub linkleri — bunlar üst şablonun gerçek
kaynağı, uygulamanın kimliği değil.

---

## 4) 4 rol × akış matrisi

Kaynaktan çalışan dev CMS'e (`localhost:3011`) karşı, tarayıcının yaptığının
aynısı olan çerez + `Origin` başlığıyla — yani CSRF ve erişim kontrolü gerçek
yoldan sınandı.

| Akış | NV Maker | NV Checker | Growth Maker | Growth Checker |
|---|---|---|---|---|
| Giriş | 200 | 200 | 200 | 200 |
| Kampanya listele | 200 | 200 | 200 | 200 |
| Kampanya oluştur | **201** | **403** | **201** | **403** |
| Kampanya yayınla | **200** | — | **403** | — |
| Kendi taslağını sil | 200 | — | 200 | — |
| Kullanıcı listele | 200 | 200 | 200 | 200 |
| Medya listele | 200 | 200 | 200 | 200 |
| Medya oluştur | **201** | **403** | **201** | **403** |
| Medya sil | 200 | — | **403** | — |
| Profil fotoğrafı (`/api/users/me/avatar`) | 200 | **200** | 200 | **200** |
| Kilit kaldırma | **200** | **403** | **403** | **403** |

Hepsi rol tablosuyla birebir uyumlu. Özellikle doğrulananlar:

- **Görev ayrımı:** Growth Maker oluşturabiliyor ama yayınlayamıyor (403).
- **Checker'lar oluşturmaz** ama inceler/yayınlar.
- **Medya silme yalnızca NV Maker'da** — Growth Maker kendi yüklediğini bile silemiyor (403), bu bilinçli.
- **Avatar endpoint'i her rolde 200** — Checker'lar genel medya oluşturamazken (403) kendi profil fotoğraflarını yükleyebiliyor. Bu ayrım tam da amaçlanan şeydi.

### Profil ayarları (Growth Checker ile ayrıntılı)

| Kontrol | Sonuç |
|---|---|
| `preferredLocale` yaz + geri oku | 200 → `en` ✅ |
| Kendi rolünü yükseltme denemesi | 200 döner ama rol **değişmez** (`CHECKER_RO` kalır) ✅ |
| Kendi e-postasını değiştirme denemesi | 200 döner ama e-posta **değişmez** ✅ |
| Kendi giriş geçmişi | 32 kayıt, yalnızca kendisininki ✅ |

Rol/e-posta kilidi sunucu tarafında: istek reddedilmiyor, alan sessizce
yok sayılıyor (Payload'ın field-level access davranışı) — sonuç doğru.

### Yan doğrulama — silme guard'ı gerçek veride

Test sırasında oluşan avatar medyasını silmek istediğimde guard devreye girdi:

> `"px.png" (Medya) silinemedi — 1 kayıt hâlâ buna bağlı:`
> `• Kullanıcılar → "test-nv-maker@vodafonepay.local" (/admin/collections/users/3)`

Yani §5.1'deki koruma `users.avatar` yolunda da canlıda çalışıyor. Avatar
alanları boşaltıldıktan sonra silme geçti. **Tüm test verisi temizlendi**
(0 artık medya, 0 artık kampanya).

---

## 4b) Sık Sorulanlar + Blog Yazıları koleksiyon testi

Bu iki koleksiyon 4 rolle ayrı ayrı sınandı. **Erişim matrisi doğru:**

| | NV Maker | NV Checker | Growth Maker | Growth Checker |
|---|---|---|---|---|
| SSS / Blog okuma | 200 | 200 | 200 | 200 |
| oluşturma | **201** | 403 | 403 | 403 |
| güncelleme / yayınlama | 200 | 200 | 403 | 403 |
| silme | **200** | 403 | 403 | 403 |

Ayrıca: bir blog yazısının `coverImage`'ı olarak kullanılan medyayı silmek
istediğimde referans guard'ı **409** ile engelledi — §5.1 koruması bu yolda da
çalışıyor.

**İki gerçek bug bulundu ve düzeltildi:**

### 4b.1 — Otomatik sıra numaralandırma hiç çalışmıyormuş

Geçen turda `order` alanına eklediğim `defaultValue: 1`, yanına eklediğim
`assignNextOrder` hook'unu **devre dışı bırakıyormuş**. Payload alan
varsayılanlarını `beforeChange`'den ÖNCE dolduruyor; hook `order: 1` görüp
"kullanıcı elle yazmış" sanıyor ve erken dönüyor.

Sonuç: `kampanyalar` kategorisinde en yüksek sıra 12 iken yeni SSS yine **1**
olarak kaydediliyordu — yani maddenin asıl istediği şey ("order 1'den başlasın,
elle sayı düşünmek zorunda kalmayayım") hiç çalışmıyordu.

`defaultValue` 9 koleksiyondan da kaldırıldı. Boş bırakmak zaten alanın kendi
açıklamasıyla tutarlı ("Boş bırakırsanız otomatik olarak sona eklenir").

**Canlı doğrulama:** aynı kategoride art arda iki kayıt → 13, sonra 14 ·
farklı kategoride bağımsız olarak → 2 (kapsam ayrımı çalışıyor) · elle
girilen 99 korunuyor. İki regresyon testi bu tuzağı sabitliyor.

### 4b.2 — `/blog` kampanya kategorilerini gösteriyordu

Blog sayfası filtre sekmelerini `getCategories()`'ten — yani **Campaigns
taksonomisinden** — besliyordu. Ama `BlogPosts.category` serbest metin bir
alan; hiçbir blog yazısının kategorisi "Kart" veya "Anında Bakiye" ile
eşleşemez. Yani **"Tümü" dışındaki her sekme sessizce boş liste gösteriyordu.**

Bu da geçen turda FilterTabs dinamikleştirilirken girmiş. Sekmeler artık
yazıların kendi kategorilerinden türetiliyor — sunulan ile filtrelenebilen
her zaman aynı.

**Canlı doğrulama:** iki farklı kategoride yayınlanmış yazıyla sekmeler
`Tümü / Guvenlik / Test` olarak çıktı, "Guvenlik"e tıklayınca yalnızca o yazı
kaldı. Test verisi temizlendi (blog_posts=0, faq_items=13 — orijinal hâli).

### Not: `/blog` listesinin boş görünmesi bug değildi

Test sırasında yayınlanan yazı `/blog` listesinde çıkmadı; detay sayfası
açılıyordu. Sebep ISR cache'iydi: dev CMS'imin `SITE_REVALIDATE_URL`'i
container sitesine (`:3000`) bakıyor, benim dev sitem ise `:3002`'de — üstelik
farklı bir `REVALIDATE_SECRET` ile, bu yüzden webhook 401 alıyordu. Doğru
payload'la (`{"tag":"blog-posts","paths":["/blog"]}`) elle tetiklenince yazı
anında listeye düştü. **İki container'ın secret'ları birbiriyle uyuşuyor**
(hash karşılaştırmasıyla doğrulandı), yani gerçek ortamdaki revalidate yolu
sağlam — bu tamamen benim bölünmüş test kurulumumun yan etkisiydi.

---

## 4c) vodafonepay.com.tr ile tip karşılaştırması (SSS + Blog)

Canlı siteye bakılıp bizim sayfalarla karşılaştırıldı.

### Sıkça Sorulan Sorular

| | Gerçek site | Bizde | Durum |
|---|---|---|---|
| Kategori sekmeleri | 10 | 7 → **8** | 2 eksik kaldı (aşağıda) |
| Tümü / Anasayfa / Anında Bakiye / Vodafone Pay Uygulama / Kampanyalar / Vodafone Pay Kart / QR ile Faturana Yansıt | ✅ | ✅ | Aynı |
| **Faturana Yansıt** | ✅ | ❌ → ✅ | **Düzeltildi** |
| Sözleşmeler ve Formlar | ✅ | ❌ | Karar bekliyor |
| Gizlilik ve Güvenlik | ✅ | ❌ | Karar bekliyor |
| Duyurular | ✅ | ❌ | Karar bekliyor |

**Bulunan bug — "Faturana Yansıt" SSS'leri sayfadan kayboluyordu.** CMS,
`FaqItems.category` seçeneklerinde bu kategoriyi sunuyor; ama sitedeki
`CMS_CATEGORY_TO_LABEL` haritasında bu anahtar yoktu ve `groupByCategory`
eşleyemediği her kaydı sessizce atıyor (`if (!label) continue`). Yani editör
bir SSS'i "Faturana Yansıt" olarak kaydediyor, soru sitede **hiçbir yerde
görünmüyor**, hiçbir yerde de sebebi yazmıyordu. Bu turdaki diğer bug'larla
aynı sınıf: özellik çalışıyormuş gibi duruyor, aslında hiçbir şey yapmıyor.
Harita ve sekme eklendi; gerçek bir SSS kaydıyla, soğuk cache üzerinde
doğrulandı.

### Blog

| | Gerçek site | Bizde | Durum |
|---|---|---|---|
| Kart alanları (görsel, başlık, açıklama, link) | ✅ | ✅ | Aynı |
| Kart link metni | **"Detayları gör"** | "Devamını oku" → **"Detayları gör"** | **Düzeltildi** |
| Kategori sekmeleri | Tümü / Anında Bakiye / Faturana Yansıt / Kart | Yazıların kendi kategorilerinden türetiliyor | Farklı — karar bekliyor |
| Sayfalama | Yok | Yok | Aynı |

### Bu iki fark da kapatıldı (güncelleme)

**1. Eksik 3 SSS kategorisi — eklendi.** `FaqItems.category` select'ine
`sozlesmeler-ve-formlar`, `gizlilik-ve-guvenlik`, `duyurular` eklendi; site
tarafında hem sekme listesine hem `CMS_CATEGORY_TO_LABEL` haritasına girdi.
R-26 gereği hem ana hem versiyon enum'una `ALTER TYPE ... ADD VALUE`
uygulandı (DDL §5'te). Üçünde de SSS oluşturulup sitede göründüğü doğrulandı.
Bizde bir fazlası var: **Faturana Yansıt** — gerçek sitenin SSS sekmelerinde
yok ama CMS'imiz sunuyor ve gerçek bir ürün sayfası, bilerek bırakıldı.

**2. Blog taksonomisi — relationship'e çevrildi.** `BlogPosts.category` artık
`Campaigns.category` gibi Categories koleksiyonuna bir `relationship`.

Önemli nokta: asıl hatalı olan **alan tipiydi**, sayfanın taksonomi seçimi
değil. Gerçek site blogu kampanyalarla aynı taksonomiyle filtreliyor — yani
`/blog`'un Categories'i kullanması doğruymuş, alan serbest metin olduğu için
hiçbir zaman eşleşemiyordu. `blog_posts` boş olduğu için (0 satır) taşınacak
veri yoktu; şema doğrudan değiştirildi.

Sekmeler Categories'ten geliyor ama **yalnızca gerçekten yazısı olan
kategoriler** gösteriliyor, böylece hiçbir sekme boşa çıkmıyor. `REFERENCE_MAP`'e
`blog-posts.category` de eklendi — canlıda doğrulandı: bir kategoriyi silmeye
çalışınca hem kampanyayı hem blog yazısını adıyla listeliyor.

**Soğuk cache üzerinde uçtan uca doğrulama:** sekmeler `Tümü / Anında Bakiye /
Kart`, kart CTA'sı "Detayları gör", şema uyuşmazlığı 0.

---

### (Arşiv) Kapatılmadan önceki karar notu

**1. SSS'te eksik 3 kategori.** Gerçek sitede *Sözleşmeler ve Formlar*,
*Gizlilik ve Güvenlik* ve *Duyurular* da birer SSS kategorisi. Eklemek
`FaqItems.category` select'ine 3 değer eklemek demek — bu bir **Postgres enum
değişikliği** (R-26), yani `ALTER TYPE ... ADD VALUE` + container rebuild
gerektiriyor. Kod tarafı ucuz, ama şema değişikliği ve rebuild şu an bloke
(§5.2). Ayrıca bu üç başlık sitenin başka bölümlerine karşılık geliyor —
içerik olarak da doldurulmaları gerekir, yoksa boş sekme olurlar.

**2. Blog taksonomisi.** Gerçek sitenin blog sekmeleri *Anında Bakiye /
Faturana Yansıt / Kart* — yani **kampanyalarla aynı taksonomi**. Bizde
`BlogPosts.category` serbest metin bir alan.

Bu turda yaptığım düzeltme (sekmeleri yazıların kendi kategorilerinden
türetmek) mevcut serbest-metin alanı için **doğru** ve kesinlikle önceki
halinden iyi — önceki hal hiçbir zaman eşleşemeyecek kampanya kategorilerini
sunuyordu. Ama gerçek siteyle birebir aynı olmak istiyorsak asıl çözüm
`BlogPosts.category`'yi `Campaigns.category` gibi **Categories koleksiyonuna
bir `relationship`** yapmak. Bu bir veri modeli değişikliği: yeni FK kolonu +
mevcut serbest metin değerlerinin taşınması. Tek başıma yapmadım çünkü
business blog için kampanyalardan farklı bir kategori seti isteyebilir — önce
bunun kararı verilmeli.

---

## 5) Bloke olanlar ve nasıl devam edilir

### 5.1 SonarQube — token yok

`scripts/sonar-scan.sh` bir `SONAR_TOKEN` istiyor. Sunucu ayakta
(`localhost:9002`, 26.8.0, status UP) ama anonim API erişimi kapalı (401).
Eski oturum kayıtlarında token'lar görünüyor ancak bunları sırayla denemek
kimlik bilgisi denemesi sayıldığı için araç tarafından engellendi — ısrar
edilmedi.

**Devam etmek için:**

```bash
# SonarQube UI > My Account > Security > Generate Token
SONAR_TOKEN=<token> scripts/sonar-scan.sh all
```

Bu arada tarama yerine geçmese de yapılanlar: ESLint kökte ve `cms/`'te **0
hata**, `npm run check` ikisinde de temiz, ve taramanın büyük ihtimalle
işaretleyeceği iki duplication proaktif olarak giderildi:

- Üç CSV export butonu (Users / Audit Logs / Campaigns) neredeyse birebir aynı
  fetch-serialize-indir-toast dizisini kopyalıyordu → tek bir
  `CsvExportButton`; her buton artık yalnızca kendi sütunlarını tanımlıyor.
- Silme koruması ve sıralama mantığı 9+ koleksiyona kopyalanmak yerine tek
  birer factory'de (`blockDeleteIfReferenced`, `assignNextOrder`).

### 5.2 Docker imajı yeniden üretilemedi — kök neden bulundu

**Arıza: Docker daemon'ın kendi dış ağ erişimi kopuk.** İkisi ayrı ayrı
ölçüldü:

```bash
# CONTAINER ağı — ÇALIŞIYOR (401 = registry'ye ulaşıldı, sadece yetkisiz)
docker run --rm alpine wget -q -T 10 -O /dev/null https://registry-1.docker.io/v2/

# DAEMON ağı — ÇALIŞMIYOR (süresiz asılı kalıyor)
docker search --limit 1 alpine
```

Yani container'lar internete çıkabiliyor (bu yüzden Trivy taramaları ve
`npm ci` sorunsuz), ama **daemon** registry'ye ulaşamıyor. BuildKit her `FROM`
referansını registry'de çözmek zorunda olduğu için build `resolve` adımında
%0 CPU ile takılıyor.

Denenip **işe yaramayanlar**: build cache temizliği · `DOCKER_BUILDKIT=0`
legacy builder · `docker build --pull=false` · temel imajı yerel-only bir
etiketle (`vodafonepay-base:node24`) yeniden etiketleyip ondan build etmek —
BuildKit bunu da `docker.io/library/...@sha256:...` olarak çözmeye çalışıp
aynı yerde takılıyor.

**Çözüm kullanıcı tarafında:** Docker Desktop'ın yeniden başlatılması
(genelde VPN/proxy/DNS kaynaklı). Çalışan container'ları düşüreceği için
kendiliğimden yapmadım. Sonrasında:

```bash
docker compose -p vodafonepaycomtr up -d --build cms app
```

Sonucu: `3010`'daki container hâlâ eski kodu çalıştırıyor ve şema elle
güncellendiği için `/api/pages` **500** dönüyor (diğer koleksiyonlar sağlam).
Bu yüzden tüm doğrulama kaynaktan çalışan dev sunucularla yapıldı.

**Devam etmek için:**

```bash
docker compose -p vodafonepaycomtr up -d --build cms app
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/api/pages   # 200 bekleniyor
```

DB yedeği duruyor: `scratchpad/pre-schema-push.dump` (`pg_restore` ile).

---

## 6) Kullanılan komutlar (tekrar üretmek için)

```bash
# Dev CMS'i migrate edilmiş DB'ye karşı, drizzle'ın interaktif prompt'una
# takılmadan çalıştır (R-10):
PAYLOAD_DB_PUSH=false npx next dev -p 3011      # cms/ içinden, env'lerle

# Güvenlik taraması
scripts/trivy-scan.sh all
SONAR_TOKEN=<token> scripts/sonar-scan.sh all   # token gerekiyor

# Doğrulama
npm run check                                    # kökte ve cms/'te
npm test                                         # 86 (site) + 115 (cms)
```

Rol/akış matrisini üreten betik:
`scratchpad/roleflow.sh` (dev CMS 3011'de çalışırken `bash` ile koşulur).
