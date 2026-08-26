# Proje Rehberi — Baştan Sona

**Amaç:** Bu dosya, projeye hiç bakmamış birinin (ya da yeni bir Claude Code oturumunun) 10 dakikada "bu proje ne, ne var, ne yok, neden böyle yapıldı, nasıl çalışır" sorularının cevabını bulabileceği tek bir referans olsun diye yazıldı. `docs/STATUS.md` güncel durumu (ne bitti, ne açık) günlük takip için özetler; bu dosya ise **mimariyi ve "neden"leri** anlatır — ikisi birbirini tamamlar, biri diğerinin yerine geçmez.

Okuma sırası önerisi: önce bu dosya (mimariyi anla) → sonra `docs/STATUS.md` (güncel durumu anla) → gerekirse §9'daki detay dosyalarına in.

---

## 1. Bu proje ne?

**Vodafone Pay'in (vodafonepay.com.tr) reverse-engineer edilmiş, CMS'e bağlı bir klonu.** Orijinal site tersine mühendislikle pixel-perfect kopyalanmış, ardından neredeyse tüm içeriği (metin, görsel, kampanya, blog, SSS, ücret tabloları vb.) hardcoded olmaktan çıkarılıp gerçek bir headless CMS'e taşınmış — böylece bir geliştirici olmadan, iş birimleri (New Vertical, Growth) içeriği kendileri yönetebiliyor.

İki ayrı, birbirinden bağımsız proje tek repo'da yaşıyor:

```
vodafonepaycomtr/     ← Next.js 16 pazarlama sitesi (App Router, React 19, TS strict)
cms/                  ← Payload CMS 3.87 admin paneli (ayrı Docker container)
docs/                 ← Tüm dokümantasyon (bu dosya dahil)
scripts/              ← Sonar/Trivy tarama, cache warm-up, asset indirme script'leri
docker-compose.yml    ← Tüm stack'i (site+cms+postgres+minio) ayağa kaldırır
```

`vodafonepaycomtr/` ve `cms/` npm workspace değil — her birinin kendi `package.json`/`node_modules`/lockfile'ı var, her `npm run <script>` ilgili klasörün İÇİNDEN çalıştırılmalı.

## 2. Neden var — arka plan

Bu, Vodafone Pay için hazırlanmış bir RFP'nin (teklif isteme dokümanı) karşılığı olarak inşa edildi. RFP; draft/publish akışı, maker-checker onay süreci, versiyon geçmişi, audit log, rol bazlı erişim, zamanlanmış yayın, canlı önizleme gibi kurumsal bir CMS'in beklenen tüm özelliklerini talep ediyordu. `docs/RFP-OPEN-ITEMS.md` RFP'nin her maddesinin bu repodaki karşılığını ✅/🟡/❌/⬜ ile işaretliyor; `docs/RFP-GAP-ANALYSIS-2026-08-24.md` en güncel satır-satır uyum analizi.

RFP'nin 30/30 admin maddesi tamamlanmış ve `docs/CMS-USER-TESTS.md`'de tek tek test edilmiş durumda.

## 3. Tech stack

| Katman | Ne kullanılıyor | Neden |
|---|---|---|
| Site framework | Next.js 16, App Router, Turbopack | SSR/ISR, sunucu bileşenleri |
| Site UI | shadcn/ui (Radix), Tailwind v4 | Hızlı, erişilebilir, tema token'lı |
| CMS | Payload CMS 3.87 (Postgres adapter) | Headless, TypeScript-native, self-hosted (3. parti SaaS bağımlılığı yok) |
| DB | Postgres 16 | Payload'ın resmi desteklediği adapter |
| Dosya depolama | MinIO (S3-uyumlu) | Docker'da self-hosted S3 — prod'da gerçek S3'e taşınabilir |
| Zengin metin | `@payloadcms/richtext-lexical` | Payload'ın kendi editörü |
| Deployment | Docker Compose (4 servis: app, cms, postgres, minio) | Tek komutla ayağa kalkan, taşınabilir stack |

## 4. Nasıl çalıştırılır

```bash
docker compose -p vodafonepaycomtr up -d --build app cms
```

Bu, `postgres` ve `minio`'yu da bağımlılık olarak otomatik ayağa kaldırır (`depends_on: condition: service_healthy`).

- Site: http://localhost:3000
- CMS admin: http://localhost:3010/admin
- MinIO console: http://localhost:9001

`docker-compose.yml`'de ayrıca bir `dev` servisi var (hot-reload, port 3001) — bu makinede host-seviyesi bir Docker Desktop dosya-paylaşım izin hatasıyla başlamıyor (bilinen, kod dışı bir sorun; `docs/STATUS.md` §3). Ana stack'i etkilemiyor, `up -d app cms` ile dev servisini atlayabilirsiniz.

**npm ile lokal çalıştırma** (Docker'sız) da mümkün ama bu ortamda tercih edilen yol Docker Compose — env değişkenleri, Postgres/MinIO bağlantıları hepsi compose üzerinden yönetiliyor.

Test kullanıcıları: `docs/TEST-USERS.MD` (4 rol + admin, e-posta/şifre — asla commit edilmez, sadece bu repo'nun kendi kopyasında durur).

## 5. Rol modeli (RBAC)

4 rol, `cms/src/access/roles.ts` → `ROLES`:

| Rol | Yetki |
|---|---|
| `new_vertical_maker` | Her koleksiyonda tam CRUD + publish |
| `new_vertical_checker` | Her koleksiyonu görüntüler/onaylar, yeni kayıt oluşturamaz |
| `growth_maker` | Sadece Campaigns'i oluşturur/düzenler, **kendi yayınladığını yayına alamaz** (maker-checker ayrımı) |
| `growth_checker` | Campaigns'i onaylar/yayınlar, kendi kampanyasını da oluşturabilir |

Gerçek LDAP/AccessPoint bağlantısı henüz kurulmadı (kullanıcı kararı — "şimdilik sadece rol simülasyonu"). `cms/src/access/roleMapping.ts` gerçek AD grup adlarını yukarıdaki 4 role çevirecek eşleme katmanı; LDAP bağlandığında sadece bu dosyaya satır eklemek yeterli olacak şekilde tasarlandı. Plan: `docs/RFP-OPEN-ITEMS.md` §6.

**Kullanıcı hesapları tamamen LDAP/AccessPoint'in olacak şekilde kilitlendi** — CMS içinden email/username/rol/parola değiştirilemez (`cms/src/collections/Users.ts`, `ALLOW_USER_CREATION = false`). Tek self-servis alanlar: avatar, dil tercihi, checker delegasyonu.

## 6. CMS koleksiyonları — ne var, ne işe yarıyor

Grup başlıkları admin sidebar'daki gruplamayla aynı.

### İçerik Yönetimi
| Koleksiyon | Ne tutar | Dikkat edilecek |
|---|---|---|
| **Campaigns** | Kampanyalar (başlık, görsel, açıklama, body, kategori, CTA, tarih aralığı) | Draft/publish + maker-checker onay akışı var; **yayındaki bir kampanya doğrudan PATCH edilemez** — önce yayından kaldırılmalı. `campaignStatus` alanı Payload'ın kendi `_status`'üyle çakışmasın diye özellikle bu adı aldı. |
| **BlogPosts** | Blog yazıları | `coverImage`+`body` zorunlu, kategori `blog` scope'undan seçilir |
| **FaqItems** | SSS soruları | `showOnHomepage` + `homepageOrder` ile anasayfadaki SSS bloğuna da düşebilir |
| **Categories** | Kampanya/Blog/SSS için ortak, business-editable kategori listesi | `scope` alanı (`campaign`/`blog`/`faq`) üç akışın picker'larını birbirinden ayırır — aynı isim (örn. "Kart") farklı scope'larda tekrar edebilir, slug sadece scope içinde unique |
| **ContentBlocks** | Anasayfa ve ürün sayfalarındaki adım/slayt/video/logo blokları (`page` + `blockType` ile serbest tipli) | `page` alanına örnek: `anasayfa-steps` (StepPhones — telefon mockup'ları), `anasayfa-highlights` (FeatureHighlights) |
| **Pages** | Geliştirici gerekmeden, blok sürükle-bırak ile oluşturulan yeni sayfalar (kampanya landing, hub sayfası vb.) | `[...slug]` catch-all route üzerinden render edilir; pilot + 2 ürün sayfası (§8) buraya göçürüldü |
| **Representatives** | Temsilcilikler | Herkese açık okuma |
| **Announcements** | Duyurular | — |

### Ürün Sayfaları
| Koleksiyon | Ne tutar |
|---|---|
| **ProductHeroes** | Her ürün sayfasının (`anasayfa`, `vodafone-pay-uygulama`, `vodafone-pay-kart`, `faturana-yansit` vb.) hero görseli+başlığı |
| **FeatureCards** | Ürün sayfalarındaki özellik kartları |
| **StepCards** | Ürün sayfalarındaki "nasıl kullanılır" adım kartları |

### Ücretler & Limitler
| Koleksiyon | Ne tutar |
|---|---|
| **FeeRows** | `/ucretler-ve-limitler` sayfasının ücret tablosu satırları |
| **LimitTables** | Aynı sayfanın limit tabloları |

### Site Yapısı
| Koleksiyon | Ne tutar |
|---|---|
| **NavLinks** | Header/footer menü linkleri (`section` alanıyla hangi menüye ait olduğu belirlenir), `mobileHref` ile masaüstü/mobil ayrı URL desteği |
| **LegalPages** | 5 hukuki sayfa (gizlilik, çerez, bilgi güvenliği, sözleşmeler, kullanım şartları) — **gövde metni bilinçli olarak hardcoded** (hukuki doğruluk riski, R-22) |
| **CookieRows** | Çerez politikası sayfasındaki tablo satırları |
| **PageMeta** | Sayfa bazlı SEO meta (title/description/OG image) override'ları |

### Sistem
| Koleksiyon | Ne tutar |
|---|---|
| **Users** | CMS kullanıcıları — email/username/rol salt-okunur (LDAP-managed), parola değişikliği tamamen kapalı |
| **Media** | Yüklenen görseller (MinIO/S3'te saklanır), boyut limiti + SVG crop atlama |
| **Documents** | `/sozlesmeler-ve-formlar` sayfasındaki indirilebilir PDF'ler, herkese açık okuma |
| **AuditLogs** | Her create/update/delete/login/export/denied olayının kaydı (RFP §7) — kim, ne zaman, ne yaptı |
| **Translations** | Admin panelinin TR/EN UI string'leri, DB-backed (kod değişikliği gerekmeden metin güncellenebilir) |

### Diğer
| Koleksiyon | Ne tutar |
|---|---|
| **Feedback** | Kullanıcıların gönderdiği geri bildirimler — `read/create/update: () => false` (API'den erişilemez, sadece admin panelinden) |

### Global
| Global | Ne tutar |
|---|---|
| **ContactInfo** (`cms/src/globals/ContactInfo.ts`) | `/iletisim` sayfasının tekil içeriği (adres, telefon, harita vb.) |

## 7. Site nasıl CMS'ten besleniyor

- `vodafonepaycomtr/src/lib/cms.ts` — tüm CMS fetch'lerinin tek noktası. Her koleksiyon için bir `getX()` fonksiyonu, **zod ile runtime doğrulama**, 8sn timeout, yapılandırılmış hata loglama. CMS şeması değişirse (örn. bir alan kaldırılırsa) bu görünür bir hata verir, sessizce `undefined`'a düşmez.
- **Fallback yok:** Bir component CMS'ten veri alamazsa kendi hardcoded içeriğini GÖSTERMEZ — `ContentUnavailable` boş/hata durumunu render eder. Bilinçli tasarım kararı (RFP feedback 5.0): "CMS çökse de sağlıklı görünsün" yerine "CMS'in sağlıksız olduğu görünür olsun".
- **ISR (Incremental Static Regeneration):** Sayfalar `revalidate: 1h` ile statik üretilir; CMS'te bir kayıt değiştiğinde `afterChange` hook'u `revalidateTag`/`revalidatePath` çağırıp ilgili sayfaları tazeler. Bir CMS değişikliğinden sonra tarayıcıda sayfayı **iki kez** yenilemek gerekebilir (stale-while-revalidate: ilk istek eskiyi döner, arka planda tazeler).
- **Draft önizleme:** `/api/preview` — `PREVIEW_SECRET` ile authenticate edilir (site'ın kendi oturumu yok), draft içeriği cache'lenmeden gösterir.

## 8. Route yapısı (`vodafonepaycomtr/src/app/`)

Çoğu sayfa kendi klasöründe sabit bir route (`/kampanyalar`, `/blog`, `/sikca-sorulan-sorular`, `/ucretler-ve-limitler`, `/iletisim`, `/temsilciliklerimiz`, 5 hukuki sayfa, vb.) — içerik CMS'ten geliyor ama route'un kendisi elle yazılmış bir `page.tsx`.

**`[...slug]`** — Pages koleksiyonundaki blok-tabanlı sayfaları render eden catch-all route. Şu an 3 sayfa burada yaşıyor:
- `vodafone-pay-uygulama` (pilot göç)
- `aninda-bakiye`
- `qr-ile-faturana-yansit`

**Hâlâ elle yazılmış kalan 2 ürün sayfası** (bilinçli, kullanıcı kararıyla):
- `faturana-yansit` — `VideosWithTabs`+`LeadFormCta` içeriyor, bu blok tipleri Pages'in blok sistemine henüz eklenmedi
- `vodafone-pay-kart` — `WhereCanIBuy` bloğu aynı sebeple henüz Pages'e giremiyor

## 9. Nerede ne var — doküman haritası

Bu dosya + `docs/STATUS.md` günlük ihtiyacın %90'ını karşılar. Daha derin geçmiş/detay gerektiğinde:

| İhtiyaç | Dosya |
|---|---|
| **Güncel durum, açık işler, ortam notları** | `docs/STATUS.md` — asıl takip dosyası, bu dosyadan sonra oraya bak |
| RFP'nin her maddesinin karşılığı | `docs/RFP-OPEN-ITEMS.md` |
| En güncel RFP uyum analizi (satır satır) | `docs/RFP-GAP-ANALYSIS-2026-08-24.md` |
| Risk kaydı (R-01..R-26), olgunluk skoru | `docs/T0-PRODUCTION-READINESS.md` |
| Kullanıcının ham CMS test geri bildirimi (60+ madde, en ayrıntılı kayıt) | `docs/CMS-USER-TESTS.md` |
| Uçtan uca RBAC/collection test senaryoları | `docs/RUNBOOK.md` |
| Editörler için SSS/Blog kategori rehberi | `docs/SSS-BLOG-REHBER.md` |
| Test kullanıcıları (e-posta/şifre) | `docs/TEST-USERS.MD` |
| İşin bugüne kadarki iş listesi (tamamlanan/açık her madde) | `tasks.md` (repo kökü) |
| Kod yazarken uyulacak kurallar, komutlar, "en önemli notlar" | `AGENTS.md` / `CLAUDE.md` (repo kökü) |

## 10. Önemli mimari kararlar — "neden böyle"

- **Fallback yok, hata görünür olsun** (§7) — sağlıklı görünen ama aslında bozuk bir entegrasyon, gerçekten bozuk ama görünür bir entegrasyondan daha kötü.
- **Categories tek koleksiyon, `scope` ile ayrılıyor** — Campaigns/Blog/FAQ'nin kendi bağımsız kategori listeleri olması gerekiyordu ama üç ayrı koleksiyon açmak yerine tek koleksiyon + scope alanı seçildi (daha az kod, aynı esneklik).
- **`campaignStatus` adı, `status` değil** — Payload'ın kendi draft/publish `_status` alanıyla aynı isimde Postgres enum çakışması yaşandığı için (canlıda doğrulandı).
- **Kullanıcı hesapları CMS'ten yönetilemiyor** — LDAP/AccessPoint'in tekil doğruluk kaynağı olması gerektiği için bilinçli kısıtlama (bkz. `AGENTS.md`'deki "MOST IMPORTANT NOTES").
- **`node:24-alpine` (slim değil)** — Trivy taramasında Debian-slim'in çok daha fazla OS-seviyesi CVE taşıdığı görüldüğü için; runner stage'lerden `npm`/`npx`/`corepack` de bu yüzden silindi.
- **DB şeması push-tabanlı senkronla yönetiliyor, migration'lı değil** — `payload migrate:create` artık çalışıyor (R-10 kapandı) ama migration'a geçiş ayrı, henüz alınmamış bir karar; yeni kolon/enum gerektiğinde hâlâ elle SQL uygulanıyor (`docs/STATUS.md` §5).
- **Her custom admin bileşeni `useAdminLocale()` üzerinden metin basmak zorunda** — admin paneli TR/EN destekliyor, hardcoded metin EN switch'ini kırar.

## 11. Genel proje durumu (özet — güncel detay için `docs/STATUS.md`)

- Güvenlik (P0): tamamı kapalı — gerçek RBAC, segregation of duties, draft-read koruması, boot-time env doğrulaması, Docker image 0 HIGH/CRITICAL.
- CMS entegrasyonu: pazarlama içeriğinin ~%100'ü CMS-editable.
- RFP admin maddeleri: 30/30 tamamlandı ve test edildi.
- Test & kalite: kök proje 345 test, cms 443 test, ikisi de lint+typecheck+test+build yeşil.
- `tasks.md`: 22 maddenin tamamı kapalı, açık checkbox yok.
- Bilinçli açık/kapsam dışı bırakılanlar: gerçek LDAP entegrasyonu, 5 legal+3 kurumsal sayfanın hardcoded kalması, `VideosWithTabs`/`WhereCanIBuy` bloklarının Pages sistemine eklenmemesi, analytics/Sentry entegrasyonları (gerçek hesap bekliyor), SonarQube taraması (token eksik).
