/**
 * Per-collection admin help content, shown by <HelpButton> (see
 * cms/src/components/HelpButton.tsx). Each entry is keyed by the
 * collection/global slug and carries tr/en copy — editors get real,
 * page-specific "how do I..." steps instead of guessing at Payload's
 * generic UI. Add an entry here whenever a new collection is created;
 * HelpButton renders nothing if a slug has no entry, so a missing one
 * fails silently rather than breaking the admin.
 */

export type HelpContent = {
  title: string;
  steps: string[];
};

export type HelpEntry = {
  tr: HelpContent;
  en: HelpContent;
};

export const HELP_CONTENT: Record<string, HelpEntry> = {
  users: {
    tr: {
      title: "Kullanıcılar",
      steps: [
        "Yeni kullanıcı eklemek için sağ üstteki 'Yeni oluştur' butonuna tıklayın, e-posta ve geçici bir şifre girin.",
        "Rol atamak için kullanıcıyı açın, 'Role' alanından 4 sabit rolden birini seçin: New Vertical Maker/Checker veya Growth Maker/Checker. Bu rol, ileride gerçek LDAP bağlandığında doğrudan eşlenecek.",
        "Rolü değiştirmek mevcut oturumları etkilemez — kullanıcı tekrar giriş yaptığında yeni rolle çalışır.",
        "Bir kullanıcıyı geçici olarak durdurmak için 'Hesabı Etkinleştir/Devre Dışı Bırak' seçeneğini kullanın; silmek yerine bunu tercih edin, geçmiş audit kayıtları korunur.",
        "Şifre sıfırlamak için kullanıcıyı açın → 'Parolayı Değiştir' → yeni şifreyi girip kaydedin.",
        "Kim neyi ne zaman değiştirdiğini görmek için sol menüden 'Audit Logs'a bakın.",
      ],
    },
    en: {
      title: "Users",
      steps: [
        "To add a new user, click 'Create new' at the top right, enter an email and a temporary password.",
        "To assign a role, open the user and pick one of the 4 fixed roles under 'Role': New Vertical Maker/Checker or Growth Maker/Checker. This will map directly once real LDAP is connected.",
        "Changing a role doesn't affect an active session — it takes effect on the user's next login.",
        "To temporarily stop a user, use 'Enable/Disable Account' instead of deleting — this keeps their audit history intact.",
        "To reset a password, open the user → 'Change Password' → enter and save the new password.",
        "To see who changed what and when, check 'Audit Logs' in the left menu.",
      ],
    },
  },
  media: {
    tr: {
      title: "Medya",
      steps: [
        "Görsel veya video yüklemek için 'Yeni oluştur' → dosyayı sürükleyip bırakın (image/* ve video/* desteklenir).",
        "'Alt' alanı erişilebilirlik ve SEO için zorunlu — görselin ne olduğunu kısaca açıklayın.",
        "Payload otomatik olarak farklı boyutlarda türevler üretir (responsive image sizes) — ayrıca bir şey yapmanız gerekmez.",
        "Bir medya dosyasını değiştirmek yerine yeni bir tane yükleyip ilgili içerikteki referansı güncelleyin; eski dosyayı kullanan başka içerik olabilir.",
      ],
    },
    en: {
      title: "Media",
      steps: [
        "To upload an image or video, click 'Create new' → drag and drop the file (image/* and video/* are supported).",
        "The 'Alt' field is required for accessibility and SEO — briefly describe what the image shows.",
        "Payload automatically generates responsive image size variants — no extra action needed.",
        "Instead of replacing a media file in place, upload a new one and update the reference in the content that uses it — other content may still depend on the old file.",
      ],
    },
  },
  documents: {
    tr: {
      title: "Dokümanlar",
      steps: [
        "PDF ve diğer belgeleri buraya yükleyin (örn. sözleşme, form).",
        "Yüklenen dosyanın URL'i otomatik oluşur; bu URL'i ilgili sayfadaki bir link alanına (örn. Legal Pages, Pages) yapıştırabilirsiniz.",
        "Bir belgeyi güncellerken eski URL'in bozulmaması için mümkünse aynı dosyayı değiştirmek yerine yeni belge yükleyip linkleri güncelleyin.",
      ],
    },
    en: {
      title: "Documents",
      steps: [
        "Upload PDFs and other files here (e.g. contracts, forms).",
        "The uploaded file gets an automatic URL — paste this URL into a link field on the relevant page (e.g. Legal Pages, Pages).",
        "When updating a document, prefer uploading a new file and updating links rather than replacing the file in place, so the old URL doesn't break unexpectedly.",
      ],
    },
  },
  "audit-logs": {
    tr: {
      title: "Denetim Kayıtları",
      steps: [
        "Bu liste salt-okunurdur — hiçbir kayıt buradan elle eklenemez, değiştirilemez veya silinemez.",
        "Her kayıt: hangi kullanıcının, hangi collection'da, hangi kaydı, ne zaman değiştirdiğini gösterir.",
        "Login/logout olayları da burada kullanıcı e-postası ve IP ile birlikte tutulur.",
        "Yalnızca New Vertical — Maker rolü tüm kayıtları görür — diğer roller sadece kendi hesaplarıyla yaptıkları işlemleri görür.",
      ],
    },
    en: {
      title: "Audit Logs",
      steps: [
        "This list is read-only — nothing here can be manually added, edited, or deleted.",
        "Each entry shows which user changed which record in which collection, and when.",
        "Login/logout events are also recorded here, together with the user's email and IP.",
        "Only the New Vertical — Maker role sees every entry — other roles only see actions performed by their own account.",
      ],
    },
  },
  campaigns: {
    tr: {
      title: "Kampanyalar",
      steps: [
        "Yeni kampanya oluştururken 'slug' alanı URL'i belirler: /kampanyalar/{slug}.",
        "'body' ve 'terms' alanları zengin metin editörüdür — kalın, liste, link gibi biçimlendirme yapabilirsiniz.",
        "'campaignStatus' alanıyla kampanyayı aktif/pasif yapabilirsiniz; 'startDate'/'endDate' verirseniz kampanya o tarih aralığı dışında otomatik olarak listelerden kalkar (detay sayfası yine erişilebilir kalır).",
        "Kaydettiğinizde önce taslak olarak kalır; sitede görünmesi için sağ üstten 'Yayınla' demeniz gerekir.",
        "Yayınlamadan önce sonucu görmek için 'Önizle' (preview) butonunu kullanın.",
      ],
    },
    en: {
      title: "Campaigns",
      steps: [
        "When creating a campaign, the 'slug' field determines the URL: /kampanyalar/{slug}.",
        "'body' and 'terms' are rich text editors — you can use bold, lists, links, etc.",
        "Use 'campaignStatus' to make a campaign active/inactive; if you set 'startDate'/'endDate', the campaign is automatically dropped from listings outside that range (the detail page stays reachable).",
        "Saving keeps it as a draft — click 'Publish' at the top right for it to appear on the site.",
        "Use the 'Preview' button to see the result before publishing.",
      ],
    },
  },
  "faq-items": {
    tr: {
      title: "Sık Sorulanlar",
      steps: [
        "Her SSS bir 'category' değerine bağlıdır (örn. anasayfa, aninda-bakiye) — bu, hangi sayfada göründüğünü belirler.",
        "Liste sayfasının üstündeki 'Sürükleyerek sırala' paneliyle aynı kategori içindeki soruları sürükleyip sıralayabilirsiniz.",
        "Sıralama yalnızca aynı kategori içinde geçerlidir, farklı kategoriler birbirini etkilemez.",
      ],
    },
    en: {
      title: "FAQ Items",
      steps: [
        "Each FAQ item belongs to a 'category' (e.g. homepage, instant-balance) — this determines which page it appears on.",
        "Use the 'Drag to reorder' panel at the top of the list to reorder questions within the same category.",
        "Reordering only applies within one category — other categories are unaffected.",
      ],
    },
  },
  "blog-posts": {
    tr: {
      title: "Blog Yazıları",
      steps: [
        "'slug' alanı URL'i belirler: /blog/{slug}.",
        "'body' zengin metin editörüdür.",
        "Kaydettiğinizde taslak kalır; sitede görünmesi için 'Yayınla' gerekir.",
        "Arşivlemek isterseniz ilgili durum alanını kullanın — arşivlenen yazı liste sayfasından kalkar ama detay sayfası erişilebilir kalır.",
      ],
    },
    en: {
      title: "Blog Posts",
      steps: [
        "The 'slug' field determines the URL: /blog/{slug}.",
        "'body' is a rich text editor.",
        "Saving keeps it as a draft — click 'Publish' for it to appear on the site.",
        "To archive a post, use the status field — an archived post drops off the listing page but its detail page stays reachable.",
      ],
    },
  },
  announcements: {
    tr: {
      title: "Duyurular",
      steps: [
        "'title' ve 'body' zorunludur; 'body' içinde paragraflar arasına boş satır bırakabilirsiniz.",
        "'deeplink' verirseniz duyuru tıklanabilir olur (örn. /kampanyalar/{slug} veya bir uygulama linki).",
        "Liste üstündeki panelden duyuruları sürükleyerek sıralayabilirsiniz.",
      ],
    },
    en: {
      title: "Announcements",
      steps: [
        "'title' and 'body' are required; you can leave a blank line between paragraphs in 'body'.",
        "If you set 'deeplink', the announcement becomes clickable (e.g. /kampanyalar/{slug} or an app link).",
        "Use the panel above the list to drag-and-drop reorder announcements.",
      ],
    },
  },
  "content-blocks": {
    tr: {
      title: "İçerik Blokları",
      steps: [
        "Bu collection, anasayfa ve ürün sayfalarındaki adım/video/logo gibi tekrarlayan blokları besler.",
        "'page' alanı hangi sayfaya ait olduğunu belirler (örn. anasayfa-steps, kart-video-guide) — sıralama bu değere göre gruplanır.",
        "Liste üstündeki panelden aynı 'page' grubundaki blokları sürükleyerek sıralayabilirsiniz.",
      ],
    },
    en: {
      title: "Content Blocks",
      steps: [
        "This collection feeds recurring blocks (steps/video/logo) on the homepage and product pages.",
        "The 'page' field determines which page it belongs to (e.g. homepage-steps, card-video-guide) — reordering is grouped by this value.",
        "Use the panel above the list to drag-and-drop reorder blocks within the same 'page' group.",
      ],
    },
  },
  representatives: {
    tr: {
      title: "Temsilciler",
      steps: [
        "Her temsilci bir 'repCode' ile tanımlanır (örn. 835343KGSM) — bu kod /temsilci/{id} sayfasında kullanılır.",
        "Temsilci bilgilerini güncelledikten sonra sitedeki ilgili sayfa otomatik olarak yenilenir (revalidate).",
      ],
    },
    en: {
      title: "Representatives",
      steps: [
        "Each representative is identified by a 'repCode' (e.g. 835343KGSM) — this code is used on the /temsilci/{id} page.",
        "After updating a representative's info, the corresponding site page revalidates automatically.",
      ],
    },
  },
  pages: {
    tr: {
      title: "Sayfalar (Sayfa Kurucu) — baştan sona nasıl yapılır",
      steps: [
        "1) Başlık girin (örn. 'Kurumsal'). URL (slug) başlıktan otomatik türetilir, siz elle yazmazsınız.",
        "2) 'Layout' bölümünde '+ Layout Ekle'ye basıp bir blok seçin — her blok sayfanın bir bölümü demektir, istediğiniz kadar ekleyip sürükleyerek sırasını değiştirebilirsiniz. 10 blok var: Hero (en üstteki büyük başlık+görsel afişi), Metin (biçimlendirilmiş yazı), SSS (Kategoriler'deki soruları otomatik listeler), Kampanya Grid (Campaigns'teki kampanyaları kart olarak listeler), Video (tek YouTube videosu), Logo Grid (marka/ortak logoları vitrini), İkonlu Kartlar (ikon+başlık+kısa açıklama, 3'lü kart — 'özellikler/faydalar' anlatımı için), Adım Listesi (numaralı 'nasıl yapılır' adımları, görselli), Görsel + Metin Slayt (kaydırmalı görsel/metin vitrini), Çoklu Video (sekmeli, birden fazla video). Her bloğu eklediğinizde, içindeki her alanın altında ne yazmanız gerektiğini açıklayan bir not var.",
        "3) SEO alanlarını (Seo Title, Seo Description, Og Image) doldurun — arama sonuçlarında ve link paylaşımlarında bunlar görünür. Boş bırakırsanız sayfa Başlığı kullanılır.",
        "4) EN SIK KARIŞTIRILAN ADIM — bu sayfa kaydedilip yayınlansa bile header'daki 'Ürünler' menüsünde veya footer'da OTOMATİK görünmez, çünkü menüler ayrı bir yerden yönetiliyor. Menüde görünmesini istiyorsanız: sol menüden 'Menü Linkleri' (NavLinks) koleksiyonuna gidin → 'Yeni oluştur' → Label alanına menüde görünecek yazıyı yazın (örn. 'Kurumsal') → Href alanına başında / olacak şekilde bu sayfanın adresini yazın (örn. sayfanızın slug'ı 'kurumsal' ise: /kurumsal) → Section alanından NEREDE görüneceğini seçin (Header — Ürünler / Header — Ana Menü / Footer — Kurumsal / Footer — Yasal) → kaydedin. Bu kadar — kod veya deploy gerekmez.",
        "5) 'Üst Sayfa' (opsiyonel) sadece breadcrumb'da 'Ana Sayfa > Üst Sayfa > Bu Sayfa' gösterir, URL'i etkilemez — ve sadece DAHA ÖNCE kaydettiğiniz başka bir Page'i seçebilirsiniz (ilk sayfanız için liste boş görünür, normaldir).",
        "6) 'Görünürlük' varsayılan olarak Herkese Açık'tır; 'Gizli' seçilirse sayfa yayınlansa bile ziyaretçilere hiç gösterilmez, sadece CMS'e giriş yapmış kullanıcılar görebilir.",
        "7) Kaydetmeden önce sağ üstteki göz ikonundan (Önizle) sonucu kontrol edebilirsiniz. 'Taslağı Kaydet' ile ileride devam edebilir, 'Değişiklikleri Yayınla' ile canlıya alabilirsiniz.",
      ],
    },
    en: {
      title: "Pages (Page Builder) — start to finish",
      steps: [
        "1) Enter a Title (e.g. 'Kurumsal'). The URL (slug) is auto-derived from it — you never type it by hand.",
        "2) In the 'Layout' section, click '+ Add Layout' and pick a block — each block is one section of the page; add as many as you like and drag to reorder. There are 10: Hero (the big headline+image banner at the top), Rich Text (formatted copy), FAQ (auto-lists questions from a Category), Campaign Grid (auto-lists campaigns from Campaigns), Video (a single YouTube video), Logo Grid (a partner/brand logo showcase), Icon Cards (icon+title+short text, a 3-card 'features/benefits' layout), Steps (numbered 'how to' steps with an image each), Image + Text Slides (a scrollable image/text showcase), Multi Video (tabbed, more than one video). Every field inside a block has a note under it explaining what to put there.",
        "3) Fill in the SEO fields (Seo Title, Seo Description, Og Image) — these show up in search results and link previews. Leave blank to fall back to the page Title.",
        "4) THE MOST COMMONLY MISSED STEP — saving and publishing this page does NOT make it appear in the header's 'Ürünler' menu or the footer automatically, because menus are managed separately. To show it there: go to 'Menü Linkleri' (NavLinks) in the sidebar → 'Create new' → set Label to the menu text (e.g. 'Kurumsal') → set Href to this page's address starting with / (e.g. if your page's slug is 'kurumsal': /kurumsal) → pick a Section for WHERE it shows (Header — Ürünler / Header — Ana Menü / Footer — Kurumsal / Footer — Yasal) → save. That's it — no code, no deploy.",
        "5) 'Parent Page' (optional) only affects the breadcrumb ('Home > Parent > This page'), never the URL — and only lists OTHER Pages you've already saved (empty for your very first page, that's expected).",
        "6) 'Visibility' defaults to Public; 'Private' means the page is never shown to visitors even once published — only logged-in CMS users can see it.",
        "7) Use the eye icon (Preview) before saving to check the result. 'Save Draft' to come back to it later, 'Publish changes' to go live.",
      ],
    },
  },
  "fee-rows": {
    tr: {
      title: "Ücret Tablosu",
      steps: [
        "Her satır bir ücret kalemidir ('label' + 'value').",
        "Liste üstündeki panelden satırları sürükleyerek sıralayabilirsiniz — bu sıra sitede aynen yansır.",
        "Finansal içerik olduğu için değişiklikler versiyonlanır; yanlış bir düzenlemeyi eski sürüme geri alabilirsiniz ('Sürümler' sekmesi).",
      ],
    },
    en: {
      title: "Fee Rows",
      steps: [
        "Each row is a fee line item ('label' + 'value').",
        "Use the panel above the list to drag-and-drop reorder rows — the order is reflected on the site exactly.",
        "Since this is financial content, changes are versioned; you can roll back a mistaken edit from the 'Versions' tab.",
      ],
    },
  },
  "limit-tables": {
    tr: {
      title: "Limit Tabloları",
      steps: [
        "Her tablo bir 'title' ve altında 'rows' (kategori/periyot/limit) dizisi içerir.",
        "Satır eklemek için 'rows' alanının altındaki 'Ekle' butonunu kullanın.",
        "Liste üstündeki panelden tabloları sürükleyerek sıralayabilirsiniz.",
        "Finansal içerik olduğu için değişiklikler versiyonlanır ve geri alınabilir.",
      ],
    },
    en: {
      title: "Limit Tables",
      steps: [
        "Each table has a 'title' and a 'rows' array underneath (category/period/limit).",
        "Use the 'Add' button under the 'rows' field to add a row.",
        "Use the panel above the list to drag-and-drop reorder tables.",
        "Since this is financial content, changes are versioned and can be rolled back.",
      ],
    },
  },
  "nav-links": {
    tr: {
      title: "Menü Linkleri",
      steps: [
        "Her link bir 'section'a aittir (örn. Header — Ana Menü, Footer — Yasal) — bu, linkin sitede nerede göründüğünü belirler.",
        "Liste üstündeki panelden aynı section içindeki linkleri sürükleyerek sıralayabilirsiniz; farklı section'lar birbirini etkilemez.",
        "'href' alanı hem site içi yol (/kampanyalar) hem dış link olabilir.",
      ],
    },
    en: {
      title: "Nav Links",
      steps: [
        "Each link belongs to a 'section' (e.g. Header — Main Menu, Footer — Legal) — this determines where it appears on the site.",
        "Use the panel above the list to drag-and-drop reorder links within the same section; different sections don't affect each other.",
        "'href' can be either an internal path (/kampanyalar) or an external link.",
      ],
    },
  },
  "legal-pages": {
    tr: {
      title: "Hukuki Sayfalar",
      steps: [
        "KVKK, kullanım koşulları gibi sabit hukuki metinler burada tutulur.",
        "'intro' alanına paragraflar arasında boş satır bırakarak yazın.",
        "Değişiklikler versiyonlanır — bir onay/hukuk incelemesi sonrası hatalı bir değişikliği geri alabilirsiniz.",
      ],
    },
    en: {
      title: "Legal Pages",
      steps: [
        "Fixed legal text such as privacy policy or terms of use is kept here.",
        "Write the 'intro' field with a blank line between paragraphs.",
        "Changes are versioned — you can roll back a mistaken edit after a legal review.",
      ],
    },
  },
  "cookie-rows": {
    tr: {
      title: "Çerez Politikası Satırları",
      steps: [
        "Her satır çerez politikası sayfasındaki bir tablo satırıdır (çerez adı, amacı, süresi vb.).",
        "Yeni bir çerez kullanılmaya başlanınca burada yeni satır ekleyin — bu, uyumluluk açısından önemlidir.",
      ],
    },
    en: {
      title: "Cookie Rows",
      steps: [
        "Each row is one table row on the cookie policy page (cookie name, purpose, duration, etc.).",
        "Add a new row here whenever a new cookie starts being used — this matters for compliance.",
      ],
    },
  },
  "page-meta": {
    tr: {
      title: "Sayfa Meta Bilgileri",
      steps: [
        "'pageKey' alanı hangi sayfaya ait olduğunu belirler (örn. /, /aninda-bakiye, /kampanyalar) — sitedeki route ile birebir eşleşmeli.",
        "'breadcrumbLabel' o sayfanın breadcrumb'da (üst gezinme çubuğunda) görünen adını belirler.",
        "'seoTitle'/'seoDescription'/'ogImage' arama sonuçlarında ve sosyal medya paylaşımlarında görünür — boş bırakırsanız sayfanın kod içindeki varsayılan değeri kullanılır.",
      ],
    },
    en: {
      title: "Page Meta",
      steps: [
        "The 'pageKey' field determines which page this belongs to (e.g. /, /instant-balance, /campaigns) — it must exactly match the site route.",
        "'breadcrumbLabel' sets the name shown for that page in the breadcrumb navigation.",
        "'seoTitle'/'seoDescription'/'ogImage' show up in search results and social shares — if left blank, the page's built-in default is used.",
      ],
    },
  },
  "contact-info": {
    tr: {
      title: "İletişim Bilgileri",
      steps: [
        "Bu bir 'global' — yani liste değil, tek bir kayıttır; site genelinde tek bir iletişim bilgisi seti kullanılır.",
        "Telefon, e-posta, adres gibi alanları güncelledikten sonra kaydedin — sitedeki tüm sayfalar otomatik güncellenir (revalidate).",
      ],
    },
    en: {
      title: "Contact Info",
      steps: [
        "This is a 'global' — a single record, not a list; the whole site uses one shared set of contact info.",
        "Update fields like phone, email, address, then save — all pages on the site update automatically (revalidate).",
      ],
    },
  },
  "product-heroes": {
    tr: {
      title: "Ürün Hero Alanları",
      steps: [
        "Her kayıt bir ürün sayfasının (örn. Vodafone Pay Kart, Anında Bakiye) üst hero bölümünü besler.",
        "Başlık, alt başlık ve hero görseli/videosu buradan yönetilir.",
      ],
    },
    en: {
      title: "Product Heroes",
      steps: [
        "Each record feeds the top hero section of a product page (e.g. Vodafone Pay Card, Instant Balance).",
        "Title, subtitle, and hero image/video are managed here.",
      ],
    },
  },
  "feature-cards": {
    tr: {
      title: "Özellik Kartları",
      steps: [
        "Her kart bir 'page' değerine bağlıdır (örn. vodafone-pay-uygulama) — hangi ürün sayfasında göründüğünü belirler.",
        "'deeplink' verirseniz kart tıklanabilir olur.",
        "Liste üstündeki panelden aynı sayfa grubundaki kartları sürükleyerek sıralayabilirsiniz.",
      ],
    },
    en: {
      title: "Feature Cards",
      steps: [
        "Each card belongs to a 'page' value (e.g. vodafone-pay-app) — this determines which product page it appears on.",
        "If you set 'deeplink', the card becomes clickable.",
        "Use the panel above the list to drag-and-drop reorder cards within the same page group.",
      ],
    },
  },
  "step-cards": {
    tr: {
      title: "Adım Kartları",
      steps: [
        "Her adım bir 'page' değerine bağlıdır (örn. qr-ile-faturana-yansit) — hangi ürün sayfasında göründüğünü belirler.",
        "'deeplink' verirseniz adım tıklanabilir olur.",
        "Liste üstündeki panelden aynı sayfa grubundaki adımları sürükleyerek sıralayabilirsiniz — sıra numaraları site tarafında aynen kullanılır.",
      ],
    },
    en: {
      title: "Step Cards",
      steps: [
        "Each step belongs to a 'page' value (e.g. qr-to-bill) — this determines which product page it appears on.",
        "If you set 'deeplink', the step becomes clickable.",
        "Use the panel above the list to drag-and-drop reorder steps within the same page group — the order is used as-is on the site.",
      ],
    },
  },
};
