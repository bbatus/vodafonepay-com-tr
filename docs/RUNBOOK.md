# RBAC / Collection Uçtan Uca Test Runbook'u

**Amaç:** 4 test kullanıcısının (New Vertical Maker/Checker, Growth Maker/Checker) her collection'da
gerçekten ne yapabildiğini/yapamadığını tek tek doğrulamak, ve onaylanan içeriğin canlı siteye
(vodafonepaycomtr) doğru yansıdığını kanıtlamak. Bu doküman dev/QA ekibi içindir — her adımın
beklenen sonucu var, "beklenenden farklı davranan" her şey gerçek bir bug'dır.

**Kapsam dışı:** LDAP/SSO gerçek entegrasyonu (rol simülasyonu kullanılıyor), CI/CD, altyapı/monitoring
maddeleri — bunlar ayrı, ortam bağımlı konular.

---

## 0. Ortam Hazırlığı

```bash
# Repo kökünden
docker compose -p vodafonepaycomtr up -d
```

Kontrol listesi:
- [ ] `docker compose -p vodafonepaycomtr ps` → `vodafonepaycomtr-cms`, `vodafonepaycomtr` (=`app` servisi), `vodafonepaycms-postgres`, `vodafonepaycms-minio` hepsi `healthy`
- [ ] `.env` dosyasında `CMS_AUTO_LOGIN=false` (veya satır yok) — **açıksa test geçersizdir**, gerçek
      login akışını test edemezsiniz (her istek otomatik admin olarak authenticate olur)
- [ ] `http://localhost:3010/admin/login` gerçek bir login formu gösteriyor (auto-login yoksa doğrudan
      dashboard'a düşmüyor)
- [ ] `http://localhost:3000` canlı site açılıyor
- [ ] `docs/TEST-USERS.MD` dosyasında 4 kullanıcının e-posta+şifresi var

**Şifreler için not:** Chrome'a kayıtlıysa login sayfasında otomatik dolar, sadece "Giriş"e tıklayın.
Kayıtlı değilse `docs/TEST-USERS.MD`'den kopyalayıp elle girin.

---

## 1. Roller Özeti

| Rol | E-posta | Campaigns | Diğer TÜM collection'lar | Users | Audit Logs |
|---|---|---|---|---|---|
| **Growth — Checker** | test-growth-checker@vodafonepay.local | update ✅, publish ✅, create ❌, delete ❌ | salt-okunur (yazma ❌ her yerde) | gizli | gizli |
| **Growth — Maker** | test-growth-maker@vodafonepay.local | create ✅ (taslak), update ✅, publish ❌, delete ❌ | salt-okunur (yazma ❌ her yerde) | gizli | gizli |
| **New Vertical — Maker** | test-nv-maker@vodafonepay.local | create/update/publish/delete ✅ | create/update/publish/delete ✅ her yerde | tam (rol değiştirme dahil) | ✅ görebilir |
| **New Vertical — Checker** | test-nv-checker@vodafonepay.local | update/publish ✅, create ❌, delete ❌ | update/publish ✅, create ❌, delete ❌ her yerde | sadece kendi kaydı | ❌ göremez |

**Neden "Growth" rolleri Users/Audit Logs'u hiç görmüyor?** Bu iki collection `isNewVerticalMaker`
(sadece NV Maker) veya kimlik bazlı erişimle korunuyor — Growth rolleri bu kontrolün dışında.

**Neden NV Checker Audit Logs'u göremiyor ama NV Maker görüyor?** Kod bilinçli olarak böyle yazılmış
(`AuditLogs.access.read: isNewVerticalMaker`) — "checker onaylar, maker'ın audit sorumluluğu var" mantığı.
Beklenmedik geliyorsa iş birimiyle netleştirilmeli, ama şu an kodun DAVRANIŞI bu.

---

## 2. AŞAMA 1 — Growth Maker: Campaigns'te taslak oluştur

**Giriş:** `test-growth-maker@vodafonepay.local`

### 2.1 Campaigns dışında yazma denemesi (engellenmeli)
- [ ] Sol menüden **Faq Items**'a gir → **"Yeni oluştur" butonu YOK** olmalı
- [ ] Herhangi bir mevcut FAQ kaydına tıkla → tüm alanlar **gri/salt-okunur** olmalı, Kaydet/Yayınla butonu yok
- [ ] Aynı deneyi **Media**, **Nav Links** gibi 1-2 collection'da daha tekrar et — aynı sonucu bekle

### 2.2 Campaigns'te gerçek create
- [ ] **Campaigns** → **Yeni oluştur**
- [ ] Doldur: Title=`Runbook Test Kampanya`, Slug=`runbook-test-kampanya`,
      Description=`Runbook testi için oluşturuldu`, Image=Varolanlardan seç (herhangi biri),
      Category=Genel (varsayılan kalsın)
- [ ] **"Taslağı kaydet"** → başarılı olmalı, **Durum: Taslak** görünmeli
- [ ] **"Değişiklikleri yayınla"** → **403/hata almalı, durum Taslak kalmalı** (Growth Maker yayınlayamaz —
      bu segregation-of-duty'nin can alıcı noktası)
- [ ] Kaydı silmeyi dene (sağ üst "…" menüsünden Sil) → **engellenmeli** (delete sadece NV Maker'da)

**Bu aşamadan sonra:** kayıt TASLAK olarak kalmalı, sonraki aşamada checker bunu yayınlayacak. **Çıkış yapmayın gerekirse yeni sekmede devam edin**, ya da id'yi not alın (URL'deki `/campaigns/<id>`).

---

## 3. AŞAMA 2 — Growth Checker: onayla ve yayınla

**Giriş:** `test-growth-checker@vodafonepay.local`

### 3.1 Campaigns dışında yazma denemesi (engellenmeli — Aşama 1.1 ile aynı)
- [ ] Faq Items, Media, Nav Links → aynı şekilde salt-okunur olmalı

### 3.2 Campaigns'te create denemesi (engellenmeli)
- [ ] Campaigns listesine gir → **"Yeni oluştur" YOK**
- [ ] `/admin/collections/campaigns/create` URL'ine doğrudan git → "yetkiniz yok" mesajı görmelisin

### 3.3 Maker'ın taslağını onayla
- [ ] Campaigns listesinde Aşama 1'de oluşturulan **"Runbook Test Kampanya"**yı bul, aç
- [ ] Alanlar editable olmalı (checker Campaigns'te update yapabiliyor)
- [ ] **"Değişiklikleri yayınla"** → **başarılı olmalı**, Durum: Yayınlandı, Sürüm sayısı artmalı

### 3.4 Siteye yansımasını doğrula
- [ ] Tarayıcıda `http://localhost:3000/kampanyalar/runbook-test-kampanya` aç → sayfa açılmalı, başlık doğru olmalı
- [ ] `http://localhost:3000/kampanyalar` listesinde de görünmeli
- [ ] **Görünmüyorsa hemen bug değildir** — cache'in tazelenmesi birkaç saniye sürebilir (ISR); 10-15
      saniye bekleyip tekrar dene. Hâlâ görünmüyorsa gerçek bir revalidation bug'ıdır, not al.

### 3.5 Delete denemesi (engellenmeli)
- [ ] "Runbook Test Kampanya"yı silmeyi dene → engellenmeli (checker da silemez, sadece NV Maker)

---

## 4. AŞAMA 3 — New Vertical Maker: tam yetki, tüm collection'lar

**Giriş:** `test-nv-maker@vodafonepay.local`

Bu rol her collection'da create/update/publish/delete yapabilmeli. Aşağıdaki HER collection için
**gerçekten bir kayıt oluştur, yayınla, sonra sil** (temiz bırakmak için). Alan değerleri örnektir,
gerçekçi bir şey girmeniz yeterli.

### 4.1 İçerik grubu

| Collection | Zorunlu alanlar | Test adımı |
|---|---|---|
| **Campaigns** | Title, Slug, Description, Image, Category | Yeni oluştur → doldur → Yayınla → siteyi doğrula (`/kampanyalar/<slug>`) → Sil |
| **Faq Items** | Question, Answer, Category | Yeni oluştur → doldur → Yayınla → Sil. Ayrıca listede **"Sürükleyerek sırala"** ile aynı kategorideki 2 soruyu yer değiştir, sayfayı yenileyip sıranın kalıcı olduğunu doğrula |
| **Blog Posts** | Title, Slug, Cover Image, Excerpt | Yeni oluştur → doldur → Yayınla → `/blog/<slug>` doğrula → Sil |
| **Announcements** | Title, Body | Yeni oluştur → doldur (Deeplink alanına örn. `/kampanyalar` yaz) → Yayınla → Sil |
| **Content Blocks** | Page, Block Type, (tipe göre Title/Text/Image) | Yeni oluştur → `blockType=step` seçip Title+Text doldur → Yayınla → Sil |
| **Representatives** | Business Name, Address, Province, District | Yeni oluştur → doldur → Yayınla → Sil |
| **Pages** | Title, Slug, en az 1 Layout bloğu | Yeni oluştur → Title/Slug doldur → Layout'a **"Blok Ekle"** ile Rich Text bloğu ekle → Yayınla → `/<slug>` doğrula → Sil |

### 4.2 Ücretler & Limitler grubu

| Collection | Zorunlu alanlar | Test adımı |
|---|---|---|
| **Fee Rows** | Label, Value | Yeni oluştur → doldur → Kaydet → Sil |
| **Limit Tables** | Title, en az 1 satır (rows: Category, Period, Unverified/Verified Limit) | Yeni oluştur → doldur → Kaydet → Sil |

### 4.3 Site Yapısı grubu

| Collection | Zorunlu alanlar | Test adımı |
|---|---|---|
| **Nav Links** | Label, Href, Section | Yeni oluştur → Section=`Footer — Yasal` seç → Kaydet. Aynı section'da 2. bir link daha ekleyip **sürükle-bırak sıralamayı** test et → ikisini de Sil |
| **Legal Pages** | Title, Intro | Mevcut bir kayda gir → Intro metnini ufak değiştir → Kaydet → geri al |
| **Cookie Rows** | Name, Provider, Party, Category, Description, Duration | Yeni oluştur → doldur → Kaydet → Sil |
| **Page Metas** | Page Key (benzersiz olmalı, örn. `/runbook-test`) | Yeni oluştur → doldur → Kaydet → Sil |
| **Contact Info** *(global, tek kayıt)* | — | `customerServiceText` alanını ufak değiştir → Kaydet → eski haline getir |

### 4.4 Ürün Sayfaları grubu

| Collection | Zorunlu alanlar | Test adımı |
|---|---|---|
| **Product Heroes** | Page, Image, Heading | Yeni oluştur → doldur → Kaydet → Sil |
| **Feature Cards** | Page, Icon, Title, Text | Yeni oluştur → doldur → Kaydet. Aynı page'de 2. kart ekleyip sürükle-bırak dene → ikisini de Sil |
| **Step Cards** | Page, Number, Text, Image | Yeni oluştur → doldur → Kaydet. Sürükle-bırak dene → Sil |

### 4.5 Sistem grubu

| Collection | Test adımı |
|---|---|
| **Media** | Yeni oluştur → herhangi bir görsel yükle, Alt metni gir → Kaydet → Sil |
| **Documents** | Yeni oluştur → bir PDF yükle → Kaydet → Sil |
| **Users — rol değiştirme** | Herhangi bir test kullanıcısını aç → Role alanını **geçici olarak** değiştir → Kaydet → **hemen eski haline getir** (rol değişikliği canlı etkili olur, dikkatli olun) |
| **Users — yeni kullanıcı** | "Yeni oluştur" → E-posta+Parola+Rol gir → Kaydet başarılı olmalı → oluşturduğunuz test kullanıcısını Sil |
| **Audit Logs** | Listeye gir → görüntülenebilmeli, **hiçbir satırı düzenleyemez/silemezsiniz** (salt-okunur koleksiyon, buton yok) |

---

## 5. AŞAMA 4 — New Vertical Checker: onaylayabilir, oluşturamaz

**Giriş:** `test-nv-checker@vodafonepay.local`

### 5.1 Create her yerde engellenmeli
Aşama 4'teki collection'ların **hepsinde** "Yeni oluştur" butonunun **görünmediğini** doğrula
(en az 5-6 tanesini örnekle: Campaigns, Faq Items, Media, Nav Links, Fee Rows, Product Heroes).

### 5.2 Update her yerde çalışmalı
NV Maker'ın Aşama 4'te oluşturup henüz silmediği (veya siz şimdi NV Maker ile taze bir taslak
oluşturup) bir kayıtta:
- [ ] Alanları düzenle → Kaydet başarılı olmalı
- [ ] Taslak durumundaysa **"Değişiklikleri yayınla"** başarılı olmalı (checker publish yapabilir)

### 5.3 Delete her yerde engellenmeli
- [ ] Herhangi bir kayıtta Sil dene → engellenmeli

### 5.4 Users
- [ ] Users listesine gir → **erişim reddedilmeli / boş listelenmeli** (tüm kullanıcıları göremez)
- [ ] `/admin/account`'a git → **kendi hesabına** erişebilmeli, Role alanını görebilmeli (değiştiremez)

### 5.5 Audit Logs
- [ ] Sol menüde **Audit Logs görünmemeli** (bu, kodun bilinçli tercihi — bkz. Bölüm 1)

---

## 6. Kapanış — Temizlik Kontrolü

- [ ] Bu runbook boyunca oluşturulan TÜM test kayıtları silindi mi? (Campaigns, Faq Items, Blog Posts,
      Announcements, Content Blocks, Representatives, Pages, Fee Rows, Limit Tables, Nav Links, Cookie
      Rows, Page Metas, Product Heroes, Feature Cards, Step Cards, Media, Documents, geçici Users kaydı)
- [ ] Contact Info ve Legal Pages'e yaptığınız geçici değişiklikler geri alındı mı?
- [ ] Değiştirdiğiniz herhangi bir kullanıcının rolü orijinaline döndü mü?
- [ ] `http://localhost:3000/kampanyalar` sayfasında "Runbook Test" içerikli hiçbir kayıt kalmadı mı?

---

## 7. Bilinen, Beklenen Davranışlar (bug SANMAYIN)

Bu oturumda test edilirken bulunan ve **henüz bilinçli olarak düzeltilmemiş** davranışlar — runbook'u
takip ederken karşılaşırsanız zaten bilinen bir bulgudur, tekrar raporlamanıza gerek yok:

1. **Bazı collection'larda "Sürükleyerek sırala" widget'ı, yazma yetkiniz olmasa bile tıklanabilir
   görünür.** Sürüklerseniz ekranda sıra değişmiş GİBİ görünür ama sunucu 403 ile reddeder — sayfayı
   yenilediğinizde eski sıra geri gelir. Veri bozulmaz, sadece anlık yanıltıcı bir görüntü.
2. **Bazı collection'lar (nav-links, page-meta, fee-rows, limit-tables, documents, representatives,
   pages, cookie-rows, product-heroes, feature-cards, step-cards, blog-posts) bu ortamda başlangıçta
   boş olabilir** — seed edilmemiş. İlk siz veri eklerseniz normal davranışı test etmiş olursunuz.
3. **Yetkisiz bir `/create` URL'ine gidildiğinde gösterilen mesaj "lütfen giriş yapın" der** — kullanıcı
   zaten giriş yapmış olsa bile. Mesaj metni yanıltıcı ama SONUÇ (erişim reddi) doğru.

---

## 8. Bug Bulursanız

Yukarıdaki Bölüm 7 dışında beklenmedik bir davranışla karşılaşırsanız not edin:
- Hangi kullanıcı (rol)
- Hangi collection / hangi kayıt
- Hangi aksiyon (create/update/publish/delete)
- Beklenen sonuç vs gerçek sonuç
- Varsa tarayıcı konsolundaki hata / network sekmesindeki HTTP status kodu
