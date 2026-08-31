# OCP DevOps Runbook — vodafonepaycomtr + Clover

**Durum:** §1 (repo ayrımı) **tamamlandı ve canlıda doğrulandı** (30-31.08.2026,
tam kayıt: `tasks.md` madde 39). Geri kalan her şey (§2-§7) hâlâ analiz/planlama
— DevOps ekibinin `devops-surecleri` reposundaki şablonunu (`devops-proje-sablonu/`)
bizim projemize uyarlayan bir yol haritası, henüz uygulanmadı.

_Kaynak:_ `devops-surecleri/Devops-Surecleri.md` + `devops-surecleri/devops-proje-sablonu/`
(DevOps ekibinin verdiği şablon repo, bu proje klasörünün içine ayrıca clone'landı).
_Hedef ortam:_ **test OCP, namespace `vepas-ai-am`** (kullanıcının verdiği isim —
teyit edilmeli, bkz. §7 S1). Test PostgreSQL zaten talep edilip karşılandı (§3).

---

## 1. ✅ TAMAMLANDI — repo ayrımı (30-31.08.2026)

DevOps şablonunun tartışmaya kapalı kuralı — **her mikroservis ayrı repo**
(`devops-proje-sablonu/README.md §1`) — uygulandı. `cms/`, **Seçenek A**
(`git subtree split`) ile ayrıldı ve yeni adını aldı: **Clover** (İngilizce
"yonca").

| | Önce | Sonra |
|---|---|---|
| CMS'in yeri | `vodafonepaycomtr/cms/` (monorepo alt klasörü) | `https://github.com/bbatus/clover.git`, yerelde `/Users/guestbatu/Documents/Projects/clover/` — `vodafonepaycomtr/`'ın tam yanında, tamamen bağımsız repo |
| Git geçmişi | — | **Korundu** — 148 commit, `cms/x` yolları `x`'e yeniden yazılmış, hiçbir kök-neden notu kaybolmadı |
| Yerel ayağa kalkış | Tek `docker-compose.yml`, kök dizinden | İki bağımsız `docker-compose.yml`: `clover/` ve `vodafonepaycomtr/vodafonepaycomtr/`, kendi klasöründen |
| Ortak Postgres/MinIO | Aynı compose'un servisleri | Clover'ın compose'unda, **aynı eski volume'lara** (`external: true`) bağlı — veri taşınmadı |
| Haberleşme | Docker Compose'un kendi ağı | Paylaşılan harici ağ: `vodafonepay-net` (`docker network create vodafonepay-net`) — container adıyla DNS, OCP'de iki Service'in birbirini bulması gibi |

**Doğrulama (gerçek komutlarla, tahmin değil) — tam kayıt `tasks.md` madde 39:**
- İki klasör bağımsız ayakta ✅
- Haberleşme iki yönde de (`fetch()` ile container adından) ✅
- Postgres verisi bölünmeden önce/sonra **birebir aynı** (satır sayıları) ✅
- MinIO **128/128 obje**, birebir aynı ✅
- Gerçek veri senkronu: Clover'da oluşturulan bir duyuru, elle tetiklenmeden
  site'ta anında göründü (Clover'ın `afterChange` hook'u otomatik çalıştı) ✅
- Site 380/380, Clover 564/564 test yeşil ✅

**Bu sırada bulunan gerçek bir hata:** `cms/` hiçbir zaman kendi
`.gitignore`'ına sahip olmamış — hep monorepo kökündekine güvenmiş. Subtree
split sonrası Clover bağımsız bir repo olunca bu ortaya çıktı (`node_modules`/
`.env` bir `git add .` ile commit'e girebilirdi) — `clover/.gitignore`
oluşturuldu.

**Bilinçli ertelenen (ayrı onay bekliyor):** `cms/` klasörü monorepo'dan henüz
**silinmedi** — `scripts/trivy-scan.sh`, `scripts/warm-cache.sh`,
`scripts/sonar-scan.sh` ve `AGENTS.md` hâlâ eski yapıya (kök `docker-compose.yml`,
`cms/` yolu) referans veriyor, bunları güncellemek ayrı bir iş.

`vodafonepaycomtr` (site) için aynı ayrım **henüz yapılmadı** — bu doküman
hâlâ onu da OCP'ye çıkmadan önce kendi repo'suna ayrılması gereken bir servis
olarak sayıyor (§2, §4, §5). Ne zaman sırası gelirse aynı yöntem (subtree
split) uygulanabilir:
```bash
git subtree split --prefix=vodafonepaycomtr -b site-only
git push <yeni-site-repo-url> site-only:main
```

---

## 2. DevOps şablonunun S1–S12 soruları — bizim projeye göre taslak cevaplar

`devops-proje-sablonu/README.md §4`, kod yazılmadan önce cevaplanması gereken
12 soru listeliyor. Bildiğimiz kadarıyla taslak cevaplar:

| # | Soru | Site (`vodafonepaycomtr`) | Clover (eski `cms`) |
|---|---|---|---|
| S1 | Repo adı + namespace | Repo adı muhtemelen `vodafonepaycomtr` (henüz kendi repo'suna ayrılmadı, §1) — namespace TODO | **Repo adı `clover` — biliniyor** (`github.com/bbatus/clover`, §1'de ayrıldı). Namespace hâlâ TODO |
| S2 | Dil/stack | **Node.js / Next.js 16** (Java değil — pipeline'da `project_type: npm`) | Aynı — **Node.js / Next.js 16 + Payload CMS 3.87** |
| S3 | Harici bağımlılıklar | Yok (kendi başına statik+ISR site, CMS'e HTTP ile bağlanıyor) | **PostgreSQL** (zaten talep edildi, §3), **MinIO/S3** (medya deposu) |
| S4 | Test/prod host-port-db-kullanıcı | — | TEST: §3'teki bilgiler. PROD: **henüz talep açılmadı** |
| S5 | Sertifikalar | TODO — DevOps ile netleşecek (muhtemelen sadece `github.vpara.local` CA, CI için) | Aynı + Postgres/MinIO bağlantısı TLS ile mi? (§3'teki TNS düz `5432`, TLS belirtilmemiş — netleştirilmeli) |
| S6 | Local user / generic service user | TODO | TODO — Postgres kullanıcısı zaten generic görünüyor (`vpaycmstest_new_user`) |
| S7 | Prod dağıtım modeli (aktif-aktif-aktif vb.) | TODO — henüz konuşulmadı, bu doküman **sadece test** kapsıyor | Aynı |
| S8 | LDAP gerekli mi, hangi domain(ler)? | Hayır (site'ın kendi girişi yok) | **Evet, ileride** — `cms/src/access/roleMapping.ts` zaten LDAP grup→rol eşlemesi için hazır ama gerçek LDAPS bağlantısı **henüz kurulmadı** (bkz. §6.4) |
| S9 | LDAP grup → rol eşlemesi | — | Kısmen var: `ROLES` (4 rol) + `roleMapping.ts`'teki `LDAP_GROUP_TO_ROLE` — gerçek AccessPoint grup adlarıyla zaten dolu (`docs/PROJECT-OVERVIEW.md §5`), sadece gerçek bir LDAPS sunucusuna bağlanmıyor |
| S10 | Route: otomatik host mü, kurumsal DNS mi? | TODO | TODO |
| S11 | Sonar/Fortify blocker mı, sadece rapor mu? | TODO — mevcut yerel Sonar akışımız zaten "0 açık bulgu" hedefliyor (`AGENTS.md`), OCP pipeline'ında da aynı disiplin istenebilir | Aynı |
| S12 | Kaynak talebi (CPU/RAM), min/max replica | TODO | TODO — CMS muhtemelen site'dan daha az trafik alır (sadece editörler), kaynak talebi buna göre küçük tutulabilir |

**Not:** Bu tablo bir taslaktır — DevOps ekibiyle netleşmeden `k8s/` manifest'leri
gerçek değerlerle doldurulamaz (`devops-proje-sablonu/docs/01 §Faz 0`: *"Cevaplar
gelmeden manifest üretme"*).

---

## 3. Elimizdeki test PostgreSQL bilgisi

```
TNS:      172.31.229.152:5432/vpaycms_test_new
HOSTNAME: vp-cmsrpgdt01
IP:       172.31.229.152
PORT:     5432
DBNAME:   vpaycms_test_new
VERSION:  PostgreSQL 16 (16.9) Standalone
USERNAME: vpaycmstest_new_user
USERPASS: vpaycmstest_new_user   ⚠️ kullanıcı adıyla aynı — bkz. not aşağıda
```

**Bu, `devops-proje-sablonu/sql/00-db-talep-sablonu.md`'deki gerçek örnekle
birebir aynı desende geldi** — o dosyanın kendi örneği de `vp-cmsrpgdt01`
sunucusuna `genaiops-event-processor` ve `vodafinwatcher` için önceden ekleme
yapıldığını, bizim talebimizin de aynı sunucuya üçüncü bir veritabanı olarak
eklendiğini gösteriyor. Yani süreç doğru işlemiş, talep doğru şablonla açılmış.

⚠️ **Parola kullanıcı adıyla birebir aynı görünüyor** (`vpaycmstest_new_user` /
`vpaycmstest_new_user`). Bu muhtemelen DBA'nın geçici/varsayılan bir parola
verdiği, ilk girişte değiştirilmesi beklenen bir durum — production'a taşımadan
önce **mutlaka** teyit edilmeli, koşulsuz kullanılmamalı.

### Nereye gidecek

Doğru — kullanıcının dediği gibi, **host/port/db adı/kullanıcı adı ConfigMap'te,
sadece parola Secret'ta** (`devops-proje-sablonu/k8s/configmap.yaml` deseni):

```yaml
# k8s/configmap.yaml (CMS servisi, ORTAM: TEST)
data:
  DATABASE_URI_HOST: "172.31.229.152"      # ya da DB_HOST — Payload'ın env adına göre
  DATABASE_URI_PORT: "5432"
  DATABASE_URI_NAME: "vpaycms_test_new"
  DATABASE_URI_USER: "vpaycmstest_new_user"
  # Payload tek bir DATABASE_URI (postgres:// bağlantı string'i) de kabul eder —
  # o zaman host/port/db/user'ı ayrı ayrı değil, tek bir Secret alanında birleştirmek
  # gerekebilir. cms/payload.config.ts'nin DATABASE_URI'yi nasıl okuduğuna bakılmalı.
```

```yaml
# k8s/secret.yaml (ŞABLON — gerçek parola commit edilmez)
stringData:
  DATABASE_PASSWORD: "${DB_PASSWORD}"
```

⚠️ **Uyarlama notu — koddan doğrulandı:** `cms/payload.config.ts:537`,
`postgresAdapter({ pool: { connectionString: env.DATABASE_URI } } })` —
Payload **tek bir `DATABASE_URI`** (`postgres://user:pass@host:port/db`)
env değişkeni okuyor, host/port/db/user'ı ayrı ayrı okumuyor. DevOps
şablonu bunları **ayrı ayrı** ConfigMap anahtarları olarak öngörüyor
(Java/Spring deseni) — bize doğrudan uymuyor. İki yol var:
- (a) `payload.config.ts`'e host/port/db/user'ı ayrı ayrı okuyup kendi
  içinde connection string'i birleştiren birkaç satır eklemek, **ya da**
- (b) Tüm `postgres://...` string'ini (parola dahil, dolayısıyla **tamamı
  Secret'ta**, ConfigMap'e hiç host/port/db/user yazılmaz) tek bir
  `DATABASE_URI` Secret anahtarı olarak tutmak.

**(b) tercih edilmeli** — sıfır kod değişikliği, Payload'ın zaten native
okuduğu format bu. Tek risk: host/port/db adı gibi (gizli olmayan) bilgiler
de Secret'ta yaşar, DevOps'un "gizli olmayan, topoloji bilgisi ConfigMap'te"
alışkanlığından sapar (`docs/03 §2`'deki LDAP URL/DN kararına benzer bir
istisna — onlar da "parola değil ama iç ağ haritası" gerekçesiyle Secret'ta
tutuluyor, aynı mantık DATABASE_URI'ye de uygulanabilir). DevOps ekibine
bu şekilde anlatılmalı, S4/S6'nın bir parçası olarak netleştirilmeli.

---

## 4. Faz faz plan (bizim projeye uyarlanmış)

`devops-proje-sablonu/docs/01-yeni-proje-akisi.md`'nin 8 fazı, bizim 2
servisimize göre:

### Faz 0 — Bilgi toplama
- [x] Test PostgreSQL talebi açıldı ve karşılandı (§3)
- [ ] §2'deki S1, S4 (prod), S5, S6, S7, S10, S11, S12 DevOps ekibiyle netleşecek
- [ ] MinIO için: test ortamında kurumsal bir MinIO/S3 mü kullanılacak, yoksa
      bizim kendi MinIO container'ımız aynı namespace'e mi deploy edilecek?
      (Yerel geliştirmede kendi MinIO'muz var — `docker-compose.yml` — ama OCP'de
      muhtemelen kurumsal bir S3 endpoint'i tercih edilir.) **Netleşmemiş.**
- [ ] IT/AD'den LDAP service account (S8/S9 zaten kısmen hazır, bkz. §6.4)

### Faz 1 — Repo iskeleti
- [x] Clover için: §1'deki karar uygulandı (subtree split, `github.com/bbatus/clover`)
- [ ] Site için: aynı ayrım henüz yapılmadı
- [ ] Her repo'ya (Clover dahil, henüz yapılmadı): `.github/workflows/`, `k8s/`,
      `Containerfile` (mevcut `Dockerfile`'larımızdan uyarlanacak, bkz. §6.1),
      `DEPLOYMENT_RUNBOOK.md`
- [ ] Branch modeli: `development`/`release`/`master` — Clover ve site'ın
      ikisi de hâlâ sadece `main` kullanıyor, bu üçe bölünmeli

### Faz 2 — Uygulama iskeleti
- [ ] **Health endpoint'leri yazılmalı** — şu an ikisinde de yok
      (`docs/PROJECT-OVERVIEW.md §11`'in kendi notu: "`/api/health` yok").
      Next.js'te Spring'in `/actuator/health/{liveness,readiness}` karşılığı
      yok, kendi route'umuzu yazmamız gerekiyor — bkz. §6.2

### Faz 3 — TEST ortamı ilk kurulum
Sırası `devops-proje-sablonu/docs/05-deployment-runbook.md`'deki ile aynı,
her iki servis için ayrı ayrı (ayrı Secret, ayrı ConfigMap, ayrı Route —
aynı namespace `vepas-ai-am` içinde 2 servis olarak yaşayabilirler, ya da
DevOps ekibi 2 ayrı namespace isteyebilir — S1'de netleşecek).

### Faz 4-8
Şablondakiyle birebir aynı — CI/CD devreye alma, TEST doğrulama, PROD
hazırlık (henüz kapsam dışı, bu doküman sadece TEST'i hedefliyor), PROD'a
çıkış, devir.

---

## 5. İşin sonunda elimizde ne olacak

Her bir mikroservis (site, cms) için ayrı ayrı:

```
<repo>/
├── .github/workflows/
│   ├── pipeline-test.yml       development/release → TEST OCP
│   ├── pipeline-prod.yml       master → PROD (henüz kapsam dışı)
│   ├── sonar.yml, fortify.yml, mend.yml   (project_type: npm)
├── k8s/
│   ├── deployment.yaml         port 3000, probe'lar dolu, non-root
│   ├── configmap.yaml          ORTAM: TEST — DB host/port/db/user (CMS için)
│   ├── secret.yaml             şablon — DB_PASSWORD (CMS için)
│   ├── service.yaml, route.yaml, hpa.yaml, serviceaccount.yaml, networkpolicy.yaml
│   ├── certs/configmap-ca-bundle.yaml   (gerekiyorsa)
│   └── create-secret.sh
├── Containerfile                mevcut Dockerfile'dan uyarlanmış (bkz §6.1)
└── DEPLOYMENT_RUNBOOK.md        bu dokümandan türetilmiş, o repo'ya özel
```

CMS için ayrıca:
```
sql/
├── 00-db-talep-sablonu.md      DOLU — talep zaten açıldı (§3)
├── 00-ilk-baglanti-dogrulama.sql
└── (V1/V2 YOK — bkz. §6.3, Payload push-tabanlı şema kullanıyor)
```

Ve (LDAP gerçek bağlantı kurulunca, şimdilik değil):
```
ldap/
├── ldap-config-contract.md
├── k8s/ldap-secret.yaml, configmap-ldap-ca.yaml
```

**Namespace `vepas-ai-am` içinde test cluster'da çalışan 2 pod:**
- `vodafonepaycomtr` — ziyaretçi trafiği, route ile dışa açık
- `cms` — editör trafiği (admin paneli), muhtemelen ayrı bir route/host,
  Postgres'e (§3) ve MinIO'ya bağlı

---

## 6. Projeye özgü uyarlama noktaları ve riskler

Şablon Java/Spring Boot varsayımıyla yazılmış; bizim Next.js/Node projemiz
için değişmesi gereken yerler:

### 6.1 Containerfile
Şablonun `Containerfile.react` bir **statik SPA** (Vite/CRA + nginx) varsayıyor
— bize **uygun değil**, ikisi de server-render eden Next.js uygulaması
(`node server.js` çalıştırıyor, nginx'in servis edebileceği düz dosyalar değil).
**Mevcut `vodafonepaycomtr/Dockerfile` ve `cms/Dockerfile` zaten doğru
desende** (multi-stage, `node:24-alpine`, standalone output, non-root `USER
node`, port 3000) — şablonun Containerfile'ı yerine **bunlar** `Containerfile`
adıyla kopyalanmalı. Tek gerçek eksik: kurumsal CA trust'ı (§6.5).

### 6.2 Health endpoint — yazılması gereken gerçek iş
Şu an hem site hem CMS'in "healthcheck"i sadece `/`'in 200 dönüp dönmediğine
bakıyor (`docker-compose.yml`) — bu, liveness/readiness ayrımı yapmıyor ve
gerçek bağımlılık kontrolü (DB/MinIO erişilebilir mi) içermiyor. Yazılması
gerekenler:
- `GET /api/health/liveness` — sadece "process ayakta mı" (DB'ye gitmez,
  hızlı döner)
- `GET /api/health/readiness` — CMS için: Postgres'e ve MinIO'ya gerçek bir
  bağlantı/sorgu (site için: CMS'e erişilebilir mi, opsiyonel)
- `deployment.yaml`'daki `readinessProbe.timeoutSeconds`, bu health route'un
  kendi iç zaman sınırından **büyük** olmalı (şablonun kendi uyarısı,
  `docs/05 Troubleshooting` tablosunda bunun gerçek bir sahada yaşanmış hata
  olduğu yazılı)

### 6.3 Migration aracı — DevOps kuralıyla mevcut mimari çelişiyor
Şablonun **tartışmaya kapalı** kuralı: `ddl-auto=validate`, şema migration
aracıyla yönetilir (Flyway/Alembic/node-pg-migrate), Hibernate/ORM şemayı
**asla** kendisi değiştirmez (`docs/04-sql-script-rehberi.md §3`).

Bizim projede ise (`docs/PROJECT-OVERVIEW.md §10`, bilinçli bir karar olarak
kayıtlı): *"DB şeması push-tabanlı senkronla yönetiliyor, migration'lı değil
— `payload migrate:create` çalışıyor (R-10 kapandı) ama migration'a geçiş
ayrı bir karar, henüz alınmadı."* Yani Payload, açılışta/geliştirmede şemayı
kendi kendine senkronlayabiliyor (Prisma'nın `db push`'ına benzer) — bu,
DevOps'un "migration aracı zorunlu" kuralının tam karşıtı.

**Bu, OCP'ye çıkmadan önce netleştirilmesi gereken açık bir karar noktası:**
- (a) Payload'ın kendi `migrate:create`/`migrate` komutlarına gerçekten
  geçilir (R-10 zaten bunu mümkün kıldı, sadece kullanılmıyor) — DevOps
  kuralına uyar, versiyon versiyon migration dosyası üretilir.
- (b) Push-tabanlı senkron korunur ama DevOps ekibine bunun neden (Payload'ın
  kendi mimarisi gereği) farklı olduğu açıkça anlatılır, istisna olarak kabul
  ettirilir.

Şablonun kendi kuralı zaten çok net gerekçelendiriyor neden bu önemli:
uygulanmış bir migration'ın değiştirilmemesi, checksum kontrolü, geriye
dönük uyumluluk (§4'te detaylı). Push-tabanlı senkron bu güvenceleri
vermiyor. **Önerim: (a)** — zaten R-10 bu kapıyı açtı, kalan iş sadece
"kullanmaya başlamak."

### 6.4 LDAP — hazır ama bağlı değil
`cms/src/access/roleMapping.ts` gerçek AccessPoint LDAP grup adlarını (4 rol)
zaten biliyor (`docs/PROJECT-OVERVIEW.md §5`) ama gerçek bir LDAPS sunucusuna
**hiç bağlanmıyor** — rol ataması şu an test kullanıcılarına elle yapılmış
bir simülasyon. `devops-proje-sablonu/docs/03-ldap-entegrasyon-rehberi.md`
tam bir "dilden bağımsız" sözleşme + T1-T12 test planı içeriyor — LDAP
gerçekten bağlanacağı zaman **bu rehber baştan sona uygulanmalı** (özellikle
G1-G9 güvenlik gereksinimleri: boş parola reddi, LDAP injection koruması,
enumeration koruması — hiçbiri şu an bizim tarafımızda gerekmiyor çünkü LDAP
hiç yok, ama gerçek bağlantı kurulduğu an hepsi geçerli olur).

Bu, **test OCP'ye ilk çıkışın kapsamında olmak zorunda değil** — CMS,
LDAP olmadan da (mevcut simüle rol sistemiyle) test ortamında çalışabilir.
Ama prod'a çıkmadan önce kesin gerekli.

### 6.5 Sertifika / CA trust
`docs/02-sertifika-rehberi.md §5`'teki Node.js deseni bize doğrudan uygulanır:
```js
const ca = fs.readdirSync(dir).map(f => fs.readFileSync(path.join(dir, f)));
const agent = new https.Agent({ ca, minVersion: 'TLSv1.2' });
```
veya konteyner env'inde `NODE_EXTRA_CA_CERTS=/etc/ssl/certs/corporate/bundle.pem`.
Bizim Dockerfile'larımızda şu an bu yok — CMS'in Postgres'e/MinIO'ya bağlantısı
TLS istiyorsa (§2 S5, henüz netleşmedi) eklenmesi gerekecek. **CI runner'ı için
de gerekli**: `NODE_EXTRA_CA_CERTS` GitHub Actions runner'ında da set
edilmezse `actions/cache`/`upload-artifact` GHES'in kendi CA'sını tanımadığı
için patlar (şablonun kendi troubleshooting notu, sahada yaşanmış).

### 6.6 Non-root / rastgele UID
Dockerfile'larımız zaten `USER node` (sabit, non-root) kullanıyor — iyi bir
başlangıç ama OpenShift'in varsayılan `restricted-v2` SCC'si pod'a **rastgele
bir UID** atar (kök grup GID 0 ile). Sabit `USER node` bazı OCP kurulumlarında
sorunsuz çalışır (SCC'ye göre değişir) ama garanti değildir. Kontrol
edilmesi gereken: dosya izinlerinin **GID 0'a da yazılabilir** olup olmadığı
(`chown node:node` yerine ya da ek olarak `chmod g+rwX` deseni). İlk deploy'da
`ImagePullBackOff`'tan sonraki en olası ikinci hata sınıfı budur.

### 6.7 `readOnlyRootFilesystem` uyumluluğu
`images.unoptimized: true` (Next.js image optimizasyonu kapalı, `PROJECT-OVERVIEW.md
§6`) olduğu için Next.js'in runtime'da diske yazma ihtiyacı düşük — iyi bir
işaret, `readOnlyRootFilesystem: true` + `emptyDir` `/tmp` mount'u muhtemelen
yeterli olur, ama ilk deploy'da gerçekten doğrulanmalı (özellikle CMS
tarafında Payload'ın geçici dosya/upload akışı MinIO'ya gidiyor olsa da
ara adımda diske yazıp yazmadığı kontrol edilmeli).

### 6.8 Redis — muhtemelen gerekmiyor
Şablonun `configmap.yaml`'ı varsayılan olarak `REDIS_HOST` bekliyor — bizim
projede Redis **yok** (Payload ISR/ `revalidateTag` ile çalışıyor, ayrı bir
cache katmanı kullanmıyor). ConfigMap'ten bu bölüm tamamen çıkarılmalı,
DevOps ekibine "Redis kullanmıyoruz" diye açıkça belirtilmeli (S3'ün cevabı).

### 6.9 Güvenlik taraması proje tipi
`fortify.yml`/`mend.yml`/`sonar.yml` reusable workflow'ları `project_type:
java | npm` kabul ediyor — bize `npm` seçilecek. Zaten yerelde kendi
Sonar/Trivy disiplinimiz var (`AGENTS.md`) — OCP pipeline'ındaki
Sonar/Fortify/Mend bunun **yerine geçmiyor**, üstüne ekleniyor (farklı
araçlar: Fortify=SAST, Mend=SCA, bizim yerel Sonar zaten var ama bu kurumsal
SonarQube — muhtemelen aynı `SONAR_ENTERPRISE_HOST_URL`'e taşınacak).

---

## 7. DevOps ekibine sorulacaklar (özet)

1. **Namespace kesin adı** — `vepas-ai-am` her iki servis için mi, yoksa
   ayrı namespace'ler mi?
2. **Repo adları** — GitHub Enterprise'da açılacak 2 yeni repo için isim.
3. **MinIO** — kurumsal bir S3/MinIO endpoint'i mi kullanılacak, yoksa
   kendi MinIO'muz aynı namespace'e mi deploy edilecek?
4. **CMS↔Postgres bağlantısı TLS mi?** (§3'teki bilgi düz `5432`, netleşmedi)
5. **DB parolası** — kullanıcı adıyla aynı görünüyor, gerçek/kalıcı mı,
   değiştirilmesi mi gerekiyor?
6. **Route host'ları** — otomatik OCP host mu, kurumsal DNS kaydı mı?
7. **Sonar/Fortify/Mend** — pipeline'ı kırsın mı (`blocker=true`), yoksa
   sadece raporlasın mı?
8. **Migration kararı** (§6.3) — Payload'ın push-tabanlı senkronu istisna
   olarak kabul mü edilecek, yoksa `migrate:create`'e geçiş mi istenecek?

---

## 8. Kaynaklar

- `devops-surecleri/Devops-Surecleri.md` — DevOps ekibinin genel süreç notu
- `devops-surecleri/devops-proje-sablonu/README.md` — şablonun kendi haritası + S1-S12
- `devops-surecleri/devops-proje-sablonu/docs/01-yeni-proje-akisi.md` — faz faz akış
- `devops-surecleri/devops-proje-sablonu/docs/02-sertifika-rehberi.md` — CA/sertifika
- `devops-surecleri/devops-proje-sablonu/docs/03-ldap-entegrasyon-rehberi.md` — LDAP (dil bağımsız)
- `devops-surecleri/devops-proje-sablonu/docs/04-sql-script-rehberi.md` — DB kararları
- `devops-surecleri/devops-proje-sablonu/docs/05-deployment-runbook.md` — deploy/rollback/troubleshooting
- `devops-surecleri/devops-proje-sablonu/docs/06-github-variables-secrets.md` — CI değişkenleri
- `devops-surecleri/devops-proje-sablonu/docs/07-teslim-checklist.md` — "bitti" tanımı
- `docs/PROJECT-OVERVIEW.md` — bizim projenin güncel mimarisi (§5 rol modeli, §10 kararlar, §11 sınırlamalar)
- `tasks.md` madde 39 — §1'in tam uygulama/doğrulama kaydı (repo ayrımı, Docker ayrımı, canlı test sonuçları)
