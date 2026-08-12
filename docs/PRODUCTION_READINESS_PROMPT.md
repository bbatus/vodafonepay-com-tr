# Claude Cowork / Claude Code Prompt — vodafonepaycomtr T0 Analizi & Production Hazırlığı

> Bu dosya, projeyi "PoC" durumundan "production'a gidebilir mi?" sorusuna cevap verebilir hale
> getirmek için Claude'a verilecek promptu içerir. Aşağıdaki **PROMPT** bloğunu olduğu gibi kopyalayıp
> yeni bir Cowork / Claude Code oturumuna yapıştır.

---

## Nasıl kullanılır

Prompt 4 faza bölünmüş durumda. **Hepsini tek seferde çalıştırma.**

1. Önce sadece **FAZ 0**'ı ver → rapor gelsin, oku, kararları sen ver.
2. Sonra **FAZ 1**'i ver (monorepo ayrıştırma) → tek başına, davranış değişikliği olmadan.
3. FAZ 2 ve 3'ü, FAZ 0 raporundaki önceliklendirmeye göre parça parça ver.

Sebep: refactor + restructure + feature work aynı commit'te karışırsa neyin neyi bozduğunu
anlayamazsın. Her fazın sonunda `npm run check` yeşil olmalı ve ayrı bir branch/PR olmalı.

---

## PROMPT — FAZ 0: T0 Durum Analizi ve Rapor

```
Bu repo, vodafonepay.com.tr sitesinin AI ile klonlanmış bir PoC'u. İki ayrı Next.js uygulaması
aynı klasörün içinde duruyor: kök dizinde public site, cms/ altında Payload CMS. Kodun tamamı
"test amaçlı" yazıldı, production kalite hedefi gözetilmedi.

GÖREVİN: Kod yazma. Sadece analiz et ve rapor üret.

Şu anki durumun (T0) eksiksiz bir teknik durum tespitini çıkar ve
`docs/T0-PRODUCTION-READINESS.md` dosyasına yaz.

## Kapsam — şu eksenlerin HER BİRİNİ ayrı ayrı incele

1. **Repo yapısı & bağımlılık yönetimi**
   - İki uygulamanın izolasyonu, paylaşılan tip/kod olup olmadığı
   - package.json'ların tutarlılığı (isim, versiyon, engines, dependency sürümleri)
   - build/lint/typecheck sınırlarının nasıl çizildiği

2. **Mimari & veri akışı**
   - Site → CMS veri akışı, ISR/revalidate mekanizması, cache stratejisi
   - CMS'e bağlanmış içerik vs. koda gömülü içerik — tam bir kapsama matrisi çıkar
     (hangi component/sayfa CMS'ten besleniyor, hangisi hardcoded, hangisinde İKİSİ de var)

3. **Kod kalitesi**
   - Tekrar eden pattern'ler, kopyala-yapıştır kod, tek sorumluluğu aşan dosyalar
   - Tip güvenliği: runtime'da gelen verinin tipinin gerçekten doğrulanıp doğrulanmadığı
   - Hata yönetimi: yutulan hatalar, sessiz fallback'ler, timeout'suz network çağrıları
   - Ölü kod / çalışmayan UI / yarım bırakılmış özellikler
   - İsimlendirme, dosya organizasyonu, component boyutları

4. **Güvenlik**
   - CMS access control ve yetkilendirme modeli
   - Secret yönetimi, default değerler, prod'da dev secret'la boot etme riski
   - Webhook/endpoint doğrulama, rate limiting
   - CORS/CSRF, cookie ayarları, object storage erişim politikası
   - Bağımlılık zafiyetleri (`npm audit` çıktısını her iki app için de al)

5. **Veri katmanı & operasyon**
   - DB migration stratejisi, schema değişikliklerinin prod'da nasıl uygulanacağı
   - Backup/restore, veri kaybı senaryoları
   - Docker/compose'un production'a uygunluğu
   - Health check, observability, logging, alerting

6. **Web kalitesi**
   - SEO: metadata kapsamı, sitemap, robots, OG/Twitter kartları, structured data
   - Performance: Core Web Vitals riskleri, bundle, font/görsel yükleme
   - Erişilebilirlik (a11y): klavye navigasyonu, focus görünürlüğü, ARIA, form etiketleri
   - Responsive davranış ve hata sayfaları (error/not-found/loading)

7. **Test & CI/CD**
   - Mevcut test kapsamı, CI pipeline'ın gerçekte neyi koruduğu
   - Deploy süreci, rollback imkanı, environment ayrımı

8. **Yasal & uyumluluk riski — BUNU ATLAMA**
   - Bu proje gerçek bir markanın sitesinin birebir kopyası; marka varlıkları, fontları,
     görselleri, metinleri ve hukuki metinleri kullanılıyor. Ayrıca bu bir ödeme/fintech markası.
   - Production'a çıkma senaryosunda marka/telif, KVKK ve finansal regülasyon açısından
     nelerin netleşmesi gerektiğini P0 blocker olarak raporun EN BAŞINA yaz.
   - Bu maddeyi teknik bulguların arasına gömme; ayrı ve görünür bir bölüm olsun.

## İncelerken mutlaka doğrula (ön tespitlerim — teyit et, genişlet, yanlışsa düzelt)

Aşağıdakiler benim hızlı bakışımda gördüklerim. Her birini kodda doğrula, doğruysa rapora
kanıtıyla (dosya:satır) ekle, yanlışsa neden yanlış olduğunu yaz. Bu liste TAM DEĞİL —
kendi bulgularını da ekle.

- Kök `package.json` hâlâ şablon kimliğini taşıyor (`ai-website-clone-template`, şablonun
  author/repository/homepage/keywords alanları). Proje kimliği yanlış.
- `tsconfig.json` `cms` klasörünü exclude ediyor, `eslint.config.mjs` `cms/**` ignore ediyor —
  iki app arasındaki sınır workspace yerine ignore listeleriyle çizilmiş.
- Node engines uyumsuz (kök `>=24`, cms `>=20`); Next sürümleri farklı ve biri pinned biri caret.
- `.github/workflows/ci.yml` yalnızca kök uygulamayı lint/typecheck/build ediyor; `cms/` CI'da
  hiç doğrulanmıyor.
- Repoda hiç test yok — ne unit, ne integration, ne e2e, ne görsel regresyon.
- Tüm Payload collection'larında `access: { read: () => true }`. Draft/versiyon açık olan
  collection'larda yayınlanmamış içeriğin REST üzerinden sızıp sızmadığını özellikle kontrol et.
- `Users` collection'ında `role` alanı var ama hiçbir access fonksiyonu bu alanı kullanmıyor —
  RBAC dekoratif; kimliği doğrulanmış her kullanıcı fiilen tam yetkili.
- `PAYLOAD_SECRET || ""`, `dev-revalidate-secret`, `payload/payload` gibi default'lar hem
  config'de hem compose'da var → prod'da eksik env ile sessizce boot etme riski.
- `/api/revalidate` secret'ı basit `!==` ile karşılaştırıyor; rate limit ve tag allowlist yok.
- `src/lib/cms.ts` CMS yanıtını runtime doğrulaması olmadan tipli interface'e cast ediyor;
  `cmsFetch` tüm hataları yutup `null` dönüyor, timeout yok, log yok. CMS çöktüğünde site
  sessizce eski/hardcoded içeriğe düşer ve kimse fark etmez.
- İçerikte çift kaynak problemi: Campaigns, Footer, Header, PricesAndLimits ve kampanyalar
  sayfası hem CMS'ten besleniyor hem de kod içinde `fallback*` sabit dizileri taşıyor.
- Buna karşılık AppFeatures, BrandLogoGrid, EarnWithCard, Faq, FeatureHighlights, FilterTabs,
  StepPhones, VideoGuideSection, VideosWithTabs tamamen hardcoded — CMS'e hiç bağlanmamış.
  Yani içerik yönetimi yarım: editör bazı şeyleri değiştirebiliyor, bazılarını değiştiremiyor.
- `LegalPages` collection'ı var ama hukuki metinlerin gövdesi TSX içinde hardcoded duruyor
  (ör. gizlilik politikası sayfası ~250 satır JSX). Hukuki metnin deploy gerektirmesi ciddi bir
  operasyonel risk.
- `TemsilciliklerimizForm` çalışmayan bir UI: 81 il hardcoded, ilçe select'i her zaman boş,
  "Bul" butonu hiçbir şey yapmıyor. Kullanıcıya kırık özellik gösteriliyor.
- `next.config.ts` içindeki `images.remotePatterns` sadece `localhost:9000` ve `minio`'ya izin
  veriyor — prod medya domain'i yok.
- `docker-compose.yml` içinde prod `app` servisiyle birlikte bir `dev` servisi de
  `restart: unless-stopped` ile tanımlı.
- Health check'ler `/` ve `/admin` sayfalarını çekiyor; ayrı bir readiness endpoint'i yok.
- Payload postgres adapter'da migration dosyası/stratejisi görünmüyor — prod'da schema
  auto-push riski var mı, kontrol et.

## Rapor formatı

`docs/T0-PRODUCTION-READINESS.md`:

1. **Executive Summary** (max 1 sayfa) — projenin bugünkü hali bir cümlede, ve net bir
   **Go / No-Go / Conditional-Go** kararı gerekçesiyle.
2. **P0 Bloklayıcılar** — yasal/uyumluluk maddesi dahil, production'a çıkışı imkansız kılanlar.
3. **Sistem envanteri** — iki servis, portlar, bağımlılıklar, veri akış diyagramı (mermaid).
4. **İçerik kapsama matrisi** — tablo: Sayfa/Component | CMS'te mi | Hardcoded mı | Çift kaynak mı | Aksiyon
5. **Bulgu kayıt defteri (risk register)** — her satır şu kolonlarla:
   `ID | Başlık | Kategori | Önem (P0/P1/P2/P3) | Kanıt (dosya:satır) | Etki | Önerilen çözüm | Tahmini efor (S/M/L)`
   Önem sıralaması için "prod'da patlarsa ne olur" kriterini kullan, "kod çirkin" kriterini değil.
6. **Eksen bazlı olgunluk skoru** — yukarıdaki 8 eksenin her biri için 1-5 skor + tek cümle gerekçe.
   Skorları bir tabloda topla ve genel olgunluk seviyesini belirt.
7. **Fazlı yol haritası** — Faz 1 (yapısal ayrıştırma), Faz 2 (kod kalitesi), Faz 3 (production
   sertleştirme), Faz 4 (nice-to-have). Her faz için: kapsam, çıktı, kabul kriteri, tahmini efor.
8. **Karar gerektiren açık sorular** — benim (proje sahibinin) cevaplaması gereken sorular
   listesi. Örn: bu proje gerçekten yayına çıkacak mı yoksa iç demo mu, object storage prod'da
   MinIO mı gerçek S3 mü, kaç editör kullanacak, beklenen trafik. Bu soruları varsayımla geçme,
   açıkça sor.

## Kurallar

- Hiçbir kod dosyasını değiştirme. Sadece `docs/T0-PRODUCTION-READINESS.md` oluştur.
- Her iddiayı `dosya:satır` referansıyla kanıtla. Kanıtlayamadığın şeyi "doğrulanmadı" diye işaretle.
- Genel Next.js/güvenlik tavsiyesi yazma; bu repodaki somut koda dair konuş.
- Abartma da, yumuşatma da. PoC'un PoC olduğu için "kötü" olması normal — asıl soru
  "buradan production'a giden yol ne kadar uzun ve nerede kırılır".
- Emin olmadığın yerde tahmin yürütme, "doğrulanması gerekiyor" yaz.
```

---

## PROMPT — FAZ 1: Monorepo Ayrıştırması

> FAZ 0 raporu okunduktan ve onaylandıktan sonra ver.

```
FAZ 1: Repoyu, iki mikroservisin ilk sınıf vatandaş olduğu bir monorepo'ya dönüştür.

## Hedef yapı

```
apps/
  web/            # mevcut kök Next.js sitesi buraya taşınır
  cms/            # mevcut cms/ buraya taşınır
packages/
  cms-client/     # src/lib/cms.ts + Payload'dan generate edilen tipler, tek paylaşılan katman
infra/
  docker/         # Dockerfile'lar ve compose dosyaları
docs/
```

- npm workspaces kullan (repo zaten npm; pnpm'e geçiş ayrı bir karar, şimdi yapma).
- Kök `package.json` sadece workspace orchestration yapsın: `dev`, `build`, `lint`, `typecheck`,
  `check` script'leri her iki app'i de kapsasın.
- Kök package.json'daki şablon kimliğini (`ai-website-clone-template`, şablonun author/repository/
  homepage/keywords alanları) projenin kendi kimliğiyle değiştir.
- `tsconfig.json`'daki `exclude: ["cms"]` ve `eslint.config.mjs`'deki `cms/**` ignore hack'lerini
  kaldır; sınırı workspace yapısı çizsin. Ortak base tsconfig ve base eslint config oluştur,
  her app kendi config'inde extend etsin.
- Node engines ve Next sürümlerini iki app arasında hizala; `.nvmrc` ile tutarlı olsun.
  Sürümleri pinle (caret bırakma).
- Dockerfile'ları ve `docker-compose.yml`'i yeni build context'lere göre güncelle;
  `.dockerignore`'u workspace yapısına uyarla. Compose'daki `dev` servisini prod compose'undan
  ayır (`compose.yml` + `compose.dev.yml` override).
- `.github/workflows/ci.yml`'i her iki app'i de lint + typecheck + build edecek şekilde güncelle;
  mümkünse workspace bazlı matrix kullan.

## Kritik kısıt

Bu faz SAF bir taşıma işlemidir. Hiçbir davranış, hiçbir UI, hiçbir iş mantığı değişmeyecek.
Refactor'a girme, kod kalitesi düzeltmesi yapma — onlar FAZ 2. Bu fazda sadece dosyalar yer
değiştirir, config'ler yeni yollara uyarlanır.

## Doğrulama (bunları yapmadan bitti deme)

1. `npm run check` her iki app için de yeşil.
2. `docker compose up` ile tüm stack ayağa kalkıyor; site 3000'de, admin 3010'da açılıyor.
3. CMS'te bir kampanya değiştir → revalidate webhook'u tetikleniyor ve site güncelleniyor.
4. `git diff --stat` çıktısını incele: içerik değişikliği içeren (sadece yol değişmemiş) her
   dosyayı ayrı ayrı gerekçelendir.
5. Taşıma öncesi ve sonrası için ana sayfa + 3 ürün sayfasının ekran görüntüsünü al ve
   görsel olarak birebir aynı olduklarını doğrula.

## Çalışma şekli

- Ayrı bir branch'te çalış. AGENTS.md'de belirtildiği gibi paralel agent kullanacaksan her biri
  kendi worktree'sinde çalışsın ve sonunda merge et.
- `git mv` kullan ki history korunsun.
- Mantıksal adımlar halinde commit at (yapı iskeleti → web taşıma → cms taşıma → shared package →
  docker/CI güncelleme), tek dev commit atma.
- Bittiğinde `docs/T0-PRODUCTION-READINESS.md`'deki ilgili bulguları "çözüldü" olarak işaretle.
```

---

## PROMPT — FAZ 2: Kod Kalitesi Refactor'u

> FAZ 1 merge edildikten sonra. Bu fazı da bulgu bulgu ver, hepsini birden değil.

```
FAZ 2: docs/T0-PRODUCTION-READINESS.md'deki P1 kod kalitesi bulgularını çöz.

Öncelik sırası (üstteki en kritik):

1. **Tek içerik kaynağı kararı.** Şu an bazı içerik hem CMS'te hem kodda `fallback*` sabiti
   olarak duruyor, bazısı sadece kodda. Bu belirsizliği bitir:
   - CMS'e taşınacak içeriği taşı ve seed script'ini güncelle.
   - Kodda kalacak `fallback` verisi varsa bunu bir "component default'u" olmaktan çıkarıp
     açıkça `seed-data` olarak isimlendirilmiş tek bir modülde topla; component'ler sabit
     içerik taşımasın.
   - Hukuki metinleri CMS'e taşı — hukuk metninin değişmesi deploy gerektirmemeli.
   - Sonuçta her içerik parçasının tek ve belirli bir sahibi olsun; kapsama matrisini güncelle.

2. **CMS istemcisini sağlamlaştır** (`packages/cms-client`):
   - Payload'ın generate ettiği tipleri kaynak al; elle yazılmış paralel interface'leri sil.
   - Gelen JSON'u runtime'da doğrula (zod/valibot). Şema uyuşmazlığı sessiz runtime crash değil,
     loglanan ve yakalanan bir hata olsun.
   - Her fetch'e timeout ekle; hata durumunu tipli bir sonuç olarak dön (başarı/hata ayrımı),
     her şeyi `null`'a çevirme.
   - Hataları yapılandırılmış şekilde logla; CMS erişilemezliği görünür olsun.
   - Query oluşturmayı tekrarsız hale getir; limit/depth sihirli sayılarını isimlendirilmiş
     sabitlere çevir ve limit aşımında sessiz kesme (silent truncation) olmasını engelle.
   - İlişkili alanların (ör. upload alanları) null/id-string gelebileceğini varsayarak koru.

3. **Kırık ve ölü UI'ı temizle.** Temsilcilikler formu gibi çalışmayan özellikler ya
   tamamlanacak ya da kaldırılacak. Yarım özellik production'a çıkmaz.

4. **Büyük sayfa component'lerini böl.** 150+ satırlık sayfa dosyalarını anlamlı
   alt-component'lere ayır; tekrar eden layout kalıplarını ortak component'e çıkar.

5. **Component API tutarlılığı.** Props isimlendirme, export stili, dosya organizasyonu ve
   CMS'ten veri alma pattern'i tüm component'lerde aynı olsun. Bir "component yazım kuralı"
   dokümante et ve AGENTS.md'ye ekle.

## Kısıtlar

- Görsel çıktı değişmeyecek. Her adımdan sonra etkilenen sayfaların ekran görüntüsünü al ve
  önceki haliyle karşılaştır.
- Her madde ayrı commit/PR. Bir maddeyi bitirmeden diğerine geçme.
- Her adımdan sonra `npm run check` yeşil olacak.
- Bir şeyi "daha iyi" diye değiştirmeden önce raporda o bulgunun kaydı olmalı. Kapsam dışına çıkma.
```

---

## PROMPT — FAZ 3: Production Sertleştirme

```
FAZ 3: Production'a çıkış için güvenlik, operasyon ve kalite güvence eksiklerini kapat.

1. **Yetkilendirme.** Payload'daki `role` alanını gerçek access control'e bağla: her collection
   ve global için read/create/update/delete kurallarını rollere göre tanımla. Yayınlanmamış
   (draft) içeriğin public API'den okunamadığını test ederek kanıtla. Public read gereken
   collection'larda bile sadece yayınlanmış alanların döndüğünü doğrula.

2. **Secret ve konfigürasyon.** Tüm env değişkenleri için boot anında şema doğrulaması ekle
   (zod). Production'da eksik veya default değerdeki bir secret ile uygulama BAŞLAMASIN — sessizce
   dev secret'la çalışmak en tehlikeli senaryo. Compose ve config'lerdeki dev default'larını
   production profilinden ayıkla. `.env.example`'ı gerçek gereksinimlere göre güncelle.

3. **Endpoint sertleştirme.** Revalidate endpoint'inde sabit-zamanlı secret karşılaştırması,
   tag allowlist'i ve rate limiting uygula. Payload auth için deneme limiti/kilitleme, güvenli
   cookie ayarları ve prod origin'lerine indirgenmiş CORS/CSRF listesi yapılandır.

4. **Veri katmanı.** Payload migration akışını kur; prod'da schema auto-push kapalı olsun,
   değişiklikler versiyonlanmış migration dosyalarıyla uygulansın. Postgres ve object storage
   için yedekleme + geri yükleme prosedürünü yaz ve bir kez test et.

5. **Object storage.** Prod için MinIO mı gerçek S3/CDN mi kararını uygula. Public URL'ler
   HTTPS olsun, `images.remotePatterns` prod domain'ini içersin, upload boyut/tip limitleri ve
   görsel varyantları tanımlansın.

6. **Observability.** `/api/health` readiness endpoint'i (DB + storage + CMS erişilebilirliği
   kontrol eden) ekle, container healthcheck'lerini buna bağla. Yapılandırılmış logging ve hata
   izleme (Sentry vb.) entegre et. CMS erişilemediğinde alarm üretilsin.

7. **Test altyapısı.** Sıfırdan kur:
   - Unit: cms-client parse/hata yolları, veri dönüştürücüler
   - Integration: revalidate akışı uçtan uca
   - E2E (Playwright): kritik sayfaların yüklenmesi, navigasyon, CMS içeriğinin görünmesi
   - Görsel regresyon: ana sayfa + 5 ürün sayfası
   - Bunları CI'a bağla; testler kırmızıyken merge edilemesin.

8. **Web kalitesi.** Eksik metadata'ları tamamla, sitemap ve robots ekle, OG/Twitter kartlarını
   ve structured data'yı yapılandır. `error.tsx` / `not-found.tsx` / `loading.tsx` ekle.
   Lighthouse (performance + a11y + SEO) ve axe taramasını CI'a ekle, eşik belirle.
   Klavye navigasyonu ve focus görünürlüğünü elle doğrula — özellikle carousel'ler ve form'lar.

9. **Deploy.** Ortam ayrımı (dev/staging/prod), reverse proxy + TLS, container kaynak limitleri,
   log yönetimi ve rollback prosedürünü tanımla. Deploy runbook'unu `docs/RUNBOOK.md`'ye yaz.

## Kısıtlar

- Her madde ayrı PR. Her PR'da "bu neyi engelliyor" cümlesi olsun.
- Güvenlik değişikliklerini kanıtla: yetkisiz erişimin gerçekten reddedildiğini gösteren bir test
  yaz, "ekledim" demekle yetinme.
- Bitirdiğin her maddeyi risk register'da kapat ve olgunluk skorunu güncelle.
```

---

## Ek notlar (prompt'a dahil değil, senin için)

**Sıralama neden böyle:** Monorepo ayrıştırması önce geliyor çünkü FAZ 2/3'teki her değişiklik
dosya yollarına dokunuyor. Restructure'ı sonraya bırakırsan bütün refactor'u ikinci kez taşırsın.

**Zorunlu kararlar** — FAZ 0 raporu bunları soracak, şimdiden düşün:

- Bu gerçekten yayına mı çıkacak, yoksa iç demo/portföy mü? Cevap "yayın" ise marka/telif
  meselesi teknik borçtan önce gelir ve FAZ 1'e başlamadan netleşmeli.
- Object storage prod'da MinIO mu, gerçek S3/R2 mı? Bu, FAZ 3'ün yarısını belirliyor.
- Kaç editör CMS kullanacak? 1-2 kişiyse RBAC yatırımı küçük kalabilir, 10+ ise onay akışı gerekir.
- Deploy hedefi Vercel mi self-hosted Docker mı? `.vercel` klasörü ve `output: "standalone"`
  şu an ikisini de ima ediyor; biri seçilmeli.
