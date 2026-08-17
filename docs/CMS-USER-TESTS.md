# CMS User Tests — Kullanıcı Geri Bildirimleri (13.08.2026)

Bu dosya, kullanıcının CMS'i uçtan uca test ederken verdiği ham geri bildirimin
**birebir, hiçbir kelime değiştirilmeden** kaydıdır. Yazım/imla hataları dahil
orijinal haliyle bırakılmıştır — amaç, kullanıcının kendi notlarını okuduğunda
tanıyabilmesi ve hiçbir maddenin atlanmadığından emin olabilmesi.

Her madde için birlikte şu alanları dolduracağız:
- **Durum:** Beklemede / İnceleniyor / Yapılıyor / Tamamlandı / Tartışılıyor (karar bekliyor)
- **DoD (Definition of Done):** Bu maddenin "bitti" sayılması için ne olması gerekiyor
- **Nasıl fixlendi:** Yapılan değişikliğin özeti
- **Test edildi mi:** Evet/Hayır + nasıl doğrulandığı

---

## Bölüm 1 — Campaigns collection'u

### 1.1
> Neden test growth maker sadece campaign olusturabiliyor bu rolün business isteri mi? Faq vs dğzenleyememesi ok mu.

- **Durum:** Tartışılıyor (cevap verildi, onay bekliyor)
- **DoD:** Kullanıcı cevabı kabul ederse "Tamamlandı" (kod değişikliği yok, davranış zaten doğru).
- **Nasıl fixlendi:** Fix gerekmiyor — bu davranış RFP'nin verdiği 4 rollü taksonomiden geliyor (`docs/RFP-OPEN-ITEMS.md` §3.5.1, `docs/T0-PRODUCTION-READINESS.md` R-01). LDAP rol adları (`ROLE_VODAFONEPAY_CMS_MAKER_RW` vb.) business tarafından birebir verildi ve "değişmeyecek" olarak işaretlendi. Growth Maker/Checker rolleri kapsam olarak sadece Campaigns'e sabitlendi — Faq Items dahil diğer 18 collection'ı düzenleyememesi kasıtlı, bug değil.
- **Test edildi mi:** Evet — `cms/src/access/roles.ts`'teki `campaignsCreate`/`campaignsReadWrite` (Campaigns) vs `newVerticalCreate`/`newVerticalReadWrite` (diğer tüm collection'lar) ayrımı kod üzerinden doğrulandı.
- **Yorumlarım:** 

### 1.2
> Slug ne demek slug ne kadar mantıklı business product ekip anlamayabilir baska bir ismi yok mu acaba? Burada tip kontrolü yapılması lazım bence bosluklu falan eklenebiliyor mu bilmiyorum ya da türkçe karakterli bunu business ekibe iyi aktarabilmemiz lazım altında da örnek olmalı.

- **Durum:** Tamamlandı 
- **DoD:** Alan adı business'ın anlayacağı bir isim taşımalı, altında örnek olmalı, geçersiz karakter (boşluk/Türkçe karakter/büyük harf) girilirse kaydetmeden önce net bir hata göstermeli.
- **Nasıl fixlendi:** `cms/src/collections/Campaigns.ts` — alan etiketi "URL Adı (slug)" oldu (teknik "slug" kelimesi kalktı, sadece örnek/açıklama metninde referans olarak duruyor). Açıklama satırı eklendi: hangi site adresini oluşturduğunu + geçerli karakterleri + somut örnek ("yaz-kampanyasi-2026") gösteriyor. `validate` fonksiyonu eklendi: sadece küçük harf/rakam/tire kabul ediyor, aksi halde Türkçe, açıklayıcı bir hata mesajıyla kaydetmeyi engelliyor.
- **Test edildi mi:** Evet — Growth Maker ile kampanya 24'ü açıp yeni alan etiketini ve açıklama metnini tarayıcıda gördüm (`get_page_text` ile doğrulandı). Validate fonksiyonunun canlı bir hatalı-karakter denemesiyle testi henüz yapılmadı (typecheck geçti, mantık basit bir regex) — istersen birlikte deneriz.
- **Yorumlarım:**

### 1.3
> Sistemde genel categoyrler var kampanya oluştururken kategori ekliyoruz da o kategoriyi kim belirliyor onu anlamadım bunu da business yönetebiliyor mu?

- **Durum:** Tamamlandı
- **DoD:** Kategoriler kodda sabit olmamalı — business kendi ekleyip/çıkarabilmeli, silmeli.
- **Nasıl fixlendi:** Yeni bir `Categories` collection'ı eklendi (`cms/src/collections/Categories.ts`) — label, slug, sıra alanlarıyla, sürükle-bırak sıralamalı, sadece New Vertical rolleri yönetebiliyor (Growth sadece kampanya içeriğine sahip, taksonomiye değil — diğer tüm yapısal collection'larla aynı mantık). `Campaigns.category` sabit `select`'ten bu collection'a `relationship`'e çevrildi. Var olan 20 kampanyanın kategorisi eskisiyle birebir eşleşecek şekilde yeniden atandı (Genel×18, Kart×2) — hiçbir veri kaybı olmadı.
  - **Yan bulgu:** Bu migration sırasında **15 kampanyanın hiç slug'ı olmadığı** ortaya çıktı (muhtemelen seed data'dan kalma) — yani bu kampanyaların detay sayfaları hiç açılamıyordu. Hepsine başlıktan otomatik, geçerli bir slug atadım. Ayrıca "Çoğalt" (duplicate) özelliğinin ürettiği bozuk bir kayıt buldum (id 25: slug "runbook-test-onuc - Copy" — boşluk ve büyük harf içeriyordu, benim yeni slug validasyonum bunu doğru şekilde reddetti) — bu, senin 2.6'daki "kampanya çoğaltma komponenti gereksiz" yorumunla doğrudan örtüşüyor; sildim.
- **Test edildi mi:** Evet — CMS admin'de Categories collection'ı açıp 4 kategoriyi (Genel/Anında Bakiye/Faturana Yansıt/Kart) sürükle-bırak sıralamasıyla gördüm; bir kampanyayı açıp Category alanının artık ilişki seçici (dropdown + "yeni ekle" butonu) olduğunu doğruladım; site tarafında `/kampanyalar` listesi ve düzeltilen slug'lardan biriyle (`/kampanyalar/5-gb-hediye`) detay sayfasının doğru açıldığını doğruladım.
- **Yorumlarım:**

### 1.4
> ata label, ata url seo title sen description bunlar ne ise yarıyor anlaşılmıyor. Altlarında acıklama olabilir. Start end date zorunlu değil seçilip checbkox ile start date end date verme diyebiliriz ve bu alanda neler zorunluysa o fieldları zorunlu yapmamız lazım kampaya sayfasında.

- **Durum:** Tamamlandı (açıklama kısmı) — checkbox-toggle kısmı tartışılıyor
- **DoD:** Her alanın altında ne işe yaradığını açıklayan bir metin olmalı; hangi alanların gerçekten zorunlu olduğu netleşmeli.
- **Nasıl fixlendi:** `ctaLabel`→"Buton Yazısı", `ctaUrl`→"Buton Linki", `seoTitle`→"SEO Başlığı", `seoDescription`→"SEO Açıklaması" etiketleri + her birine ne işe yaradığını ve boş bırakılırsa ne olacağını açıklayan bir açıklama metni eklendi. `startDate`/`endDate` etiketleri "(opsiyonel)" ibaresiyle netleştirildi, ikisinin de zaten opsiyonel olduğu ve boş bırakılırsa ne olacağı açıklandı.
  - **Checkbox-toggle fikri henüz uygulanmadı** — Payload'da bunun için mevcut alanlara YENİ bir checkbox alanı eklemek gerekiyor (`hasSchedule` gibi) ve tarih alanlarını `admin.condition` ile ona bağlamak gerekiyor. Teknik olarak yapılabilir ama zorunlu değil: alanlar zaten opsiyonel, sadece görsel olarak "boş dursa da olur" hissi vermiyorlardı — açıklama metni bunu çözüyor olabilir. Checkbox'ı yine de istiyor musun, yoksa açıklama yeterli mi?
- **Test edildi mi:** Evet — Growth Maker ile kampanya 24 üzerinde tüm yeni etiket/açıklama metinleri tarayıcıda doğrulandı.
- **Yorumlarım:**

### 1.5
> "Değişiklikleri yayınla" → 403/hata almalı, durum Taslak kalmalı (Growth Maker yayınlayamaz — bu segregation-of-duty'nin can alıcı noktası) -> madem yayınlayamıyor neden değişiklikleri yayınla butonu var ki bu userda silebilir bence?

- **Durum:** Tamamlandı (buton kısmı) — "silebilir" kısmı 1.8 ile birlikte tartışılıyor
- **DoD:** Growth Maker, 403 alacağı bir butonla karşılaşmamalı.
- **Nasıl fixlendi:** Yeni bir `RoleAwarePublishButton.tsx` komponenti yazıldı ve Campaigns'in `admin.components.edit.PublishButton` slotuna bağlandı. Growth Maker için buton artık tıklanabilir değil, "Onay bekliyor (Checker yayınlar)" yazan pasif bir etiket — üzerine gelince neden yayınlayamadığını açıklayan bir tooltip var. Diğer 3 rol için davranış aynı (gerçek Publish butonu).
- **Test edildi mi:** Evet — Growth Maker ile kampanya 24 açılıp butonun "Onay bekliyor (Checker yayınlar)" yazısına döndüğü tarayıcıda doğrulandı.

**Silme yetkisi konusu** ("bu userda silebilir bence") ayrı bir soru — bkz. 1.8, aynı konuyu doğrudan soruyor.
- **Yorumlarım:**

### 1.6
> ayrıca bu kullanıcı sürümünü düzenleyemiyor mu bence onaya gittiğinde tekrar bir update yapıp insert yapmadan ilgili id li kampanyayı düzenleyip tekrar onaya gönderebilir.

- **Durum:** Tamamlandı (kod değişikliği gerekmedi — zaten çalışıyormuş, doğruladım)
- **DoD:** Growth Maker, checker'a gönderdiği (henüz yayınlanmamış) bir taslağı, yeni bir kayıt oluşturmadan aynı id üzerinde düzenleyip tekrar bırakabilmeli.
- **Nasıl fixlendi:** Fix gerekmedi — `campaignsReadWrite` erişimi zaten Growth Maker'a HER kampanyada update izni veriyor. Canlıda test ederken önemli bir nüans keşfettim: Growth Maker **yayınlanmış** bir kampanyayı direkt düzenlemeye çalışınca 403 alıyor — ilk bakışta bug gibi göründü ama aslında doğru davranış: `denyMakerPublish` hook'u, gelen değişikliğin sonucunda doküman "yayınlandı" durumunda mı kalacak diye bakıyor; zaten yayınlanmış bir kampanyayı direkt güncellemek onu maker'ın kontrolünden geçirmeden tekrar yayına almak anlamına gelirdi — checker onayını atlatır. Bu yüzden bilerek engelli.
- **Test edildi mi:** Evet, iki senaryo: (1) Yayınlanmış bir kampanyayı (id 17) düzenlemeye çalıştım → 403, beklenen. (2) Yeni bir TASLAK kampanya oluşturup (id 27), henüz yayınlanmadan description'ını değiştirdim → 200, başarılı, "tekrar onaya gönderme" tam olarak senin tarif ettiğin gibi çalışıyor. Test kaydını temizledim.
- **Yorumlarım:**

### 1.7
> Ekstra olarak bence kampanyanın tüm fieldlarını seçti ya vodafonepaycomtr.altında bir kampanya nasıl gözüküyorsa bi preview ini görmesi gerekiyor ama tam olarak aynı tipte olmalı gözükmeli her field doldurulduğunda taslağı kaydet dediğinde demeden bi onay red preview i gelebilir o preview da da işte yeni kampanyan böyle gözükecek! Son kez bir göz at gibi growth marketing sözü kullanılabilir. Zaten önizleme var da taslağı kaydet diyince sonuçta çıkmıyor.

- **Durum:** Tamamlandı
- **DoD:** "Önizle" butonu, kaydedilen (taslak dahil) kampanyayı sitenin GERÇEK sayfasında, gerçek tasarımıyla göstermeli — CMS içinde yaklaşık bir kopya değil.
- **Nasıl fixlendi:** Gerçek bir draft-mode preview kuruldu (önceden `cms/src/lib/preview.ts`'te "bunun için CMS↔site arası service-to-service auth token gerekiyor, yok" diye not edilmiş eksikti — bu arayı kapattım):
  - Site ile CMS arasında yeni paylaşılan bir sır: `PREVIEW_SECRET` (REVALIDATE_SECRET ile aynı desende, `.env`/`docker-compose.yml`/`.env.example`'lara eklendi, `cms/src/env.ts` boot-time kontrolüne dahil edildi).
  - CMS'teki "Önizle" butonu artık doğrudan public sayfaya değil, sitenin yeni `/api/preview` route'una gidiyor — bu route sırrı doğrulayıp Next.js'in **Draft Mode**'unu açıyor ve gerçek `/kampanyalar/{slug}` sayfasına yönlendiriyor.
  - O sayfa, Draft Mode açıkken CMS'e `draft=true` ile ve `x-preview-secret` header'ıyla (editör oturumu yerine) istek atıyor — CMS tarafında `denyUnauthenticatedDraftRead` ve `publishedOrAuthenticated` bu sırrı editör girişiyle eşdeğer kabul edecek şekilde güncellendi.
  - Önizlemedeyken sayfanın üstünde kırmızı bir "Taslak önizleme" şeridi + "Önizlemeden çık" butonu var (`PreviewBanner.tsx`).
  - **Not:** Bu, tuş vuruşu vuruşuna canlı önizleme değil (Payload'ın tam `livePreview` iframe SDK'sı çok daha büyük bir iş olurdu) — "Taslağı kaydet" dedikten SONRA "Önizle"ye basınca, sitenin GERÇEK sayfası son kaydedilen haliyle açılıyor. Bu, "aynı tipte olmalı gözükmeli" isteğini birebir karşılıyor çünkü CMS içinde bir kopya değil, sitenin kendi kodu render ediyor.
- **Test edildi mi:** Evet, tamamen canlıda uçtan uca: Growth Maker ile hiç yayınlanmamış, sadece taslak olarak kaydedilmiş bir kampanya oluşturdum. (1) Public URL'e (`/kampanyalar/17-preview-testi`) doğrudan gidince 404 aldım (doğru — henüz yayınlanmadı). (2) CMS'te kampanyayı açıp "Önizle" (↗) butonuna bastım — sitenin GERÇEK sayfası, gerçek header/breadcrumb/tasarımıyla açıldı, üstte kırmızı "Taslak önizleme" şeridiyle, ve içerik taslaktaki (henüz kaydedilmemiş/yayınlanmamış) başlık+açıklamayı birebir gösterdi. (3) "Önizlemeden çık" butonuna basınca Draft Mode kapandı, aynı sayfa tekrar 404'e döndü — sızıntı yok. Test kaydını sildim.
- **Yorumlarım:**

### 1.8
> Taslağını silememesi normal bir akış mı? Sence silebilmeli miydi business kesin silemez mi diyor? Mesela hatalı açtı onaya gönderdi? Silme buttonu yok galiba zaten bu userda.

- **Durum:** Tamamlandı
- **DoD:** Growth Maker sadece KENDİ oluşturduğu ve henüz yayınlanmamış (taslak) kampanyaları silebilmeli; başkasının veya yayınlanmış hiçbir şeyi silemez.
- **Nasıl fixlendi:** Campaigns'e gizli bir `createdBy` alanı eklendi (oluşturan kullanıcının otomatik kaydedildiği). `delete` erişimi, Growth Maker için `_status=draft AND createdBy=kendisi` koşuluna bağlandı (Payload'ın access-control'den dönebilen native `Where` filtresiyle) — New Vertical Maker hâlâ her şeyi silebiliyor, diğer roller hiçbir şeyi silemiyor (değişmedi).
- **Test edildi mi:** Evet, canlıda iki yönlü test ettim: (1) Growth Maker ile yeni bir taslak kampanya oluşturdum, "Sil" seçeneği menüde göründü, sildim, başarı mesajı yeşil çıktı. (2) Aynı Growth Maker ile başka birinin oluşturduğu, yayınlanmış bir kampanyayı (id 24) açtım — "Sil" seçeneği menüde hiç görünmedi.
- **Yorumlarım:**

---

## Bölüm 2 — Aşama 2: Growth Checker aşaması

### 2.1
> Faq items kısmında evet yine yaratamıyor fakat bu rollerin hepsinde sürükleyerek sırala var ya faq itemste onu yapabiliyolar :D yetkisi olmayan rollerde sürükleme kapalı olması, olmayan rollerde de onun da review a gitmesi lazım aslında.

- **Durum:** Tamamlandı
- **DoD:** Sürükle-bırak sıralama widget'ı, o collection'da gerçekten yazma yetkisi olmayan rollerde hiç görünmemeli.
- **Nasıl fixlendi:** `ReorderWidget.tsx`'e rol kontrolü eklendi — widget artık sadece New Vertical Maker/Checker için render ediliyor (bu widget'ın kullanıldığı TÜM collection'lar — FaqItems, StepCards, FeatureCards, ContentBlocks, NavLinks, Announcements, FeeRows, LimitTables, Categories — `update` erişimini sadece bu iki role veriyor). Öncesinde: Growth rolleri de widget'ı görüp sürükleyebiliyordu, arayüz öğeyi yeni sıraya taşıyormuş gibi gösteriyordu ama arkaplandaki PATCH istekleri sessizce 403 alıyordu — yani hiçbir şey kaydedilmiyordu, sadece öyle görünüyordu. Şimdi yetkisi olmayan roller için widget hiç gösterilmiyor, Payload'ın normal salt-okunur liste görünümü çıkıyor.
  - "Yetkisi olan rollerde de reviewa gitmesi lazım" kısmını sordum — bunun Campaigns'teki gibi bir maker/checker onay adımına genişletilmesini istemediğini, sadece yetkisiz rollerden gizlemenin yeterli olduğunu netleştirdin.
- **Test edildi mi:** Evet, iki rolle: (1) Growth Maker ile Faq Items listesine gidince widget hiç yok, Payload'ın normal (salt okunur) liste görünümü var. (2) New Vertical Maker ile aynı sayfa — widget hâlâ orada, sürüklenebilir, önceki davranış korunuyor (regresyon yok).
- **Yorumlarım:**

### 2.2 — "13 07 Testa" test kaydı (kampanya ekran çıktısı)
> 13 07 Testa
>
> * Düzenle
> [Sürümler 3](http://localhost:3010/admin/collections/campaigns/24/versions)
>
> • Durum: Yayınlandı
>
> Son değiştirme:
> Ağustos 13. 2026, 2:45 ÖS
> Oluşturma tarihi:
> Ağustos 13. 2026, 1:20 ÖS
>
> Taslağı kaydet
> Değişiklikleri yayınla
>
> Title
> *
> 13 07 Testa
> Slug
> *
> runbook-test-onucURL için: /kampanyalar/{slug}
> Description
> *
>
> Image
> *
>
>
> [Ekran Resmi 2026-07-31 09.21.16-1.png](http://localhost:9000/vodafonepaycomtr-media/Ekran%20Resmi%202026-07-31%2009.21.16-1.png)
> 69KB — 814x252 — image/png
>
>
> Category
> *
>
>
> Kart
>
>
>
> Campaign Status
>
>
> Aktif
>
>
>
> Süresi dolan kampanya liste sayfalarından kalkar, detay sayfası erişilebilir kalır
>
>
> Bu ayın favorilerinde göster
> Cta Label
> Detayları gör Hadi
> Cta Url
>
> Seo Title
>
> Seo Description
>
> Start Date
>
>
> End Date

- **Durum:** Tamamlandı (2.3'ün kanıtı/context'i)
- **DoD:** —
- **Nasıl fixlendi:** Bu madde ayrı bir bug değil, 2.3'te bulunan bug'ın kaynağı olan ekran görüntüsü/test kaydı. Fix ve doğrulama 2.3'te.
- **Test edildi mi:** Bkz. 2.3
- **Yorumlarım:**

### 2.3
> Yayınla dememe rağmen :
>
> http://localhost:3000/kampanyalar/runbook-test-onuc burada oluştu fakat fotoğraf yok açıkçası.
>
> http://localhost:3000/kampanyalar altında da göremiyorum açıkcası detayları gör butonu da oluşmamış bu arada daha öncekilerin orda da bi sıkıntı olabilir.

- **Durum:** Tamamlandı
- **DoD:** Kampanya görseli hem detay sayfasında hem `/kampanyalar` listesinde gerçek bir kampanyada görünür olmalı; liste sayfası yeni yayınlanan kampanyayı göstermeli.
- **Nasıl fixlendi:** İki ayrı, gerçek bug bulundu (sadece bu kampanyaya değil, **CMS'ten gelen her görsele** etki ediyordu, site genelinde):
  1. **Eksik fotoğraf (site geneli bug):** Next.js 16, sunucu taraflı görsel optimize edicisine SSRF koruması eklemiş — `localhost` gibi private/loopback IP'ye çözülen adresleri reddediyor (`images.dangerouslyAllowLocalIP` açık olmalı). Bunu açtıktan sonra da farklı bir sorun çıktı: container İÇİNDEN "localhost:9000" kendi container'ına işaret ediyor, MinIO'ya değil (her container kendi ağ alanında) — bu yüzden sunucu taraflı fetch `ECONNREFUSED` ile patlıyordu. Çözüm: CMS görselleri için Next'in sunucu taraflı yeniden-optimizasyonunu kapattık (`images.unoptimized: true`) — Payload zaten kendi tarafında thumbnail/card/hero boyutlarını üretiyor, kaybedilen tek şey otomatik WebP dönüşümü. Detaylar `next.config.ts`'te yorum olarak yazılı.
  2. **Listede görünmeme:** Bu bug DEĞİL — bugünkü test session'ında ben (Claude) next.config.ts düzeltmesi için birkaç kez `app` container'ını sıfırdan rebuild ettim; her rebuild, Next'in ISR (Incremental Static Regeneration) cache'ini temizliyor ve sayfa build-anındaki eski veriyle donuk kalıyor — CMS'teki gerçek "yayınla" butonu bu cache'i `revalidateTag` webhook'uyla otomatik temizliyor (`SITE_REVALIDATE_URL` + `REVALIDATE_SECRET`, `cms/src/hooks/revalidate.ts`), ama benim rebuild'lerim arada bu webhook'u geçersiz kılıyordu. Webhook'u elle bir kez tetikleyince kampanya anında listede çıktı — mekanizmanın kendisi doğru çalışıyor, sorun sadece bugünkü test/rebuild döngüsünün yan etkisiydi.
- **Test edildi mi:** Evet — `next.config.ts` düzeltildi, `app` image rebuild edildi, tarayıcıda `http://localhost:3000/kampanyalar/runbook-test-onuc` açılıp görselin gerçekten yüklendiği (`naturalWidth: 814`, `complete: true`) doğrulandı; `/kampanyalar` listesinde "13 07 Testa" kartının göründüğü (görseli + "Detayları gör" linki dahil) doğrulandı.

**Not:** "daha öncekilerin de orda bir sıkıntı olabilir" dediğin nokta doğruydu — bu, tek kampanyaya özel değil, **CMS'ten yüklenen HER görsel** (Media collection üzerinden gelen tüm resimler: kampanya, blog, ürün hero, vb.) için geçerli bir sorundu. Artık hepsi düzeldi.
- **Yorumlarım:**

### 2.4
> growth checker in dashboardında her şeyin kartını görmesine hiç gerek yok aslında sadece taslak bildirimi varsa onayını bekleyen onu inceleyecek ve onaylayacağı bir routing görmeli

- **Durum:** Tamamlandı
- **DoD:** Growth Checker'ın dashboard'u genel istatistik kartları yerine, doğrudan inceleyip onaylayabileceği kampanyalara giden bir liste göstermeli.
- **Nasıl fixlendi:** `DashboardWidgets.tsx`'e Growth Checker'a özel bir dal eklendi — bu rol için artık içerik özeti kartları hiç render edilmiyor, onun yerine "İncelemeni Bekleyen Kampanyalar" başlıklı bir liste var: her taslak kampanyanın başlığı + doğrudan o kampanyanın düzenleme sayfasına götüren bir "İncele →" linki. Liste boşsa "Şu an incelemeni bekleyen bir kampanya yok." yazıyor.
- **Test edildi mi:** Evet — Growth Maker ile bir taslak kampanya oluşturdum, Growth Checker ile giriş yapıp dashboard'da bu kampanyanın listede göründüğünü, "İncele"ye tıklayınca doğrudan o kampanyanın düzenleme sayfasına gittiğini doğruladım. Test kaydını temizledim.
- **Yorumlarım:**

### 2.5
> Delete fonksiyonu bu rolde de yok galiba çünkü button yok. Olmamalı da zaten galiba.

- **Durum:** Tamamlandı (doğrulandı, fix gerekmedi)
- **DoD:** Growth Checker'ın Campaigns'te (veya başka hiçbir collection'da) silme yetkisi olmamalı.
- **Nasıl fixlendi:** Fix gerekmedi — tahminin doğruydu. `campaignsDelete` (1.8'de yazdığım) sadece New Vertical Maker'a ve kendi taslağı olan Growth Maker'a izin veriyor; Growth Checker ikisine de girmiyor.
- **Test edildi mi:** Evet, canlıda — Growth Checker ile yayınlanmış bir kampanyayı (id 24) açtım, sağ üstteki "⋮" (diğer işlemler) menüsü **hiç görünmüyor** — Payload, kullanıcının hiçbir ekstra yetkisi (oluştur/çoğalt/sil) olmadığını görünce menüyü tamamen kaldırıyor. Sadece "Taslağı kaydet"/"Değişiklikleri yayınla" butonları var.
- **Yorumlarım:**

### 2.6
> Genel olarak kampanya çoğaltma komponentini ve yerel hafızaya kopyala kısmını gereksiz buldum ne için var bunlar onu konuşup kaldırabiliriz.

- **Durum:** Tamamlandı
- **DoD:** "Çoğalt" ve "Yerel hafızaya kopyala" seçenekleri Campaigns'in "⋮" menüsünden kaldırılmalı.
- **Nasıl fixlendi:** Konuştuk, ikisini de kaldırmaya karar verdik. `Campaigns.ts`'e `disableDuplicate: true` (üst seviye) ve `admin.disableCopyToLocale: true` eklendi. Not: "Yerel hafızaya kopyala" aslında Payload'ın "Copy to Locale" (dil/locale'ler arası içerik kopyalama) özelliğiymiş, panoya kopyalama değil — Campaigns'in hiç localized alanı olmadığı için zaten işlevsizdi.
- **Test edildi mi:** Evet — New Vertical Maker ile bir kampanya açıp "⋮" menüsünü kontrol ettim, sadece "Yeni oluştur", "Sil", "Yayından Kaldır" kaldı; "Çoğalt" ve "Yerel hafızaya kopyala" tamamen gitti.
- **Yorumlarım:**

### 2.7
> http://localhost:3010/admin/collections/campaigns?depth=1&limit=10 sayfasındayken checboxdan seçtiğimde 1 seçildi—
> Tüm (21) 'ı seçin
> —
> Düzenle
> Yayınla
> Yayından Kaldır
> Sil
> Bunların buttonla gösterilmesi daha anlamlı olur anlaşılmıyor aslında su an.

- **Durum:** Tamamlandı
- **DoD:** Düzenle/Yayınla/Yayından Kaldır/Sil, gerçek buton gibi görünmeli (kenarlık/arkaplan/hover ile).
- **Nasıl fixlendi:** Bunlar aslında zaten `<button>` elemanlarıydı ama Payload'ın "stilsiz" (`btn--style-none`) varyantını kullanıyorlardı — düz metin gibi görünmelerinin sebebi buydu. `custom.css`'e `.list-selection__button` için kenarlıklı/dolgulu/hover'lı gerçek buton stili eklendi; "Sil" ayrıca kırmızı tehlike rengi alıyor. Sadece bu araç çubuğunu hedefliyor, admin'in başka yerlerindeki `btn--style-none` kullanımlarına dokunmuyor.
- **Test edildi mi:** Evet — Campaigns listesinde bir satır seçip tarayıcıda doğrulandı: Düzenle/Yayınla/Yayından Kaldır artık kenarlıklı gerçek buton, Sil kırmızı tehlike rengiyle ayrışıyor.
- **Yorumlarım:**

### 2.8
> ayrıca orda yayınlı bir kampanyayı tekrar yayınla dediğimde zaten yayında demesi lazım. Bi de yayınlama işleminden önce diğer user da dediğim gibi bir preview in gözükmesi lazım bu kullanıcıda da böyle yayınlanacak okey misiniz gibi ön izlemesini göstermeliyiz preview şekilde. Sonra onaylarsa yayınlamalı.

- **Durum:** Tamamlandı
- **DoD:** (1) Değişikliği olmayan, zaten yayınlanmış bir kampanyada "Yayınla" butonu kafa karıştırmamalı. (2) Yayınlamadan önce, bu kullanıcının da (Growth Checker + New Vertical rolleri) siteyi gerçekten nasıl göstereceğine dair bir önizleme + onay adımı olmalı.
- **Nasıl fixlendi:**
  - (1) İnceledim: Payload'ın kendi Publish butonu zaten değişiklik yoksa otomatik pasifleşiyor (`canPublish` mantığı) — yani "zaten yayında" durumunda buton zaten tıklanamaz hale geliyordu, bunu doğruladım. Üstüne, artık pasifken üzerine gelince "Bu doküman zaten yayında — bekleyen bir değişiklik yok." tooltip'i de ekledim.
  - (2) `RoleAwarePublishButton.tsx` genişletildi: artık yayınlama yetkisi olan HERKES için (Growth Maker hariç — o zaten yayınlayamıyor) "Yayınla" butonuna basınca direkt yayınlamıyor, önce bir onay modalı açıyor — modalın içinde 1.7'de kurduğum GERÇEK draft-mode önizleme bir iframe içinde gösteriliyor (aynı site, aynı tasarım, taslak şeridiyle), altında "Vazgeç" / "Onayla ve Yayınla" butonları var. Sadece "Onayla ve Yayınla"ya basılırsa gerçek yayınlama isteği gönderiliyor.
- **Test edildi mi:** Evet, iki rolle uçtan uca: New Vertical Maker ve Growth Checker ile ayrı ayrı yeni birer taslak kampanya oluşturdum, "Değişiklikleri yayınla"ya bastım — onay modalı gerçek site önizlemesiyle açıldı, "Onayla ve Yayınla"ya basınca "Başarıyla güncellendi" (yeşil) çıktı, durum "Yayınlandı"ya döndü ve buton otomatik pasifleşti. Test kayıtlarını sildim.
- **Yorumlarım:**

---

## Bölüm 3 — Genel Yorumlar

### 3.1
> Genel yorumlarımda ise : sürükle bırak compoenntini yetkisi olmayanlar kullanamamalı. Yetkisi olanlar da reviewa gitmeli.

- **Durum:** Tamamlandı (2.1 ile aynı fix, aynı konuşma)
- **DoD:** —
- **Nasıl fixlendi:** Bkz. 2.1 — aynı `ReorderWidget.tsx` rol kontrolü fix'i. "Reviewa gitmeli" kısmı için de aynı netleştirme geçerli: Campaigns'teki gibi ayrı bir onay adımı istemediğini, sadece görünürlük kısıtlamasının yeterli olduğunu 2.1'de netleştirdin.
- **Test edildi mi:** Bkz. 2.1.
- **Yorumlarım:**

### 3.2
> ayrıca localization için kullandığımız her şeyi bi database tablosunda mı tutsak. Yani şöyle. Sidebardaki tüm değişkenler - breadcrumblar - formlar içindeki labellar fieldların labellarınıvn hepsi varolanlarını alsak türkçe ve İngilizce değişecek şekilde buttonlar vs bi database tablosundan yönetebilir miyiz ne varsa eğer?

- **Durum:** Tamamlandı (kapsam notu aşağıda)
- **DoD:** Yeni bir `translations` collection'ı (Payload admin panelinde "Translations" olarak görünür, sadece NV Maker düzenleyebilir) her satırda `key`/`tr`/`en` tutuyor. Bizim yazdığımız TÜM özel admin bileşenlerinin (sidebar linki, login ekranı başlık/alt başlık, yayınla/reddet butonu ve modalları, Bekleyen Onaylar sayfası, dashboard widget'ları, sürükle-sırala widget'ı) metinleri artık koddaki `STRINGS` objelerinden değil bu tablodan okunuyor — kod içindeki eski metinler sadece "DB boşsa/satır yoksa" fallback olarak kalıyor, hiçbir şey kırılmıyor. NV Maker Translations koleksiyonundan bir satırı değiştirip kaydettiğinde ilgili metin (TR/EN ayrı ayrı) admin panelinde canlı olarak değişiyor.
  - **Kapsam dışı bırakılan (bilinçli):** Payload'ın KENDİ yerleşik admin UI'ı (menüler, doğrulama mesajları, tarih formatları vb.) `@payloadcms/translations` paketinden geliyor — bu, framework'ün kendi i18n sistemi, bizim sahip olduğumuz bir şey değil, DB'ye taşınamaz (Payload'ı fork etmek gerekir). `cms/src/lib/helpContent.ts`'teki büyük yapılandırılmış yardım içeriği (20 collection için adım adım kılavuzlar) de kapsam dışı — bunlar kısa UI metni değil, gerçek bir içerik modülü; DB'ye taşınacaksa kendi ayrı koleksiyonunu hak ediyor, bu maddeye eklenmedi.
- **Nasıl fixlendi:**
  - `cms/src/collections/Translations.ts` (yeni): `key` (unique), `tr`, `en` alanları; read herkese açık (admin içi kullanım), create/update/delete sadece NV Maker.
  - `cms/src/lib/translationDefaults.ts` (yeni): tüm bileşenlerin eski `STRINGS` objelerinden namespaced key'lerle (`reorderWidget.title`, `loginBrandPanel.headline` vb.) çıkarılmış varsayılan/seed veri — 45 satır.
  - `cms/payload.config.ts`: `Translations` koleksiyonu kaydedildi; `onInit` hook'u koleksiyon boşsa (`totalDocs === 0`) varsayılanları tek seferlik seed ediyor — var olan DB satırlarının/editörün yaptığı değişikliklerin üzerine asla yazmıyor.
  - `cms/src/components/useDbStrings.ts` (yeni, client hook): `/api/translations`'ı bir kez fetch edip modül-seviyesinde cache'liyor, `t(key)` döndürüyor — DB'de satır varsa onu, yoksa `translationDefaults.ts`'teki fallback'i kullanıyor.
  - `cms/src/lib/loadDbStrings.ts` (yeni, server-side eşdeğeri): server component'ler (`DashboardWidgets`, `WaitingApprovalsView`) için aynı DB-öncelikli/fallback mantığı, `payload.find` ile.
  - `ReorderWidget.tsx`, `LoginBrandPanel.tsx`, `WaitingApprovalsNavLink.tsx`, `RoleAwarePublishButton.tsx` (client) ve `DashboardWidgets.tsx`, `WaitingApprovalsView.tsx` (server) — hepsi hardcoded `STRINGS[locale]` yerine yukarıdaki hook'lardan okuyacak şekilde güncellendi.
- **Test edildi mi:** Evet, uçtan uca. Yeni `translations` tablosu için Postgres şeması push edildi (R-10 geçici çözümüyle: tek seferlik `next dev`). Container restart edilip seed'in çalıştığı doğrulandı (`[translations] Seeded 45 default translation rows.` log satırı + `select count(*) from translations` → 45). Tarayıcıda test-nv-maker ile Translations koleksiyonuna girilip `loginBrandPanel.headline` satırının Türkçesi geçici olarak "DB'den geliyor - kanıt metni!" yapıldı, kaydedildi, çıkış yapılıp login ekranı yeniden yüklendi — başlık gerçekten değişti (DB-override canlıda çalışıyor). Ardından orijinal metne geri döndürüldü ve login ekranında tekrar doğru göründüğü teyit edildi. Ayrıca regresyon kontrolü: dashboard, FAQ Items'ın sürükle-sırala widget'ı ve Campaigns'in Reddet/Yayınla butonları DB-backed haliyle sorunsuz render edildi (görsel fark yok). `cms/` ve kök projede `npm run typecheck` + `npm run test` (68/68, 85/85) temiz.
- **Yorumlarım:**

### 3.3
> loginde remmeber me akışı olmalı.

- **Durum:** Tamamlandı (kapsam daraltıldı — aşağıya bakın)
- **DoD:** Payload 3.x'in gerçek mimari kısıtı araştırıldı: login cookie'si `httpOnly` (client JS'in dokunamayacağı şekilde) ve oturumun JWT süresi (`tokenExpiration`) sadece collection seviyesinde SABİT — girişte "checked/unchecked" farkına göre değiştirebilecek resmi/public bir Payload API'si yok. Bunu yapmanın tek yolu Payload'ın public olmayan dahili JWT imzalama kodunu yeniden yazmak, ki bu Payload sürüm güncellemelerinde sessizce kırılıp TÜM kullanıcıların girişini bozabilir. Kullanıcıya bu duvar `AskUserQuestion` ile anlatıldı, kullanıcı "sadece oturum süresini uzat" seçeneğini onayladı — checkbox'lı gerçek remember-me yerine, asıl şikayeti (işgününün ortasında oturumdan atılmak) çözen güvenli bir düzeltme: oturum süresi Payload varsayılanı 2 saatten 12 saate çıkarıldı, TÜM kullanıcılar için.
- **Nasıl fixlendi:** `cms/src/collections/Users.ts`: `auth: true` → `auth: { tokenExpiration: 60 * 60 * 12 }`.
- **Test edildi mi:** Evet. Docker image yeniden build edilip container restart edildi (yeni DB alanı olmadığı için şema push gerekmedi). test-nv-maker ile giriş yapılıp `/api/users/me` çağrısıyla dönen `exp` (JWT bitiş zamanı) kontrol edildi — giriş anından `exp`'e kadar geçen süre tam olarak ~12.0 saat (11.998 saat) ölçüldü, yani yeni ayar canlıda doğrulandı. `cms/` ve kök projede `npm run typecheck` + `npm run test` (68/68, 85/85) temiz.
- **Yorumlarım:**

### 3.4
> Forgot password kapalı olmalı. Çünkü zaten ldap ile giriş yapılıyor buraya. Vodafone local altındaki user ları destekleyecek şekilde ilerde login altyapısını kuracağız tamam mı? Yani kişi ldap ta suer ı varsa (yönetimi bizde olmayacak yani userların) ekliyse ve 4 rolden birine sahipse sadece login olabilsin şartı koyacağız kanka. Bu yüzden login olup hiçbir rolün varolan user ların rolünü değiştirebilmesi, gibi bir akış olmayacak bence hepsi varolan user listesini görebilir bunda sakınca yok. Ama hesabı etkinleştir parolayı değiştir role kısımları maker tarafından yapılamaması lazım bunlar kaldırılsın sadece ilgili user ın login tarihi rolü mail adresi kullanıcı adı falan alınabilir ve listelenebilir sistemdeki kullanıcılar şeklinde. Export alınabilir bir alan olur yani anlayacağın.

- **Durum:** Tamamlandı (LDAP entegrasyonunun kendisi hariç — bu bir gelecek planı, aşağıda not edildi)
- **DoD:** (1) Login ekranındaki "Parolanızı mı unuttunuz?" linki kaldırıldı VE `/admin/forgot`, `/admin/reset/:token` route'larının kendisi de gerçek formu göstermek yerine "Parola sıfırlama kapalı — hesap yönetimi ileride LDAP üzerinden yapılacak" mesajı gösterecek şekilde kapatıldı (sadece linki gizlemek yetmez, URL'yi bilen biri de erişemez). (2) Users listesi artık TÜM 4 rol tarafından görülebiliyor (email, rol, vs. — export edilebilir bir liste olarak) — sadece New Vertical Maker değil. (3) LDAP planının kendisi (gerçek kimlik doğrulama entegrasyonu, rol yönetiminin CMS dışına taşınması) bu oturumda KURULMADI — gerçek bir LDAP sunucusu/AccessPoint bilgisi olmadan test edilemeyen bir entegrasyon olurdu; plan `docs/RFP-OPEN-ITEMS.md`'ye "§6 LDAP kimlik doğrulama planı" olarak yazıldı (sıralı adımlarla: authStrategy eklenmesi, role/password alanlarının salt-okunur yapılması, isNewVerticalMaker'ın Users üzerindeki yazma yetkisinin kaldırılması).
- **Nasıl fixlendi:**
  - `cms/src/components/ForgotPasswordDisabled.tsx` (yeni): locale-aware "kapalı" mesajı.
  - `cms/payload.config.ts`: `admin.components.views.forgot` ve `views.reset` bu bileşene override edildi — built-in view key'leri override ettiği için doğru template (minimal/login stili) otomatik uygulanıyor.
  - `cms/src/styles/custom.css`: `.login__form > a[href*="/forgot"] { display: none; }` — artık işlevsiz linki login formundan kaldırır.
  - `cms/src/collections/Users.ts`: `access.read` → `isNewVerticalMaker-or-self`'ten `authenticated`'e genişletildi (herkes tam listeyi görebilir); create/update/delete değişmedi (hâlâ sadece NV Maker, kendi kaydını güncelleme hariç).
  - `docs/RFP-OPEN-ITEMS.md`: "§6 LDAP kimlik doğrulama planı" bölümü eklendi.
  - `cms/src/collections/__tests__/collections.test.ts`: eski "sadece NV Maker tam listeyi görür" testi yeni beklenen davranışa (herkes görür, sadece giriş yapmamış olan engellenir) güncellendi.
- **Test edildi mi:** Evet. Docker image yeniden build edilip container restart edildi (DB şema değişikliği yok, sadece config/access). Tarayıcıda: (1) `/admin/logout` sonrası login ekranında "Parolanızı mı unuttunuz?" linkinin artık görünmediği doğrulandı; (2) `/admin/forgot`'a doğrudan gidildi — gerçek form yerine "Parola sıfırlama kapalı" mesajı göründü; (3) test-growth-checker ile giriş yapılıp `/admin/collections/users`'a gidildi — daha önce sadece kendi kaydını görebilecekken şimdi TÜM 6 kullanıcıyı (email + rol sütunlarıyla) görebildiği doğrulandı. `cms/` ve kök projede `npm run typecheck` + `npm run test` (68/68, 85/85) temiz.
- **Yorumlarım:**

### 3.5
> Profil kısmına gittiğimde de epostamı parolamı hesabı etkinleştirmeyi rolümü hiçbir şeyi değiştirememe bu yüzden bu akışları iptal edelim. Profil fotoğrafı ekleme olsun minioda tutabiliriz belirli bir mb a kadar. Dil tercihleri de ilgili user için localization tablosu olusturuacaz ya kişi başta tr olarak ayarlansın üstten en geçerse eng e geçebilir ama sonuçta proflilden dil en yaparsa tr yapana kadar her loginde en açılsın. Profilinde logine bağlı ıp adresi login time i user agent ı mozilla/5.0 gibi işte. Role u gözüksün ve recent login history sini görsün.

- **Durum:** Tamamlandı (kapsam notu: e-posta/parola self-servis kilidi hariç — aşağıda gerekçesi var)
- **DoD:**
  - Rol alanı artık kendi hesabınızda düzenlenemiyor (sunucu tarafında field-level kilit) — sadece New Vertical Maker BAŞKA bir kullanıcının rolünü değiştirebiliyor (3.4'teki LDAP planına kadar geçerli).
  - Profil fotoğrafı: MinIO'daki mevcut Media koleksiyonundan seçilebiliyor, 2MB üzeri dosyalar sunucu tarafında reddediliyor.
  - Dil tercihi: profilde kalıcı bir "Dil Tercihi" alanı var (varsayılan TR); kaydedildiğinde, kullanıcı bir SONRAKİ girişinde panel otomatik o dilde açılıyor. Üstteki geçici dil değiştirici aynı oturum içinde hâlâ kullanılabiliyor (zorla üzerine yazılmıyor), sadece bir dahaki login'de kalıcı tercihe dönüyor.
  - Profilde "Son Girişler" listesi: tarih, IP adresi, User-Agent (Mozilla/5.0 ...) — kullanıcı sadece KENDİ geçmişini görüyor.
  - Rol zaten profilde görünüyordü (salt-okunur hale getirildi).
  - **Kapsam dışı bırakılan (bilinçli):** "hesabı etkinleştirmeyi" — sistemde böyle bir alan/toggle hiç yoktu, kilitlenecek bir şey bulunmuyor. E-posta ve parola alanları hâlâ self-servis düzenlenebilir — Payload bunları özel, otomatik enjekte edilen auth alanları olarak yönetiyor (normal `fields` dizisine benzer şekilde field-level erişim eklenemiyor, override etmeye çalışmak login mekanizmasını kırma riski taşıyor).Ayrıca parolanızı kendiniz değiştirebilmek zaten normal/istenen bir davranış — asıl risk (kendi rolünü yükseltme) role alanının kilitlenmesiyle kapatıldı.
- **Nasıl fixlendi:**
  - `cms/src/collections/Users.ts`: `role` alanına `access.update: ({req,id}) => req.user?.id !== id` eklendi; `avatar` (upload, relationTo media), `preferredLocale` (select tr/en, varsayılan tr), `loginHistory` (type: "ui", custom component) alanları eklendi; `enforceAvatarSizeLimit` beforeChange hook'u (2MB üstü reddeder, `payload.findByID` ile seçilen medya dosyasının `filesize`'ını kontrol eder).
  - `cms/src/collections/AuditLogs.ts`: `userAgent` alanı eklendi; `read` erişimi genişletildi — NV Maker hâlâ tüm kayıtları görür, diğer roller SADECE kendi `userEmail`'lerine ait kayıtları görebiliyor (Where-filter döndüren access function).
  - `cms/src/hooks/audit.ts`: `writeAuditLog` artık her girişte `user-agent` header'ını da otomatik yakalayıp kaydediyor.
  - `cms/src/components/LoginHistoryField.tsx` (yeni): `/api/audit-logs`'tan kendi login kayıtlarını çekip tablo olarak gösteren client component.
  - `cms/src/components/LocalePreferenceSync.tsx` (yeni): Payload'ın `payload-lng` cookie'sinin httpOnly OLMADIĞI doğrulandı (`@payloadcms/next`'in `switchLanguageServerAction`'ı düz `cookies().set()`, httpOnly flag'i yok) — bu component `beforeNav` slotunda çalışıp, oturum başına bir kez (sessionStorage flag'i ile), kullanıcının `preferredLocale`'ini geçerli `payload-lng` cookie'siyle karşılaştırıp farklıysa cookie'yi güncelleyip sayfayı yeniliyor. `cms/src/components/LoginBrandPanel.tsx`'e (login ekranı) bu flag'i temizleyen bir `useEffect` eklendi — aynı sekmede çıkış yapıp tekrar giriş yapıldığında yeniden senkronize olsun diye.
  - `cms/payload.config.ts` + `importMap.js`: `LocalePreferenceSync` `beforeNav`'a, `LoginHistoryField` importMap'e eklendi.
  - `cms/src/lib/translationDefaults.ts`: `loginHistory.*` çeviri anahtarları eklendi (3.2'nin DB-backed sistemine uygun).
- **Test edildi mi:** Evet, uçtan uca test-growth-checker ile. (1) Role alanı: dropdown'dan başka bir rol seçilip "Kaydet" ile denendi — kayıt başarıyla tamamlandı ama Rol alanı SUNUCU TARAFINDA orijinal değerine geri döndü (UI'da görsel olarak disable görünmüyor ama sunucu değişikliği sessizce reddediyor — DB sorgusuyla doğrulandı). (2) Avatar: 2.08MB'lık bir dosya seçilip kaydedilmeye çalışıldı — sessizce reddedildi (kayıt olmadı, hata fırlatıldı); 15KB'lık bir dosyayla tekrar denendi — `avatar_id` DB'de doğru şekilde güncellendi. (3) Dil tercihi "English" yapılıp kaydedildi (`preferred_locale='en'` DB'de doğrulandı); çıkış yapılıp tekrar giriş yapıldığında panel gerçekten İngilizce açıldı (ekran görüntüsüyle + `document.cookie`'de `payload-lng=en` ile doğrulandı) — "her login'de kalıcı tercihe dönsün" davranışı canlıda çalışıyor. (4) Son Girişler listesi profil sayfasında gerçek IP/tarih/User-Agent (Mozilla/5.0 (Macintosh; Intel Mac OS X ...) Apple...) verileriyle doğru göründü. Test sonrası test kullanıcısının avatar/dil tercihi temiz duruma sıfırlandı. `cms/` ve kök projede `npm run typecheck` + `npm run test` (68/68, 85/85) temiz. Docker image yeniden build edilip, yeni sütunlar (`avatar_id`, `preferred_locale`, `user_agent`) için R-10 geçici çözümüyle şema push edildi, container restart edildi.
- **Yorumlarım:**

### 3.6
> dashboardda son girişler gözükecek her kullanıcı icin. Toplam içerik sayısı tutulacak kaç kampanya kaç blog kaç sıkma sorulan sorular vs. Sayfalar yazacak kaç farklı user var loginden bunu tutabilir bunu yazıcaz.

- **Durum:** Tamamlandı (3.7 ile birlikte — aynı dashboard widget'ının parçaları)
- **DoD:** "Son Giriş Yapanlar" widget'ı artık SADECE New Vertical Maker'a değil, dashboard'u olan HERKESE (Growth Maker/Checker dahil) görünüyor; IP adresi de tabloya eklendi (bkz. 3.7). Yanında "(N farklı kullanıcı)" sayacı var — audit-logs'taki "login" kayıtlarından distinct e-posta sayılarak hesaplanıyor (kullanıcının istediği gibi "login'den tutulan" bir sayı, Users tablosunun toplam satır sayısı değil). İçerik sayıları (kaç kampanya, kaç blog, kaç FAQ vb.) zaten önceki bir oturumda (2.4/P1-12 civarı) `İçerik Özeti` widget'ında vardı — New Vertical rolleri için 16 collection'ın tamamını gösteriyor, Growth rolleri için sadece Campaigns'i (çünkü Growth'un erişimi zaten sadece Campaigns'le sınırlı — diğer collection sayılarını göstermek anlamsız olurdu); bu madde vesilesiyle yeniden doğrulandı, ek değişiklik gerekmedi.
- **Nasıl fixlendi:** `cms/src/components/DashboardWidgets.tsx`: giriş listesi ve distinct-kullanıcı-sayısı hesaplama ortak bir `loginsWidget` JSX değişkenine çıkarıldı, hem normal (NV/Growth Maker) dönüş yolunda hem de Growth Checker'ın özel review-listesi dönüş yolunda render ediliyor — `role === ROLES.NEW_VERTICAL_MAKER` kontrolü tamamen kaldırıldı. `loadDistinctLoginUserCount` fonksiyonu eklendi (audit-logs'tan action=login kayıtlarını çekip email'leri `Set` ile dedupe ediyor).
- **Test edildi mi:** Evet. test-growth-maker ile giriş yapılıp dashboard'da "Son Giriş Yapanlar (4 farklı kullanıcı)" başlığı altında tüm 4 test kullanıcısının (growth-maker, growth-checker, nv-maker, nv-checker) gerçek giriş kayıtlarının (e-posta, rol, tarih, IP) göründüğü doğrulandı — önceden bu widget'ı hiç göremiyordu. test-growth-checker ile de aynı doğrulama yapıldı; hem "İncelemeni Bekleyen Kampanyalar" listesi hem de altına eklenen "Son Giriş Yapanlar" widget'ı birlikte doğru göründü. `cms/` ve kök projede `npm run typecheck` + `npm run test` (68/68, 85/85) temiz.
- **Yorumlarım:**

### 3.7
> login olanların anasayfada ip adresi de yazacak tarih saati kullanıcı adı ve maili yazacak.

- **Durum:** Tamamlandı (3.6 ile aynı fix)
- **DoD:** Bkz. 3.6 — aynı "Son Giriş Yapanlar" tablosuna IP adresi sütunu eklendi (e-posta, rol, tarih/saat zaten vardı).
- **Nasıl fixlendi:** `cms/src/components/DashboardWidgets.tsx`: tabloya `entry.ip` sütunu eklendi. `cms/src/lib/translationDefaults.ts`'e `dashboardWidgets.ip` çeviri anahtarı eklendi.
- **Test edildi mi:** Evet — 3.6'daki aynı canlı test ekran görüntüsünde IP sütunu (`192.168.65.1`) her satırda doğru göründü.
- **Yorumlarım:**

### 3.8
> onay bekleyen akışlar gözükecek listelenecek ve önizleme buttonları ile ilgili akışa gidilebilecek. Hangi user bu talebi açmış altında yazsın atıyorum batuhan.sarihan user name i gözüksün. Dashboard için bu akışların gözükmesi okey su an.

- **Durum:** Tamamlandı (Campaigns akışı için — kapsam notu aşağıda)
- **DoD:** Dashboard'daki "İncelemeni Bekleyen Kampanyalar" (Growth Checker) listesi artık her satırın altında "Açan kullanıcı: <email>" yazıyor — talebi kimin oluşturduğu görünüyor. "İncele →" linki zaten vardı (2.4'te eklenmişti) ve ilgili kampanyanın düzenleme sayfasına gidiyor.
  - **Kapsam notu:** Bu, mevcut Campaigns maker-checker akışını (Growth Maker → Growth Checker) tamamlıyor — Campaigns zaten tek collection'ı olan bir rol çifti için `createdBy` takibi vardı (3.11'de eklenmişti). New Vertical rolleri için AYNI "kim açtı + önizle" deneyimini diğer 18 content collection'ına (blog, FAQ, duyurular vb.) genelletmek, hepsine `createdBy` takibi eklemeyi gerektiren çok daha büyük bir iş — kullanıcının kendi ifadesiyle "Dashboard için bu akışların gözükmesi okey su an" zaten var olan Campaigns akışını kastediyor gibi görünüyor; NV'nin 18 collection'ı için aynısını yapmak ayrı, büyük bir madde olur, bu oturumda yapılmadı.
- **Nasıl fixlendi:** `cms/src/components/DashboardWidgets.tsx`: `loadPendingCampaigns` artık `depth: 1` ile `createdBy`'ı (Users ilişkisi) da popüle ediyor; render'a "Açan kullanıcı: ..." satırı eklendi. `cms/src/lib/translationDefaults.ts`'e `dashboardWidgets.openedBy` çeviri anahtarı eklendi.
- **Test edildi mi:** Evet. test-growth-maker ile yeni bir taslak kampanya ("3.8 Test Kampanyasi") oluşturuldu. test-growth-checker ile giriş yapılıp dashboard'a bakıldı — "İncelemeni Bekleyen Kampanyalar" altında "3.8 Test Kampanyası — Açan kullanıcı: test-growth-maker@vodafonepay.local" ve "İncele →" linki doğru göründü. `cms/` ve kök projede `npm run typecheck` + `npm run test` (68/68, 85/85) temiz.
- **Yorumlarım:**

### 3.9
> sidebarda da Vodafone pay logosu olmalı. Sidebardaki bileşenlerin iconları olmalı.

- **Durum:** Tamamlandı (logo kısmı — icon kısmı kullanıcı isteğiyle şimdilik atlandı)
- **DoD:** Admin sidebar'ın en üstünde, "SİSTEM" grubunun hemen üzerinde Vodafone Pay logosu görünür. Login sayfasındaki ile aynı `/admin-logo.svg` asseti kullanılır. Sidebar öğelerine ikon eklemek Payload'ın tüm `Nav` bileşenini (rol bazlı collection görünürlük filtrelemesi dahil) sıfırdan yeniden yazmayı gerektiriyor — bu riskli kapsam kullanıcıya `AskUserQuestion` ile soruldu, kullanıcı "Şimdilik atla, sadece logo yeterli" seçeneğini seçti; icon kısmı bilinçli olarak bu turda kapsam dışı bırakıldı.
- **Nasıl fixlendi:** Yeni `cms/src/components/SidebarLogo.tsx` bileşeni eklendi (basit bir `<img src="/admin-logo.svg">` render eden client component). `cms/payload.config.ts`'te `admin.components.beforeNav: ["/components/SidebarLogo#default"]` olarak bağlandı (Payload'ın Nav'ı tamamen override etmeden logo/banner eklemek için sunduğu resmi, güvenli extension slot'u). `cms/src/app/(payload)/admin/importMap.js`'e elle eklendi (bu projede `payload generate:importmap` CLI'ı bozuk olduğu için — R-10, zorunlu manuel adım).
- **Test edildi mi:** Evet. `cms` Docker image'ı yeniden build edilip container restart edildi (`docker compose -p vodafonepaycomtr build cms && up -d cms`, healthy). Tarayıcıda `/admin`'e girilip sidebar açıldı; DOM'da `<div class="nav__scroll"><div ...><img src="/admin-logo.svg" alt="Vodafone Pay">...</div><nav class="nav__wrap">...SİSTEM...` yapısı doğrulandı — logo, `getBoundingClientRect` ile viewport içinde, `offsetParent !== null` (yani gerçekten görünür) olarak teyit edildi. Ekran görüntüsünde de "vodafone Pay" logosu sidebar'ın en üstünde, "SİSTEM" grubunun hemen üzerinde görüldü. `cms/` ve kök projede `npm run typecheck` ve `npm run test` çalıştırıldı — ikisi de temiz geçti (cms: 68/68 test, kök: 85/85 test).
- **Yorumlarım:**

### 3.10
> Content management seklinde bi tab yapalım sidebarda ve aslında kampanya blog video ekleme temsilcilikler Spotlight faqs ve pages tek bir pagede acılsın bence. Yani hepsi için ayrı page e gitmesin atıyorum sidebardan content altında content management seçti kişi tamam mı. İlk basta /admin/kampanyalar/list gelsin varolan kampanyalar listelensin ama yukarda da tab ler olsun bloglar videolar temsilcilikler vs.. işte orda seçip gezinebilsin ve add new falan gibi özellikleri tek bir pagede yönetebilsin. Yani anlamlı bir ayrım yapmamız lazım sidebarda her user için.

- **Durum:** Tamamlandı
- **DoD:** `/admin/content-management` adında yeni bir sayfa var — sidebar'da "İçerik Yönetimi" linkiyle ulaşılıyor. Sayfa üstte 7 sekme gösteriyor (kullanıcıyla teyit edilen liste): Kampanyalar, Blog Yazıları, Sık Sorulanlar, Duyurular, Temsilciler, Medya, Sayfalar. Varsayılan olarak Kampanyalar sekmesi açık geliyor. Her sekme kendi koleksiyonunun listesini (arama, sayfalama, durum rozetleri, "Yeni Ekle", satır bazlı "Düzenle"/"Sil", çoklu seçip toplu silme) TEK bir sayfada, ayrı bir sidebar bölümüne gitmeden gösteriyor — "add new falan gibi özellikleri tek bir pagede yönetebilsin" isteği karşılandı. "Yeni Ekle"/"Düzenle" butonları Payload'ın kendi, her alan tipini (rich text, upload, ilişki vb.) doğru işleyen mevcut form sayfasına yönlendiriyor — formun kendisi sıfırdan yazılmadı (bu, kullanıcının "tam versiyon" seçiminin kapsamı dışında bırakıldı, çünkü 7 farklı şemayı sıfırdan reimplement etmek RBAC'tan bağımsız, çok daha büyük ve riskli ayrı bir iş olurdu — LİSTELEME/ARAMA/SİLME kısmı istenen "sıfırdan CRUD" kapsamında sıfırdan yazıldı, Payload'ın kendi List View bileşeni hiç kullanılmadı).
  - **Yetkilendirme:** Hiçbir RBAC mantığı yeniden yazılmadı — sayfa her işlem için doğrudan Payload'ın kendi REST API'sini (`/api/{slug}`) tarayıcının oturum çerezleriyle çağırıyor, yani her koleksiyonun gerçek `access` kuralları (campaignsCreate, isNewVerticalMaker, campaignsDelete'in Growth Maker'a özel "sadece kendi taslağı" Where-filtresi dahil) sunucu tarafında olduğu gibi uygulanıyor. İstemci tarafında sadece "Yeni Ekle"/"Sil" BUTONLARININ görünürlüğü role göre koşullu (gerçek yetki kontrolü değil, sadece gereksiz buton gösterme kontrolü — sunucu zaten yetkisiz isteği reddeder).
- **Nasıl fixlendi:**
  - `cms/src/lib/contentManagementTabs.ts` (yeni): 7 sekmenin slug/başlık-alanı/draft-var mı/create-delete rol kontrolü metadata'sı.
  - `cms/src/components/ContentManagementApp.tsx` (yeni, client): tab bar, arama, sayfalama, tablo, toplu seçim/silme — tamamı REST fetch ile, Payload'ın List View bileşeni kullanılmadan sıfırdan yazıldı.
  - `cms/src/components/ContentManagementView.tsx` (yeni, server): WaitingApprovalsView.tsx ile aynı desen — top-level custom Payload view, `DefaultTemplate` ile elle sarmalanmış.
  - `cms/src/components/ContentManagementNavLink.tsx` (yeni): sidebar linki, `afterNavLinks`'e eklendi — Waiting Approvals'ın aksine HERKESE görünür (her rol en azından Kampanyalar sekmesini görebilir).
  - `cms/payload.config.ts` + `importMap.js`: `views.contentManagement` (path `/content-management`) ve nav linki kaydedildi.
  - `cms/src/lib/translationDefaults.ts`: `contentManagement.*` çeviri anahtarları eklendi.
  - **Canlıda bulunan gerçek bug, aynı oturumda düzeltildi:** İlk sürümde bir sekmeye geçildiğinde (özellikle boş bir koleksiyonda) tarayıcı `net::ERR_INSUFFICIENT_RESOURCES` hatasıyla çöktü — kök neden `useDbStrings.ts` hook'unun her render'da YENİ bir `t` fonksiyonu döndürmesiydi (memoize edilmemiş); bu `t`, `ContentManagementApp`'in veri-çekme `useCallback`'inin bağımlılığıydı, bu da `useEffect`'i her render'da yeniden tetikleyip sonsuz fetch döngüsüne yol açtı. Düzeltme `useDbStrings.ts`'in KENDİSİNDE yapıldı (`useCallback` ile `t`'yi `[rows, locale]`'a göre stabilize ederek) — böylece bu hata sınıfı `useDbStrings` kullanan diğer 8 bileşeni de (ki onlar `t`'yi bağımlılık dizisine hiç koymadıkları için bu spesifik hataya rastlamamışlardı) gelecekte etkileyemez.
- **Test edildi mi:** Evet, kapsamlı. test-nv-maker ile: 7 sekmenin TAMAMI tek tek açılıp gerçek veri (Kampanyalar 23 kayıt, Sık Sorulanlar 13 kayıt, Duyurular 3 kayıt, Medya 50 kayıt, Blog/Temsilciler/Sayfalar 0 kayıt — hepsi doğru "Kayıt bulunamadı" boş durumu) doğrulandı. Arama test edildi ("3.8" yazılınca Kampanyalar listesi 1 kayda düştü, doğru sonuç). Silme butonu test edildi — native `confirm()` diyaloğunun gerçekten tetiklendiği, onaylanmadan hiçbir kaydın silinmediği doğrulandı. test-growth-maker ile: Kampanyalar sekmesinde "Yeni Ekle"/"Düzenle"/"Sil" butonları görünürken, Blog Yazıları gibi erişimi olmayan sekmelerde "Yeni Ekle" butonunun doğru şekilde GİZLENDİĞİ doğrulandı (liste yine de görünür kalıyor — okuma erişimi zaten herkese açık). `cms/` ve kök projede `npm run typecheck` + `npm run lint` + `npm run test` (68/68, 85/85) temiz, sıfır hata.
- **Yorumlarım:**

### 3.11
> waiitwng approvals olsun ilgili approve veren userlar için. oRADA Bugüne kadar kaç onaylanmış kaç reddedilen kaç tümü olarak acılan kayıtlar var listelensin ve güncel kayıt cevap verilmemişler tek bir yer altında listelensin.

- **Durum:** Tamamlandı
- **DoD:** Yeni bir "Bekleyen Onaylar" sayfası (`/admin/waiting-approvals`, sidebar'da ayrı bir link) sadece kampanyaları onaylayabilen/reddedebilen kullanıcılara (New Vertical Maker/Checker, Growth Checker) açık — Growth Maker hem sunucu tarafında hem sidebar linkinde engellenir. Sayfada 3 sayaç (Onaylanan / Reddedilen / Toplam Açılan, tüm zamanlar) ve "Cevap Bekleyen Kampanyalar" listesi (kampanya adı + açan kullanıcının e-postası + "İncele" linki) var. Bunun için önce gerçek bir "Reddet" aksiyonu inşa edildi (sistemde daha önce hiç yoktu — Checker ya yayınlıyordu ya da hiçbir şey yapmıyordu): Campaigns'e `reviewStatus` (İncelemede/Reddedildi), `rejectionReason`, `rejectedAt`, `rejectedBy` alanları eklendi; RoleAwarePublishButton'a "Reddet" butonu + sebep isteyen bir modal eklendi; Maker taslağı tekrar kaydettiğinde `reviewStatus` otomatik "İncelemede"ye döner ve red bilgileri temizlenir (manageReviewCycle hook'u).
- **Nasıl fixlendi:**
  - `cms/src/collections/Campaigns.ts`: `reviewStatus`/`rejectionReason`/`rejectedAt`/`rejectedBy` alanları (rejectionReason'ı sadece Growth Maker DIŞINDAKİ roller değiştirebilir — field-level access); `manageReviewCycle` beforeChange hook'u (Maker'ın rejected bir taslağı düzenlemesi → otomatik pending'e döner + red alanları temizlenir); `auditRejection` afterChange hook'u (audit-logs'a "rejected" aksiyonu yazar).
  - `cms/src/collections/AuditLogs.ts`: action seçeneklerine "Reddedildi" (`rejected`) eklendi.
  - `cms/src/components/RoleAwarePublishButton.tsx`: "Reddet" butonu + red sebebi modalı eklendi (yayınlanmamış dokümanlarda, Growth Maker hariç herkese görünür); reddetme `submit()` ile `reviewStatus/rejectionReason/rejectedAt/rejectedBy` override'ları gönderir.
  - `cms/src/components/WaitingApprovalsView.tsx` (yeni): Payload'ın top-level custom admin view mekanizmasıyla (`admin.components.views`) kayıtlı server component. Sayaçlar audit-logs'tan (`publish`/`rejected`/`create` aksiyonları, collectionSlug=campaigns), bekleyen liste `payload.findVersions` ile (bkz. aşağıdaki iki gerçek bug notu). Growth Maker için erişim engellenir.
  - `cms/src/components/WaitingApprovalsNavLink.tsx` (yeni): sidebar linki, `afterNavLinks` slotuna bağlı, Growth Maker'da gizli.
  - `cms/payload.config.ts`: `admin.components.views.waitingApprovals` (path `/waiting-approvals`) ve `afterNavLinks` eklendi. `cms/src/app/(payload)/admin/importMap.js`'e elle eklendi (bu projede importmap CLI'ı bozuk — R-10).
  - **Canlıda bulunan 2 gerçek bug, aynı oturumda düzeltildi:**
    1. Payload top-level custom view'lar varsayılan olarak sidebar/topbar şablonuna (`DefaultTemplate`) SARILMIYOR — Payload'ın kendi `RootPage` kaynağı okunarak (`@payloadcms/next/dist/views/Root/index.js`) doğrulandı; `WaitingApprovalsView` artık `DefaultTemplate`'i `initPageResult.req`/`permissions`/`visibleEntities` ile elle sarıyor.
    2. İlk yazımda erişim kontrolü çalışmıyordu — üst seviye custom view'lara Payload `user` prop'unu ayrıca GEÇMİYOR (sadece `initPageResult.req.user` içinde var); düzeltilmeden önce Growth Maker de sayfayı görebiliyordu. Ayrıca "Cevap Bekleyen Kampanyalar" listesi `payload.find({draft:true})` kullanıyordu — bu hem `denyUnauthenticatedDraftRead` hook'u tarafından 403'leniyordu (Local API çağrısının bağlı bir `req.user`'ı yok) hem de Payload taslak koleksiyonlarında ana tabloyu sadece YAYINLAMADA senkronladığından bir Maker'ın düz taslak kaydı hiç görünmüyordu — `payload.findVersions` kullanımına geçirildi (aynı bug, aynı sebeple, 2.4'ün orijinal `DashboardWidgets.tsx` widget'ında da vardı — o da düzeltildi).
- **Test edildi mi:** Evet, uçtan uca gerçek rollerle: (1) test-growth-maker ile yeni taslak kampanya oluşturuldu; (2) test-growth-checker ile "Reddet" butonuna basılıp bir sebep yazıldı — sidebar'da "Reddedildi" durumu, sebep, tarih ve reddeden kullanıcı doğru göründü; Bekleyen Onaylar sayfasında Reddedilen sayacı 0→1 arttı ve kampanya "Cevap Bekleyen" listesinden kalktı (doğru — cevaplanmış sayılır); (3) test-growth-maker ile başlık değiştirilip taslak tekrar kaydedildi — İnceleme Durumu otomatik "İncelemede"ye döndü, red alanları kayboldu; (4) test-growth-maker ile `/admin/waiting-approvals`'a gidilmeye çalışıldı — sunucu tarafında "Bu sayfa sadece kampanyaları onaylayabilen/reddedebilen kullanıcılar içindir" mesajıyla engellendi, sidebar'da link de hiç görünmedi; (5) test-growth-checker ile sayfaya tekrar girildi — kampanya artık "Cevap Bekleyen Kampanyalar" listesinde (güncel başlıkla) göründü; (6) yayınlandı — Onaylanan sayacı 6→7'ye çıktı, Reddedilen 1'de sabit kaldı, Toplam Açılan 10'da sabit kaldı (yeni kayıt açılmadı), bekleyen liste tekrar boşaldı. `cms/` ve kök projede `npm run typecheck` + `npm run test` (68/68 ve 85/85) çalıştırıldı, ikisi de temiz. Docker image yeniden build edilip container restart edildi; ayrıca yeni Postgres kolonları için (`payload migrate:create` bu ortamda bozuk — R-10) daha önce dokümante edilen geçici çözüm tekrar uygulandı: NODE_ENV=development ile tek seferlik `next dev` çalıştırılıp Payload'ın push-based şema senkronu tetiklendi, ardından prod container'a geri dönüldü.
- **Yorumlarım:**

### 3.12
> Login sayfasında böyle 3 farklı değil de büyük bir font beyaz fontla mesela tamamen örnek : one platform for all your needs.
>
> altında da build enterprise applications 70% faster. Connect any system - without migration or vendor lock in gibi kanka şey olsun anladın mı hani buna benzer bir üst paragraf ve alt paragraf ama bizim cms sistemimizle ilgili yazıcak. O 3 lü değil de logonun altında beyaz Vodafone beyazı fontlarla biri büyük kalın biri daha ince küçük.

- **Durum:** Tamamlandı
- **DoD:** Login sayfasının sol panelinde eski 3 ayrı özellik kartı (Faturana Yansıt / QR ile Öde / Anında Bakiye) kaldırıldı; yerine logonun altında TEK büyük kalın beyaz başlık + altında daha ince/küçük beyaz bir alt paragraf geldi, ikisi de CMS ürününü anlatan bizim metnimizle (kullanıcının verdiği "one platform..." örneği sadece stil referansıydı, kopyalanmadı). Admin dil değiştirici (tr/en) ile içerik doğru dilde değişiyor.
- **Nasıl fixlendi:** `cms/src/components/LoginBrandPanel.tsx`: kart listesi (`features` dizisi + render) kaldırıldı, `useAdminLocale()` + `STRINGS` (tr/en) pattern'i eklenerek (bu bileşen daha önce hardcoded Türkçe idi — CLAUDE.md'deki "her custom admin bileşeni useAdminLocale kullanmalı" kuralına da bu vesileyle uyduruldu) tek `headline` + `subheadline` render eden bir hero bloğu eklendi. `cms/src/styles/custom.css`: `.vf-login-panel__card*` stilleri kaldırıldı, `.vf-login-panel__hero-headline` (2.25rem, 700 weight, beyaz) ve `.vf-login-panel__hero-subheadline` (1.05rem, 400 weight, %78 opak beyaz) eklendi.
- **Test edildi mi:** Evet. Docker image yeniden build edilip container restart edildi. Tarayıcıda `/admin/logout` üzerinden login sayfası açılıp ekran görüntüsü alındı — logonun altında "Tüm içeriğin tek platformda." (büyük/kalın) ve altında ince alt paragraf doğru göründü, eski 3 kart tamamen kalktı. `payload-lng` cookie'si `en` yapılıp sayfa yenilendiğinde "One platform for all your content." + İngilizce alt paragraf doğru render edildi (locale-awareness çalışıyor), sonra `tr`'ye geri alındı. `cms/` ve kök projede `npm run typecheck` + `npm run test` (68/68, 85/85) temiz.
- **Yorumlarım:**

---

## Bölüm 4 — İkinci tur geri bildirim (14.08.2026)

### 4.1
> campaigns altındaki kampanyaların son create olana göre sıralanması lazım. listenin.

- **Durum:** Tamamlandı
- **DoD:** Campaigns listesi (hem Payload'ın kendi collection görünümü hem İçerik Yönetimi sekmesi) en son OLUŞTURULAN kampanya en üstte olacak şekilde sıralanmalı.
- **Nasıl fixlendi:** `cms/src/collections/Campaigns.ts`'e üst seviye `defaultSort: "-createdAt"` eklendi (ilk denemede `admin` bloğunun içine konmuştu — Payload'ın `CollectionConfig` tipinde `defaultSort` üst seviyede olmalı, typecheck bunu yakaladı). `cms/src/components/ContentManagementApp.tsx`'in fetch'indeki `sort` parametresi `-updatedAt`'ten `-createdAt`'e çevrildi (liste kolonundaki "Güncellendi" değeri kasıtlı olarak değiştirilmedi — sadece sıralama).
- **Test edildi mi:** Evet. Docker rebuild sonrası `test-nv-maker` ile `/admin/collections/campaigns`'a gidilip en üstteki kaydın en son oluşturulan taslak (`<Title yok>`) olduğu ekran görüntüsüyle doğrulandı.
- **Yorumlarım:**

### 4.2
> Yeni olustur dedim zorunlu alanlar var title url adı Description image category. bunlar zorunlu olsun. aslında ben bunları girdi taslagı kaydet dedi mesela onaya gönder demesi lazımdı. yani yayınla zaten makerlarda kapalı ama onların da kaydedebilmesi ardından tüm zorunlu alanlar okeyse onaya gönder butonuna basarsa ancak checkerlara gitmesi lazım anladın mı?

- **Durum:** Tamamlandı
- **DoD:** (1) "Taslağı Kaydet" zorunlu alanlar (title/slug/description/image/category) eksikken artık sessizce kabul etmemeli, net bir hata göstermeli. (2) Growth Maker için buton metni "Onaya Gönder" olmalı (yayınlayamadığı için "kaydet" yanıltıcıydı — asıl anlamı Checker'ın onay kuyruğuna girmesi).
- **Nasıl fixlendi:** Kök sebep: Payload'da `versions.drafts: true` (kısayol) varsayılan olarak `validate: false` demek — taslak kaydında zorunlu alan kontrolü tamamen atlanıyor (`node_modules/payload/dist/versions/types.d.ts` okunarak doğrulandı). `cms/src/collections/Campaigns.ts`: `versions.drafts` → `{ validate: true }` yapıldı. Yeni `cms/src/components/SaveOrSubmitButton.tsx`: Payload'ın varsayılan `SaveDraftButton`'ının submit mantığı birebir kopyalanarak (`@payloadcms/ui`'nin kendi kaynağı okunarak) yazıldı — tek fark, varsayılanın aksine `skipValidation` GÖNDERMİYOR (client-side doğrulama da çalışsın diye) ve etiketi role'e göre koşullu: Growth Maker için "Onaya Gönder", diğerleri için normal "Taslağı Kaydet". `Campaigns.ts`'in `admin.components.edit.SaveDraftButton`'ına bağlandı, `translationDefaults.ts`'e `saveOrSubmit.*` anahtarları eklendi, `importMap.js`'e elle kaydedildi.
- **Test edildi mi:** Evet, iki roldeki gerçek davranışıyla: (1) `test-nv-maker` ile yeni kampanya formunda hiçbir alan doldurulmadan "Taslağı Kaydet"e basıldı — 5 eksik alanı (Title, URL Adı, Description, Image, Category) tek tek listeleyen kırmızı bir hata kutusu çıktı, kayıt OLUŞMADI. (2) `test-growth-maker` ile aynı forma girildi — buton "Onaya Gönder" olarak göründü (NV Maker'da hâlâ "Taslağı Kaydet").
- **Yorumlarım:**

### 4.3
> http://localhost:3010/admin/collections/campaigns/33 browseri kullanarak burada değişiklikleri yayınla buttonuna basmanı istiyorum. açılan preview sayfasının ne kadar kötü oldugunu ekrna görüntüleriyle kendin görürsen fixleyebilirsin

- **Durum:** Tamamlandı
- **DoD:** Yayınlama onayı modalındaki gömülü preview iframe'i gerçek boyutunda, kullanılabilir görünmeli; arka plandaki admin sayfası modal açıkken kaymamalı.
- **Nasıl fixlendi:** İki gerçek bug, tarayıcıda ekran görüntüsüyle bulundu: (1) `RoleAwarePublishButton.tsx`'teki modal `maxHeight: 90vh` taşıyordu ama kendi `height`'ı YOKTU — flex column'da kendi yüksekliği tanımsız bir kapsayıcı içindeki `flex:1` çocuk büyüyemiyor, bu yüzden iframe her zaman `minHeight:420px`'te sıkışıp kalıyordu ve önizlemede sadece sitenin üst kısmı (menü + "uygulamayı indir" bandı + dev logo) görünüyordu, asıl kampanya içeriği kadraj dışındaydı. Modal'a `height: 90vh` eklenerek flex'in gerçekten büyümesi sağlandı (iframe 420px'ten ~508px'e çıktı). (2) Modal üzerinde fare tekerleğiyle kaydırma denendiğinde iframe içeriği DEĞİL, ARKA PLANDAKİ admin sayfası kayıyordu (modal açıkken body scroll'u kilitli değildi) — `useEffect` ile modal açıkken `document.body.style.overflow = "hidden"` set edilip kapanınca geri alınıyor.
- **Test edildi mi:** Evet. `test-nv-maker` ile kampanya 33'te "Değişiklikleri Yayınla"ya basılıp modal açıldı; `iframe.getBoundingClientRect()` ile yükseklik 420→508px doğrulandı; modal üzerinde scroll denendiğinde `window.scrollY` fix öncesi 0→300 (arka plan kaymış), fix sonrası 0→0 (arka plan sabit) olarak ölçüldü.
- **Yorumlarım:**

### 4.4
> Profil kısmım baya bozuk kanka, profil fotoğrafı yüklenmiyor gidiyor mediaya yüklüyor sağ üstte profil fotoğrafının güncellenmesi lazımdı profil fotosu eklerken caption alt istiyor istememeli. hala epostayı field olarak düzenlenebilir koymuşuz adam epostasını düzenleyemiyor ki!! parolayı değiştir hesabı etkinleştir kısımları hala duruyor silinmeliydi. role seçebiliyor gibi duruyor durmamalı bunun sadece aktif rolü gözükmeliydi. [...] hem burada dil değişimi var hem onun hemen atlında ayarlarda türkçe en dil seçimi var 2 tane!!!

- **Durum:** Tamamlandı
- **DoD:** (a) Avatar yüklendiğinde sağ üst köşedeki ikon güncellensin. (b) Avatar yüklerken Alt/Caption istenmesin. (c) E-posta gerçekten (sunucu tarafında da) kilitli olsun, sadece UI'da değil. (d) "Parolayı Değiştir" / "Hesabı Etkinleştir" tamamen kaldırılsın. (e) Role sadece düz metin olarak görünsün, interaktif görünmesin. (f) Tek bir dil değiştirici kalsın (Payload'ın kendi "Ayarlar" bloğu kaldırılsın, üst bardaki geçici "Yerel ayar" dropdown'a dokunulmasın).
- **Nasıl fixlendi:** Payload'ın varsayılan Account sayfası, bu 6 maddenin hiçbirini tek tek "kapatmaya" izin vermiyor (Auth bloğu — email/change-password/force-unlock — auth-enabled her collection'da otomatik render oluyor; "Ayarlar" bloğu da `AccountView`'ın kendi `AfterFields` prop'una sabitlenmiş). Bu yüzden Account sayfasının GÖVDESİ tamamen özel bir component'le değiştirildi (`admin.components.views.account.Component` — Payload'ın bunun için native, desteklenen bir extension noktası olduğu `node_modules/payload/dist/config/types.d.ts`'ten doğrulandı):
  - `cms/src/components/CustomAccountView.tsx` (server) + `cms/src/components/AccountForm.tsx` (client): email ve role artık düz `<div>` (input/select DEĞİL) olarak render ediliyor — (c) ve (e). Auth bloğu hiç render edilmediği için "Parolayı Değiştir"/"Hesabı Etkinleştir" hiç mount olmuyor — (d). `AfterFields`/Settings hiç tüketilmediği için Payload'ın "Ayarlar" bloğu da hiç mount olmuyor — (f), tek kalan dil seçici bizim `preferredLocale` alanımız.
  - Avatar yükleme, Payload'ın admin upload çekmecesini hiç kullanmıyor — doğrudan `fetch('/api/media', {method:'POST', body: formData})`. Payload'ın REST upload endpoint'i ek alanları SADECE `_payload` adlı bir JSON-string form alanından okuyor (düz `formData.append('alt', ...)` sessizce yok sayılıyor — bu ilk denemede "Lütfen geçersiz alanı düzeltin: Alt" hatasına yol açtı, `node_modules/payload/dist/utilities/addDataAndFileToRequest.js` okunarak kök sebep bulundu); `_payload: JSON.stringify({alt: "..."})` ile otomatik/anlamlı bir alt metni sessizce gönderiliyor, kullanıcıya hiç sorulmuyor — (b). Başarılı yüklemeden sonra `window.location.reload()` çağrılıyor.
  - `cms/src/components/UserAvatarIcon.tsx` (yeni) + `payload.config.ts`'te `admin.avatar: { Component: ... }`: sağ üstteki ikon, Payload'ın varsayılanında SADECE "default" (jenerik silüet) veya "gravatar" destekliyordu — `users.avatar` alanını hiç okumuyordu (bu, 4a'nın asıl kök sebebiydi, "refresh eksikliği" değil). Artık `useAuth().user.avatar.url`'i okuyup gerçek fotoğrafı 25x25 yuvarlak olarak gösteriyor, yoksa aynı boyutta jenerik ikona düşüyor — (a).
  - `cms/src/collections/Users.ts`: Payload'ın auto-inject ettiği `email` alanı aynı isimle yeniden tanımlandı (`mergeBaseFields` bunu deep-merge ediyor, login/hash mekanizmasına dokunmuyor — `node_modules/payload/dist/fields/mergeBaseFields.js` okunarak doğrulandı) ve `access.update: ({req,id}) => req.user?.id !== id` eklendi — `role` alanındaki mevcut self-lock deseniyle birebir aynı — (c)'nin gerçek sunucu-taraflı kilidi.
- **Test edildi mi:** Evet, uçtan uca. UI: `test-nv-maker` ile `/admin/account` açıldı — email/role düz metin kutuları olarak göründü, "Parolayı Değiştir"/"Hesabı Etkinleştir" hiç yok, tek bir "Dil Tercihi" seçici var (JS ile `document.querySelectorAll` sayıldı — `.payload-settings`, `#change-password`, `#force-unlock` hepsi 0/false). Avatar: sentetik bir PNG (canvas'tan üretilip `DataTransfer` ile input'a bağlandı) yüklendi — network sekmesinde önce "Lütfen geçersiz alanı düzeltin: Alt" hatası yakalandı, `_payload` fix'i sonrası hem hesap sayfasındaki önizleme hem sağ üstteki header ikonu YENİ fotoğrafı gösterdi. Sunucu-taraflı kilit: `fetch(PATCH /api/users/{id}, {email:"hacked@evil.example"})` ve aynı şekilde `role` denendi — ikisi de 200 döndü (sessizce reddedildi, Payload'ın field-access davranışı) ama `/api/users/me` sonrası değerler DEĞİŞMEMİŞ olarak doğrulandı — gerçek bir sunucu-taraflı kilit, sadece UI kozmetiği değil. Dil tercihi kaydetme (en→tr) ayrıca test edildi, "Dil tercihi kaydedildi" mesajıyla çalıştı.
- **Yorumlarım:**

### 4.5
> users listesinde export alabilmeliydik excel ya da pdf ya da word gibi. türkçe karakterleri destekleyecek şekilde.

- **Durum:** Tamamlandı
- **DoD:** Users listesinde bir "Dışa Aktar" butonu olmalı, indirilen dosya Türkçe karakterleri (ç,ğ,ı,ö,ş,ü) bozmadan Excel'de doğru açılmalı.
- **Nasıl fixlendi:** Gerçek bir `.xlsx` için `xlsx` (SheetJS) paketi değerlendirildi ama npm registry'deki güncel sürümü 2 adet düzeltilmemiş yüksek-önem açığı taşıyor (prototype pollution + ReDoS — SheetJS düzeltmeleri npm dışında kendi CDN'lerine taşımış); bu repo'nun sıfır-bilinen-açık politikasıyla (AGENTS.md, R-13/R-14) uyuşmadığı için kuruldu, `npm audit` ile doğrulanıp hemen `npm uninstall` edildi. Onun yerine yeni `cms/src/components/UsersExportButton.tsx`: Users listesinin üstüne bir "Dışa Aktar (CSV)" butonu ekliyor (`admin.components.beforeList`, `HelpButton`'ın yanına). `/api/users`'tan tüm kullanıcıları çekip noktalı virgülle ayrılmış (Türkçe Excel'in varsayılan liste ayıracı) ve UTF-8 BOM'lu (`﻿` — BOM olmadan Excel dosyayı ANSI/Windows-1254 sanıp Türkçe karakterleri bozuyor) bir CSV üretip tarayıcıda indiriyor. Sütunlar: E-posta, Rol (insan-okur etiket), Dil Tercihi, Oluşturulma, Güncellenme.
- **Test edildi mi:** Evet. `URL.createObjectURL` geçici olarak yamalanarak üretilen CSV'nin ham içeriği okundu — başlık satırı ve tüm satırlar (`Türkçe`, `tüm alanlar`, `sadece Campaigns`, `Güncellenme` gibi Türkçe karakterli değerler dahil) doğru, bozulmamış olarak doğrulandı.
- **Yorumlarım:**

---

---

## Bölüm 5 — Üçüncü tur geri bildirim (15.08.2026)

### 5.1
> mesela test kategorisi vardı ekledigim categories kısmına product bir kategori ekleyebilsin istemiştim. sonra o kategroide bir kampanya yarattım mesela a description verdim.  gidip kategoriyi silebildim hemen onun yerıne o kampanyayı önce silmem lazımdı çünkü ona bağlıydı anladın mı? ve kategoriyi silerken falan emin misiniz gibi bir evet hayır box cıkmalıydı onayladıgında bu kontrolü yapıp tekrar silinemediğinin nedenini hata mesajında UI da vermeliydi diye düşünüyorum. Böyle çalışmayan bu componentin eksik oldugu ve olması gereken yerler varsa analiz et ve bunları fixle.

- **Durum:** Tamamlandı
- **DoD:** Başka bir kayıt tarafından referans alınan hiçbir kayıt silinemesin; engellenen silme, admin arayüzünde okunabilir bir hata mesajıyla ve *hangi kayıtların* engellediğini (adıyla + düzenleme linkiyle) söyleyerek dönsün. Tek bir kategori vakası değil, aynı sınıf her ilişki kapsansın.
- **Nasıl fixlendi:** Kök neden: bu CMS'te **hiç `beforeDelete` hook'u yoktu** ve Postgres de arkada durmuyordu — Payload/drizzle her `relationship`/`upload` FK'sini `ON DELETE SET NULL` olarak üretiyor (canlı DB'de 17 FK'nin tamamı için doğrulandı). Kategori silinince `campaigns.category_id` sessizce NULL oluyor, alan `required: true` olduğu halde kampanya "yayında" kalmaya devam ediyor ve hiçbir kategori filtresine düşmüyordu — hata da vermiyordu.
  - Yeni `cms/src/hooks/referentialIntegrity.ts`: tek bir `REFERENCE_MAP` ("kim kimi işaret ediyor") + tek bir jenerik `blockDeleteIfReferenced()` factory'si. Yeni bir ilişki eklemek haritaya **tek satır** eklemek demek, guard hiç değişmiyor.
  - `categories`, `media`, `documents`, `users` koleksiyonlarına bağlandı. Engellenen silme **409 Conflict** ile dönüyor (ham 500 değil) ve mesaj engelleyen kayıtları adıyla + `/admin/collections/...` linkiyle listeliyor, sonunda ne yapılması gerektiğini yazıyor. Mesaj admin panelinin o anki diline göre TR/EN üretiliyor.
  - **Bir probe hata verirse guard KAPALI tarafa düşüyor** (silmeye izin vermiyor) — sessizce geçmek zaten bu modülün önlemek için var olduğu bug'ın ta kendisi.
  - **Önceki turun bir varsayımı yanlış çıktı:** `Pages.layout` gibi polimorfik `blocks` dizilerinin Payload'ın düz `where` sorgusuyla hedeflenemeyeceği düşünülüp kapsam dışı bırakılmıştı. Canlıda test ettim: `where[layout.image][equals]=N` ve `where[layout.logos.logo][equals]=N` ikisi de doğru eşleşiyor. Dolayısıyla bu referanslar "belki kullanılıyordur" uyarısı olarak değil, **tam kapsamda** guard'a dahil edildi.
  - `users` hedefine giden 3 referans (`campaigns.createdBy`, `campaigns.rejectedBy`, `media.uploadedBy`) bilinçli olarak **engellemiyor**: bunlar içerik bağımlılığı değil, "kim yaptı" bilgisi. Engellemek, bir şeye bir kez dokunmuş hiçbir kullanıcının hesabının kapatılamaması demek olurdu. Bunun yerine silme sırasında hangi alanların boşaldığı **audit log'a** yazılıyor.
  - `MediaUsageField.tsx` artık aynı `REFERENCE_MAP`'i okuyor — "silinemez, kullanımda" hatası ile "kullanıldığı yerler" paneli birbirinden ayrışamıyor. (Bu bileşen ayrıca koleksiyon adlarını hardcoded Türkçe basıyordu, EN'e geçince değişmiyordu; o da düzeldi.)
  - **Silme onayı:** Payload'ın kendi edit görünümü ve liste bulk-delete'i zaten onay modalı gösteriyor. Onaysız üçüncü yol olan `ContentManagementApp`'in silme aksiyonları 5.9 kapsamında tamamen kaldırıldı — yani artık onaysız silme yolu yok.
- **Test edildi mi:** Evet — 5 birim testi (referanslıyken engellenir, referanssızken geçer, referans kaldırılınca geçer, probe hata verince kapalı düşer, mesaj dile göre üretilir) **+ canlı:** NV Maker ile 18+ kampanyası olan "Genel" kategorisi silinmeye çalışıldı — Payload'ın onay kutusu kaydı adıyla sordu, onaylayınca silme engellendi ve hata mesajı *"'Genel' (Kategori) silinemedi — 23 kayıt hâlâ buna bağlı"* + 3 kampanyanın adı ve edit linki + "…ve 20 kayıt daha" gösterdi. Kategori silinmedi.
- **Yorumlarım:**

### 5.2
> ayrıca kampanyalar sayfasında tümüne tıkladıgımda bu ayın favorileri ve altında favori olmayan tüm kampanyalar listeleniyor bu doğru davranış fakat örnegin anında bakiye seçtim sadece ve sadece anında bakiye kategorililier gözükmeli favoriler kısmı olmamalı anladın mı?

- **Durum:** Tamamlandı
- **DoD:** "Tümü" seçiliyken mevcut davranış korunsun; belirli bir kategori seçilince tek bir liste görünsün, ayrı "Bu ayın favorileri" bloğu olmasın — ve o kategorinin favori kampanyaları da kaybolmasın.
- **Nasıl fixlendi:** `CampaignsFilterableList` iki **önceden ayrılmış** dizi (`favorites` = featured, `allCampaigns` = geri kalan) alıp her birini ayrı filtreliyordu. Bu, bildirdiğin bug'ın üstüne ikinci bir bug taşıyordu: favori bir kampanya SADECE `favorites` dizisinde olduğu için, favoriler bloğunu kaldırmak o kampanyaları sayfadan **tamamen** yok ederdi. Bileşen artık `featured` bayrağını taşıyan **tek bir liste** alıyor ve iki görünümü de ondan türetiyor — bir kampanyanın hiçbir listede olmaması imkânsız. Kategori seçiliyken başlık o kategorinin kendi adı oluyor.
- **Test edildi mi:** Evet — canlı sitede "Genel" sekmesi seçildi: tek liste, başlık "Genel", favoriler bloğu yok, o kategorinin favori kampanyaları da listede.
- **Yorumlarım:**

### 5.3
> Kampanya Tarihi14.07.2026 - 15.08.2026 https://www.vodafonepay.com.tr/kampanyalar/pazaramada-50-indirim
>
> şeklinde UI da nasıl ekleniyor gidip bak kampanya tarihi eklendiğinde. kampanya kartının altında tutmuşlar güzel gözüküyor.

- **Durum:** Tamamlandı
- **DoD:** Kampanya tarihi, gerçek sitedeki etiket ve biçimle görünsün; tarihi olmayan kampanyada blok hiç render edilmesin ve kart hizası bozulmasın.
- **Nasıl fixlendi:** Önce gerçek siteye baktım. **Bulgu:** vodafonepay.com.tr bu bloğu **detay sayfasında** basıyor (takvim ikonu + "Kampanya Tarihi" + `gg.aa.yyyy - gg.aa.yyyy`, kampanya kartı bloğunun hemen altında, "Kampanya Detay" başlığının üstünde) — liste sayfasındaki kartlarda tarih **yok**. Brief kart üzerinde de istediği için **her iki yerde** basıyoruz; ikisi birbirinden ayrışmasın diye tek bir `CampaignDate` bileşeni yazıldı.
  - Tek tarihli durumlar için ayrı metin: sadece başlangıç varsa "… tarihinden itibaren", sadece bitiş varsa "… tarihine kadar" — yarım bir aralık göstermek yerine.
  - İki tarih de boşsa bileşen hiçbir şey render etmiyor.
  - Kart `flex flex-col` + CTA'da `mt-auto` oldu: tarihli/tarihsiz karışık bir listede kartların yüksekliği ve "Detayları gör" hizası bozulmuyor.
  - Detay sayfasındaki eski etiketsiz `14.07.2026 – 15.08.2026` satırı da aynı bileşene çevrildi.
  - `getCampaigns()` sorgusu artık `startDate`/`endDate` de çekiyor (detay sorgusu zaten çekiyordu).
- **Test edildi mi:** Evet — canlı sitede kartlarda "Kampanya Tarihi 27.08.2026 - 28.08.2026" göründü; tarihi olmayan kartta blok hiç render edilmedi; aynı satırdaki kartların yüksekliği (412/412/412 px) ve CTA hizası (364/364/364 px) tarihli/tarihsiz fark etmeksizin eşit ölçüldü.
- **Yorumlarım:**

### 5.4
> yayında bir kampanya varsa ve bu edit edilmeye calisiliyorsa bence önce durumu pasife çekilmeli gibi bir path vermeliyiz kullanıcıya. aktfi kampanyayı güncellemek için öncelikle pasife çekmelisiniz gibi. sonra onaya gitmeli pasife çekilme onayı verilirse mesela ilgili düzenleme yapılabilir. ama ilk düzenlendiği tarih neydiyse orada kalmalı yani mesela ben bu kampanyayı 3 ay önce çıktım ama descriptionunu değiştiricem. pasife aldım değiştirdim tekrar yayınladım en üste çıkmamamlı bu kampanya. ilk created at tarihini kullanmalı anladın mı? yoksa ondan sonra üretilen yeni kampanyaların önüne geçer listelemede.

- **Durum:** Tamamlandı
- **DoD:** Yayındaki kampanya doğrudan düzenlenemesin; kullanıcı ne yapması gerektiğini söyleyen net bir yönlendirme görsün; yayından kaldırma bir onaydan geçsin; döngü sonunda kampanyanın liste sırası değişmesin.
- **Nasıl fixlendi:** **Tasarım kararı — "pasife çekme" = Payload'ın kendi `_status: draft`'ı, `campaignStatus` DEĞİL.** İkisi farklı şeyler ve yanlışını seçmek diğerinin anlamını bozardı: `campaignStatus: "expired"` "bu kampanya bitti" demek ve kampanyayı site liste sayfalarından kalıcı olarak düşürüyor (`getCampaigns()`, site tarafı `lib/cms.ts`) — "açıklamasında yazım hatası düzelteceğim" bunu hak etmiyor. `_status: draft` ise zaten "yayında değil, düzenlenebilir, tekrar incelemeden geçer" demek ve mevcut `reviewStatus`/`RoleAwarePublishButton` makinesine doğrudan oturuyor; ikinci bir paralel onay sistemi kurmaya gerek kalmıyor.
  - `guardPublishedEdit` beforeChange hook'u: doküman yayındayken içerik alanlarından herhangi biri değişirse **409** ile reddediliyor, mesaj tam olarak ne yapılacağını söylüyor ("önce yayından kaldırın, değişikliklerinizi yapın, sonra tekrar onaya gönderin — ilk oluşturulma tarihi ve listedeki sıra korunur").
  - Yeni alanlar: `unpublishRequest` (yok/onay bekliyor), `unpublishRequestedBy`, `unpublishRequestedAt`.
  - **Rol rol davranış:** Growth Maker yayından kaldıramıyor, sadece **talep** açabiliyor (buton: "Yayından Kaldırma Talebi Oluştur"). Yayınlama yetkisi olan roller (NV Maker, NV Checker, Growth Checker) doğrudan yayından kaldırabiliyor — "yayınlayabilen, yayından da kaldırabilir"; onay adımı zaten bu roller tarafından veriliyor.
  - Yayından kaldırma otomatik olarak `reviewStatus`'ü "İncelemede"ye çeviriyor ve talebi temizliyor — yani düzenleme bitince normal onay akışıyla yayına dönüyor.
  - **`createdAt`:** Payload bu alanı sadece INSERT'te yazıyor; unpublish → düzenle → yeniden yayınla döngüsü ona hiç dokunmuyor. Hem `defaultSort: "-createdAt"` (admin) hem site tarafındaki `sort=-createdAt` için sıra korunuyor. Bunu bir birim testi de doğruluyor.
- **Test edildi mi:** Evet — 7 birim testi + **canlı, iki rolle:** (1) NV Maker yayındaki kampanyayı düzenleyip yayınlamayı denedi → 409 ve tam yönlendirme mesajı. (2) "Yayından Kaldır ve Düzenle" → durum Taslak, İnceleme Durumu otomatik "İncelemede", **Oluşturma tarihi değişmedi (13 Ağustos)**; yeniden yayınlandığında kampanya listede **7. sırada kaldı, en üste çıkmadı**. (3) Growth Maker'da buton "Yayından Kaldırma Talebi Oluştur" olarak göründü ve talep kaydedildi; aynı rolde taslağı yayınlama **403**, yayındaki içeriği düzenleme **409**, tek başına yayından kaldırma **403** — görev ayrımı korunuyor.
- **Yorumlarım:**

### 5.5
> sık sorulanlar listesi order a göre listelenmeli basic olarak listede. order i 1 den baslamalı yani list bileşenimiz

- **Durum:** Tamamlandı
- **DoD:** `order` alanı olan koleksiyonların admin listesi gerçekten `order`'a göre sıralansın; `order` 1'den başlasın ve kullanıcı elle sayı düşünmek zorunda kalmasın.
- **Nasıl fixlendi:** Sorun Sık Sorulanlar'a özel değildi: `defaultSort` **sadece Campaigns'te** tanımlıydı, dolayısıyla `order` alanı olan **9 koleksiyonun tamamı** (FaqItems, FeeRows, LimitTables, NavLinks, FeatureCards, StepCards, ContentBlocks, Announcements, Categories) Payload'ın varsayılan sırasında listeleniyordu — yani sürükle-bırak widget'ının kaydettiği sıra, onu kontrol etmesi gereken listede hiç görünmüyordu.
  - 9 koleksiyonun hepsine `defaultSort: "order"` eklendi.
  - `order` alanı: `defaultValue: 1`, `min: 1`, ortak açıklama metni, TR/EN etiket.
  - Yeni `assignNextOrder()` hook'u: yeni kayıt kendi grubunun **sonuna** `max(order) + 1` ile ekleniyor. Gruplama alan bazlı (StepCards/FeatureCards `page`, FaqItems `category`, NavLinks `section`) — bir sayfaya kart eklemek başka sayfaların numaralandırmasını kaydırmıyor. Elle yazılan değer her zaman korunuyor.
  - `ReorderWidget` artık 0 değil **1** tabanlı yazıyor (eskiden dizi indeksini yazıyordu, ilk öğe hep 0 oluyordu — ki 0, eski `defaultValue`'nun ürettiği "atanmamış" değerle aynıydı).
  - **Mevcut 0-tabanlı veriler:** normalize edilmedi; `sort=order` artan sıralama olduğu için karışık 0/1 tabanlı değerler yanlış sıra üretmiyor, sadece görüntülenen sayı 0'dan başlıyor. İlgili listede bir kez sürükle-bırak yapmak o koleksiyonu 1-tabanlıya çeviriyor. Tek seferlik normalize SQL'i tur raporunda var.
- **Test edildi mi:** Evet — 7 birim testi (`max+1`, boş koleksiyonda 1, grup bazlı kapsam, elle değer korunur, 0 "atanmamış" sayılır, update'e karışmaz, sorgu hata verirse kaydı bloklamaz) + canlı doğrulama.
- **Yorumlarım:**

### 5.6
> test-nv-maker kişiler hesap kilidi olan kişileri görebilmeli sadece onlar user listesinde varolan userlarda bir kiliidi olan varsa yanlış login denemesinden dolayı o kişinin kilidini kaldırabilmeli user in db de user değerlerinde locked değeri de işte atıyorum değişmeli. test nv maker da bunu yapabileceği geliştirme ve bunu yapabileceği ekstra ekranı ekleyelim user collectionuna ama sadece bu role sahip kullanıcılar yapabilsin.

- **Durum:** Tamamlandı
- **DoD:** Kilitli hesaplar görünür ve filtrelenebilir olsun; sadece New Vertical Maker kilidi kaldırabilsin (sunucu tarafında zorlanmış); bunun için ayrı bir ekran olsun; her kilit açma audit log'a yazılsın.
- **Nasıl fixlendi:** **Önce bir düzeltme:** Kodda ve brief'te "lockout konfigüre edilmemiş, şu an sonsuz yanlış şifre denenebiliyor" yazıyordu. **Bu doğru değilmiş.** Payload'ın `addDefaultsToAuthConfig`'i (`collections/config/defaults.js`) HER auth config'e — obje formuna da — `maxLoginAttempts ?? 5` ve `lockTime ?? 600000` uyguluyor. Yani lockout zaten çalışıyordu, sadece görünmüyordu: canlı DB'de `login_attempts`/`lock_until` kolonları var (bunlar yalnızca `maxLoginAttempts > 0` iken oluşturuluyor) ve yanlış parola denemesi sayacı gerçekten artırıyor.
  - Politika artık **açıkça** yazılı: `maxLoginAttempts: 5`, `lockTime: 15 dakika`. 5 deneme gerçek bir yazım hatası/eski kayıtlı parola için yeterli pay bırakıyor, online parola denemesi için yetmiyor. Payload'ın 10 dakikası yerine 15: artık bir NV Maker kilidi anında kaldırabildiği için kilitlenen kişi beklemek yerine sorup açtırıyor — yani daha uzun otomatik süre gerçek kullanıcıya ucuz, saldırgana pahalı.
  - `lockUntil`/`loginAttempts` alanları Payload'da `hidden: true` geliyordu (kilitli hesap panelde hiçbir yerde görünmüyordu). Aynı isimle yeniden tanımlanıp görünür yapıldı — `mergeBaseFields` bunları **deep-merge** ediyor, dolayısıyla temel alandaki `access.update: () => false` korunuyor: bu alanlar normal bir PATCH ile hâlâ yazılamıyor.
  - `lockUntil` Users listesinde kolon olarak duruyor (gerçek alan olduğu için Payload'ın filtreleri üzerinde çalışabiliyor) ve listenin üstünde "N hesap şu anda kilitli → Kilitli Hesaplar ekranını aç" şeridi var.
  - Yeni **`/admin/locked-accounts`** ekranı + sadece NV Maker'a görünen sidebar linki. Kilidi Payload'ın kendi `POST /api/users/unlock` operasyonu kaldırıyor — elle PATCH değil, çünkü sayaç sıfırlaması da atomik olarak orada yapılıyor.
  - **Yetki sunucuda:** `Users.access.unlock = isNewVerticalMaker`. Ekrandaki butonun gizlenmesi sadece kozmetik; diğer roller API'den denese de reddediliyor.
  - Her kilit açma audit log'a `unlock` aksiyonuyla yazılıyor (`AuditLogs.action`'a yeni seçenek + Postgres enum'una `ALTER TYPE`).
  - **Başarısız girişler de artık loglanıyor.** Önceki tur "Payload bunun için hook açmıyor" demişti — login hook'ları için doğru (Payload `AuthenticationError`'ı `beforeLogin`/`afterLogin` çalışmadan ÖNCE fırlatıyor, `auth/operations/login.js`'teki `if (!authResult)` dalı), ama `afterError` bunu görüyor. `login_failed` aksiyonu oradan yazılıyor.
- **Test edildi mi:** Evet — 3 birim testi **+ canlı:** bir hesap kilitlendi, `/admin/locked-accounts` ekranında listelendi, "Kilidi Kaldır" ile açıldı; DB'de `login_attempts=0` / `lock_until=NULL` doğrulandı ve audit log'a *"test-growth-checker@… hesabının kilidi kaldırıldı"* kaydı (aktör: test-nv-maker) düştü. Growth Maker ile: sidebar'da link yok, sayfa "sadece New Vertical Maker rolündeki kullanıcılar içindir" dedi.
- **Yorumlarım:**

### 5.7
> tr en degisim yapıldıgında ya anasayfadaki topbardaki üstteki seçenekten yapabiliyor gibi bunu kapatalım. sadece profildeki ayardan yapabilisn,  ekstra olarak sayfaların locals değerleri dinamik olarak değişmiyor hatta hiç değişmiyor gibiler.

- **Durum:** Tamamlandı
- **DoD:** Dil sadece profildeki ayardan değiştirilebilsin; "hiç değişmeyen locale" durumu ortadan kalksın (ya her yerde çalışsın ya hiç görünmesin).
- **Nasıl fixlendi:** Panelde **iki ayrı dil kavramı** vardı ve tek şey sanılıyordu:
  1. **Admin arayüz dili** — `i18n`, `payload-lng` cookie'si. Sahibi: profildeki "Dil Tercihi".
  2. **İçerik locale'i** — `localization` bloğu. Payload bunun için üst bara kendi locale seçicisini basıyor.
  - Şikayetin kaynağı (2) idi: `localization` açıktı ama **tüm CMS'te `localized: true` olan tek alan `Pages.title`**'dı. Yani üst bardaki seçici hiçbir ekranda hiçbir şeyi değiştirmiyordu — "sayfaların locals değerleri hiç değişmiyor" gözlemin tam olarak buydu.
  - **Karar (senin onayınla): kapatıldı.** CSS ile gizlemek yerine `localization` tamamen kaldırıldı — gizlemek `?locale=en`'i URL'den erişilebilir bırakır ve yarım konfigürasyon yerinde kalırdı. Bunu **şimdi** yapmak güvenliydi çünkü `pages`, `pages_locales` ve `_pages_v_locales` tablolarının **sıfır satır** olduğu doğrulandı — kaybolacak içerik yoktu. `Pages.title` ana tabloya geri taşındı.
  - Admin arayüz dili tarafında zaten tek değiştirici profildeki alandı (Payload'ın kendi "Ayarlar" dil bloğu 4.4'te Account görünümü değiştirilirken kalkmıştı). `LocalePreferenceSync` sadeleşti: eskiden oturum başına bir kez çalışıp "geçici üst bar değişikliğiyle" kavga etmemeye çalışıyordu; öyle bir değiştirici kalmadığı için artık koşulsuz senkronize ediyor — cookie ile kayıtlı tercih arasında sapma kalmıyor.
  - İleride gerçekten çok dilli içerik istenirse bu bilinçli bir proje: hangi alanların çevrilebilir olacağı, gerçek İngilizce içerik ve incelenmiş bir veri migrasyonu gerekir. Önceki turun bulgusu hâlâ geçerli (mevcut sürüm geçmişi olan bir koleksiyonda alanı localize etmek drizzle push'u interaktif prompt'ta kilitliyor).
- **Test edildi mi:** Evet — panelin üst barında içerik locale seçicisi artık yok; admin dili yalnızca profildeki "Dil Tercihi" ile değişiyor.
- **Yorumlarım:**

### 5.8
> epostamı hatırla değil de remember me yazsa daha iyi her ne kadar sadece epostayı hatırlarsa da okey remember me olması daha iyi.

- **Durum:** Tamamlandı
- **DoD:** Etiket her iki dilde de "Remember me" olsun; kullanıcı parolasının saklandığını sanmasın.
- **Nasıl fixlendi:** `rememberEmail.label` TR ve EN'de **"Remember me"** — bilinçli olarak çevrilmedi. Yanına küçük bir yardım metni eklendi: *"Sadece e-posta adresiniz bu tarayıcıda hatırlanır — parolanız hiçbir zaman saklanmaz."* (EN karşılığıyla). Bu metin çevriliyor; asıl etiket çevrilmiyor. Checkbox'a `:focus-visible` halkası ve 24px dokunma hedefi de eklendi.
- **Test edildi mi:** Evet — login ekranında etiket "Remember me", altında "Sadece e-posta adresiniz bu tarayıcıda hatırlanır — parolanız hiçbir zaman saklanmaz." göründü.
- **Yorumlarım:**

### 5.9
> content management sayfası tab li haliyle kalsın bence. her user burayı görebilsin ama hiçbir user content management sidebardan gidip burada bir edit vs yapamasın sadece temiz bir rapor sayfası olsun burası listelesin ne collectionumuz var ve onun altında ne değerlerimiz var şeklimde tüm collectionların özet sayfası olsun anladın mı olmayan gereken tableri ekleyeliöm yani buraya.

- **Durum:** Tamamlandı
- **DoD:** Sekmeli yapı kalsın; her rol görebilsin; hiçbir rol buradan düzenleme/silme/oluşturma yapamasın; sayfa tüm koleksiyonların özetini versin; eksik koleksiyonlar eklensin; erişim kontrolü gerçek olsun.
- **Nasıl fixlendi:**
  - **Tüm aksiyonlar kaldırıldı** — "Yeni Ekle", "Düzenle", "Sil", "Seçilenleri Sil" yok. Satırlar Payload'ın kendi doküman görünümüne link veriyor; düzenleme orada, kendi yetki kontrolüyle yapılıyor. (Yan fayda: silme yapılabilen ikinci bir yüzey ortadan kalktı — bkz. 5.1.)
  - **Üstte tüm koleksiyonların özet tablosu:** 22 koleksiyonun tamamı için kayıt sayısı, yayında/taslak dağılımı, son güncellenme ve koleksiyona link.
  - **Altta detay sekmeleri:** 7 yerine **20** koleksiyon. Her koleksiyonun sütunları kendine özel (tek bir "başlık/durum/güncellendi" şablonu 20 farklı şemaya zorlanmadı) — örn. Kampanyalar'da kategori/inceleme/öne çıkan/bitiş, Temsilciler'de il/ilçe/temsilci kodu, Medya'da tür/alt metin/yükleyen.
  - **Sekmesi olmayan 2 koleksiyon ve gerekçeleri:** `audit-logs` — kendi ekranı, kendi CSV export'u ve kendi rol bazlı okuma kapsamı olan append-only güvenlik kaydı; satır satır kopyalamak o ekranı tekrar eder ve raporlaması gereken içeriği gömerdi. `translations` — panelin kendi arayüz metinleri (`key`/`tr`/`en`); site içeriği değil, altyapı. **İkisinin de sayıları özet tablosunda var.**
  - **Erişim kontrolü yeniden yazılmadı:** her istek tarayıcının oturum çerezini taşıyan düz bir REST çağrısı, `overrideAccess` hiç kullanılmıyor. Bir rolün okuyamadığı koleksiyon **kayıt sayısı bile göstermiyor** — "Bu koleksiyonu görüntüleme yetkiniz yok" diyor (bu yüzden sayaç `number` değil `number | null`).
  - Sayfadaki tüm inline style'lar `custom.css`'e taşındı; tablolar `.table-wrap` içinde (dar ekranda yatay kaydırma), sekmeler 44px dokunma hedefi ve focus halkası taşıyor.
- **Test edildi mi:** Evet — **iki rolle:** NV Maker'da 22 koleksiyonun tamamı özet tabloda, 20 detay sekmesi, hiçbir ekle/düzenle/sil butonu yok. Growth Maker'da sayfa açılıyor ama Kullanıcılar ve Denetim Kayıtları satırları **sayı bile göstermeden** "Bu koleksiyonu görüntüleme yetkiniz yok" diyor — erişim kontrolü gerçek. Dar viewport'ta yatay taşma yok, tablolar `.table-wrap` içinde kaydırılabiliyor, sekme dokunma hedefi 44px.
- **Yorumlarım:**

### 5.10
> One platform for all your need. daha iyi sanki.
>
> Manage campaigns, pages, and every piece of site content from a single panel. Approval workflows, roles, and audit trails built in — no migration, no lock-in.
>
> burada da vodafonepaycomtr websiteniz altındaki .... leri daha kolay yönetin! gibi bir yazı olabilir. kreatif ol.

- **Durum:** Tamamlandı
- **DoD:** EN başlık "One platform for all your need." yönünde olsun; alt metin somut olsun ve vodafonepay.com.tr'yi adıyla ansın; TR ve EN birbirinin motamot çevirisi olmasın.
- **Nasıl fixlendi:** `translationDefaults.ts` → `loginBrandPanel.headline` / `subheadline`:
  - **EN başlık:** "One platform for all your need." (senin verdiğin cümle birebir)
  - **TR başlık:** "Sitenizin tek kumanda merkezi." — İngilizcenin motamot çevirisi değil; Türkçede kendi başına duran, aynı şeyi söyleyen bir cümle.
  - **TR alt metin:** "vodafonepay.com.tr'deki kampanyaları, sayfaları, duyuruları ve SSS'leri tek yerden yönetin. Onay akışı, roller ve denetim kaydı kutudan çıkar — ne göç, ne bağımlılık."
  - **EN alt metin:** "Run every campaign, page, announcement and FAQ on vodafonepay.com.tr from one place. Approval workflows, roles and audit trails come built in — no migration, no lock-in."
- **Test edildi mi:** Evet — login ekranında yeni başlık ve alt metin göründü. **Bu sırada gerçek bir bug bulundu:** `translationDefaults.ts`'i değiştirmek, satır bir kez seed edildikten sonra hiçbir işe yaramıyordu (kod bir şey söylüyor, ekran eskisini gösteriyordu). Seeder düzeltildi — bkz. tur raporu §5b.1.
- **Yorumlarım:**

### 5.11
> ekstra olarak campaigns sayfasında da türkçe karakterleri destekleyecek şekilde ne değerlerimiz varsa tüm sütunlarla birlikte csv alabilmeliyiz exportu ekleyelim.

- **Durum:** Tamamlandı
- **DoD:** Campaigns listesinde CSV export butonu olsun; tüm anlamlı sütunlar çıksın; Türkçe karakterler Excel'de bozulmasın; ekrandaki filtre/arama/sıralama export'a taşınsın; ilişkiler ham ID değil okunabilir değer olsun.
- **Nasıl fixlendi:** `CampaignsExportButton` — mevcut `lib/csv.ts` altyapısıyla (UTF-8 BOM + `;` ayraç). **20 sütun:** başlık, URL adı, açıklama, kategori, yayın durumu, inceleme durumu, kampanya durumu, öne çıkan, başlangıç, bitiş, buton yazısı, buton linki, SEO başlığı, SEO açıklaması, red sebebi, oluşturan, oluşturulma, güncellenme, gövde metni, katılım koşulları.
  - `depth: 1` ile çekiliyor — kategori ve oluşturan kullanıcı ham ID değil, etiket/e-posta olarak çıkıyor.
  - Tarihler `tr-TR`, boolean'lar "Evet/Hayır", durum alanları insan-okunur etiketler; başlıklar ve değerler panelin diline göre TR/EN.
  - **Richtext kararı:** `body` ve `terms` **dahil**, düz metne indirgenmiş halde — "ne değerlerimiz varsa" denince editörün beklediği şey kampanyanın asıl metnidir. Son iki sütuna konuldu ki taranabilir meta veri kaydırmadan görünsün; satır sonları boşluğa çevriliyor (bazı Excel sürümlerinde hücre içi satır sonu bozuk çok satırlı kayıt gibi görünüyor).
  - **Yan iyileştirme:** üç export butonu (Users, Audit Logs, Campaigns) neredeyse aynı fetch/serialize/indir/toast dizisini kopyalamıştı; ortak bir `CsvExportButton`'a çıkarıldı, her buton artık sadece kendi sütunlarını tanımlıyor. `AuditLogsExportButton`'ın hardcoded Türkçe aksiyon etiketleri de bu vesileyle TR/EN oldu ve eksik `unlock` etiketi eklendi.
- **Test edildi mi:** Kısmen — buton Campaigns listesinde canlı doğrulandı; üretilen CSV'nin içeriği bu oturumda tarayıcıdan indirilip açılamadı (indirme sandbox'ta engelli). Sütun/biçim mantığı kodda ve `lib/csv.ts` testleriyle sabit.
- **Yorumlarım:**

### 5.12 — (kapsam maddesi) Fallback maskeleme denetimi + admin arayüz denetimi
> (Bu madde senin listende ayrı bir satır değil — önceki turdan devreden ve bu turda kapatılan iki açık kalem.)

- **Durum:** Kısmen tamamlandı (aşağıda ne kaldığı ve neden kaldığı yazılı)
- **DoD:** CMS erişilemediğinde sahte içerik gösteren her yer dürüst bir boş duruma çevrilsin; gerçekten "henüz içerik girilmedi" olanlar gerekçesiyle bırakılsın.
- **Nasıl fixlendi:** Ayrımı tahminle değil **veriyle** yaptım — her fallback'in arkasındaki koleksiyonun canlı DB'de kaç satırı olduğuna baktım:
  - **Kaldırılanlar (koleksiyon dolu → fallback zaten ölü kod, sadece CMS çökünce devreye giriyordu):** `Faq` bileşeninin gömülü 4 soruluk varsayılanı, anasayfanın adım/öne çıkan/kampanya/SSS listeleri, 4 ürün sayfasının SSS dizileri, duyurular, SSS kategori filtresi, `/kampanyalar` SSS'i.
  - **Bilinçli bırakılanlar (koleksiyonda SIFIR satır → fallback'in kendisi canlı içerik):** feature-cards, step-cards, fee-rows, limit-tables, cookie-rows, product-heroes, nav-links (header/footer/site haritası), hukuki doküman listeleri, iletişim/kurumsal yönetim bilgileri, `faturana-yansit` SSS'i. Bunları silmek maskelenmiş bir hatayı ortaya çıkarmaz, **çalışan bir bölümü boşaltırdı**. Her birinin dosyasına neden bırakıldığı ve ne zaman kaldırılacağı yazıldı; tam liste tur raporunda.
  - **Admin arayüz denetimi:** bu turda eklenen/değişen her ekran için focus halkası, klavye erişimi, 44px dokunma hedefi ve dar ekranda yatay kaydırma (`.table-wrap`) baştan uygulandı.
- **Test edildi mi:** Kısmen — bkz. tur raporu §Açık kalan riskler.
- **Yorumlarım:**

## Bölüm 6 — Kategori & SSS turu (17.08.2026)

### 6.1
> sss deki kategoriler de sanki hardcoded gibi duruyor. [...] kategori sayfasına geldiğinde sss için kategori oluşturmalı elle [...] kampanyalar için kategori oluşturma da tamamen aynı çalışmalı [...] kampanya bağlarken de ilgili kampanyanın category'si sadece kampanya kategorilerine bağlanabilmeli, sss ise sadece sss kategorilerine.

- **Durum:** Tamamlandı
- **DoD:** Kategoriler tek koleksiyon olarak kalsın (hardcoded liste yok), ama her kategori hangi akışa (Kampanya/Blog ya da SSS) ait olduğunu taşısın; kampanya kategori seçicisi sadece kampanya kategorilerini, SSS'inki sadece SSS kategorilerini göstersin/kabul etsin — sunucu tarafında da zorlansın.
- **Nasıl fixlendi:** `Categories.ts`'e `scope` alanı (`campaign` | `faq`, zorunlu) eklendi. `Campaigns.ts`/`BlogPosts.ts`/`FaqItems.ts`'in `category` ilişki alanlarına `filterOptions` ile scope kısıtı kondu — bu sadece admin arayüzünde gizleme değil, API'ye yanlış scope'ta bir id gönderilirse 400 ile reddediliyor (canlı test edildi). Slug benzersizliği de akış bazlı yapıldı (`indexes: [{fields:["scope","slug"], unique:true}]` + `generateSlug` scope'a göre sayıyor) — aynı isim ("Anında Bakiye") iki akışta da temiz slug'la var olabiliyor.
- **Test edildi mi:** Evet, canlı — SSS'e kampanya kategorisi bağlamayı denedim → 400; kampanyaya SSS kategorisi bağlamayı denedim → 400; iki akışta aynı isimle kategori oluşturdum, ikisi de soneksiz slug aldı. `cms/src/collections/__tests__/categories.test.ts` (4 test) + `cms/src/access/__tests__/roles.test.ts` güncellemesi.
- **Yorumlarım:**

### 6.2 — (canlı bug, kullanıcının promptundan) Site tarafı scope filtrelemiyordu
> `getFaqItems` ve `getCategories` hiç scope filtrelemiyor — yani `/kampanyalar` filtre sekmelerinde SSS kategorileri de görünüyor olmalı.

- **Durum:** Tamamlandı
- **DoD:** `getCategories`/`getFaqItems` scope-farkında olsun; her `getFaqItems("<slug>")` çağıran sayfanın SSS bloğu doğru kategoriyi çeksin; kampanya/blog sekmelerinde SSS kategorisi görünmesin.
- **Nasıl fixlendi:** Kullanıcının kod incelemesiyle bulduğu bug canlı olarak yeniden üretildi: `/kampanyalar` sekmelerinde `Anasayfa` (salt SSS kategorisi) ve tekrarlanan `Anında Bakiye` görünüyordu. `getCategories(scope)` artık zorunlu parametre alıyor ve `where[scope][equals]` gönderiyor; `getFaqItems` her zaman `where[category.scope][equals]=faq` ekliyor (slug filtresi olsun olmasın). 3 çağıran sayfa (`/kampanyalar`, `/blog`, `/sikca-sorulan-sorular`) güncellendi.
- **Test edildi mi:** Evet, canlı — düzeltme öncesi/sonrası ekran görüntüsü karşılaştırıldı, sekmelerden yabancı/tekrarlanan kategori kalktı.
- **Yorumlarım:**

### 6.3
> boş kategoriler SSS sayfasında sekme üretmiyor [...] her kategori sekme olsun, altında henüz soru olmasa bile [...] boş sekmeye tıklandığında ne görüneceğine karar ver

- **Durum:** Tamamlandı
- **DoD:** `faq` scope'undaki her kategori bir sekme olsun (soru sayısına bakılmaksızın); boş sekmeye tıklanınca anlamlı bir boş durum mesajı görünsün, sessiz boşluk olmasın.
- **Nasıl fixlendi:** `sikca-sorulan-sorular/page.tsx`'teki `usedSlugs` filtresi kaldırıldı — artık `getCategories("faq")`'ın döndürdüğü her kategori sekme. `FaqCategoryFilter.tsx`'e "Bu kategoride henüz soru yok." boş durumu eklendi (sadece belirli bir kategori seçiliyken, "Tümü"de değil).
- **Test edildi mi:** Evet, canlı — "Boş Test Kategorisi" adında geçici bir kategori oluşturup sekmenin çıktığını, tıklanınca boş durum mesajının göründüğünü doğruladım, sonra kategoriyi sildim.
- **Yorumlarım:**

### 6.4
> anasayfada gözüken sıkça sorulan sorular var [...] anasayfa kategorisine bağlı olanlar mı sadece anasayfada olabiliyor? [...] bence olmamalı, kişiye bağlı olmalı

- **Durum:** Tamamlandı (kısmi katılım — aşağıda gerekçesi var)
- **DoD:** Anasayfadaki SSS bloğunun hangi sorulardan oluşacağı kategoriden bağımsız, ayrı bir sinyal olsun; bir soru hem kendi kategorisinde hem anasayfada görünebilsin.
- **Nasıl fixlendi:** Önce gerçek siteyi (vodafonepay.com.tr anasayfa + /aninda-bakiye) canlı inceledim: her ürün sayfası kendi kategorisiyle sınırlı bir SSS bloğu gösteriyor — bu bir kısıtlama değil, gerçek sitenin kendi mimarisi, "kişiye bağlı olmalı" varsayımı bu noktada doğru değildi (bunu ayrı bir mesajda anlattım). Asıl haklı olduğun nokta ayrı: kategori ile "anasayfada göster" AYNI sinyal olmamalı. `FaqItems`'a bağımsız `showOnHomepage` (checkbox) + `homepageOrder` (sayı, sadece işaretliyken görünür) eklendi. Anasayfa artık `getFaqItems("anasayfa")` değil `getHomepageFaqItems()` (`where[showOnHomepage]=true`) çekiyor. "Anasayfa" kategorisi olduğu gibi kaldı (SSS sayfasında kendi sekmesi), mevcut tek sorusuna (id 31) `showOnHomepage:true` atandı — iki mekanizma bilinçli olarak paralel: biri "bu soru neyle ilgili", diğeri "ayrıca anasayfada da göster".
- **Test edildi mi:** Evet, canlı — id 31 hem `/` anasayfada hem `/sikca-sorulan-sorular`'ın "Anasayfa" sekmesinde göründü (aynı anda, iki mekanizma çakışmadan).
- **Yorumlarım:**

### 6.5
> "Tümü" sekmesi hardcoded ve sıralanamıyor [...] kullanıcı bunun CMS'ten yeniden adlandırılabilir olmasını, ama her zaman ilk sırada çakılı kalmasını ve silinememesini istiyor

- **Durum:** Tamamlandı
- **DoD:** "Tümü" etiketi CMS'ten değiştirilebilsin; yanlışlıkla silinemesin/sürüklenip yerinden oynatılamasın; üç sayfa (Kampanyalar/Blog/SSS) aynı ortak ismi kullansın.
- **Nasıl fixlendi:** İki seçenek arasında Translations anahtarını seçtim (Category kaydı değil): `filterTabs.all` — `translations` koleksiyonunda bir satır, `src/lib/cms.ts`'teki yeni `getTranslation(key, fallback)` ile okunuyor, DB'de yoksa/CMS erişilemezse "Tümü"ye düşüyor (admin panelin kendi `useDbStrings` desenindeki aynı DB-override-with-fallback mantığı). Bir Category kaydı olmadığı için `blockDeleteIfReferenced`/reorder'da özel durum kodu gerekmedi — zaten silinemez/sürüklenemez, çünkü kategori listesinin bir parçası değil. `FilterTabs.tsx` artık `allLabel` prop'u alıyor, 3 sayfa da `getTranslation("filterTabs.all", "Tümü")`'yü paralel çekip geçiriyor. `Translations.ts`'e `revalidateTag("translations")` eklendi (siteye habersiz kalmasın diye) ve site'nin `/api/revalidate` allowlist'ine `"translations"` eklendi.
- **Test edildi mi:** Kod ve testlerle (`getTranslation` — DB değeri / fallback). Admin panelden gerçek bir "Tümü" satırı oluşturup canlı yeniden adlandırma denemedi — bu bir sonraki adım olarak öneriliyor (bkz. tur raporu, açık işler).
- **Yorumlarım:**

### 6.6
> sürükleyerek sırala bölümü de hangi dropdown seçilirse onun için açılması lazım [...] (önceki mesajda) istediğin onay adımı zaten yok [...] birden fazla öğe arka arkaya sürüklenirse her seferinde onay sormak yorucu olur

- **Durum:** Tamamlandı
- **DoD:** Sürükleme anında kaydetmesin; onay adımı olsun; ardışık birden çok sürüklemede her seferinde ayrı onay istemesin; kısmi PATCH hatası sessiz kalmasın.
- **Nasıl fixlendi:** `ReorderWidget.tsx` — drop artık sadece yerel state'i günceller, hiçbir PATCH gitmez. Değişiklik olduğunda ("dirty") **Kaydet / Vazgeç** butonları çıkar; istediği kadar sürükleyip tek "Kaydet"le gönderebilir (biriktir + tek onay, ayrı ayrı onay değil — kullanıcının ikinci mesajında onayladığı seçenek). "Vazgeç" listeyi son kaydedilmiş haline döndürür. `Promise.all` artık her PATCH'in `.ok`'una bakıyor; herhangi biri başarısız olursa kullanıcıya açık hata mesajı gösterip listeyi sunucudaki gerçek durumla yeniden senkronluyor (kısmi başarıyı sessizce "başarılı" gibi göstermek yerine). Kategoriler gibi birden çok grup varsa (dropdown), kaydedilmemiş değişiklik varken grup değiştirmek engelleniyor — aksi halde sürüklenen değişiklik sessizce kaybolurdu.
  - **Draft/publish sorusu ayrıca test edildi** (kullanıcının "taslağa yazıyor olabilir" endişesi): çıplak PATCH (`?draft=true` yok) yayındaki kaydı **doğrudan** güncelliyor ve yayında yeni bir versiyon satırı oluşturuyor — taslakta takılı kalmıyor. Yani sürükle-bırak zaten canlıya anında yansıyordu, eksik olan sadece onay adımıydı.
- **Test edildi mi:** Kod ve API seviyesinde (çıplak PATCH'in yayına yazdığı canlı doğrulandı). Tarayıcıdan gerçek sürükle-bırak (HTML5 drag events) bu oturumda otomatik test edilemedi — tarayıcı aracı native drag simülasyonunu güvenilir desteklemiyor. Elle denenmesi öneriliyor.
- **Yorumlarım:**

## Bölüm 7 — Sıra geri bildirimi + Rich Text turu (17.08.2026)

### 7.1 — Sıra alanı: canlı sayaç ve öneri
> aslında anasayfa sırası anasayfada kaç tane var mesela 2 tamam mı aktif kaç tane sss var onu da göstermeli aynı şekilde mesela anında bakiye seçtim ya dropdowndan kategoriden sıra kısmı güncellenmeli [...] kullanıcı isterse 1000 girer yine ama 0 -1 -2 vs girememesini sağlamalıyız

- **Durum:** Tamamlandı
- **DoD:** Kategori (veya "Anasayfada Göster") seçildiği an, editör o gruptaki mevcut kayıt sayısını ve önerilen bir sonraki sırayı görsün; 0/negatif değer hem formda hem ham API isteğinde reddedilsin; editörün kendi yazdığı bir değer otomatik ezilmesin.
- **Nasıl fixlendi:** 0/negatif engeli aslında zaten vardı — `order`/`homepageOrder` alanlarındaki `min: 1` sunucu tarafında da uygulanıyor, ham `PATCH {"order":-1}` isteğiyle canlı doğrulandı (400 döndü). Eksik olan sadece canlı geri bildirimdi. Yeni `LiveOrderField.tsx` bileşeni — Payload'ın kendi `NumberField`'ını sarıp altına "Bu grupta N kayıt var — önerilen sıra: M" satırı ve tıklanınca değeri dolduran bir "M kullan" butonu ekliyor. Değeri **otomatik doldurmuyor** — bilinçli tercih: `order`'ın kendi yorum satırında anlatılan `defaultValue` tuzağına (hook'un "editör elle yazmış" kontrolünü kandırma) düşmemek için, doldurma sadece editörün açık tıklamasıyla oluyor. `FaqItems.ts`'te hem `order` (grup: `category`) hem `homepageOrder`'a (grup: `showOnHomepage`) bağlandı.
  - **Canlıda bulunan ayrı bir bug:** Bileşen ilk deploy'da hiç görünmedi — sebebi `payload generate:importmap` komutunun bu ortamda kırık olması (`ERR_REQUIRE_ASYNC_MODULE`, R-10 ile aynı tsx/ESM sınıfı hata, artık `@payloadcms/richtext-lexical`'ı doğrudan import eden `payload.config.ts` üzerinden de tetikleniyor). Yeni bir custom component eklendiğinde `src/app/(payload)/admin/importMap.js`'e elle eklenmesi gerekiyor — dosyanın başına bunu açıklayan bir not eklendi.
- **Test edildi mi:** Evet, canlı — yeni bir SSS oluşturup "Anında Bakiye" seçtim, "Bu grupta 2 kayıt var — önerilen sıra: 3" ve "3 kullan" butonu çıktı, tıklayınca alan "3" oldu ve buton kayboldu (öneri ile eşleştiği için).
- **Yorumlarım:**

### 7.2 — Admin listesi: en son oluşturulana göre sırala (5.5 ile çakışma)
> db de hangi sss'i ne zaman create etmişsek create date tutalım ve sık sorulan sorular kısmındaki liste en son create edilene göre orderlansın

- **Durum:** Tamamlandı — **5.5'i (RFP geri bildirimi) kısmen geçersiz kılıyor, SİTEYİ etkilemiyor**
- **DoD:** Yeni oluşturulan bir SSS, admin listesinde uzun bir `order` dizisinin ortasına gömülmeden, en üstte kolayca bulunabilsin. Sitenin kendi görünür sırası (ziyaretçiye giden) bundan etkilenmesin.
- **Nasıl fixlendi:** `FaqItems.ts`'in `defaultSort` değeri `"order"` → `"-createdAt"` oldu — bu **sadece admin liste görünümü**. `getFaqItems()` (`src/lib/cms.ts`) hâlâ `sort: "order"` kullanıyor, yani `/sikca-sorulan-sorular` sayfasındaki gerçek soru sırası hiç değişmedi. Bu, 5.5'in "Liste `order`'a göre sıralansın" kararını admin tarafında güncelliyor — 5.5 sitenin kendi sırasını `order`'a bağlamıştı ve o karar hâlâ doğru; sadece admin ekranındaki "hangi kaydı düzenliyorum" sorusu için `order` yanlış araç olduğu ortaya çıktı.
- **Test edildi mi:** Evet, canlı — yeni oluşturulan test kaydı admin listesinde en üstte çıktı (createdAt'e göre).
- **Yorumlarım:**

### 7.3 — Sürükle-bırak: sunucudan dinamik kategori/sayı çekme
> sürükle bırak kısmı olması lazım kullanıcı seçtiği anda db den o tipteki sss leri getirmesi lazım [...] her kategori özelinde kaç sss varsa dropdowndan seçilebilir

- **Durum:** Tamamlandı
- **DoD:** Dropdown, önceden istemci tarafında gruplanmış (limit 200 çekilip client'ta filtrelenmiş) bir liste değil, sunucudaki gerçek kategori listesinden (sayaçlarıyla) gelsin; 0 veya 1 kayıtlı kategoriler de seçilebilir olsun.
- **Nasıl fixlendi:** `ReorderWidget.tsx`'e yeni bir `groupsFrom` prop'u ve `ServerGroupedReorder` bileşeni eklendi — dropdown artık `/api/categories?where[scope][equals]=faq` sorgusundan (her kategori için ayrı bir sayım isteğiyle) doluyor; bir kategori seçildiğinde o kategorinin kayıtları `/api/faq-items?where[category][equals]=<id>` ile ayrıca çekiliyor (500 kayıt limitine kadar, üzeri kesilirse uyarı gösteriliyor). Eski davranış (tüm 200 kaydı çekip client'ta grupla) `groupsFrom` verilmeyen koleksiyonlarda hâlâ çalışıyor — geriye dönük uyumlu.
- **Test edildi mi:** Evet, canlı — dropdown'da "Anında Bakiye (2)" gibi sayaçlı etiketler görüldü, kategori değiştirilince network isteğinin sadece o kategoriye ait kayıtları çektiği doğrulandı.
- **Yorumlarım:**

### 7.4 — Kategori silme koruması (yeniden doğrulama)
> bir kategori silinecekken o kategoriye bağlı sss varsa o kategori silinememeli

- **Durum:** Tamamlandı — **zaten çalışıyordu, kod değişikliği gerekmedi**
- **DoD:** Referans verilen bir kategori silinmeye çalışılınca engellensin, editöre hangi kayıtların engellediği açıkça gösterilsin.
- **Nasıl fixlendi:** Bu madde aslında 6.1'de eklenen `blockDeleteIfReferenced` hook'unun (referentialIntegrity.ts) canlı yeniden-doğrulamasıydı. İlk denemede toast mesajı görünmüyormuş gibi geldi — araştırınca sebep sonner toast'ının otomatik kapanma süresiyle ardışık/yavaş tool round-trip'leri arasındaki gecikme olduğu anlaşıldı (gerçek bug değil). Silme akışı TEK bir senkron çalıştırmada (menü → Sil → Onayla, aralarda kısa bekleme) yeniden denendiğinde: `DELETE` isteği 409 Conflict döndü, network log'unda tam engelleyici kayıt listesi görüldü, ve toast DOM'da (`data-visible="true"`) mesajla birlikte gerçekten mevcuttu.
- **Test edildi mi:** Evet, canlı — bağlı SSS'i olan bir kategoriyi silmeye çalıştım, 409 + toast'ta engelleyen kaydın adı görüldü.
- **Yorumlarım:**

### 7.5 — Blog'un kendi bağımsız kategori listesi
> blog sayfası için de kategoriler kısmında blog sayfasında yönetilebilir olması için kategori eklenmesi lazım

- **Durum:** Tamamlandı
- **DoD:** Blog, Kampanyalar'ın kategori listesini paylaşmasın — kendi bağımsız listesine sahip olsun; kategori oluşturma/silme akışı diğer akışlarla aynı desende kalsın.
- **Nasıl fixlendi:** `CATEGORY_SCOPES`'a üçüncü değer `BLOG: "blog"` eklendi (Postgres enum'a `ALTER TYPE ... ADD VALUE`, aşağıdaki SQL). `BlogPosts.category`'nin `filterOptions`'ı `CAMPAIGN`'dan `BLOG`'a çevrildi; `blog_posts` tablosunun bu değişiklik öncesi 0 satır olduğu doğrulandı, göç edilecek veri yoktu. `/blog` sayfası artık `getCategories("blog")` çağırıyor (önceden `"campaign"`).
- **Test edildi mi:** Evet, canlı — "Blog" akışıyla yeni bir kategori oluşturdum, sadece `/blog` sekmelerinde çıktı, `/kampanyalar` sekmelerinde çıkmadı.
- **Yorumlarım:**

### 7.6 — Rich text editörü: gerçek düzenleme özellikleri + renkli vurgu
> aslında tek bir yerde çözüp hepsine uygulayabiliriz [...] renderer olarak richtext-lexical'ın kendi RichText bileşenini kullanalım [...] sabit "Vurgu" stili — tek renk (Vodafone kırmızısı)

- **Durum:** Tamamlandı
- **DoD:** `lexicalEditor()` gerçek bir özellik setiyle yapılandırılsın (başlıklar, listeler, link, tablo, görsel, sabit vurgu rengi); site tarafında bu üç kullanım (BlogPosts.body, Campaigns.body/terms, Pages'in `richText` bloğu) TEK bir renderer'dan geçsin; canlı vodafonepay.com.tr'nin tipografisiyle (başlık boyutu/ağırlığı, tablo hücre kenarlığı) eşleşsin.
- **Nasıl fixlendi (onaylanan iki karar):**
  1. **Renderer:** `@payloadcms/richtext-lexical`'ın kendi React `RichText` bileşeni + `JSXConvertersFunction` (kendi converter'ı yazmak yerine). Paket sadece `/react` alt-yoluyla import edildi — bu alt-yolun import grafiği (17 dosya) `payload`/`@payloadcms/ui`/`monaco-editor`/`undici` gibi ağır admin bağımlılıklarını **hiç** çekmiyor (doğrulandı), o yüzden site bundle'ı şişmiyor; ama `npm install` seviyesinde bu paketler yine de kilit dosyasına giriyor (bkz. 7.8, Trivy).
  2. **Renkli vurgu:** `TextStateFeature` (paketin resmi, "deneysel" işaretli ama kararlı API'si) ile tek bir sabit değer: `color.vurgu` → `#e60000` (sitenin kendi `--color-vf-red` değişkeniyle birebir aynı). Serbest renk seçici DEĞİL — editör sadece "Vurgu" işaretleyebiliyor, rastgele renk giremiyor.
  - Editör tarafı: `HeadingFeature` (h2-h4), Bold/Italic/Underline/Strikethrough, sıralı/sırasız liste, `LinkFeature` (**internal doc linking kapalı** — sitenin slug→URL çözücüsü yok, editör sadece özel URL girebiliyor), `BlockquoteFeature`, `HorizontalRuleFeature`, `UploadFeature` (Media'dan görsel), `EXPERIMENTAL_TableFeature` (paketin kendi adlandırması — tek tablo implementasyonu bu, risk olarak not edildi), `FixedToolbarFeature` + `InlineToolbarFeature`.
  - Site tarafı: yeni `src/components/RichText.tsx` — `text` converter'ı override edip Lexical'ın node-state anahtarını (`"$"`.`color`) okuyup `vurgu` ise kırmızı `<span>`'a sarıyor; `heading`/`paragraph`/`link`/`list`/`quote` converter'ları canlı sitenin ölçülen tipografisiyle (h2: 20px/400 ağırlık/#333, tablo hücre kenarlığı 1px #d9d9d9) eşleşecek Tailwind sınıflarıyla override edildi; tablo `.lexical-table-container` sarmalayıcısına `overflow-x:auto` (globals.css) eklendi, dar ekranda sayfa genişlemek yerine tablo kendi içinde kayıyor.
  - Eski `richTextToParagraphs()` (düz metne indirgeyen fonksiyon) silindi, üç kullanım noktası (`kampanyalar/[slug]`, `blog/[slug]`, `[...slug]`'ın richText bloğu) `<RichText data={...} />`'a geçti.
- **Test edildi mi:** Evet, canlı — 5988 karakterlik bozuk bir test kaydının içeriği gerçek başlık/liste yapısına dönüştürülüp `body`'ye yazıldı (biri kasıtlı "Vurgu" ile), `/blog/ulasim-karti-bakiye-yukleme-yollari-vodafone-pay` sayfasında başlıklar, madde listesi ve kırmızı (`rgb(230,0,0)`) vurgulu başlık doğru render edildi. Ayrıca `src/components/__tests__/RichText.test.tsx` (7 test): boş içerik, paragraf, başlık etiketi, Vurgu renk uygulaması, düz metnin renksiz kalması.
- **Yorumlarım:**

### 7.7 — Blog slug otomatik oluşsun
> bence slug otomatik oluşmalı [...] kampanyada oluşturduğumuz gibi blogda da yapalım

- **Durum:** Tamamlandı
- **DoD:** Editör slug'ı elle yazmasın; başlıktan otomatik ve URL-güvenli türetilsin; çakışma olursa numaralı son ek eklensin.
- **Nasıl fixlendi:** (Not: Campaigns'in slug'ı aslında hâlâ elle yazılıyor — otomatik türetme örneği Categories'in `generateSlug` hook'uydu, isteği o desene göre uyguladım.) `BlogPosts.ts`'e Categories ile aynı desende bir `generateSlug` (`beforeValidate`) hook'u eklendi: sadece `create`'te, `title`'dan `turkishSlugify` + `uniqueSlug` (mevcut `lib/slugify.ts` paylaşılan yardımcıları) ile türetiliyor; `update`'te asla yeniden türetilmiyor (yayındaki bir yazının URL'i başlık düzeltmesiyle kaymasın diye). Alan `admin.readOnly: true` yapıldı — editör görebiliyor ama elle değiştiremiyor.
- **Test edildi mi:** Evet, canlı — "Sanal Kart ile Hızlı Alışveriş Rehberi" başlığıyla taslak oluşturdum, slug otomatik `sanal-kart-ile-hizli-alisveris-rehberi` oldu; test kaydı sonra silindi.
- **Yorumlarım:**

### 7.8 — Blog kartı: aşırı uzun özet + eksik "Detayları gör"
> blog sayfası normalde ilgili sayfada blogun sadece biraz texti alınması lazımken full aşağıya doğru gidiyor [...] kampanyadaki gibi butonu isimlendirebileceğimiz ve içeri sluga yönlendirebileceğimiz bir detayları gör buttonu ile yönetmemiz lazım

- **Durum:** Tamamlandı
- **DoD:** Kart üzerindeki özet metni sınırlı satırda kesilsin; her kartta bir "Detayları gör" (veya özelleştirilebilir) CTA olsun.
- **Kök neden:** `CardListGrid.tsx`'in CTA butonu ve `linkLabel` özelleştirmesi zaten mevcuttu — asıl sorun gerçek bir test kaydının `excerpt` alanına (kart özeti, kısa olması gereken) **tüm makale metninin (5988 karakter)** yapıştırılmış olması, `body`'nin ise tamamen boş kalmasıydı. Kart bunun "yanlış" olduğunu bilemiyordu.
- **Nasıl fixlendi:** `excerpt` alanına `maxLength: 200` + daha net açıklama ("kart özeti, yazının kendisi değil — asıl içerik için 'İçerik' alanını kullanın") eklendi; bu artık böyle bir hatayı yapısal olarak imkânsız kılıyor. `CardListGrid.tsx`'teki açıklama paragrafına `line-clamp-3` eklendi (katman savunması — hem Blog hem Kampanya kartlarını etkiliyor). Kusurlu test kaydının verisi düzeltildi: 5988 karakterlik metin başlık/liste yapısına ayrıştırılıp `body`'ye taşındı, `excerpt` 167 karaktere indirildi.
- **Ayrıca sorulan "excerpt Notion gibi olsun mu" sorusu:** Kullanıcıya soruldu — `body` zaten (7.6 ile) tam bir rich text editörü (başlık/liste/Vurgu/tablo) olduğu için `excerpt`'in AYRICA rich text olması gerekmediği önerildi; kullanıcı bunu onayladı, `excerpt` düz kısa metin olarak kaldı.
- **Görsel oranı notu:** Kapak görseli zaten `CardListGrid`'de sabit 361×240 (yatay/dikdörtgen, ~3:2) kutuya `object-cover` ile kırpılıyor — kare görünüm kod tarafında değil, o spesifik test görselinin kendisinde kaynaklanıyordu. `coverImage` alanına bunu netleştiren bir açıklama eklendi ("361x240 yatay kırpılır — kare değil yatay fotoğraf tercih edin"), zorunlu bir oran kontrolü eklenmedi (editörü kısıtlamamak için).
- **Test edildi mi:** Evet, canlı — `/blog` listesinde kart artık 3 satırla kesiliyor, altında "Detayları gör" görünüyor, ekran taşması yok.
- **Yorumlarım:**

### 7.9 — Kategori seçici "hardcoded gibi" görünüyor (yanlış alarm)
> blog yazısı oluştururken kategori seçtiğimiz yer de hardcoded gibi geliyor. onu kontrol et.

- **Durum:** Tamamlandı — **gerçek bug değil, doğrulandı**
- **Nasıl doğrulandı:** Blog Yazısı → Oluştur formunda "Category" alanı gerçek bir ilişki (relationship) dropdown'u — "+" butonuyla yeni kategori oluşturma dahil, sadece `scope: blog` olan kategorileri listeliyor. Az sayıda seçenek (şu an 2: "Anında Bakiye", "Kart") görünmesi, listenin sabit/hardcoded olmasından değil, DB'de henüz sadece 2 tane Blog-scope kategori olmasından kaynaklanıyor — 7.5'te doğrulanan aynı mekanizma.
- **Yorumlarım:**

## İlerleme Özeti

| # | Madde (kısa başlık) | Durum |
|---|---|---|
| 1.1 | Growth Maker neden sadece Campaigns | Tartışılıyor (cevap verildi) |
| 1.2 | Slug alanı — isim/validasyon/açıklama | Tamamlandı |
| 1.3 | Category kim belirliyor | Tamamlandı (yeni Categories collection'ı) |
| 1.4 | Alan açıklamaları + zorunlu alan netleştirme | Tamamlandı (checkbox fikri tartışılıyor) |
| 1.5 | "Değişiklikleri yayınla" butonu Growth Maker'da neden var | Tamamlandı |
| 1.6 | Onaya giden kampanya tekrar düzenlenebilmeli | Tamamlandı (zaten çalışıyordu) |
| 1.7 | Yayın öncesi gerçek site önizlemesi | **Tamamlandı** — gerçek draft-mode preview kuruldu |
| 1.8 | Taslak silme yetkisi tartışması | Tamamlandı |
| 2.1 | Reorder widget yetkisiz rollerde de açık | Tamamlandı |
| 2.2 | "13 07 Testa" test kaydı | Tamamlandı (2.3'ün context'i) |
| 2.3 | Yayınlamadan görünen kampanya + eksik foto/link | **Tamamlandı** — site geneli görsel bug'ı bulundu ve düzeltildi |
| 2.4 | Growth Checker dashboard'u sade olmalı | Tamamlandı |
| 2.5 | Delete yok (Growth Checker) — doğrulama | Tamamlandı |
| 2.6 | Çoğalt / yerel hafızaya kopyala kaldırılsın mı | Tamamlandı — ikisi de kaldırıldı |
| 2.7 | Bulk action dropdown → buton | Tamamlandı |
| 2.8 | Zaten yayında uyarısı + yayın öncesi preview | Tamamlandı |
| 3.1 | Reorder yetkisi + review akışı | Tamamlandı (2.1 ile aynı fix) |
| 3.2 | Localization için DB tablosu | Tamamlandı |
| 3.3 | Remember me | Tamamlandı (kapsam daraltıldı — oturum 12 saate uzatıldı) |
| 3.4 | Forgot password kapatılsın, LDAP planı | Tamamlandı (LDAP entegrasyonunun kendisi hariç — plan yazıldı) |
| 3.5 | Profil sayfası sadeleştirme + foto + dil + login geçmişi | Tamamlandı (e-posta/parola self-servis hariç) |
| 3.6 | Dashboard: son girişler + içerik sayıları + user sayısı | Tamamlandı |
| 3.7 | Anasayfada IP/tarih/kullanıcı bilgisi | Tamamlandı (3.6 ile aynı fix) |
| 3.8 | Onay bekleyen akışlar listesi | Tamamlandı (Campaigns akışı için) |
| 3.9 | Sidebar logo + iconlar | Tamamlandı (logo — icon şimdilik atlandı) |
| 3.10 | Content Management tek sayfa (tab'lı) | Tamamlandı |
| 3.11 | Waiting approvals sayfası (onaylı/reddedilen/tümü sayaçları) | Tamamlandı |
| 3.12 | Login sayfası hero metni | Tamamlandı |
| 4.1 | Kampanya listesi en son oluşturulana göre sıralansın | Tamamlandı |
| 4.2 | Taslak kaydette zorunlu alan doğrulaması + "Onaya Gönder" etiketi | Tamamlandı |
| 4.3 | Yayınlama onayı modalındaki bozuk preview | Tamamlandı |
| 4.4 | Profil sayfası: avatar, alt zorunluluğu, email/role kilidi, parola/etkinleştir kaldırma, tek dil değiştirici | Tamamlandı |
| 4.5 | Users listesi export (CSV, TR karakter destekli) | Tamamlandı |
| 5.1 | Referans bütünlüğü: bağlı kayıt varken silme engellensin | Tamamlandı |
| 5.2 | Kampanya filtresi: kategori seçilince favoriler bloğu kalkmalı | Tamamlandı |
| 5.3 | Kampanya tarihi kartın altında görünsün | Tamamlandı |
| 5.4 | Yayındaki kampanya: önce yayından kaldır, createdAt korunsun | Tamamlandı |
| 5.5 | Liste `order`'a göre sıralansın, order 1'den başlasın | Tamamlandı |
| 5.6 | Hesap kilidi + NV Maker'a kilit kaldırma ekranı | Tamamlandı |
| 5.7 | Dil sadece profilden; içerik locale'i kapatıldı | Tamamlandı |
| 5.8 | "Remember me" etiketi + ne saklandığı açıklaması | Tamamlandı |
| 5.9 | Content Management salt-okunur rapor sayfası (22 koleksiyon) | Tamamlandı |
| 5.10 | Login ekranı başlık/alt metin | Tamamlandı |
| 5.11 | Campaigns CSV export (tüm sütunlar, TR karakter) | Tamamlandı |
| 5.12 | Fallback maskeleme + admin arayüz denetimi (devreden) | Kısmen tamamlandı |
| 6.1 | Kategori scope ayrımı: kampanya/blog vs SSS, ayrı listeler | Tamamlandı |
| 6.2 | Site tarafı scope sızıntısı (canlı bug) | Tamamlandı |
| 6.3 | SSS sayfası: tüm kategoriler sekme + boş durum mesajı | Tamamlandı |
| 6.4 | Anasayfa SSS: showOnHomepage bağımsız alanı | Tamamlandı |
| 6.5 | "Tümü" sekmesi Translations'tan yönetilebilir | Tamamlandı |
| 6.6 | Sürükle-bırak: biriktir + Kaydet/Vazgeç + .ok kontrolü | Tamamlandı |
| 7.1 | Sıra alanı: canlı sayaç + öneri (otomatik doldurmadan) | Tamamlandı |
| 7.2 | Admin SSS listesi: -createdAt sıralama (5.5'i admin'de günceller, site etkilenmez) | Tamamlandı |
| 7.3 | Sürükle-bırak: sunucudan dinamik kategori/sayı çekme | Tamamlandı |
| 7.4 | Kategori silme koruması (yeniden doğrulama) | Tamamlandı — zaten çalışıyordu |
| 7.5 | Blog'un kendi bağımsız kategori listesi (scope: blog) | Tamamlandı |
| 7.6 | Rich text editörü: gerçek özellikler + sabit "Vurgu" rengi + ortak renderer | Tamamlandı |
| 7.7 | Blog slug otomatik oluşturma (title'dan, Categories deseniyle) | Tamamlandı |
| 7.8 | Blog kartı: excerpt maxLength + line-clamp + CTA + kusurlu test verisi düzeltmesi | Tamamlandı |
| 7.9 | Kategori seçici "hardcoded gibi" görünüyor | Tamamlandı — yanlış alarm |
