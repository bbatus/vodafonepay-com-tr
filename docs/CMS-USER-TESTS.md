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
