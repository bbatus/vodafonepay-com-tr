# CMS Entegrasyon Planı — vodafonepaycomtr

## 1. Hedef

Şu an statik/hardcoded içerikle çalışan bu Next.js sitesini, OpenShift üzerinde ayrı bir **mikroservis** olarak çalışan bir **headless CMS**'e bağlamak. Amaç: business ekibinin kod değişikliği ve deploy gerekmeden — kampanya, blog, SSS, ücret/limit, ürün sayfası içeriği gibi verileri kendi başına yönetebilmesi.

Mimari olarak iki bağımsız servis:
- **`vodafonepaycomtr-web`** (mevcut bu proje) — Next.js frontend, sadece render eder
- **`vodafonepaycomtr-cms`** (yeni) — headless CMS, içerik + medya yönetir, API sunar

---

## 2. Neler CMS'e Taşınabilir? (İçerik Envanteri)

Bugün kurduğumuz sayfalardan çıkardığım gerçek envanter:

| İçerik Tipi | Nerede kullanılıyor | Alanlar |
|---|---|---|
| **Kampanya** | Anasayfa, `/kampanyalar`, ürün sayfaları | başlık, açıklama, görsel, kategori (Anında Bakiye/Faturana Yansıt/Kart), başlangıç/bitiş tarihi, CTA linki, öne çıkan mı |
| **Blog Yazısı** | `/blog` | başlık, kapak görseli, özet, gövde (rich text), kategori, yayın tarihi, SEO meta |
| **SSS Maddesi** | Anasayfa + her ürün sayfası + `/sikca-sorulan-sorular` | soru, cevap (rich text), kategori, sıralama, hangi sayfa(lar)da görünsün |
| **Ücret Satırı** | `/ucretler-ve-limitler` | kalem adı, açıklama/değer |
| **Limit Tablosu** | `/ucretler-ve-limitler` | tablo adı, satırlar (kategori, periyot, doğrulanmamış limit, doğrulanmış limit) |
| **Ürün Hero Banner** | Anasayfa + 5 ürün sayfası | görsel, başlık, alt başlık |
| **Özellik Kartı** (icon+başlık+metin) | Ürün sayfalarındaki "Neden X?" bölümleri | ikon, başlık, açıklama — tekrarlanan bir bileşen (component), sayfaya göre 3'lü grup |
| **Adım Kartı** (numaralı) | "Nasıl kullanırım?" bölümleri | adım no, açıklama, görsel |
| **Nav / Footer Linki** | Header, Footer | etiket, url, sıra, hangi kolon |
| **Marka Logo Grid** | Faturana Yansıt "Nerelerde kullanabilirim?" | logo görseli, marka adı |

**Önerim:** İlk fazda **Kampanya + SSS** ile başlayın — bunlar en sık değişen, en çok "içerik editörü acilen güncellemek istiyor" senaryosuna sahip olanlar (kampanya süresi doldu, yeni kampanya geldi, yanlış bilgi düzeltildi). Statik ikon/adım kartları gibi tasarımsal bileşenler ileride, gerçekten ihtiyaç varsa taşınmalı — her şeyi baştan CMS'e taşımak editoryal karmaşıklığı gereksiz artırır.

---

## 3. Araştırma Bulguları — Headless CMS Seçenekleri

Self-hosted, açık kaynak, Kubernetes/OpenShift'te konteynerize çalışabilen 3 lider aday var ([kaynak](https://focusreactive.com/best-self-hosted-headless-cms/), [kaynak](https://elmapicms.com/mp/top-10-headless-cms-platforms)):

| | **Strapi** | **Payload CMS** | **Directus** |
|---|---|---|---|
| Olgunluk | En olgun, 71.8K GitHub star, büyük ekosistem | Daha yeni ama hızlı büyüyor, TypeScript-native | Olgun, farklı bir felsefe |
| Model yaklaşımı | CMS önce şema tanımlar, kendi DB'sini yönetir | Kod-öncelikli (config-as-code), TS ile tip güvenliği | **Var olan bir veritabanının üzerine** API katmanı — DB'yi CMS değil siz tasarlarsınız |
| Lisans | MIT (OSI onaylı) | MIT (OSI onaylı) | BUSL (kaynağı açık ama tam OSI değil, bazı kurumsal kısıtlar var) |
| OpenShift/K8s desteği | Red Hat'in kendi resmi blog yazısı var — Strapi'yi OpenShift'e deploy etme rehberi mevcut ([kaynak](https://developers.redhat.com/blog/2021/04/09/containerize-and-deploy-strapi-applications-on-kubernetes-and-red-hat-openshift)) | Docker ile desteklenir, resmi OpenShift dokümanı yok | Docker ile desteklenir |
| DB desteği | PostgreSQL, MySQL/MariaDB, SQLite | PostgreSQL, MongoDB | PostgreSQL, MySQL, SQLite, MSSQL, Oracle, CockroachDB |
| Next.js entegrasyon örnekleri | Çok yaygın, en çok kaynak/tutorial burada | Artıyor | Var |

### Öneri: **Strapi**

Gerekçe:
1. **Red Hat'in kendisi** OpenShift'e Strapi deploy etme konusunda resmi bir rehber yayınlamış — bu, kurumsal OpenShift ortamınızla en az sürtünmeli seçenek olduğunun güçlü bir sinyali.
2. En olgun ekosistem → business ekibinin kullanacağı admin panel UI'ı en test edilmiş, dokümantasyonu en eksiksiz olan.
3. MIT lisans, kurumsal açık kaynak uyumluluğu açısından temiz.
4. PostgreSQL desteği — muhtemelen zaten kurumda kullanılan bir veritabanı motoru, ek altyapı öğrenme maliyeti yok.
5. Rol bazlı izinler (RBAC) admin panelde hazır geliyor — "business ekip kendi istediği gibi şekillendirsin" ihtiyacınıza doğrudan cevap veriyor: editör, yayıncı, admin gibi roller tanımlanabilir.

**Payload** gerçek bir alternatif — özellikle geliştirici ekibiniz TypeScript-first, "şema kod içinde tanımlansın, PR review'dan geçsin" yaklaşımını tercih ediyorsa daha iyi oturur. Ama business ekibi için editoryal UI olgunluğu Strapi'de daha yüksek.

**Directus**'u önermiyorum — sizin senaryonuzda (yeni içerik modelleri sıfırdan tasarlanacak, var olan bir veritabanı yok) Directus'un asıl gücü olan "var olan DB üzerine API" avantajı devreye girmiyor, ayrıca lisansı tam OSI onaylı değil.

---

## 4. Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                          OpenShift Namespace                  │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │  vodafonepaycomtr │  HTTPS  │   vodafonepaycomtr-cms     │  │
│  │  -web (Next.js)   │◄────────┤   (Strapi)                 │  │
│  │                    │  REST/  │                             │  │
│  │  Route (public)    │  GraphQL│   Route (internal-only,    │  │
│  │                    │         │   admin panel VPN/SSO      │  │
│  │                    │────────►│   arkasında)                │  │
│  │  webhook receiver  │ webhook │                             │  │
│  │  /api/revalidate   │◄────────┤   on publish/update         │  │
│  └──────────────────┘         └──────────┬─────────────────┘  │
│                                            │                    │
│                                  ┌─────────▼─────────┐          │
│                                  │  PostgreSQL         │          │
│                                  │  (StatefulSet veya   │          │
│                                  │   yönetilen DB servisi)│        │
│                                  └────────────────────┘          │
│                                            │                    │
│                                  ┌─────────▼─────────┐          │
│                                  │  Object Storage      │          │
│                                  │  (S3-uyumlu, medya)  │          │
│                                  └────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Kritik nokta:** CMS admin paneli **asla doğrudan internete açılmamalı**. Sadece kurum içi ağdan (VPN/SSO arkasında bir Route veya NetworkPolicy ile) erişilebilir olmalı. Public olan tek şey, frontend'in tükettiği read-only content API'si — o da mümkünse sadece `vodafonepaycomtr-web` servisinin erişebildiği bir internal Service olarak kalmalı (Route açmaya gerek yok), CMS'in public API'si dışarıya hiç çıkmasın.

### Neden bu ayrım önemli (fintech bağlamı)
Vodafone Pay bir finansal teknoloji şirketi olduğu için: CMS'te müşteri PII/finansal veri **tutulmamalı** — sadece pazarlama/editoryal içerik (kampanya metni, blog, SSS). Bu ayrımı net tutmak hem KVKK/GDPR kapsamını küçültür hem de CMS'in olası bir güvenlik açığında gerçek müşteri verisine hiç erişim yolu olmamasını garanti eder.

---

## 5. Frontend Tarafı — İçerik Nasıl Çekilir ve Güncellenir?

Next.js App Router zaten bu projede kullanılıyor, bu yüzden doğal fit **ISR + on-demand revalidation**:

1. Sayfalar `fetch()` ile CMS API'sinden veri çeker, `revalidate: 3600` gibi bir fallback süresiyle statik üretilir (build'de tamamen boş kalmasın diye).
2. Strapi'de bir içerik **yayınlandığında/güncellendiğinde**, Strapi'nin webhook özelliği `vodafonepaycomtr-web`'deki `/api/revalidate` route'una POST atar.
3. Bu route, gizli bir token ile doğrulanır, `revalidateTag()` veya `revalidatePath()` çağırarak **sadece ilgili sayfayı** anında yeniden üretir — tüm siteyi yeniden build etmeye gerek kalmaz.
4. Sonuç: business ekip Strapi'de "Yayınla"ya bastığı an, saniyeler içinde canlı sitede görünür; ekstra bir CI/CD deploy tetiklenmez.

Bu, şu an Vercel'de host ettiğimiz PoC ile de bire bir uyumlu bir desen — OpenShift'e taşındığında da aynı mantık çalışır, sadece Next.js'in kendi image'ı içinde bir custom server (`next start`) ile çalışır hale gelir (Vercel'e özel bir şey değil).

---

## 6. Editoryal İş Akışı (Business Ekip Beklentisi)

- **Taslak → Yayında** durumları: Strapi'nin draft/publish sistemi hazır geliyor, kod gerektirmez.
- **Zamanlanmış yayın** (kampanya X tarihinde başlasın, Y tarihinde bitsin): Strapi'nin kendi başına "ileri tarihli yayın" özelliği sınırlı — bunu ya (a) basit bir cron job/scheduled task ile (her gece "bitiş tarihi geçmiş kampanyaları unpublish et" gibi) ya da (b) frontend'de sorgu seviyesinde filtreleyerek (`startDate <= now <= endDate`) çözebiliriz. İkinci yöntem daha basit ve önerdiğim yaklaşım — kod tarafında ekstra bir job yönetmeye gerek kalmaz.
- **Roller:** Editör (oluştur/düzenle, yayınlayamaz) / Yayıncı (yayınlayabilir) / Admin (şema değiştirebilir) — Strapi'nin RBAC'ı bunu native destekliyor.
- **Önizleme:** Business ekip yayınlamadan önce "canlıda nasıl görünecek" görmek isteyecektir — Next.js'in Draft Mode özelliğiyle, Strapi'deki taslak içeriği önizleme linkiyle canlı sitenin üzerinde (ama yayınlanmamış halde) gösterebiliriz.

---

## 7. Aşamalı Uygulama Planı

**Faz 0 — Altyapı (1 sprint)**
- OpenShift'te `vodafonepaycomtr-cms` namespace/proje alanı, PostgreSQL, object storage kurulumu
- Strapi'nin temel Docker image'ı + Helm chart / OpenShift BuildConfig ile deploy
- CI/CD pipeline (mevcut deploy pipeline'ınıza benzer şekilde)

**Faz 1 — İlk içerik tipleri (1-2 sprint)**
- Kampanya ve SSS için Strapi'de content-type tanımları
- Next.js tarafında bu iki içerik tipi için CMS'ten veri çeken fetch katmanı + mevcut statik veriyi değiştirme
- Webhook → revalidate entegrasyonu
- Business ekip için admin panel eğitimi/onboarding

**Faz 2 — Genişletme (2-3 sprint)**
- Blog, Ücretler/Limitler tabloları
- Ürün sayfası hero banner + özellik kartları için component (tekrar kullanılabilir bileşen) modelleri

**Faz 3 — Olgunlaştırma**
- Draft Mode ile önizleme
- Görsel optimizasyon pipeline'ı (Strapi upload → CDN/object storage → Next.js Image)
- Gerekirse çok-dilli (i18n) altyapı — şu an tek dil (TR) olduğu için düşük öncelik

---

## 8. Açık Kalan Kararlar (Sizinle netleştirilmeli)

1. **PostgreSQL**: OpenShift'te zaten yönetilen bir Postgres servisiniz var mı, yoksa StatefulSet olarak biz mi kuracağız?
2. **Object storage**: Kurumda S3-uyumlu bir çözüm (MinIO, Ceph RGW, gerçek AWS S3) var mı?
3. **Kimlik doğrulama**: CMS admin paneli kurumsal SSO'ya (Azure AD/Okta vb.) bağlanacak mı, yoksa Strapi'nin kendi local kullanıcı sistemi mi kullanılacak?
4. **Ölçek**: Kaç editör kullanıcı, günde kaç içerik güncellemesi bekleniyor? (Bu, revalidation stratejisini ve CMS instance boyutunu etkiler.)

Bu 4 soruya cevap geldiğinde Faz 0'ı somut bir OpenShift manifest/Helm chart planına dönüştürebilirim.
