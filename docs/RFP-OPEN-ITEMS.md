# RFP Açık Madde Listesi

**Kaynak:** `docs/RFP-GAP-ANALYSIS.md` (ana repo, 2026-08-11 tarihli analiz)
**Bu doküman:** O analizdeki her maddenin bu branch'teki (`claude/selam-login-disable-temp-725fb7`) güncel durumu.
**Tarih:** 2026-08-12

Notasyon: ✅ Karşılanıyor · 🟡 Kısmi/bilinçli sınırlı · ❌ Açık, kod ile kapatılabilir · ⬜ Kapsam dışı (kullanıcı kararı veya gerçek altyapı/3.parti bağımlılığı)

---

## 1. Hâlâ açık olan maddeler (❌) — kod ile kapatılabilir, henüz yapılmadı

| # | Madde | Neden açık | Efor |
|---|---|---|:--:|
| 3.2.2 | Editable desktop and mobile URLs (ayrı alanlar) | Hiç alan yok. Niş bir istek — çoğu modern sitede masaüstü/mobil için ayrı URL tutulmaz (responsive tasarım kullanılır), ama RFP açıkça istiyor. | S |
| 3.2.10 | SEO auditing and reporting — analitik araç entegrasyonu | Sitede hiç analytics/GTM entegrasyonu yok. Gerçek bir GA4/GTM hesabı ve tracking ID gerektirir — bu olmadan sahte bir entegrasyon eklemek anlamsız. | ⬜'e yakın — gerçek hesap bilgisi lazım |
| 3.2.11 | Multi-channel publishing (desktop, mobile, 3rd-party) | REST/GraphQL API teknik olarak mümkün kılıyor ama tasarlanmış bir "kanal" kavramı yok (hangi içerik hangi kanala gider). | M — gerçek bir 2. tüketici (mobil app, 3rd-party) olmadan test edilemez |
| 3.5.2-3.5.5 | Content Provider / Content Admin / Report Admin / CC Admin rol-özel ekranları (raporlama, SMS keyword, CC agent log) | Gerçek raporlama modülü, SMS gateway, CC (call center) sistemi entegrasyonu gerektiriyor — bunlar bu repo'nun üretebileceği şeyler değil. | ⬜'e yakın |
| §4 | Centralized error tracking / configurable error messages (Sentry vb.) | `src/lib/cms.ts`'te fail-loud logging var (R-08) ama merkezi bir hata izleme servisi (Sentry/Datadog) entegre değil — gerçek bir hesap/DSN gerektirir. | ⬜'e yakın |

---

## 2. Bilinçli olarak kapatılmayan maddeler (🟡) — teknik gerekçeyle

| # | Madde | Gerekçe |
|---|---|---|
| 3.1.8 | Active/inactive toggle (ayrı alan) | Artık her collection'da `versions.drafts` var (yayın durumu zaten var). Ayrı bir `isActive` boolean eklemek, "taslak ama aktif" gibi çelişkili durumlara yol açar — draft/publish zaten aynı işlevi görüyor. İstenirse eklenebilir ama gereksiz karmaşıklık riski var. |
| 3.2.5 | Rich text (tüm collection'larda) | Blog, Pages (RichTextBlock), Campaigns'te var; `LegalPages.intro` hâlâ düz textarea — hukuki metinlerde biçimlendirme ihtiyacı sınırlı olduğu için bilinçli olarak ertelendi. |
| 3.2.6 | Meta "keywords" alanı | Google 2009'dan beri meta keywords etiketini kullanmıyor — ölü bir SEO pratiği. title/description/OG zaten var (PageMeta). İstenirse eklenir ama gerçek SEO değeri yok. |
| 3.1.12 | Flexible/Extensible panel (iş birimi tarafından) | Payload config-as-code mimarisinin doğal sonucu — alan eklemek/çıkarmak hâlâ geliştirici + deploy gerektiriyor. Bu, Payload'ı bırakıp başka bir mimariye geçmeden kapanmaz. |
| 3.1.13 | Admin UI'dan alan yönetimi (no-code field builder) | Aynı mimari sınır — Payload'ın kendisi bunu desteklemiyor. |
| 3.2.14 | Localization — site tarafı | CMS içeriği tr/en localization altyapısı hazır (`payload.config.ts`), ama site (`vodafonepaycomtr`) tarafında dil değiştirici/route yok. Kullanıcı talimatıyla kapsam CMS-only tutuldu (bkz. bu oturumun ilk talimatı: "vodafonepaycomtr websitede olmasına gerek yok"). |

---

## 3. Kullanıcı kararıyla kapsam dışı (⬜)

| # | Madde | Karar |
|---|---|---|
| 3.1.9 | SSO (LDAP) gerçek entegrasyonu | Kullanıcı: "sadece rol simülasyonu" — gerçek LDAP dizini/auth stratejisi kurulmayacak, mevcut 4-rol RBAC yeterli. |
| 3.1.10, 3.1.11 | Ayrı test CMS ortamı, test→prod promosyon akışı | Kullanıcı: "ortam bağımlı, şu an gerek yok." |
| 3.5.1 | RFP'nin 5 isimli rol taksonomisi (Content Provider/Admin/Report Admin/Full Admin/CC Admin) | Kullanıcı: mevcut 4 rol (New Vertical Maker/Checker, Growth Maker/Checker) "değişmeyecek" — bu 4 permission şekli hâlâ sabit. 2026-08-19'da değişen tek şey bu 4 rolün AD grubuna nasıl bağlandığı — bkz. §7. |
| §5/§7 (tamamı) | OpenShift, Fortify, SonarQube-CI entegrasyonu, ArcSight/SIEM CEF export, Zabbix/SNMP monitoring, DR, CI/CD pipeline (GitHub Actions branch/deploy) | Kullanıcı: "github vs ci cd akısları su an ortam bagımlı ... onlara gerek yok." Bunların hepsi gerçek kurumsal altyapı/tedarikçi kararları — bir kod deposu bunları kapatamaz. |
| 3.1.16 | VEPAS/VPAY entegrasyonu | PoC kapsamında hiç ele alınmadı, entegrasyon yüzeyi bilinmiyor — RFP'nin kendisi de bunun kapsam netleştirmesi gerektiğini söylüyor. |
| 3.2.15 | Çoklu veritabanı (Oracle/MongoDB/Couchbase) yönetimi | RFP maddesi genel bir DB yönetim aracı gibi duruyor, CMS isteri değil — netleştirilmeli. |

---

## 4. Bu oturumda kapatılanlar (özet — detay için sohbet geçmişine bakınız)

- 3.1.1 Draft/publish tüm içerik collection'larında
- 3.1.2 Video + PDF desteği (Media + Documents collection)
- 3.1.3 Zamanlanmış yayın/kaldırma (startDate/endDate)
- 3.1.4 Image mgmt (boyut, focal point, caption)
- 3.1.6 Sürükle-bırak sıralama — **tüm** order'lı collection'lara genelleştirildi, canlı doğrulandı
- 3.1.7 Deeplink alanı
- 3.1.14 Maker-checker — RBAC uçtan uca kuruldu
- 3.1.15 Audit trail — AuditLogs collection + hook'lar
- 3.2.3 Breadcrumb — PageMeta üzerinden CMS'ten yönetiliyor
- 3.2.6/7/8 Meta tag/OG/dynamic meta — PageMeta + generateMetadata
- 3.2.9 Content versioning/rollback — evrensel
- 3.2.12 Preview — livePreview/admin.preview
- 3.2.13 Drag-and-drop sayfa tasarımı — Payload Blocks + Pages collection + dinamik route
- 3.3.1-3.3.3 Sayfa üretimi (kod yazmadan) — Pages/Blocks modeliyle gerçek
- 3.5.6 Full Admin aktivite log görüntüleme — AuditLogs
- 3.5.7 Türkçe admin paneli — i18n

---

## 5. Bu konuşmada eklenen yeni işler (henüz tamamlanmadı)

- CMS admin TR/EN dil değiştiricisinin varsayılanının TR olduğunu doğrulama + gerçek geçiş testi
- Custom admin bileşenlerinin (ReorderWidget vb.) locale-aware hale getirilmesi ve bunun bundan sonraki her yeni component için kural olarak benimsenmesi
- Her collection için "Yardım (?)" butonu — sayfa bazlı adım adım kullanım kılavuzu
- 4 test kullanıcısıyla tarayıcıda uçtan uca RBAC/CRUD akış testi (şifre sıfırlama kullanıcıdan bekleniyor)

---

## 6. LDAP kimlik doğrulama planı (RFP feedback 3.4 — henüz İMPLEMENT EDİLMEDİ, sadece plan)

Kullanıcının 3.4 maddesinde tarif ettiği hedef mimari — bu bölüm gelecekte LDAP entegrasyonuna başlarken referans olsun diye yazıldı, bu oturumda kod olarak kurulmadı:

- **Kimlik kaynağı:** vodafone.local LDAP / AccessPoint. CMS kullanıcı hesapları artık burada yönetilecek, `users` collection'ında elle oluşturulmayacak.
- **Giriş kuralı:** Bir LDAP kullanıcısı CMS'e SADECE şu ikisi doğruysa girebilir: (1) LDAP'ta hesabı var VE (2) 4 tanımlı rolden birine (`ROLES` — `access/roles.ts`) sahip. Rolü olmayan/4 rol dışı bir LDAP kullanıcısı giriş yapamaz.
- **Rol yönetimi CMS dışında:** Rol ataması LDAP/AccessPoint tarafında yapılacak, CMS admin panelinden bir kullanıcının rolü değiştirilemeyecek (bugün `isNewVerticalMaker` bunu yapabiliyor — LDAP bağlandığında bu yetki kaldırılmalı).
- **Self-servis tamamen kapalı:** Parola, e-posta, hesap aktif/pasif durumu — hiçbiri CMS içinden değiştirilemeyecek (LDAP'ın sorumluluğu). Bu, 3.5'teki profil sayfası sadeleştirmesiyle örtüşüyor.
- **Şu an neden yapılmadı:** Gerçek bir LDAP sunucusu/AccessPoint entegrasyon bilgisi (host, bind DN, arama filtresi) olmadan Payload'a bir `authStrategy` eklemek test edilemeyen, sahte bir entegrasyon olurdu. Bu oturumda sadece LDAP gelene kadar makul olan iki parça yapıldı: forgot-password kapatıldı (`views.forgot`/`views.reset` override — `cms/src/components/ForgotPasswordDisabled.tsx`) ve Users listesi tüm rollere salt-okunur açıldı (`cms/src/collections/Users.ts`).
- **LDAP bağlanınca yapılacaklar (sıralı):** (1) Payload'a custom bir `authStrategy` eklenip LDAP bind/arama ile doğrulama yapılacak; bu strateji, kullanıcının AD grup listesini `cms/src/access/roleMapping.ts`'teki `resolveRoleFromLdapGroups()`'a verip `role` değerini üretecek (bkz. §7 — bu fonksiyon bugün hazır, sadece hiçbir yerden çağrılmıyor); (2) `users` collection'ının `password`/`role` alanları LDAP'tan senkronlanacak şekilde salt-okunur yapılacak (bugünkü `role` select alanı ve `auth: true` şifre girişi kaldırılacak); (3) `isNewVerticalMaker`'ın Users üzerindeki create/update/delete yetkisi kaldırılacak (LDAP artık tek doğruluk kaynağı); (4) mevcut 4 test kullanıcısı (`docs/TEST-USERS.MD`) gerçek LDAP hesaplarıyla değiştirilecek.

---

## 7. Rol modelinin AD grubundan ayrıştırılması (2026-08-19)

Kullanıcı geri bildirimi: "Butterfly"daki (referans alınan başka bir CMS) Admin/Editor/Author/Viewer rol hiyerarşisi generic — herhangi bir departmanın AD grubuna atanabiliyor, yeni bir ekip geldiğinde sadece AD'de grup açılıyor, CMS tarafı değişmiyor. Bizim 4 rolümüz ise o zamana kadar hem isim hem DEĞER olarak doğrudan Vodafone AccessPoint'in iki iş birimine (New Vertical, Growth) ait LDAP grup adı string'leriydi (`RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW` vb.) — `cms/src/access/roles.ts`'teki `ROLES` sabiti bu string'leri birebir taşıyordu ve her erişim kontrolü fonksiyonu bunlarla karşılaştırıyordu.

**Yapılan değişiklik:**
- `ROLES`'un değerleri artık kendi iç sözlüğümüz (`new_vertical_maker`, `new_vertical_checker`, `growth_maker`, `growth_checker`) — AccessPoint'in grup adlandırma şemasından bağımsız.
- Yeni dosya `cms/src/access/roleMapping.ts`: `LDAP_GROUP_TO_ROLE` — "hangi AD grubu hangi role denk geliyor" eşlemesi tek bir yerde. `resolveRoleFromLdapGroups(groups: string[])` bugünün 4 AccessPoint grup adını bu 4 role çeviriyor; henüz hiçbir auth stratejisinden çağrılmıyor (gerçek LDAP yok), ama §6'daki entegrasyon planının 1. adımının tam olarak nereye bağlanacağı artık belli.
- Sonuç: bugünkü 4 permission şeklinden (tam yetki-maker, tam yetki-checker, kampanya-scope maker, kampanya-scope checker) birini ihtiyaç duyan YENİ bir departman için artık `roleMapping.ts`'e tek satır eklemek yeterli — `roles.ts`, `rolePermissions.ts` veya herhangi bir collection dosyasına dokunmadan. Örnek: `LEGAL_DEPT_GROUP: ROLES.GROWTH_MAKER` eklenirse Legal ekibi, Growth'un bugün sahip olduğu "sadece Campaigns'te oluştur/düzenle, yayınlayamaz" yetkisiyle CMS'e girebilir.
- **Kapanmayan sınır (bilinçli, §3.1.12 ile aynı gerekçe):** Bu 4 permission ŞEKLİ hâlâ sabit kod. Yeni bir departman bu 4 şekilden HİÇBİRİNE uymayan bir yetki setine (örn. sadece belirli 3 collection'a yazma) ihtiyaç duyarsa, yine `roles.ts` + `rolePermissions.ts` + ilgili collection'lara yeni kod + deploy gerekir. Çözülen kısım "var olan bir yetki şeklini yeni bir gruba atamak" — çözülmeyen kısım "sıfırdan yeni bir yetki şekli tanımlamak" (bu, Payload'ın config-as-code doğası gereği zaten kapanamaz).
- Local docker DB'de (`users.role` kolonu, Postgres enum) mevcut 6 kullanıcının rol değeri eski AccessPoint string'lerinden yeni iç sözlüğe migrate edildi; canlıda gerçek LDAP bağlanırken zaten §6'daki plan uygulanacağı için bu migration kalıcı bir endişe değil.
- Kullanıcının ayrıca sorduğu iki madde, bilinçli olarak KOD DEĞİŞİKLİĞİ GEREKTİRMEDEN kapatıldı:
  - **Users'a department/title/phone gibi LDAP-senkron alanlar:** Eklenmedi — bunlar gerçekten LDAP'tan senkronize edilecek alanlar, ve henüz senkronize edilecek bir LDAP kaynağı yok (aynı `username` alanının bugünkü "boş kalabilir, LDAP bağlanınca dolar" durumu). Sahte/boş placeholder alan eklemek yalnızca kafa karıştırır. `avatar` (profil fotoğrafı) ve `preferredLocale` (dil tercihi) ise LDAP'tan gelmeyen, CMS'e özgü tercihler olarak zaten var ve kalmaya devam ediyor.
  - **"Sistem ayarları / rol atama" admin ekranı (Butterfly'daki `/settings`, `/roles/assign` gibi):** Bilinçli olarak ŞİMDİ kodlanmadı. Gerekçe: gerçek LDAP bağlanana kadar rol ataması zaten CMS içinden elle yapılıyor (`Users` koleksiyonunun `role` alanı, `isNewVerticalMaker` yetkisiyle) ve local docker testinde buna ihtiyaç yok; LDAP bağlandığında da §6'nın 3. maddesi gereği bu yetkinin CMS'ten TAMAMEN kaldırılması planlanıyor — yani bugün inşa edilecek bir "rol atama ekranı" LDAP bağlanır bağlanmaz zaten kaldırılacaktı. Canlıya geçiş öncesi, LDAP entegrasyonu netleşince tekrar değerlendirilmeli — **açık madde olarak burada işaretli kalsın.**

---

## 8. Pages koleksiyonu — Butterfly (referans vendor CMS) parity analizi (2026-08-19)

Amaç: bu proje vendor'dan bağımsızlaşma testi olarak yürütülüyor (in-house ekip vendor'ın
yaptığını üretebiliyor mu?). Kullanıcı, vendor'ın "Page (sayfa) oluşturma" akışını belgeleyen
kendi referans dokümanını (`docs/PAGE-CREATE-PRODUCTION.MD` — Laravel/Blade/MySQL, bizim kod
tabanımızla ilgisi yok, sadece davranış referansı) verip bizim `Pages` koleksiyonumuzu (zaten
var olan blok-tabanlı sayfa oluşturucu, RFP §3.3) buna karşı denetletti: "eksik olmamalı,
fazla olabilir."

**Zaten üstün olduğumuz noktalar:** içerik tek `content` alanı yerine sürükle-bırak blok
sistemi (vendor'ın sabit "template" seçiminden daha esnek — her sayfa kendi kompozisyonunu
seçer), draft/published + Payload'ın otomatik versiyon geçmişi (vendor'ın elle yazdığı
`page_revisions` tablosundan daha sağlam — her save otomatik versiyon).

**Net eksikler, doğrudan kapatıldı:**
- Slug artık `turkishSlugify`/`uniqueSlug` ile `title`'dan otomatik üretiliyor (BlogPosts/
  Categories'teki aynı desen) — önceden zorunlu elle giriliyordu.
- `createdBy` provenance alanı eklendi (Campaigns'teki aynı desen).

**Karar gerektiren eksikler — kullanıcıyla netleştirildi (AskUserQuestion), 2 tanesi eklendi:**
- **`parent` (üst sayfa referansı) — EKLENDİ, basit versiyon:** breadcrumb'da "Ana Sayfa >
  Üst Sayfa > Bu Sayfa" gösterir, URL hâlâ düz `/{slug}` kalır (vendor'ın tam iç içe
  `/{parent}/{slug}` routing'i EKLENMEDİ — site menü hiyerarşisi zaten ayrı NavLinks
  koleksiyonunun işi, route yapısını değiştirmeye değecek bir ihtiyaç yok). Kendi kendinin
  üst sayfası olması hem admin UI'da (`filterOptions`) hem sunucu tarafında
  (`preventSelfParent` beforeValidate hook, `Pages.ts`) engelleniyor.
- **`visibility` (public/private) — EKLENDİ, şifre koruması HARİÇ:** private+published bir
  sayfa yayın durumuna rağmen anonim ziyaretçiye hiç gösterilmiyor, `generateStaticParams`/
  sitemap'e girmiyor — `pagesRead` özel access fonksiyonu (`Pages.ts`)
  `publishedOrAuthenticated`'ın CMS-oturumu/preview-secret muafiyetini aynen kullanıp anonim
  istekleri ayrıca `visibility=public` ile kısıtlıyor. Şifre korumalı sayfa (vendor'ın 3.
  görünürlük seçeneği) EKLENMEDİ — public sitede hiç ziyaretçi-hesap sistemi yok, bir "şifre
  giriş ekranı" ayrı bir özellik olurdu; bugünkü ihtiyaç public/private ayrımıyla karşılanıyor.
- **`archived` (3. durum) — EKLENMEDİ:** RFP'de zaten bilinçli karar var (§2, "ayrı isActive/
  archived alanı gereksiz karmaşıklık" — draft/published ikilisi yeterli). Bu tutarlılıkla
  kullanıcı onayıyla Pages'e de uygulanmadı.
- **Yazar-scope erişim (Butterfly'nin "Author sadece kendi sayfasını görür/düzenler" rolü) —
  EKLENMEDİ:** bizim 4 rolümüzün (New Vertical Maker/Checker, Growth Maker/Checker) hiçbiri
  "sadece kendi oluşturduğunu görür" şeklinde değil — böyle bir kısıt eklemek bizim gerçek
  rol modelimizle örtüşmeyen, sadece Butterfly'ye benzemek için icat edilmiş yeni bir davranış
  olurdu. Kullanıcı onayıyla eklenmedi.

**Şema migration'ı:** bu ortamda prod container'da Payload'ın dev-only `push`'ı çalışmıyor
(§5'teki genel not) — `pages`/`_pages_v` tablolarına `parent_id`/`visibility`/`created_by_id`
kolonları elle eklendi, tam SQL `docs/STATUS.md` §2.7'de.

Canlı doğrulandı: API üzerinden üst+alt sayfa oluşturuldu, breadcrumb sitede doğru render
oldu, private sayfa hem public API'de hem sitede (404) doğru gizlendi, self-parent denemesi
400 ile reddedildi. cms: 145/145 test, root: 106/106 test, her iki tarafta typecheck+lint temiz.

---

## 9. Header/Footer menü yönetimi, sayfa envanteri, layout açıklamaları (2026-08-19)

Kullanıcı: header'daki "Ürünler" menüsü ve footer'daki linkler (Kurumsal/Sık Sorulanlar/
Kampanyalar/Yasal) CMS'ten yönetilebiliyor mu — ekle/çıkar/sırala?

**Bulgu — koddaki mimari zaten doğruydu, veri eksikti:** `NavLinks` koleksiyonu tam da bu iş
için tasarlanmış (`section` alanı 6 yeri kapsıyor, `ReorderWidget` sürükle-bırak zaten bağlı,
`href` serbest metin — herhangi bir iç/dış adresi kabul ediyor). Ama local DB'de 0 satır vardı;
`Header.tsx`/`Footer.tsx`'teki hardcoded fallback dizileri (kodun kendi yorumunda zaten
"bu fallback ölü kod değil, şu an sahnede olan budur" diye açıkça yazıyordu) tüm görünümü
üretiyordu. Editör NavLinks'e gitse bile hiçbir değişiklik göremezdi. Kapatıldı: fallback'teki
32 satırın hepsi gerçek, yayınlanmış `nav-links` kaydı olarak oluşturuldu; canlı test edildi
(bir satır silinince header'dan gerçekten kayboldu, geri eklenince geri geldi).

**Sayfa envanteri:** Editör-yapımı `Pages` dokümanları zaten İçerik Yönetimi'nin "Sayfalar"
tab'ında listeleniyordu. Eksik olan ~20 geliştirici-yapımı rota (src/app/*/page.tsx) için
İçerik Yönetimi'ne yeni, elle bakımlı bir "Site Sayfaları (geliştirici yapımı)" referans
tablosu eklendi (adres + hangi menüde bağlı olduğu).

**Layout blok açıklamaları:** Pages'in 6 bloğuna (Hero/Metin/SSS/Kampanya Grid/Video/Logo
Grid) "ne zaman kullanılır" açıklaması eklendi — Payload'ın Block tipinde `admin.description`
olmadığı için (`tsc` ile doğrulandı) bu metin `labels.singular`'a taşındı; her bloğun tek tek
alanlarına da iş birimi diliyle örnekli açıklamalar eklendi.

**"Üst sayfa ekleme çalışmıyor" şikayeti — bug değil, veri yokluğu:** `pages` tablosu 0
kayıtlıydı, seçilecek başka Page yoktu. Canlı kanıtlandı: bir Page kaydedilince ikinci bir
Page'in Üst Sayfa alanında gerçekten seçenek olarak çıktı. Alan açıklaması bunu netleştirecek
şekilde güncellendi.

---

## 10. 5 ürün sayfasının Pages'e göçü — pilot (2026-08-19)

Kullanıcı sorusu: "Ürünler" menüsündeki 5 sayfa (vodafone-pay-uygulama, aninda-bakiye,
faturana-yansit, vodafone-pay-kart, qr-ile-faturana-yansit) `Pages` koleksiyonundan mı
yaratılmalıydı? Cevap: hayır — bunlar `Pages`'ten ÖNCE var olan, kendi özel koleksiyonlarından
(`ProductHeroes`/`FeatureCards`/`StepCards`/`ContentBlocks`) beslenen, elle yazılmış Next.js
rotalarıydı; `Pages` sonradan NET YENİ sayfalar için eklendi, bunların yerine geçmesi için değil
(bkz. `Pages.ts`'in kendi üst yorumu). Kullanıcı yine de "silelim, sıfırdan Pages ile kuralım,
eksik blok varsa görürüz" dedi — bilinçli, geri dönüşü zor bir karar olarak onaylandı.

**Gap analizi:** 5 sayfanın kullandığı bileşenler çıkarıldı. Karşılığı olmayan 4 tanesi için
yeni jenerik blok tipi eklendi (`Pages.ts`): **İkonlu Kartlar** (icon+başlık+metin, 3'lü grid —
`CardsWithIcons`/`FeatureCards`'ın karşılığı), **Adım Listesi** (numara+metin+görsel —
`PhoneStepsCarousel`/`StepCards`'ın karşılığı), **Görsel+Metin Slayt** (`AppFeatures`/
`EarnWithCard`/`ContentBlocks` "slide" tipinin karşılığı), **Çoklu Video** (başlıklı video
listesi — `VideoGuideSection`'ın karşılığı; tekli `Video` bloğundan farkı sekmeli/listeli
olması). 3 bileşen HİÇBİR ŞEKİLDE blok olamıyor ve bilinçli olarak dışarıda bırakıldı:
`WhereCanIBuy` (hiç CMS'ten beslenmiyor, statik), `VideosWithTabs` (daha önce bilinçli olarak
CMS'e taşınmamıştı), `LeadFormCta` (gerçek submit eden bir form, "içerik" değil).

**Pilot: Vodafone Pay Uygulaması.** En basit sayfa (sadece Hero + Ayrıcalıklar slaytları +
Nasıl Kazanırım adımları — SSS/FeatureCards/StepCards yok) uçtan uca göçürüldü:
1. Mevcut CMS verisi (`content-blocks` page=uygulama-ayricalikli/uygulama-nasil-kazanirim)
   API'den okunup yeni `Pages` dokümanına (aynı slug: `vodafone-pay-uygulama`) Hero +
   Görsel-Metin-Slayt + Adım Listesi bloklarıyla taşındı — **not:** bu içerik `_status: draft`
   olarak duruyordu, yani şu ana kadar sitede hiç GÖRÜNMÜYORDU; göç bu içeriği ilk kez
   canlıya taşımış oldu (regresyon değil, iyileştirme).
2. `src/app/vodafone-pay-uygulama/page.tsx` (elle yazılmış rota) silindi — artık
   `src/app/[...slug]/page.tsx` (Pages catch-all) bu slug'ı karşılıyor. URL değişmedi, NavLinks
   kaydı dokunulmadan çalışmaya devam etti.
3. Artık kullanılmayan `AppFeatures.tsx` bileşeni ve onun testi silindi (`ProductHero`/
   `HowToEarn` SİLİNMEDİ — diğer 4 sayfa hâlâ kullanıyor). Artık kullanılmayan 6
   `content-blocks` kaydı (uygulama-ayricalikli/uygulama-nasil-kazanirim) silindi.
4. `docs/PAGE-CREATE-PRODUCTION.MD` analizinde eklenen "Site Sayfaları (geliştirici yapımı)"
   referans tablosundan bu satır çıkarıldı — artık gerçekten `Pages` koleksiyonunda, o tab'da.

Canlı doğrulandı: `/vodafone-pay-uygulama` artık `Pages` dokümanından render ediyor, Hero +
3 slayt + 3 adım doğru görünüyor, breadcrumb doğru, header'daki "Ürünler" linki hâlâ çalışıyor.
Şema migration'ı (bu ortamda prod container'da Payload'ın `push`'ı çalışmadığı için — bkz. §5)
gerekti: 4 yeni blok tipinin 12 Postgres tablosu (`pages_blocks_icon_cards` +
`_cards`/`_steps`/`_slides`/`_videos` alt tabloları, + hepsinin `_pages_v_blocks_*` versiyon
karşılıkları) elle oluşturuldu.

**Kalan 4 sayfa henüz göçürülmedi** — kullanıcıdan devam kararı bekleniyor. Her biri için aynı
WhereCanIBuy/VideosWithTabs/LeadFormCta sorusu tekrar gündeme gelecek (hangi sayfada hangisi
var, o bölüm nasıl ele alınacak — bkz. yukarıdaki liste).

---

## 11. Footer'daki Kampanyalar/Sık Sorulanlar — kaydın kendisinden yönetim (2026-08-19)

Kullanıcı isteği: footer'daki "Kampanyalar" ve "Sık Sorulanlar" sütunlarında en fazla 6'şar
kayıt gösterilsin, hangi kampanya/soru gösterileceğini editör Campaigns/FaqItems'taki ilgili
kayda giderek "Footer'da Göster" ile seçsin, 1-6 arası bir sıra girebilsin ya da boş bırakırsa
otomatik boş olan ilk sıraya otomatik yerleşsin. Footer bileşeninin YAPISI değişmeyecek, ama bu
iki sütun hiçbir şey işaretlenmemişken BOŞ başlayacak (önceki turda seedlenen genel NavLinks
kayıtlarının yerini alıyor — bkz. §9).

**CMS tarafı:** `Campaigns`/`FaqItems`'a `showInFooter` (checkbox) + `footerOrder` (1-6, sidebar/
koşullu görünür) eklendi. Yeni paylaşılan hook `assignFooterOrder` (`cms/src/hooks/ordering.ts`)
— mevcut `assignNextOrder`/`assignNextHomepageOrder`'dan (ikisi de "en yüksek + 1" mantığında,
sınırsız) BİLİNÇLİ OLARAK farklı: footer sabit 6 slotlu olduğu ve bir kayıt kaldırıldığında
slot boşaldığı için, "en yüksek + 1" burada 6 dolup boşaldıktan sonra cap'i aşan bir "7" üretirdi.
Bunun yerine 1-6 arasında BOŞ olan ilk slotu buluyor (gap-filling) — kullanıcının kendi isteği
zaten buydu. Elle girilen bir sıra, aynı slotu tutan başka bir kayıtla çakışırsa 400 ile
reddediliyor (o kaydın adıyla); 7. kaydı işaretlemeye çalışmak "footer'da zaten en fazla 6 kayıt
gösteriliyor" hatasıyla reddediliyor.

**Site tarafı:** `getFooterCampaigns()`/`getFooterFaqItems()` (`src/lib/cms.ts`) —
`showInFooter=true`, `sort=footerOrder`, `limit=6`. `Footer.tsx` yeniden yapılandırıldı:
Kurumsal/Yasal sütunları hâlâ NavLinks + fallback (§9'daki gibi); Sık Sorulanlar/Kampanyalar
sütunları artık bu iki fonksiyondan besleniyor, **fallback YOK** — hiçbir kayıt işaretlenmemişse
sütun başlığı görünür ama liste boş kalır, tam istenen davranış. Kampanya linki kendi detay
sayfasına (`/kampanyalar/{slug}`) gidiyor; SSS linki genel `/sikca-sorulan-sorular` sayfasına
gidiyor (tekil soruya deep-link için sitede zaten bir çapa/anchor mekanizması yok — kapsam dışı
bırakıldı, ayrı bir istek olarak gelirse eklenir).

**Artık gereksiz hale gelen NavLinks kayıtları temizlendi:** §9'da seedlenen 11 satır
(footer-sss: 6, footer-kampanyalar: 5) silindi; NavLinks'in `section` seçeneklerinden bu ikisi
çıkarıldı (editör artık oradan yeni satır ekleyemez — CMS'te tek doğru yer Campaigns/FaqItems'ın
kendi "Footer'da Göster" kutusu).

**Canlı doğrulama sırasında bulunan ayrı bir sorun (ilgisiz, önceden var olan):** `next build`
sırasında CMS henüz ayakta değildi, bu yüzden anasayfanın statik prerender'ı BOŞ CMS
sonuçlarıyla üretilip 1 saatlik revalidate penceresine kilitlendi — üstelik `cmsFetch`'in
`fetch()` çağrıları da aynı `revalidate: 3600` ile önbelleklendiği için, ISR'ın arka plan
yenilemesi bile aynı boş sonucu tekrar kullanıyordu (saat dolana kadar). Kod hatası değil —
`docker exec vodafonepaycomtr printenv REVALIDATE_SECRET` ile alınan secret'la
`POST /api/revalidate` her etkilenen tag için (`campaigns`, `faq-items`, `content-blocks`,
`nav-links`, `pages`) çağrılarak elle tazelendi. Bu, container her rebuild edildiğinde (CMS
henüz tam ayağa kalkmadan `app` build'i başlarsa) tekrar olabilir — kalıcı çözüm CI/CD'de
build sırasını (önce CMS sağlıklı, sonra site build) garantilemek, bu ortamda elle iş.

Canlı doğrulandı: bir kampanya + bir SSS "Footer'da Göster" ile işaretlendi, footer'da doğru
göründü (kampanya kendi detay sayfasına linkliyor), sonra geri kaldırılıp footer tekrar boş
hale getirildi (kullanıcı kendi akışını sıfırdan denesin diye). cms: 153/153 test (+8 yeni),
root: 110/110 test (+4 yeni), her iki tarafta typecheck+lint+build temiz.
