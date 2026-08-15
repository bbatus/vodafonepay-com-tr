# Genel Durum — Tek Takip Dosyası

_Son güncelleme: 15.08.2026, branch `claude/selam-login-disable-temp-725fb7` (main'e her adımda push edildi)._

Bu dosya artık projenin **tek genel durum özeti**dir — "ne yapıldı, ne kaldı" sorusunun
cevabı için önce buraya bakın. Diğer `docs/*.md` dosyaları hâlâ duruyor (tarihsel detay,
madde madde RFP eşleşmesi, kullanıcı test kayıtları için) ama günlük takip için hepsini
tek tek açmaya gerek yok — her birinin ne işe yaradığı en altta [§5](#5-diğer-dokümanlar-ne-zaman-bakılır) içinde listeleniyor.

---

## 1. Proje Nedir

İki ayrı servis, tek repo:
- **Kök dizin** — Next.js 16 pazarlama sitesi (`vodafonepaycomtr`), App Router + Turbopack, Tailwind v4.
- **`cms/`** — Payload CMS 3.87 admin paneli, ayrı Docker container, Postgres + MinIO.

Docker Compose servisleri: `ai-website-cloner` (site, :3000), `vodafonepaycomtr-cms` (cms, :3010),
`vodafonepaycms-postgres`, `vodafonepaycms-minio`. Hepsi `docker compose -p vodafonepaycomtr` ile.

---

## 2. Tamamlananlar (özet — kronolojik değil, konu bazlı)

### 2.1 Güvenlik (P0 — hepsi kapandı)
- Gerçek RBAC: 4 LDAP rol adı birebir (`RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW`, `RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW`, `ROLE_VODAFONEPAY_CMS_CHECKER_RO`, `ROLE_VODAFONEPAY_CMS_MAKER_RW`), 4 test kullanıcısıyla canlı doğrulandı (`docs/TEST-USERS.MD` — sadece ana repo kökünde, bu worktree'de yok, asla commit edilmiyor).
- Segregation of duties: Growth Maker kendi kampanyasını publish edemiyor (`denyMakerPublish`), Growth Checker/NV Checker publish edebiliyor ama create edemiyor.
- Kimlik doğrulaması olmadan `?draft=true` ile yayınlanmamış içerik okunabiliyordu — `denyUnauthenticatedDraftRead` hook'uyla kapatıldı.
- `CMS_AUTO_LOGIN` bayrağının prod'da tanımlı olmaması gerektiği kod içinde büyük uyarıyla işaretli.
- Boot-time env doğrulaması (`cms/src/env.ts`) — prod'da dev-placeholder secret'larla ayağa kalkmayı reddediyor.
- `npm audit`: **kök ve cms'de 0 zafiyet** (xlsx paketi denendi, 2 düzeltilmemiş high-severity CVE'si olduğu görülüp hemen geri alındı — CSV+BOM export'a geçildi, bkz. §2.4).
- Docker image: **0 HIGH/CRITICAL** (Trivy) — her iki Dockerfile `node:24-alpine`, runner stage'den kullanılmayan `npm`/`npx`/`corepack` kaldırıldı.
- SonarQube: kök + cms projelerinde sıfır açık bulgu (bkz. §4 — tarama script'i ve son tarama sonucu).

### 2.2 CMS entegrasyonu — site tarafı
- Pazarlama içeriğinin ~%100'ü artık CMS-editable (adım kartları, slaytlar, marka logoları, video rehberleri, SSS, kampanyalar, ücret/limit tabloları, sayfa meta/breadcrumb). CMS erişilemezse her component kendi fallback'ine düşüyor.
- Kasıtlı olarak CMS'e taşınmayanlar: 5 legal sayfa gövdesi + 3 kurumsal sayfa (hukuki metin doğruluğu riski — bilinçli karar), `VideosWithTabs` (gerçek video içeriği yok).
- `src/lib/cms.ts`: her getter zod ile runtime doğrulama yapıyor, 8sn timeout, yapılandırılmış hata loglama.

### 2.3 CMS admin — RFP'nin tamamı (30/30 madde + LDAP planı)
- Draft/publish, maker-checker onay akışı, versiyon geçmişi/rollback, audit log, sürükle-bırak sıralama, zamanlanmış yayın/kaldırma, deeplink, canlı önizleme (livePreview), Pages/Blocks sayfa oluşturucu, i18n (TR/EN admin paneli), rol-farkında "Yardım" butonları — hepsi `docs/CMS-USER-TESTS.md`'nin Bölüm 1-3'ünde (30 madde) tek tek "Tamamlandı" olarak işaretli ve test edilmiş durumda.
- LDAP'ın kendisi bağlanmadı (kullanıcı kararı: "sadece rol simülasyonu") — ama gerçek LDAP geldiğinde izlenecek plan `docs/RFP-OPEN-ITEMS.md` §6'da yazılı.

### 2.4 İkinci tur kullanıcı geri bildirimi (14-15.08.2026, `docs/CMS-USER-TESTS.md` Bölüm 4)
- Kampanya listesi artık en son oluşturulana göre sıralı.
- Taslak kaydında zorunlu alanlar (title/slug/description/image/category) artık gerçekten zorunlu — `versions.drafts.validate: true`; Growth Maker için buton "Onaya Gönder" yazıyor.
- Yayınlama onayı modalındaki önizleme baştan 3 kez elden geçti: önce tam detay sayfası (görsel çok büyüktü) → tam `/kampanyalar` listesi (alakasız kartlar + header/nav gürültüsü) → **son hali: sadece o kampanyanın kartı**, `kampanyalar/[slug]/kart-onizleme` route'unda, `CardListCard` bileşeni gerçek liste sayfasıyla paylaşılıyor. Ayrıca site, kendi sayfası bir CMS iframe'i içine gömüldüğünü algılayıp kendi scrollbar'ını gizliyor (`data-embedded-preview` + CSS, `layout.tsx`/`globals.css`).
- Profil sayfası tamamen özel bir view ile yeniden yazıldı (`CustomAccountView`/`AccountForm`): e-posta ve rol artık düz metin (gerçekten sunucu tarafında da kilitli — field-level `access.update`), "Parolayı Değiştir"/"Hesabı Etkinleştir" tamamen kaldırıldı, avatar yükleme çalışıyor (üstteki ikon da güncelleniyor, `admin.avatar` custom component), tek bir dil değiştirici kaldı (Payload'ın kendi "Ayarlar" bloğu hiç render edilmiyor).
- Users listesine "Dışa Aktar (CSV)" butonu eklendi — Türkçe karakterler UTF-8 BOM ile korunuyor.
- **Bugün (15.08.2026) bulunan ek bug:** kampanya kartındaki "Detayları gör" butonu, `Campaigns.ctaLabel` alanı hiçbir yere bağlı olmadığı için değiştirilemiyordu — 3 ayrı render noktasında (`CardListGrid`, homepage'in `Campaigns.tsx` slider'ı, `campaignDetailSchema`'nın `ctaLabel`/`ctaUrl`'i hiç parse etmemesi) düzeltildi, `linkLabel`/`ctaUrl` artık gerçekten uçtan uca çalışıyor ve canlı doğrulandı.

### 2.5 Test & Kalite altyapısı
- Kök: Vitest + Testing Library, 8 test dosyası, 85 test — hepsi geçiyor.
- `cms/`: Vitest, 6 test dosyası, 68 test — hepsi geçiyor.
- Her iki projede de `npm run check` (lint+typecheck+test+build) yeşil.
- SonarQube + Trivy her büyük değişiklikten sonra zorunlu adım (`AGENTS.md`'de yazılı).

---

## 3. Açık Kalan Riskler / Yapılacaklar

| ID | Konu | Durum |
|---|---|---|
| R-10 | `payload migrate:create` çalışmıyor (`ERR_REQUIRE_ASYNC_MODULE`) — yeni collection/field eklemek prod container'ını kırabiliyor. Geçici çözüm: `NODE_ENV=development` ile tek seferlik `next dev` push-sync. **En kritik yapısal açık.** | Açık |
| R-26 | Postgres native enum'lar (`enum_users_role` vb.), migration olmadan `select` seçenek değişikliğinde manuel `ALTER TYPE` istiyor — R-10'un somut bir belirtisi. | Açık |
| R-22 | 5 legal sayfa + 3 kurumsal sayfa gövdesi hâlâ hardcoded (bilinçli — hukuki doğruluk riski). | Bilinçli açık |
| R-23 | `VideosWithTabs` CMS'e bağlanmadı (gerçek video yok, ürün kararı bekliyor). | Bilinçli açık |
| R-15..R-21 | Yapısal/operasyonel P2'ler: şablon `package.json` kimliği, workspace ayrımı yok, Node/Next sürüm hizası, prod image domain'i, dev servisinin prod compose'da olması, `/api/health` yok, sitemap/robots/error sayfaları eksik. | Dokunulmadı |
| CI | `.github/workflows/ci.yml` hâlâ `master`'ı izliyor, gerçek branch `main` — muhtemelen hiç çalışmıyor; `cms/`'i hiç doğrulamıyor. | Açık |
| LDAP | Gerçek LDAP/AccessPoint bağlantısı kurulmadı (kullanıcı kararı). Plan hazır: `docs/RFP-OPEN-ITEMS.md` §6. | Kullanıcı kararıyla bekliyor |
| Analytics/Sentry/çoklu kanal | RFP'nin gerçek 3. parti hesap/altyapı gerektiren maddeleri (§3.2.10, §3.2.11, §4 hata izleme, §3.5.2-3.5.5 rol-özel raporlama ekranları) — gerçek hesap bilgisi olmadan sahte entegrasyon eklemek anlamsız. | Kapsam dışı (bilgi bekliyor) |
| Masaüstü/mobil ayrı URL (§3.2.2) | Hiç alan yok — niş bir istek, modern responsive tasarımla zaten karşılanıyor. | Açık, düşük öncelik |

---

## 4. Zorunlu Kontrol Listesi (her büyük değişiklikten önce/sonra)

1. `npm run typecheck && npm run lint && npm run test` — hem kökte hem `cms/`'de.
2. `docker compose -p vodafonepaycomtr build <servis>` + `up -d <servis> --force-recreate`.
3. Tarayıcıda gerçek test kullanıcılarıyla canlı doğrulama (rol bazlı).
4. `SONAR_TOKEN=<token> scripts/sonar-scan.sh all` (veya `web`/`cms`) — açık bulgu kalmamalı.
5. Dockerfile/dependency değiştiyse `scripts/trivy-scan.sh all`.
6. Commit → `origin/<branch>` push → fast-forward mümkünse `origin/<branch>:main` push.

---

## 5. Diğer Dokümanlar — Ne Zaman Bakılır

Bu dosya güncel genel durumu özetler; aşağıdakiler hâlâ duruyor çünkü belirli bir konuda
tarihsel/madde-madde detay taşıyorlar — silinmediler, sadece günlük takip için bu dosya yeterli:

| Dosya | Ne için |
|---|---|
| `docs/CMS-USER-TESTS.md` | Kullanıcının CMS'i uçtan uca test ederken verdiği ham geri bildirimin birebir kaydı + her maddenin DoD/fix/test detayı (4 bölüm, 35 madde). |
| `docs/RFP-OPEN-ITEMS.md` | RFP'nin her maddesinin (§3.1-§7) bu repo'daki güncel karşılığı — ✅/🟡/❌/⬜ notasyonuyla. |
| `docs/RUNBOOK.md` | Uçtan uca RBAC/collection test senaryoları — yeni bir rol/collection eklendiğinde nasıl test edileceği. |
| `docs/T0-PRODUCTION-READINESS.md` | Detaylı risk kaydı (R-01..R-26), olgunluk skoru, fazlı yol haritası — bu dosyadaki §3 tablosunun kaynağı. |
| `docs/AUDIT-CONTENT-CMS.md`, `docs/BACKLOG-CONTENT-CMS.md`, `docs/CMS_INTEGRATION_PLAN.md` | CMS entegrasyonunun ilk planlama/denetim aşamasından kalma dokümanlar — artık büyük ölçüde tamamlanmış işin planı, tarihsel referans. |
