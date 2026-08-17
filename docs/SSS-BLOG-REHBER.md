# SSS ve Blog — içerik girişi ve 4 rol test rehberi

Admin panel: **http://localhost:3010/admin**
Canlı site: **http://localhost:3000**

Şifreler [`docs/TEST-USERS.MD`](TEST-USERS.MD) içinde. Docker imajları en güncel
kodla çalışıyor. SSS ve Blog Yazıları koleksiyonları şu an **tamamen boş** —
içerik gerçek vodafonepay.com.tr'den elle kopyalanarak yeniden girilecek.

---

## 1) Gerçek siteden manuel içerik girişi

### 1a) Sıkça Sorulan Sorular

**Kategori artık hardcoded değil** — Kampanyalar/Blog'daki gibi gerçek,
düzenlenebilir bir **Kategoriler** koleksiyonuna bağlı. Bir kategoriyi
oluşturup en az bir soruya bağladığın an, `/sikca-sorulan-sorular` sayfasında
o kategorinin sekmesi ve ilgili ürün sayfasında (`/aninda-bakiye` vb.) o
kategorinin SSS bloğu **otomatik** çıkıyor — kod değişikliği gerekmiyor.

**Önce kategorileri oluştur** (Sol menü → **Kategoriler** → **Oluştur**).
Kategoriler artık **iki ayrı akışa** bölünmüş durumda — **Akış** alanından
mutlaka **"Sık Sorulan Sorular"**'ı seç (varsayılan "Kampanyalar ve Blog"
gelir, değiştirmezsen SSS'te bu kategoriyi seçemezsin). **İsim**'i gir, **URL
adı otomatik üretilir**. Aşağıdaki isimleri **aynen** yaz — otomatik üretilen
slug, gerçek sitenin `?kategori=` değeriyle böylece birebir eşleşiyor:

| CMS'te gireceğin İsim | Akış | Otomatik üretilecek slug | Gerçek site linki |
|---|---|---|---|
| Anasayfa | Sık Sorulan Sorular | `anasayfa` | https://www.vodafonepay.com.tr/sikca-sorulan-sorular?kategori=anasayfa |
| Anında Bakiye | Sık Sorulan Sorular | `aninda-bakiye` | https://www.vodafonepay.com.tr/sikca-sorulan-sorular?kategori=aninda-bakiye |
| Vodafone Pay Uygulama | Sık Sorulan Sorular | `vodafone-pay-uygulama` | https://www.vodafonepay.com.tr/sikca-sorulan-sorular?kategori=vodafone-pay-uygulama |
| Vodafone Pay Kart | Sık Sorulan Sorular | `vodafone-pay-kart` | https://www.vodafonepay.com.tr/sikca-sorulan-sorular?kategori=vodafone-pay-kart |
| QR ile Faturana Yansıt | Sık Sorulan Sorular | `qr-ile-faturana-yansit` | https://www.vodafonepay.com.tr/sikca-sorulan-sorular?kategori=qr-ile-faturana-yansit |
| Kampanyalar | Sık Sorulan Sorular | `kampanyalar` | https://www.vodafonepay.com.tr/sikca-sorulan-sorular?kategori=kampanyalar |
| Sözleşmeler ve Formlar | Sık Sorulan Sorular | `sozlesmeler-ve-formlar` | https://www.vodafonepay.com.tr/sikca-sorulan-sorular?kategori=sozlesmeler-ve-formlar |
| Gizlilik ve Güvenlik | Sık Sorulan Sorular | `gizlilik-ve-guvenlik` | https://www.vodafonepay.com.tr/sikca-sorulan-sorular?kategori=gizlilik-ve-guvenlik |
| Duyurular | Sık Sorulan Sorular | `duyurular` | https://www.vodafonepay.com.tr/sikca-sorulan-sorular?kategori=duyurular |

> **Kampanyalar/Blog'daki "Anında Bakiye" ve "Faturana Yansıt" kategorileri
> SSS'te seçilemez** — kategoriler artık akışa göre tamamen ayrı iki liste
> (Kampanya/Blog seçicisi sadece kendi listesini, SSS seçicisi sadece
> kendi listesini gösterir; sunucu da başka akıştan bir kategori
> gönderilirse reddeder). Yukarıdaki "Anında Bakiye" ve "Faturana Yansıt"
> satırları için SSS akışında **yeni, ayrı** birer kategori oluşturman
> gerekiyor — Kampanyalar'daki aynı isimli kategorilerle karışmıyor.
>
> **"Kart" ile "Vodafone Pay Kart" de ayrı** — SSS'in kart sayfası
> `vodafone-pay-kart` slug'ını arıyor, Kampanyalar'ın "Kart" kategorisi
> zaten farklı bir akışta olduğu için otomatik olarak seçilemiyor; tablodaki
> gibi SSS akışında "Vodafone Pay Kart" adıyla ayrı oluştur.

**Sonra her soru için CMS'te adım adım:**

1. Sol menü → **Sık Sorulanlar** → **Oluştur**
2. **Soru** alanına gerçek sitedeki soru başlığını aynen yapıştır (örn. "Vodafone Pay Nedir?")
3. **Cevap** alanına o sorunun altındaki açıklama metnini yapıştır
4. **Kategori** alanından yukarıda oluşturduğun kategoriyi seç (ilişki alanı — arama kutusu açılır)
5. **Sıra** alanını boş bırakabilirsin — otomatik en sona atanır (gerçek sitedeki sırayla eklersen ekstra iş çıkarmaz)
6. Sağ üstten **Kaydet**
7. **NV Maker** isen → kaydettikten sonra **Yayınla** butonuna basıp onay modalını geçebilirsin (bu rol direkt yayınlar). Diğer roller SSS'de yazma yetkisine sahip değil.

### 1b) Blog Yazıları

Blog listesi: https://www.vodafonepay.com.tr/blog

3 kategori sekmesi var (bizim CMS'teki Categories koleksiyonuyla birebir aynı):

| CMS'te seçeceğin kategori | Gerçek site linki |
|---|---|
| Anında Bakiye | https://www.vodafonepay.com.tr/blog?kategori=aninda-bakiye |
| Faturana Yansıt | https://www.vodafonepay.com.tr/blog?kategori=faturana-yansit |
| Kart | https://www.vodafonepay.com.tr/blog?kategori=kart |

Her kategori sekmesinde birkaç yazı listeleniyor; bir yazının kartına ya da
"Detayları gör" linkine tıklayınca `/blog/<slug>` adresine gidip tam metni
görebilirsin. Örnek yazı linkleri (liste her an değişebilir, sekmelere girip
o an ne varsa onu kullan):

- https://www.vodafonepay.com.tr/blog/ulasim-karti-bakiye-yukleme-yollari-vodafone-pay
- https://www.vodafonepay.com.tr/blog/on-odemeli-kart-nedir
- https://www.vodafonepay.com.tr/blog/kart-limiti-artirma-nasil-yapilir-vodafone-pay
- https://www.vodafonepay.com.tr/blog/online-alisverislerimi-faturama-nasil-yansitabilirim
- https://www.vodafonepay.com.tr/blog/dijital-mobil-cuzdan-nedir-nasil-kullanilir-vodafone-pay
- https://www.vodafonepay.com.tr/blog/vodafone-pay-kart-nedir-vodafone-pay

**CMS'te adım adım (her yazı için):**

1. Sol menü → **Blog Yazıları** → **Oluştur**
2. **Başlık (title)** — gerçek yazının başlığını aynen yapıştır
3. **URL Adı (slug)** — gerçek yazının URL'sindeki son parça (örn. `on-odemeli-kart-nedir`), tire ile küçük harf, boşluk/Türkçe karakter yok
4. **Kapak Görseli (coverImage)** — zorunlu alan. Gerçek sitedeki görseli indirip (sağ tık → "Resmi farklı kaydet") yükle, ya da kendi arşivindeki uygun bir görseli kullan
5. **Özet (excerpt)** — yazının girişindeki kısa özet cümlesi/paragrafı
6. **Gövde (body)** — yazının tam metnini yapıştır (zengin metin editörü — başlık, liste, kalın gibi biçimlendirmeleri elle uygulayabilirsin)
7. **Kategori** — yukarıdaki tabloya göre seç (boş bırakırsan yazı sadece "Tümü" sekmesinde görünür)
8. **Yayın Tarihi (publishedDate)** — istersen boş bırak, istersen gerçek yazının tarihini gir
9. **Durum (postStatus)** — "Aktif" seçili kalsın
10. Kaydet → **Yayınla**

### Notlar

- İçeriği doğrudan kopyala-yapıştır yapman telif açısından sorun değil — bu kendi şirketinin (Vodafone Pay) resmi sitesindeki kendi içeriği, bir CMS'e taşıyorsun.
- Eklerken bir hata mesajı görürsen ("Bu işlem için yetkiniz yok", "silinemedi" vb.) daha açıklayıcı — [apiErrorMessage.ts](../cms/src/lib/apiErrorMessage.ts) gerçek sebebini gösteriyor.
- Bitince siteyi kontrol et: http://localhost:3000/sikca-sorulan-sorular ve http://localhost:3000/blog — yeni eklediklerin orada görünmeli (CMS'in `afterChange` hook'u siteyi otomatik revalidate ediyor, F5 yeterli).

---

## 2) Sadece SSS akışı — 4 rol (şu an bunu deniyorsun)

Her rolle sırayla giriş yapıp aşağıdaki tek sayfayı kontrol et:
**Sol menü → Sık Sorulanlar** (`/admin/collections/faq-items`). Beklenenden
farklı bir şey görürsen bana **"[Rol] adım N: beklenen X, gördüğüm Y"**
formatında yaz.

| Adım | NV Maker (`test-nv-maker`) | NV Checker (`test-nv-checker`) | Growth Maker (`test-growth-maker`) | Growth Checker (`test-growth-checker`) |
|---|---|---|---|---|
| 1. Giriş yap | 200, admin panele düşer | 200 | 200 | 200 |
| 2. SSS listesini aç | Görür (boş/dolu) | Görür | Görür | Görür |
| 3. **Oluştur** butonu | Var, çalışır | **Yok ya da tıklayınca 403** | **Yok ya da tıklayınca 403** | **Yok ya da tıklayınca 403** |
| 4. Bir kaydı aç, düzenlemeyi dene | Kaydeder | Form salt-okunur ya da kaydet 403 | Form salt-okunur ya da kaydet 403 | Form salt-okunur ya da kaydet 403 |
| 5. **Yayınla** | Direkt yayınlar | — | — | — |
| 6. **Sil** | Onay sorar, siler | **403 / buton yok** | **403 / buton yok** | **403 / buton yok** |
| 7. Sitede kontrol (`/sikca-sorulan-sorular`) | Yayınlanan/silinen orada yansır | — | — | — |

Kısaca: **SSS'de yazma yetkisi yalnızca NV Maker'da.** Diğer 3 rol sadece
görüntüleyebilmeli — herhangi birinde oluştur/düzenle/sil çalışırsa (403
vermezse) bu bir yetki sızıntısı, mutlaka bildir.

İçerik eklerken 1. bölümdeki tabloyu (kategori → gerçek site linki) kullan;
kategori seçimini eksiksiz test etmek istersen en az 2-3 farklı kategoriden
soru ekleyip her birinin ilgili sekmede çıktığını da doğrula.

---

## 3) Genişletilmiş akış — Blog + Kilitli Hesaplar (opsiyonel, 4 rol)

SSS'den ayrı olarak Blog ve diğer yetkileri de aynı oturumda kontrol etmek
istersen bu genişletilmiş listeyi kullan.

### 3a) NV Maker — test-nv-maker@vodafonepay.local

Tam yetkili: oluşturur, yayınlar, siler.

1. `/admin/login` → giriş yap.
2. Sol menüden **Kategoriler** koleksiyonuna gir → yoksa **Duyurular** adında bir kategori oluştur (Akış: "Sık Sorulan Sorular", İsim: "Duyurular", slug otomatik `duyurular` olur).
3. Sol menüden **SSS** (Faq Items) koleksiyonuna gir → liste boş/dolu görünmeli.
4. **Oluştur** → yeni bir soru-cevap gir, kategori olarak **Duyurular**'ı seç → kaydet.
   - Beklenen: kayıt sorunsuz oluşur, `order` alanı otomatik en sona atanır.
5. Aynı kaydı **yayınla** (Publish) → sitede görünmeli: http://localhost:3000/sikca-sorulan-sorular → **Duyurular** sekmesine tıkla, az önce eklediğin soru orada olmalı.
5. Az önce oluşturduğun SSS'i **sil**.
   - Beklenen: silme onayı sorulur, onaylayınca silinir, sitede de kaybolur.
6. Sol menüden **Blog Yazıları** (Blog Posts) koleksiyonuna gir.
7. **Oluştur** → başlık, kapak görseli, özet gir, kategori olarak **Kart**'ı seç → kaydet, yayınla.
8. http://localhost:3000/blog → **Kart** sekmesine tıkla, yazı orada görünmeli, CTA butonu "Detayları gör" yazmalı.
9. Kategorisiz (kategori boş) bir blog yazısı daha oluşturup yayınla → sitede sadece **Tümü** sekmesinde görünmeli, başka hiçbir sekmede görünmemeli.
10. İki test blog yazısını da sil (temizlik).
11. **Kilitli Hesaplar** menüsüne gir (varsa kilitli kullanıcı) — kilit açma butonu görünmeli ve çalışmalı.

### 3b) NV Checker — test-nv-checker@vodafonepay.local

Sadece görüntüleme/inceleme yetkisi olmalı, yazma işlemleri 403 vermeli.

1. Giriş yap.
2. SSS ve Blog Yazıları listelerini aç → görüntüleyebilmeli.
3. Bir SSS kaydını **açmayı dene**, düzenleyip kaydetmeyi dene.
   - Beklenen: ya form salt-okunur/kaydet butonu yok, ya da kaydetmeye çalışınca yetki hatası.
4. Yeni SSS/Blog **oluşturmayı** dene (varsa "Oluştur" butonu).
   - Beklenen: buton yok ya da tıklayınca 403.
5. Silmeyi dene → 403 / silme butonu yok.
6. Kilitli Hesaplar ekranına gir → kilit açma butonu **görünmemeli** (bu yetki sadece NV Maker'da).

### 3c) Growth Maker — test-growth-maker@vodafonepay.local

Kampanya odaklı rol — SSS/Blog'da yazma yetkisi **olmamalı**.

1. Giriş yap.
2. SSS ve Blog Yazıları koleksiyonlarını aç.
   - Beklenen: listeleri görebilir (okuma), ama oluştur/düzenle/sil denemelerinde 403.
3. Kampanyalar koleksiyonuna gir → burada tam yetkili olmalı (oluştur/düzenle), ama **yayınlama** NV Checker onayına düşmeli (kendi yayınladığı direkt canlıya çıkmamalı — review akışı).
4. Medya kütüphanesine görsel yüklemeyi dene → 403 beklenir (bu rolde medya yazma yetkisi yok).

### 3d) Growth Checker — test-growth-checker@vodafonepay.local

Salt okunur — hiçbir yazma işlemi geçmemeli.

1. Giriş yap.
2. SSS, Blog Yazıları, Kampanyalar, Medya → hepsini listeleyebilmeli.
3. Herhangi birinde oluştur/düzenle/sil/yayınla dene → hepsi 403 ya da buton yok.
4. Profil sayfasından kendi dil tercihini (TR/EN) değiştir → bu **çalışmalı** (kendi profilini düzenlemek her rolde serbest).
5. Kendi rolünü değiştirmeyi dene (varsa) → değişmemeli, sunucu tarafında engellenir.

---

## Hızlı referans — SSS kategorileri

Artık hardcoded değil, Kategoriler koleksiyonunda ne varsa o — 1a'daki tabloyu
kullanarak elle oluştur. Hedef 9 kategori: Anasayfa, Anında Bakiye, Vodafone
Pay Uygulaması, Vodafone Pay Kart, QR ile Faturana Yansıt, Kampanyalar,
Sözleşmeler ve Formlar, Gizlilik ve Güvenlik, Duyurular (hepsi gerçek sitede
var). "Faturana Yansıt" da isteğe bağlı 10. kategori olarak eklenebilir —
gerçek sitenin SSS'inde yok ama blogunda var, kendi ürün sayfası
(vodafonepay.com.tr/faturana-yansit) için soru dolduracaksan işine yarar.

## Hızlı referans — blog kategorileri

Anında Bakiye / Faturana Yansıt / Kart (kampanyalarla aynı taksonomi;
kategorisiz yazılar sadece "Tümü" sekmesinde görünür).

## Bir şey bulursan

Şu formatta yaz, yeter: **"[Rol] adım N: beklenen X, gördüğüm Y"**
Örnek: "NV Checker adım 3: kaydet butonu görünüyor ve tıklayınca kaydediyor, olmaması lazım."
