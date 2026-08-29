# Growth Checker — sidebar turu

**Kim:** `mert.sarihan@vodafone.com` · Growth — Checker (`ROLE_VODAFONEPAY_CMS_CHECKER_RO`)
**Ne zaman:** 29.08.2026 · **Nasıl:** `http://localhost:3010/admin`, sidebar sırayla, gerçek tarayıcı
**Sidebar:** Maker ile **birebir aynı 18 madde**. Fark ekranların içinde.

Bu doküman ne gördüğümü ve ne yaptığımı yazıyor. **Yapmadığım şeyler açıkça işaretli.**

---

## Pano (Anasayfa) — Maker'dan farklı

Maker'daki "Taslaklarınız" / "Onay Bekleyen Taslaklar" yerine Checker'a özel:

- **İncelemeni Bekleyen Kampanyalar** — 2 kampanya, her birinde `İncele →`
- Son Giriş Yapanlar, Son Güncellenen İçerikler (Kampanyalar / Blog Yazıları / Sayfalar kartları), Site Sayfaları tablosu.

### 🔴 Bulgu (bu turun en kritiği) — pano butonu kullanıcıyı "oturumun koptu" ekranına atıyor

Kartların başlığında **`+ Yeni`** butonları var. Checker'ın tasarım gereği hiçbir yerde `create` yetkisi yok. Butona basıldı, açılan ekran:

> **Bu işlemi gerçekleştirmek için lütfen giriş yapın.**
> Bu sayfaya erişim izniniz yok.
> **[ Çıkış ]**

Yani Checker, **kendi panosunun sunduğu butona** basınca oturumu kopmuş gibi bir ekranla ve bir **Çıkış** butonuyla karşılaşıyor. Bu, bir 403 toast'tan çok daha kötü: kullanıcı sistemin bozulduğunu ya da atıldığını düşünür. Üç kartta da (Kampanyalar, Blog Yazıları, Sayfalar) aynı buton var.

Bu, daha önce Ücretler ve Limitler'de bulunup düzeltilen "sunucunun reddedeceği kontrolü gösterme" hatasının aynısı — sadece bu sefer panoda ve daha kötü bir hata ekranıyla.

### Bulgu — bekleyen yayından-kaldırma talebi panoda görünmüyor

"İncelemeni Bekleyen Kampanyalar" listesi yalnızca **taslak** kampanyaları gösteriyor. Maker'ın açtığı **yayından kaldırma talebi** bu listede yok. Checker'ın bekleyen bir talepten haberi olmasının tek yolu, kampanyayı açıp sağ paneli okumak.

---

## SİSTEM

### 1. Kullanıcılar
Maker ile aynı: salt-okunur liste, "Yeni oluştur" yok, `Dışa Aktar (CSV)` var. 7 kullanıcı, rol açıklamalarıyla.

### 2. Medya
Checker'a **`Yeni oluştur` + `Toplu Yükleme` GÖRÜNÜYOR** — ve bu sefer buton yalan değil: `mediaCreate` (`src/access/roles.ts:100`) `GROWTH_CHECKER`'ı açıkça içeriyor, sunucu izin veriyor.

- **Bulgu (kural tutarsızlığı):** 28.08 kararı *"Growth Checker'ın create hakkı her yerden kaldırıldı — bir Checker onaylar, asla içerik üretmez"* diyor; `mediaCreate` bunun tek istisnası. Koddaki gerekçe *"Growth maker/checker kampanya görseli yükleyebilmeli, yoksa kampanya oluşturup görsel ekleyemez"* — ama Checker artık kampanya **oluşturamıyor**, dolayısıyla gerekçe onun için geçersiz kalmış. Bilinçli istisna mı yoksa artık mı, karara bağlanmalı.

### 3. Denetim Kayıtları
Yalnızca mert.sarihan'ın kendi kayıtları — 194 kayıt / 20 sayfa. Kapsam doğru. Yaptığım işlemler günlükte: *"faq-items '33' yayınlandı"*, *"faq-items '1' güncellendi"*.

### 4. Tüm İçerikler
Maker ile aynı salt-okunur ekran. **YAPILMADI:** Checker olarak sekme/arama etkileşimleri tekrar denenmedi (Maker turunda doğrulanmıştı, rolden bağımsız).

---

## Koleksiyonlar — create butonu kontrolü

**Sık Sorulanlar** listesinde `Yeni oluştur` **yok** — doğru. Payload, create yetkisi olmayan role bu butonu basmıyor.

> **DÜRÜSTLÜK NOTU:** Create butonunun yokluğunu **ekranda** yalnızca **Sık Sorulanlar** ve **Ücretler ve Limitler**'de doğruladım. Diğer koleksiyon listelerinde (Kategoriler, Kampanyalar, Sayfalar, Blog Yazıları, Temsilciler, Duyurular, Menü Linkleri, Hukuki Sayfalar, Çerez Satırları, Sayfa Meta Bilgileri) aynı Payload mekanizması geçerli ama **tek tek ekran doğrulaması yapılmadı**.
>
> Ayrıca: bir HTML metin taramasıyla "hepsinde create butonu var" sonucu aldım; bu **yanlış pozitifti** (metin JS paketinin içinde geçiyor, ekranda buton yok). Bu yöntemi kullanmayın — sadece ekranda görüneni sayın.

---

## Kayıt ekranlarında Checker'ın kontrolleri

Standart koleksiyonlarda (Sık Sorulanlar örneği üzerinden doğrulandı):

`Taslağı Kaydet` · **`Yayından Kaldır`** · `Değişiklikleri yayınla`

**Koşulan akış (uçtan uca):** Yayındaki bir SSS kaydında `Yayından Kaldır` → Payload'ın onay modalı (*"Bu dökümanı yayından kaldırmak üzeresiniz. Devam etmek istiyor musunuz?"*) → `Onayla` → durum **Taslak**, toast *"Yayından kaldırıldı."*, buton kayboldu. Sitede doğrulandı: kayıt `/sikca-sorulan-sorular` sayfasından düştü. Ardından `Değişiklikleri yayınla` ile geri alındı.

*(Not: bu "Yayından Kaldır" kontrolü bu oturumda eklendi — öncesinde Checker arayüzden hiçbir içeriği yayından kaldıramıyordu.)*

---

## Ücretler ve Limitler (Checker)

`Yeni Ücret Satırı` butonu **yok** — doğru (bu oturumdan önce düzeltilmişti, doğrulandı). Tablo ve sekmeler Maker'la aynı.

- **Bulgu:** Sayfanın altındaki **"Sürükleyerek Sırala" başlığının altı yine boş.** Burada Maker'dakinden daha ciddi: Checker sunucu tarafında sıralayabiliyor (yayındaki `faq-items/1` üzerinde `order` PATCH → **200**), yani **yapabildiği bir işin aracı ondan gizleniyor.** Sebep `ReorderWidget.tsx:384`'teki `canReorder` kapısının yalnızca New Vertical rollerini içermesi — dayandığı gerekçe 28.08 rol genişletmesinde geçersiz kalmış.

---

## Kampanyalar — Checker'ın asıl akışı *(uçtan uca koşuldu)*

Maker'ın açtığı **yayından kaldırma talebi** ile devam edildi:

1. Kampanya açıldı → sağ panelde *"Yayından Kaldırma Talebi: Onay bekliyor"*, *"Talebi Açan: ece.boran"*, *"Talep Tarihi"*.
   - **Bulgu:** Aksiyon alanı bekleyen talebi **hiç yansıtmıyor** — buton ve uyarı metni, talep hiç yokmuş gibi aynı (`Yayından Kaldır ve Düzenle`). Panoda da görünmüyor (yukarı bakın).
2. `Yayından Kaldır ve Düzenle` → Durum **Taslak**, talep alanları temizlendi, butonlar `Taslağı Kaydet / Reddet / Değişiklikleri yayınla` oldu.
3. **Sitede doğrulandı:** kampanya `/kampanyalar`'dan ve footer'dan düştü.
4. `Değişiklikleri yayınla` → **yayın öncesi canlı önizleme modalı** (kampanya kartı gerçek görünümüyle, "Taslak önizleme — bu, henüz yayınlanmamış halinin canlı sitede nasıl görüneceğidir") → `Onayla ve Yayınla`.
5. **Sitede doğrulandı:** kampanya geri geldi, **footer sırası 3 korundu** — uyarı metninin verdiği söz tutuldu.

**Ayrıca (28.08 turunda koşulmuştu, burada tekrarlanmadı):** `Reddet` akışı — gerekçe zorunlu, boşken buton pasif; reddedilince durum/gerekçe/tarih/reddeden kaydediliyor ve Maker panosunda "Reddedildi" olarak beliriyor.

---

## İletişim Bilgileri *(global)*
Maker ile aynı: **tüm alanlar kilitli, Kaydet butonu yok.** Sadece `?` yardım butonu var. Tasarım gereği doğru (global yalnızca New Vertical'a açık).

---

## Geri Bildirim Gönder / Hesap
**YAPILMADI:** Checker olarak bu iki ekran ayrıca denenmedi. Rolden bağımsız çalıştıkları Maker turunda uçtan uca doğrulandı (geri bildirim gönderildi, dil tercihi değiştirilip kaydedildi). Maker turunda bulunan **kenar boşluğu yok (x=0)** kusuru bu iki ekranda role bağlı değil, Checker'da da geçerlidir.

---

## Checker turunun genel bulguları

| # | Bulgu | Etki |
|---|---|---|
| 1 | 🔴 **Panodaki `+ Yeni` butonları** → "lütfen giriş yapın / erişim izniniz yok" ekranı + Çıkış butonu | Kullanıcı oturumunun koptuğunu sanır. En kritik bulgu. |
| 2 | **Bekleyen yayından-kaldırma talebi** ne panoda ne de aksiyon alanında görünüyor | Checker talebi ancak kaydı açıp sağ paneli okuyarak fark eder |
| 3 | **Sürükle-bırak sıralama aracı Checker'a da gizli** — oysa sunucu izin veriyor (200) | Yapabildiği işin aracı yok; üstelik boş bir bölüm başlığı kalıyor |
| 4 | **Medya'da create hakkı var** ama kural "Checker asla içerik üretmez" diyor; koddaki gerekçe artık geçersiz | Kural/uygulama tutarsızlığı — karara bağlanmalı |
| 5 | Maker turunda bulunan A/C/D/E/F/G/H/J/K/L maddeleri (DURUM sütunu, doğru/yanlış, "Mahsulat", kenar boşluğu vb.) role bağlı değil — **Checker'da da aynen geçerli** | Bkz. `UI-WALKTHROUGH-MAKER.md` |

## Bu turda YAPILMAYANLAR (özet)

- Create butonunun yokluğu **10 koleksiyonda ekranda tek tek doğrulanmadı** (yukarıdaki dürüstlük notu).
- Geri Bildirim Gönder ve Hesap ekranları Checker olarak açılmadı.
- "Tüm İçerikler" ekranının sekme/arama etkileşimleri Checker olarak tekrarlanmadı.
- Medya'da Checker ile gerçek dosya yükleme denenmedi (dosya seçici otomasyondan kullanılamıyor) — dolayısıyla `mediaCreate` hakkının uçtan uca çalıştığı **doğrulanmadı**, yalnızca erişim kodundan okundu.
- `Reddet` akışı bu turda tekrarlanmadı (28.08'de koşulmuştu).
- Kampanyalar dışındaki koleksiyonlarda Checker'ın "Yayından Kaldır" butonu yalnızca **Sık Sorulanlar**'da uçtan uca çalıştırıldı; diğerlerinde aynı bileşen kullanılıyor ama tek tek denenmedi.


---

# Düzeltme turu — 29.08.2026

Aşağıdaki maddeler bu dokümanlardaki bulgular üzerine düzeltildi. Her biri
**CMS arayüzünde tekrar açılıp** doğrulandı; siteye yansıması gerekenler ayrıca
`localhost:3000` üzerinde kontrol edildi.

| ✔ | Bulgu | Düzeltme | Doğrulama |
|---|---|---|---|
| ✅ | Checker panosundaki `+ Yeni` → "lütfen giriş yapın" ekranı | `CustomDashboardView` artık Payload'ın kendi izin setinden `create` kontrol ediyor | Checker panosunda üç kartta da buton yok; **Maker'da duruyor** |
| ✅ | Sıralama aracı Growth rollerine gizli | `canReorder`'a `GROWTH_CHECKER` eklendi (gerekçesi 28.08'de eskimişti) | Checker'da 13 satırlık sürüklenebilir liste geldi |
| ✅ | "Sürükleyerek Sırala" başlığı altı boş | Başlık ve widget tek bileşende, aynı rol kontrolüyle | Maker'da başlık da yok, Checker'da ikisi de var |
| ✅ | Bekleyen yayından-kaldırma talebi butona yansımıyor | `unpublishRequest === "pending"` iken hazır ama bağlanmamış metin gösteriliyor | Maker talep sonrası **"Yayından kaldırma talebiniz Checker onayında."** görüyor |
| ✅ | 6 koleksiyonda DURUM sütunu yok | `defaultColumns`'a `_status` | Kategoriler / Temsilciler / Menü Linkleri / Hukuki Sayfalar / Çerez Satırları / Sayfa Meta — altısında da geldi |
| ✅ | Sayfalar'da Görünürlük varsayılan değil | `defaultColumns`'a `visibility` | Listede "Gizli (yalnızca CMS oturumu ile görünür)" görünüyor |
| ✅ | Boolean sütunları `doğru`/`yanlış` | `i18n.translations.tr.general` → Evet/Hayır | SSS listesinde "evet" |
| ✅ | Kırpma paneli "Mahsulat" | `i18n.translations.tr.upload.crop` → "Kırpma" | Görsel düzenleyicide "Kırpma" |
| ✅ | Hesap ve Geri Bildirim ekranlarında kenar boşluğu yok (x=0) | `.cm-view-pad` başlık+form'u birlikte sarıyor | İki ekranda da içerik kenardan ayrıldı |
| ✅ | Maker'a anlamsız "Yetki Devredilen Kişi" alanı | Alan `condition` ile Checker rollerine sınırlandı | Maker'ın alan listesinde yok |
| ✅ | Blog'da `datePublished` yapısal verisi yok | Detay sayfası `publishedDate ?? createdAt` kullanıyor (ekranda gösterilen tarih hâlâ sadece `publishedDate`) | **Canlı sitede** `"datePublished":"2026-08-27T..."` |
| ✅ | Kategori slug'ı isimle uyuşmuyor (`Kart` → `aninda-bakiye`) | `scripts/fix-category-slugs-29-08.sql` | `Kart/kart`, `Anında Bakiye/aninda-bakiye`; **canlı sitede** 6 filtre sekmesi ve 12 kampanya sağlam |
| ✅ | `/ulasim-odemeleri` PageMeta'sı Anında Bakiye'den bahsediyor | Checker akışıyla düzeltildi | **Canlı sitede** doğru `<title>` ve `<meta description>` |
| ✅ | İngilizce panelde rol etiketi Türkçe kalıyor | `ROLE_OPTIONS` etiketleri `{tr,en}` oldu | EN panelde "Growth — Maker (same scope as New Vertical, cannot publish)" |
| ✅ | Denetim kaydında ham rol slug'ı (`growth_maker`) | Salt-okunur `AuditRoleField` — **saklanan değer slug olarak kalıyor** (denetim izi makine değerini korumalı), sadece gösterim çevriliyor | Kayıt detayında okunur etiket |

## Düzeltilmeyenler ve sebepleri

- **Hukuki Sayfalar'da "Yeni oluştur"** — 5 slug'ın beşi de dolu olduğu için şu an hiçbir zaman başarıya ulaşmıyor, ama bir hukuki sayfa silinirse geçerli hale gelir; koşula bağlı olduğu için kaldırılmadı. Hata mesajı net ve veri bozulmuyor.
- **İlişki sütunlarının ~8 sn "Yükleniyor..." kalması** — Payload'ın kendi liste hücresi davranışı; dokunulmadı.
- **Medya'da Growth Checker'ın create hakkı** — "Checker asla içerik üretmez" kuralıyla çelişiyor ve koddaki gerekçe eskimiş, ama bunu tek taraflı kaldırmak bir iş kararı. Bulgu olarak duruyor.
- **Sürükle-bırak hareketinin kendisi** — HTML5 native drag, tarayıcı otomasyonundaki sentetik fare olaylarına yanıt vermiyor. Aracın **göründüğü** ve Checker'ın sıralama PATCH'inin sunucuda **200 döndüğü** doğrulandı; sürükleyip kaydetme yolu bizzat denenmedi. Bunun yerine kaydın "Sıra" alanı üzerinden test edildi ve çakışma koruması net bir mesajla çalıştı.
