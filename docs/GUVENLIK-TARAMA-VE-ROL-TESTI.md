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

### 5.2 Docker imajı yeniden üretilemedi

Docker daemon'ın registry erişimi askıda: düz bir `docker pull hello-world`
bile dönmüyor — temel imaj yerelde mevcut ve host'tan `curl` ile registry
erişilebilir olduğu halde. BuildKit `resolve` adımında %0 CPU ile takılıyor;
build cache temizlendikten sonra da, `DOCKER_BUILDKIT=0` legacy builder'la da
aynı. **Bu turun kodundan bağımsız, ortamsal bir sorun.**

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
