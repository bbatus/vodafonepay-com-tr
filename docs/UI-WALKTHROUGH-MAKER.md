# Growth Maker — sidebar turu

**Kim:** `ece.boran@vodafone.com` · Growth — Maker (`ROLE_VODAFONEPAY_CMS_MAKER_RW`)
**Ne zaman:** 29.08.2026 · **Nasıl:** `http://localhost:3010/admin`, sidebar sırayla, gerçek tarayıcı
**Kapsam:** Sidebar'daki 18 maddenin tamamı + pano + sağ üstteki Hesap ekranı.

Bu doküman ne gördüğümü ve ne yaptığımı yazıyor. **Yapmadığım şeyler her bölümde "YAPILMADI" olarak işaretli** — yapılmamış bir akış için "çalışıyor" demiyorum.

---

## Pano (Anasayfa)

Dört sayaç kartı (Toplam İçerik 59, Sayfalar 47, Kullanıcılar 7, Sık Sorulanlar 25), ardından:

- **Taslaklarınız** — Maker'a özel. Kendi taslakları ve reddedilenleri listeler. Reddedilmiş bir kampanya varken şöyle görünüyor: `Ulaşım Kartına Bakiye Yükle... — Reddedildi — Düzenle →`
- **Onay Bekleyen Taslaklar** — "Toplam 5 taslak henüz yayınlanmadı."
- **Son Giriş Yapanlar** — 11 farklı kullanıcı, rol/tarih/IP.
- **Son Güncellenen İçerikler** — Kampanyalar / Blog Yazıları / Sayfalar kartları, her birinde "+ Yeni".
- **Site Sayfaları** — sitenin tüm adresleri, kaynak (Sabit / CMS / Dinamik) ve URL sayısıyla.

---

## SİSTEM

### 1. Kullanıcılar

Liste: `Dışa Aktar (CSV)`, `?` yardım. Sütunlar: EMAIL, ROLE, KİLİTLİ (BİTİŞ), SON GİRİŞ. 7 kullanıcı. **"Yeni oluştur" yok.**

**Başka birinin kaydı** (hande.tanis): 10 alanın hepsi kilitli, **hiçbir kaydet kontrolü yok**. Tam salt-okunur.

**Kendi kaydı:** `Kaydet` var, ama açık olan sadece 3 alan — Profil Fotoğrafı, Dil Tercihi, Yetki Devredilen Kişi. E-posta / Kullanıcı Adı (LDAP) / Role kilitli, altlarında neden kilitli olduğunu anlatan açıklama var.

**Koşulan akış:** Dil Tercihi `Türkçe → English → Kaydet`. Panelin tamamı (etiketler, yardım metinleri, breadcrumb, butonlar) anında İngilizce'ye döndü. Türkçe'ye geri alındı.

- **Bulgu (kozmetik):** İngilizce paneldeyken Role seçeneğinin etiketi Türkçe kalıyor: *"Growth — Maker (New Vertical ile aynı kapsam, yayınlayamaz)"*.
- **Bulgu (kozmetik):** "Yetki Devredilen Kişi" Maker'a da açık, oysa kendi yardım metni *"Sadece Checker rolündeyseniz anlamlıdır"* diyor.
- **YAPILMADI:** Profil fotoğrafı yüklemesi (dosya seçici otomasyondan kullanılamıyor). CSV dışa aktarma butonuna basılmadı.

### 2. Medya

Özel filtre sekmeleri **Tümü / Görseller / Videolar**. `Yeni oluştur` + `Toplu Yükleme` var — Maker medya oluşturabiliyor. Sütunlar: DOSYA ADI, ALT, CAPTION, MEDYA TÜRÜ. 38 kayıt / 4 sayfa.

**Koşulan akış:** "Videolar" sekmesi → "Sonuç Yok" (sistemde video yok) → "Tümü"ye dönüş.

**Kayıt (fy-hero.jpg):** Alt (zorunlu) ve Caption editlenebilir; Medya Türü ve Yükleyen kilitli; Kullanım Yeri (URL) ve Kullanım Notu açık. **Kullanıldığı Yerler** otomatik listesi çalışıyor — *"Sayfalar: Faturana Yansıt"* ve *"Kullanımda olduğu için bu medya silinemez"*. ⋮ menüsünde sadece "Yeni oluştur" + "Çoğalt", **silme yok** (doğru — medya silme New Vertical Maker'a özel).

**Koşulan akış:** `Görüntüyü Düzenle` → kırpma + odak noktası editörü açıldı (Genişlik/Yükseklik px, X%/Y%, Sıfırla). Uygulamadan iptal edildi.

- **Bulgu (Payload çevirisi):** Kırpma panelinin başlığı **"Mahsulat"** yazıyor — "crop" hasat/ürün diye çevrilmiş. "Kırpma" olmalı.
- **YAPILMADI:** Gerçek dosya yükleme (Yeni oluştur / Toplu Yükleme).

### 3. Denetim Kayıtları

`Dışa Aktar (CSV)` + `Dışa Aktar (CEF)`. Uyarı: *"Salt okunur değişiklik kaydı — kimse bu kayıtları düzenleyemez veya silemez."* 213 kayıt / 22 sayfa.

**Kapsam doğru:** listede yalnızca ece.boran'ın kendi kayıtları var — Maker tüm günlüğü göremiyor. Az önce yaptığım işlemler görünüyor (dil değişikliği, kategori oluşturma, giriş/çıkış).

Kayıt detayı: 8 alan, hepsi kilitli, hiçbir kaydet/sil kontrolü yok.

- **Bulgu (kozmetik):** "Rol" alanı ham slug gösteriyor (`growth_maker`), listedeki gibi okunur etiket değil.
- **YAPILMADI:** CSV/CEF indirme butonlarına basılmadı.

### 4. Tüm İçerikler

Salt okunur genel bakış. Üstte **Tüm Koleksiyonlar** tablosu (Koleksiyon / Toplam / Yayında / Taslak / Son Güncelleme, 18 satır). Altta **Koleksiyon Detayı** — her koleksiyon için sekme, artı "Kullanıcılar" ve "Site Sayfaları (geliştirici yapımı)".

**Koşulan akış:** Kampanyalar sekmesinde arama kutusuna `ulaşım` yazıldı → "1 kayıt"a filtrelendi. Sekme değiştirildi → **Site Sayfaları (geliştirici yapımı)**: 18 kayıt, `Başlık / Adres / Nerede Bağlantılı` (ör. "Header → Ürünler", "Footer → Yasal"). Editöre hangi sayfanın kodla yapıldığını ve nereden linklendiğini gösteriyor.

- **Not:** Bu ekran Maker'ın sidebar'ında olmayan koleksiyonları da listeliyor (Dokümanlar, Çeviriler, Kullanıcılar, Denetim Kayıtları). Salt okunur olduğu için zararsız, ama sidebar ile bire bir örtüşmüyor.

---

## İÇERİK YÖNETİMİ

### 5. Kategoriler

`Yeni oluştur` **var**, `Dışa Aktar (CSV)`. Sütunlar: İSİM, AKIŞ, SLUG, SIRA. 13 kayıt / 2 sayfa.

Oluşturma formu açıldı: Akış (Kampanyalar/Blog/SSS), İsim, Sıra; sağda Slug (otomatik, *"kaydedildikten sonra değişmez"*) + Oluşturan. Butonlar: **`Onaya Gönder`** + gri `Onay bekliyor (Checker yayınlar)`.

Özel bileşen **"Bu akışta zaten olan kategoriler"** seçilen akıştaki kategorileri slug'larıyla gösteriyor — mükerrer kategori açmayı engelliyor. Sıra önerisi doğru (kampanya akışında sıralar 2,4,5,6,7 → "önerilen sıra: 8").

- **Bulgu (veri/CMS karışıklığı — siteyi etkilemiyor):** **"Kart" kategorisinin slug'ı `aninda-bakiye`**, ve gerçek "Anında Bakiye" kategorisi bu yüzden `aninda-bakiye-2` almış. Slug oluşturmada kilitlendiği için kategori sonradan yeniden adlandırılınca slug kalıcı olarak yanlış kalıyor ve doğru ismin slug'ını işgal ediyor. Sitede etkisi yok (kampanya filtresi URL parametresi değil, client-side state), ama CMS'te yanıltıcı — bu ekranın kendi "zaten olan kategoriler" listesinde bile öyle görünüyor.
- **YAPILMADI:** Yeni kategori kaydedilmedi (çöp veri üretmemek için). Bu koleksiyonun create→onay akışı 28.08 turunda uçtan uca koşulmuştu.

### 6. Kampanyalar

`Yeni oluştur` + `Dışa Aktar (CSV)`. Sütunlar: BAŞLIK, KATEGORİ, BU AYIN FAVORİLERİNDE GÖSTER, BAŞLANGIÇ/BİTİŞ TARİHİ, DURUM. 14 kayıt / 2 sayfa. Durum sütunu bilgilendirici ("Taslak (yayınlanmış versiyonu var)").

**Koşulan akış — yayındaki kampanya, Maker gözüyle:** Alanlar dolu ama uyarı var: *"Bu kampanya yayında. Düzenlemek için önce yayından kaldırılması gerekir — ilk oluşturulma tarihi ve listedeki sırası korunur."* Tek aksiyon: **`Yayından Kaldırma Talebi Oluştur`**. Basıldı → sağ panelde "Yayından Kaldırma Talebi: Onay bekliyor", "Talebi Açan: ece.boran", "Talep Tarihi" doldu. Kampanya yayında kaldı, site etkilenmedi. *(Talep Checker turunda onaylandı ve kampanya geri yayınlandı — Checker dokümanına bakın.)*

Footer alanları çalışıyor: "Footer'da Göster" işaretli, "Footer Sırası 3", canlı sayaç *"Footer'da 4/7 kayıt var."*

- **Bulgu (akış kusuru):** Talep "Onay bekliyor" durumundayken **buton hâlâ "Yayından Kaldırma Talebi Oluştur" diyor** — sayfa yenilendikten sonra bile. Maker aynı talebi tekrar tekrar gönderebilir ve butondan talebinin gittiğini anlayamaz. Çevirilerde bunun için hazır metin var (`roleAwarePublishButton.unpublishRequested` = *"Yayından kaldırma talebiniz Checker onayında."*) ama **koda hiç bağlanmamış**.
- **Bulgu (okunabilirlik):** "BU AYIN FAVORİLERİNDE GÖSTER" sütunu `doğru` / `yanlış` yazıyor. İş kullanıcısı için "Evet/Hayır" olmalı — "doğru/yanlış" burada "correct/incorrect" gibi okunuyor.
- **Bulgu (performans):** KATEGORİ sütunu ilk açılışta ~8 sn "Yükleniyor..." kalıyor, sonra doluyor. Kalıcı hata değil ama liste ilk bakışta bozuk görünüyor.
- **YAPILMADI:** Bu turda yeni kampanya oluşturulmadı; create→reddet→düzelt→onay döngüsü 28.08 turunda uçtan uca koşulmuştu.

### 7. Sayfalar

`Yeni oluştur` + açıklama. Sütunlar: BAŞLIK, SLUG, DURUM. 10 kayıt.

**Koşulan akış:** `Sütunlar` açıldı → 18 sütun seçeneği → **Görünürlük** eklendi → 4 sayfanın *"Gizli (yalnızca CMS oturumu ile görünür)"* olduğu göründü.

- **Bulgu:** Görünürlük **varsayılan sütun değil**. Varsayılan listede gizli sayfalar da "Yayınlandı" görünüyor; editör hangi sayfanın ziyaretçiye kapalı olduğunu listeden ayırt edemiyor. Ziyaretçinin gördüğünü doğrudan belirleyen bir alan için varsayılan olmalı.
- **YAPILMADI:** Blok kütüphanesiyle sayfa kurma akışı bu turda tekrarlanmadı (28.08'de Hero bloğuyla uçtan uca koşulmuştu).

### 8. Sık Sorulanlar

`Yeni oluştur`. Sütunlar: SORU, KATEGORİ, ANASAYFADA GÖSTER, SIRA, OLUŞTURMA TARİHİ, DURUM. 25 kayıt / 3 sayfa.

- **Bulgu (önemli) — sürükle-bırak sıralama aracı hiç görünmüyor.** Bu listeye `beforeList` ile bağlı **ReorderWidget render edilmiyor**. Sebep `ReorderWidget.tsx:384`:
  ```
  const canReorder = role === ROLES.NEW_VERTICAL_MAKER || role === ROLES.NEW_VERTICAL_CHECKER;
  ```
  Yanındaki yorum, *"bu koleksiyonlarda `update` = `newVerticalReadWrite`, Growth rolleri yazamaz, sürüklenebilir liste göstermek yalan olur"* diyor. **Bu gerekçe 28.08 rol genişletmesinde geçersiz kaldı** — faq-items, announcements, nav-links, categories, fee-rows artık `standardReadWrite` kullanıyor.
  Sunucuda test edildi (yayındaki `faq-items/1` üzerinde `order` PATCH): **Growth Checker → 200**, Growth Maker → 403 (*"Yayındaki bir kaydı düzenleyemezsiniz"*).
  Yani doğru davranış: araç **Growth Checker'a görünmeli**, Growth Maker'dan gizli kalmalı. Şu an ikisinden de gizli.

### 9. Blog Yazıları

`Yeni oluştur` + `Dışa Aktar (CSV)`. Sütunlar: BAŞLIK, KATEGORİ, YAYIN TARİHİ, DURUM. 5 kayıt.

- **Bulgu (SEO):** **YAYIN TARİHİ 5 yazının hepsinde boş.** Alan opsiyonel ve kimse doldurmuyor. Sonuç: (a) blog detay sayfasında tarih hiç görünmüyor, (b) sayfanın JSON-LD yapısal verisinde `datePublished` **hiç yok** — canlıda doğrulandı, `headline` var, `datePublished` yok.

### 10. Temsilciler

`Yeni oluştur` + açıklama. Sütunlar: TİCARİ UNVAN, İL, İLÇE, TELEFON. 4 kayıt.

- **Bulgu:** **DURUM sütunu yok.** Bu koleksiyona 28.08'de taslak/yayın eklendi ama liste bunu göstermiyor.

### 11. Duyurular

`Yeni oluştur`. Sütunlar: BAŞLIK, SIRA, DURUM. 1 kayıt. Sürükle-bırak aracı burada da yok (madde 8'deki aynı sebep).

### 12. Ücretler ve Limitler *(özel ekran)*

İki sekme: **Ücret Tablosu** / **Limit Tabloları**. `Yeni Ücret Satırı` var. Tablo: Etiket, Değer, Durum, Sıra. 13 satır.

- **Bulgu (görünür kusur):** Sayfanın altında **"Sürükleyerek Sırala" başlığı var ama altı tamamen boş.** Başlığı `FeesAndLimitsApp` koşulsuz basıyor, altındaki ReorderWidget ise Growth rolleri için `null` dönüyor (madde 8). Editör bir bölüm başlığı görüp altında hiçbir şey bulamıyor.

---

## SİTE YAPISI

### 13. Menü Linkleri
Sütunlar: ETİKET, ADRES (HREF), BÖLÜM, SIRA. 3 kayıt. `Yeni oluştur` var. **DURUM sütunu yok** — taslağa çekilmiş 2 "layout Test Sayfası" kaydı yayındakilerden ayırt edilemiyor. Sürükle-bırak aracı da yok.

### 14. Hukuki Sayfalar
Sütunlar: BAŞLIK, SLUG. 5 kayıt. DURUM sütunu yok.
- **Bulgu:** `Yeni oluştur` var ama slug sabit 5 seçenekten ibaret ve **beşi de dolu** — yeni kayıt her zaman *"Lütfen geçersiz alanı düzeltin: slug"* ile biter. (Hata net, veri bozulmuyor; ama buton hiçbir zaman başarıya ulaşamaz.)

### 15. Çerez Satırları
Sütunlar: ÇEREZ ADI, SAĞLAYICI, TARAF, KATEGORİ. 60 kayıt / 6 sayfa. DURUM sütunu yok.

### 16. Sayfa Meta Bilgileri
Sütunlar: SAYFA ADRESİ, BREADCRUMB ETİKETİ, SEO BAŞLIĞI. 17 kayıt / 2 sayfa. DURUM sütunu yok.
- **Not (benim bıraktığım tutarsızlık):** `/ulasim-odemeleri` kaydının Breadcrumb Etiketi hâlâ "Anında Bakiye" ve SEO açıklaması Anında Bakiye'den bahsediyor — önceki turda bu kaydın `pageKey`'ini değiştirirken güncellemeyi unutmuşum.

### 17. İletişim Bilgileri *(global)*
11 alan (Şirket Unvanı, Ticaret Sicil No, Adres, Müşteri Hizmetleri Telefonu, KEP, Şikayet Süreci Metni, TCMB Adres/Telefon/Faks/KEP, Basın İlişkileri). **Hepsi kilitli, Kaydet butonu yok.** Maker göremiyor değil — değiştiremiyor. Tasarım gereği doğru.

### 18. Geri Bildirim Gönder

**Koşulan akış (uçtan uca):** "İlgili Ekran / Bileşen" + "Geri Bildiriminiz" dolduruldu → `Gönder` → form temizlendi, başlıktaki sayaç **1 → 2** oldu, hem satır içi hem toast: *"Teşekkürler — geri bildiriminiz bize ulaştı."* Gönderilen içerik: Ücretler ve Limitler'deki boş "Sürükleyerek Sırala" başlığı.

---

## + Hesap *(sağ üst avatar — sidebar'da değil)*

E-posta, Kullanıcı Adı (LDAP, boş "—"), Rol — hepsi salt-okunur ve açıklamalı. Profil Fotoğrafı (tıklayarak değiştir), Dil Tercihi + Kaydet, Çıkış Yap. **Parola değiştirme yok** — LDAP modeline uygun.

---

## Maker turunun genel bulguları

| # | Bulgu | Etki |
|---|---|---|
| A | **DURUM sütunu eksik** — Kategoriler, Temsilciler, Menü Linkleri, Hukuki Sayfalar, Çerez Satırları, Sayfa Meta. Altısı da taslak/yayın destekliyor. | Editör listede neyin yayında olduğunu göremiyor |
| B | **Sürükle-bırak sıralama aracı Growth rollerine hiç görünmüyor** (madde 8) — Checker'ın sunucuda yetkisi olmasına rağmen | Sıralama arayüzden yapılamıyor |
| C | **`doğru` / `yanlış`** boolean sütunları | "Evet/Hayır" olmalı |
| D | **İlişki sütunları ~8 sn "Yükleniyor..."** kalıyor | Liste ilk bakışta bozuk görünüyor |
| E | Payload Türkçesi: kırpma paneli **"Mahsulat"** | Anlamsız kelime |
| F | **Kenar boşluğu yok**: "Hesap" ve "Geri Bildirim Gönder" ekranlarında içerik pencerenin soluna yapışık (x=0) | Görsel kusur |
| G | Rol seçeneği etiketi İngilizce panelde de Türkçe kalıyor | i18n boşluğu |
| H | Sayfalar'da **Görünürlük varsayılan sütun değil** | Gizli sayfa "Yayınlandı" gibi görünüyor |
| I | Kampanyalarda **bekleyen yayından-kaldırma talebi butona yansımıyor** | Maker aynı talebi tekrar gönderebilir |
| J | Blog'da **Yayın Tarihi hiç dolu değil** → `datePublished` yapısal verisi yok | SEO |
| K | Hukuki Sayfalar'da **create hiçbir zaman başarılı olamaz** (5 slug da dolu) | Ölü buton |
| L | Kategori slug'ı isimle uyuşmuyor (`Kart` → `aninda-bakiye`) | CMS içi karışıklık |

## Bu turda YAPILMAYANLAR (özet)

- Gerçek dosya yükleme (Medya "Yeni oluştur" / "Toplu Yükleme", profil fotoğrafı) — tarayıcı otomasyonundan dosya seçici kullanılamıyor.
- CSV / CEF dışa aktarma butonlarına basılmadı (indirilen dosya doğrulanamıyor).
- Yeni kategori / kampanya / sayfa **kaydedilmedi** — bu koleksiyonların create→onay akışları 28.08 turunda uçtan uca koşulmuştu; bu tur sidebar gezisine ve ekran davranışına odaklandı.
- Kampanyalar dışındaki koleksiyonlarda "Reddet" akışı yok (o akış Campaigns'e özel), dolayısıyla denenmedi.
- Sayfalar'ın 20+ bloklu kütüphanesinde bu turda yalnızca liste/sütun davranışı incelendi; blokların tek tek doldurulması yapılmadı.
