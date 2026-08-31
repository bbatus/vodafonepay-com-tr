# OCP DevOps Runbook — vodafonepaycomtr + Clover

**Durum (31.08.2026):** Repo ayrımı, S1-S12 kararları, health endpoint'leri
ve `k8s/` manifestleri tamamlandı. **Test OCP'de HENÜZ AYAKTA DEĞİLİZ** —
`oc apply` hiç çalıştırılmadı, imaj hiç build/push edilmedi, `.github/
workflows/` build+deploy pipeline'ı hiçbir repoda yok. Kalan iş: §4 Faz 1
kuyruğu, Faz 3 (ilk `oc apply`), §7'deki DevOps'a sorulacaklar.

_Kaynak:_ `devops-surecleri/Devops-Surecleri.md` + `devops-surecleri/devops-proje-sablonu/`.
_Hedef:_ test OCP, namespace `vepas-ai-am`. Test PostgreSQL zaten talep edilip karşılandı (§3).

---

## 1. ✅ Repo ayrımı — tamamlandı (30-31.08.2026)

`cms/` → `git subtree split` ile **Clover**'a ayrıldı (`github.com/bbatus/clover.git`,
yerelde `/Users/guestbatu/Documents/Projects/clover/`), 148 commit'lik geçmiş
korunarak. Bağımsız `docker-compose.yml`'lar, ortak Postgres/MinIO volume'lerine
(`external: true`) ve paylaşılan `vodafonepay-net` ağına bağlı — veri kaybı
yok, çift yönlü haberleşme ve gerçek içerik senkronu doğrulandı. Tam kayıt +
doğrulama detayları: `tasks.md` madde 39.

**Bilinçli ertelenen:** `cms/` klasörü monorepo'dan henüz silinmedi (bazı
scriptler hâlâ eski yola referans veriyor — ayrı bir iş). Site
(`vodafonepaycomtr`) için aynı ayrım **henüz yapılmadı**, aynı yöntemle
(`git subtree split --prefix=vodafonepaycomtr`) ileride uygulanabilir.

---

## 2. ✅ S1–S12 soruları — kesinleşen cevaplar (31.08.2026)

Özet: **`clover`** ve **`vodafonepaycomtr`**, ikisi de namespace
**`vepas-ai-am`**; ikisi de Node.js/Next.js; **PostgreSQL harici** (§3),
**MinIO namespace-içi geçici** (`clover/k8s/minio.yaml`); sadece **TEST**
kapsamında, TLS/sertifika yok, generic DB kullanıcısı zaten var; LDAP
**şimdilik bağlanmıyor** (§6.4); Route **otomatik host**; Sonar/Fortify
**sadece rapor, blocker değil**; **1 replica**, HPA 1-2. Tam soru-cevap
tablosu: `tasks.md` madde 40.

---

## 3. Test PostgreSQL bilgisi

```
TNS:      172.31.229.152:5432/vpaycms_test_new
HOSTNAME: vp-cmsrpgdt01
PORT:     5432
DBNAME:   vpaycms_test_new
VERSION:  PostgreSQL 16 (16.9) Standalone
USERNAME: vpaycmstest_new_user
USERPASS: vpaycmstest_new_user   ⚠️ kullanıcı adıyla aynı, muhtemelen geçici — §7 madde 3
```

**Karar (uygulandı):** Payload host/port/db/user'ı ayrı okumuyor, tek bir
`DATABASE_URI` bağlantı string'i okuyor (`payload.config.ts:537`) — DevOps
şablonunun "ayrı ConfigMap anahtarı" deseni (Java/Spring için) bize uymuyor.
Tüm `postgres://...` string'i parola dahil **tamamen `clover/k8s/secret.yaml`'da**,
ConfigMap'te host/port/db/user hiç yok.

---

## 4. Faz faz plan — kalanlar

**Faz 0 (bilgi toplama), Faz 2 (health endpoint) tamamlandı.**

### Faz 1 — Repo iskeleti (kalanlar)
- [ ] Site için: kendi repo'suna ayrım henüz yapılmadı (§1)
- [ ] `.github/workflows/` — henüz hiçbir repoda yok, GHES kaydı bekliyor (§7 madde 1)
- [ ] `Containerfile` — mevcut `Dockerfile`'lar bu adla henüz kopyalanmadı (§6.1)
- [ ] Branch modeli: ikisi de hâlâ sadece `main` — `development`/`release`/`master`'a bölünmeli
- [ ] IT/AD'den LDAP service account — bilinçli ertelendi (§6.4)

### Faz 3 — TEST ortamı ilk kurulum (başlamadı)
Manifestler hazır (§8) ama `oc apply` **hiç çalıştırılmadı** — bu fazın
kendisi henüz başlamadı. Sıra `devops-proje-sablonu/docs/05-deployment-runbook.md`
ile aynı, her iki servis için ayrı Secret/ConfigMap/Route, aynı namespace içinde.

### Faz 4-8
Şablondakiyle birebir aynı, henüz kapsam dışı (bu tur sadece TEST).

---

## 5. Kalan eksikler — tek bakışta

```
<repo>/  (Clover VEYA vodafonepaycomtr, ikisi de aynı durumda)
├── .github/workflows/    ❌ yok — GHES repo kaydı bekliyor (§7)
├── Containerfile          ❌ yok — mevcut Dockerfile bu adla kopyalanmalı (§6.1)
└── k8s/                   ✅ hazır (§8), ama hiç `oc apply` edilmedi
```

LDAP gerçek bağlantısı (§6.4) ve migration aracı kararı (§6.3) bu turun
kapsamında değil.

---

## 6. Projeye özgü uyarlama noktaları ve riskler

### 6.1 Containerfile
Şablonun `Containerfile.react` statik SPA (nginx) varsayıyor — bize uymuyor,
ikisi de server-render eden Next.js. Mevcut `Dockerfile`'larımız zaten doğru
desende (multi-stage, `node:24-alpine`, standalone, non-root) — sadece
`Containerfile` adıyla kopyalanmaları gerekiyor. Eksik: CA trust (§6.5).

### 6.2 ✅ Health endpoint — tamamlandı
İkisinde de `GET /api/health/{liveness,readiness}` var, canlıda test edildi,
`deployment.yaml`'lara işlendi. Site'ınki kasıtlı olarak Clover'a bağımlı
değil (kısa bir CMS kesintisi tüm site pod'larını devre dışı bırakmasın diye).

### 6.3 Migration aracı — açık karar
DevOps kuralı: şema migration aracıyla yönetilir, ORM şemayı kendisi asla
değiştirmez. Bizde Payload push-tabanlı senkron kullanıyor (bilinçli karar,
`docs/PROJECT-OVERVIEW.md §10`). İki seçenek: (a) `payload migrate:create`'e
geçilir — **önerim**, R-10 zaten altyapıyı hazırladı; (b) push-tabanlı senkron
istisna olarak DevOps'a kabul ettirilir. Henüz karar verilmedi.

### 6.4 LDAP — hazır ama bağlı değil
`clover/src/access/roleMapping.ts` gerçek AccessPoint LDAP grup adlarını
biliyor ama gerçek LDAPS sunucusuna hiç bağlanmıyor — roller şu an test
kullanıcılarına elle atanmış bir simülasyon. TEST'e ilk çıkışın kapsamında
zorunlu değil, ama prod öncesi kesin gerekli
(`devops-proje-sablonu/docs/03-ldap-entegrasyon-rehberi.md`, T1-T12 test planı).

### 6.5 Sertifika / CA trust
Dockerfile'larımızda henüz yok. Postgres/MinIO bağlantısı TLS isterse
(§2 S5, şimdilik hayır) `NODE_EXTRA_CA_CERTS` eklenmesi gerekecek — CI
runner'ı için de aynı şey geçerli (GHES kendi CA'sını tanımazsa
`actions/cache` patlar).

### 6.6 Non-root / rastgele UID
`USER node` (sabit, non-root) kullanıyoruz — iyi başlangıç ama OCP'nin
`restricted-v2` SCC'si rastgele UID atayabilir. İlk deploy'da dosya
izinlerinin GID 0'a da yazılabilir olup olmadığı kontrol edilmeli
(`ImagePullBackOff`'tan sonraki en olası hata sınıfı).

### 6.7 `readOnlyRootFilesystem` uyumluluğu
Next.js image optimizasyonu kapalı olduğu için diske yazma ihtiyacı düşük —
`readOnlyRootFilesystem: true` + `emptyDir /tmp` muhtemelen yeterli, ilk
deploy'da doğrulanmalı (özellikle Payload'ın upload akışı).

### 6.8 Redis — gerekmiyor
Projede Redis yok (Payload ISR/`revalidateTag` kullanıyor) — şablonun
varsayılan `REDIS_HOST` beklentisi ConfigMap'ten çıkarılmalı, DevOps'a
"Redis kullanmıyoruz" diye belirtilmeli.

### 6.9 Güvenlik taraması proje tipi
`project_type: npm` seçilecek (Java değil). OCP pipeline'ındaki
Sonar/Fortify/Mend, yerel Sonar/Trivy disiplinimizin (`AGENTS.md`) **yerine
geçmiyor**, üstüne ekleniyor.

---

## 7. DevOps ekibine sorulacaklar (kalan)

1. **GitHub Enterprise repo kaydı** — `clover` ve `vodafonepaycomtr` GHES'e
   kayıtlı mı, yoksa şu an sadece `github.com/bbatus/...`'ta mı? Pipeline'lar
   için GHES tarafında da açılmaları gerekecek. **Bu, build/deploy
   pipeline'ının önündeki asıl blokör.**
2. **`vepas-ai-am` namespace'inde gerçekten kota/izin var mı** — Faz 0/3'te
   ilk manuel kurulumda netleşir.
3. **DB parolası** kullanıcı adıyla aynı görünüyor (§3) — gerçek/kalıcı mı?
4. **Image pull secret'ı** için registry kullanıcı adı/token — DevOps'tan/
   registry admin'den alınacak.
5. **Migration kararı** (§6.3) — bizim tarafımızda netleştirilecek bir kod
   kararı, DevOps'a sormaktan çok kendi aramızda.

---

## 8. ✅ k8s manifestleri — üretildi, henüz uygulanmadı (31.08.2026)

Her iki repo'nun kendi `k8s/` klasöründe `deployment/service/route/configmap/
secret/serviceaccount/hpa/networkpolicy` + Clover'da ayrıca `minio.yaml` +
her iki repoda `DEPLOYMENT_RUNBOOK.md` hazır. **Hiçbiri `oc apply` ile test
OCP'ye uygulanmadı.** İçerik detayı: ilgili repoların kendi `k8s/` dosyaları
+ `DEPLOYMENT_RUNBOOK.md`'leri.

---

## 9. Kaynaklar

- `devops-surecleri/Devops-Surecleri.md`, `devops-surecleri/devops-proje-sablonu/` — DevOps şablonu (README + docs/01-07)
- `docs/PROJECT-OVERVIEW.md` — bizim projenin güncel mimarisi (§5 rol modeli, §10 kararlar, §11 sınırlamalar)
- `tasks.md` madde 39/40/40b/40c — repo ayrımı, S1-S12, manifest üretimi, düzeltmelerin tam kaydı
