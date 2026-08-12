# Genel Durum Özeti

_Son güncelleme: bu oturumun sonunda, branch `claude/selam-login-disable-temp-725fb7`._

İki ayrı proje var: kök dizindeki Next.js pazarlama sitesi ve `cms/` altındaki Payload CMS
mikroservisi. Ayrıntılı, madde madde risk kaydı için [`docs/T0-PRODUCTION-READINESS.md`](./T0-PRODUCTION-READINESS.md)'a bakın — bu dosya onun özeti, güncel test/coverage rakamlarıyla.

---

## 1. Kök Proje — Next.js Pazarlama Sitesi

**Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4, shadcn/ui.

### Neler düzeltildi bu oturumda
- **CMS entegrasyonu %100'e çıktı** — daha önce hardcoded olan tüm "pazarlama içeriği" (adım kartları, slaytlar, marka logoları, video rehberleri, SSS, kampanyalar, ücret/limit tabloları) artık `src/lib/cms.ts` üzerinden CMS'ten geliyor, CMS boşsa/erişilemezse her component kendi fallback'ine düşüyor. Kasıtlı olarak CMS'e taşınmayanlar: 5 legal sayfa gövdesi ve `kurumsal-yonetim`/`faydali-bilgiler`/`site-haritasi` (hukuki metin doğruluğu riski), `VideosWithTabs` (gerçek video içeriği yok, ürün kararı bekliyor).
- **`src/lib/cms.ts` yeniden yazıldı** — her getter artık zod ile runtime doğrulama yapıyor, 8 saniyelik `AbortSignal.timeout`, yapılandırılmış hata loglama. Canlı bir bug bulundu ve düzeltildi: Payload boş opsiyonel alanları JSON `null` döndürüyor (key'i silmiyor), `z.string().optional()` bunu reddediyordu → `nullableString()`/`nullableStringDefault()` helper'larıyla düzeltildi.
- **`/api/revalidate` sertleştirildi** — `crypto.timingSafeEqual` ile zaman-sabit secret karşılaştırması, 13 elemanlık tag allowlist, 60 saniyede 30 istek rate limit.
- **`temsilciliklerimiz` (bayi bulma) formu düzeltildi** — gerçek 81 il / ilçe verisi (`src/data/il-ilce.ts`), "Bul" butonu il+ilçe seçilene kadar disabled, seçilince Google Maps aramasına yönlendiriyor.
- **SSS sayfasındaki çift kaynak sorunu çözüldü** — `sikca-sorulan-sorular` artık CMS'ten geliyor, kategori bazlı filtreleme CMS kategorileriyle eşleşiyor.
- **Universal Links / App Links** eklendi — Safari→uygulama token kaybı senaryosuna karşı önlem (canlıda daha önce yaşanan bir soruna karşı, bu ortamda henüz gerçekleşmemiş bir riski önceden kapatmak için).
- **`npm audit`: 0 zafiyet** (önceden 15, 10'u high — `sharp`, `qs`, Next minor upgrade ile giderildi).
- **Docker image: 0 zafiyet** (Trivy) — `node:24.14.1-slim` → `node:24-alpine`, runner stage'den kullanılmayan `npm`/`npx`/`corepack` kaldırıldı.
- **SonarQube: tüm bulgular giderildi** (self-hosted Community Edition, `scripts/sonar-scan.sh`).

### Test & Coverage (bu oturumda ilk kez kuruldu)
- Vitest + Testing Library, 8 test dosyası, **71 test — hepsi geçiyor**.
- Coverage (v8, `npx vitest run --coverage`): **%62.68 statements / %59.33 branch / %54.4 fonksiyon / %64.11 satır** (kapsam: `src/lib`, `src/components`, `src/data`, `src/app/api` — sayfa/layout dosyaları ölçüm dışı, ince veri-çekme+JSX sarmalayıcılar oldukları için).
  - `lib/cms.ts`: %100 statement.
  - `api/revalidate/route.ts`: %91.
  - Component'lerin bir kısmı (Header, Footer, StepPhones, HowToEarn, ...) henüz test edilmedi — coverage'ın component tarafındaki asıl açığı burası.

### Açık kalan riskler (bilerek bu oturumda kapsam dışı bırakılan/ertelenen)
| ID | Konu |
|---|---|
| R-10 | Payload migration tooling çalışmıyor (`payload migrate:create` → `ERR_REQUIRE_ASYNC_MODULE`); prod'da yeni collection/field eklemek container'ı kırıyor. Bu oturumda `ContentBlocks` eklenirken gerçekten kırdı, geçici olarak `NODE_ENV=development` push-sync ile atlatıldı — kalıcı çözüm değil. |
| R-22 | 5 legal sayfa gövdesi + 3 kurumsal sayfa hâlâ hardcoded (bilinçli karar — hukuki doğruluk riski). |
| R-23 (kalan) | `VideosWithTabs` component'i CMS'e bağlanmadı (gerçek video yok, ürün kararı bekliyor). |
| R-15..R-21 | Yapısal/operasyonel P2'ler (şablon `package.json` kimliği, workspace ayrımı yok, Node/Next sürüm hizası, prod image domain'i, dev servisinin prod compose'da olması, `/api/health` yok, sitemap/robots/error sayfaları yok). Bu oturumda dokunulmadı. |

---

## 2. `cms/` — Payload CMS Mikroservisi

**Stack:** Payload CMS 3.87, Postgres (Drizzle), MinIO (S3-uyumlu depolama), ayrı Docker container.

### Neler düzeltildi bu oturumda
- **Gerçek RBAC kuruldu** — Vodafone LDAP/AccessPoint'ten gelen 4 gerçek rol adı birebir kullanıldı (değiştirilmedi): `RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW`, `RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW`, `ROLE_VODAFONEPAY_CMS_CHECKER_RO`, `ROLE_VODAFONEPAY_CMS_MAKER_RW`. LDAP bağlanmadı (istendiği gibi) — bunun yerine 4 gerçek test kullanıcısı oluşturulup her biriyle giriş yapılarak farklı yetkiler (create/update/publish/reddedilenler) 201/200/403 kodlarıyla ampirik doğrulandı. Segregation-of-duties: Growth Maker kendi oluşturduğu kampanyayı publish edemiyor (`denyMakerPublish` hook).
- **Draft-read sızıntısı bulundu ve düzeltildi** — kimlik doğrulaması olmadan `?draft=true` ile yayınlanmamış içerik okunabiliyordu. Payload'ın dokümante edilen `readVersions` deseni tek başına işe yaramadı; asıl çözüm `beforeOperation` hook'u (`denyUnauthenticatedDraftRead`).
- **`CMS_AUTO_LOGIN` bayrağının gerçek kapsamı belgelendi** — bu bayrak açıkken sadece login ekranı değil, cookie'siz çıplak istekler de dahil TÜM istekler kimlik doğrulanmış sayılıyor. Bu, yalnızca local dev için var; prod'da tanımlı olmamalı. Kod içinde büyük bir uyarı yorumuyla işaretlendi.
- **Boot-time env doğrulaması** (`cms/src/env.ts`, zod) — prod'da (`NODE_ENV=production` ve auto-login kapalı) bilinen dev-placeholder secret'larla (`PAYLOAD_SECRET`, `DATABASE_URI`, `REVALIDATE_SECRET`) ayağa kalkmayı reddediyor.
- **`ContentBlocks` collection'ı eklendi** — step/slide/video/logo tiplerini tek, esnek bir collection'da toplayan tasarım (kök projedeki CMS entegrasyonunun %100'e çıkmasını sağlayan parça).
- **`npm audit`: 0 zafiyet** (17 zafiyet vardı — `dompurify`, `esbuild`, `undici` transitive dependency'leri `overrides` ile, `sharp` doğrudan upgrade ile giderildi).
- **Docker image: 0 zafiyet** (aynı alpine geçişi).
- **SonarQube: tüm bulgular giderildi.**

### Test & Coverage (bu oturumda ilk kez kuruldu)
- Vitest, 5 test dosyası, **54 test — hepsi geçiyor**.
- Coverage: **%86.95 statements / %94.87 branch / %58.62 fonksiyon / %86.2 satır** — özellikle bu oturumun güvenlik kritik kodu (`access/roles.ts`, `access/authenticated.ts`, `hooks/revalidate.ts`, `env.ts`) yüksek kapsamda. Collection/global dosyalarındaki düşük fonksiyon-coverage rakamı yanıltıcı — bunlar çoğunlukla statik config objeleri, çalıştırılabilir fonksiyon içermiyor (yalnızca access-wiring smoke test'leri var).

### Açık kalan riskler
| ID | Konu |
|---|---|
| R-10 | (yukarıdaki ile aynı) Migration tooling yok — en kritik açık risk. |
| R-26 | Postgres native enum (`enum_users_role`), migration olmadan `select` alan seçenekleri değiştiğinde manuel `ALTER TYPE` gerektiriyor — R-10'un somut bir örneği, aynı kök nedene bağlı. |

---

## 3. Ortak Altyapı (her iki proje için)

- **SonarQube** — self-hosted Community Edition, `tools/sonarqube/docker-compose.yml`, `scripts/sonar-scan.sh`. `AGENTS.md`'de her büyük component/kod değişikliğinden sonra commit/push öncesi zorunlu adım olarak dokümante edildi.
- **Trivy** — hem container image hem dependency (SCA) taraması, `scripts/trivy-scan.sh`. Her iki proje de şu an **0 HIGH/CRITICAL** (OS katmanı ve dependency).
- **Docker Compose** — `ai-website-cloner` (site), `vodafonepaycomtr-cms`, `vodafonepaycms-postgres`, `vodafonepaycms-minio`. Bu özet yazılırken container'lar ayakta değildi (dev sırasında ihtiyaca göre başlatılıyor); önceki oturumlarda tüm sağlık kontrolleri (DB bağlantısı, admin panel, site) geçmişti.
- **CI:** `.github/workflows/ci.yml` hâlâ `master` branch'ini tetikliyor, gerçek default branch `main` — muhtemelen hiç çalışmıyor, ve `cms/` içeriğini hiç doğrulamıyor (R-05, R-06 — bu oturumda dokunulmadı, hâlâ açık).

---

## 4. Özetle Nerede Duruyoruz

**Güvenlik:** P0 seviyesindeki tüm bulgular (dekoratif RBAC, draft sızıntısı, secret default'ları, `CMS_AUTO_LOGIN`'in gerçek kapsamı) çözüldü ve canlı doğrulandı. Kalan tek yapısal risk migration tooling'in çalışmamasıdır (R-10) — bu bir güvenlik açığı değil ama operasyonel bir kırılganlık.

**Kod kalitesi:** SonarQube temiz, `npm audit`/Trivy her iki projede de sıfır zafiyet, test altyapısı ilk kez kuruldu (kök %62.68, cms %86.95 statement coverage — ikisi de "40-50 üstü" hedefinin üzerinde).

**İçerik:** Pazarlama içeriğinin neredeyse tamamı artık CMS-editable; sadece hukuki/kurumsal metinler ve karar bekleyen bir video component'i bilinçli olarak dışarıda bırakıldı.

**Kalan en önemli açık:** CI'ın yanlış branch'i izlemesi (muhtemelen hiç çalışmıyor) ve migration tooling'in kırık olması — ikisi de bu oturumun kapsamında değildi, ayrı bir çalışma gerektiriyor.
