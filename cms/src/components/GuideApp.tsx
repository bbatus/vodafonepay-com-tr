"use client";

import { useAuth } from "@payloadcms/ui";
import { useAdminLocale } from "./useAdminLocale";
import { getRoleDirectory } from "@/lib/rolePermissions";
import { COLLECTION_LABELS } from "@/lib/collectionLabels";
import { HELP_CONTENT } from "@/lib/helpContent";

/**
 * "Nasıl Kullanılır" — a single in-app wiki: login → what your role can do →
 * how to read the dashboard → a collection-by-collection guide → what to do
 * when stuck. Built entirely from data that already exists elsewhere in the
 * admin (getRoleDirectory() backs the Access Matrix, HELP_CONTENT backs each
 * collection's own "?" button) so this page can't drift out of sync with
 * those the way a hand-written duplicate would — it's a different
 * arrangement of the same source of truth, not a second copy of it.
 *
 * No screenshots: nothing in this toolset can save a browser screenshot to a
 * file this component can import, so instead of a handful of pixel captures
 * that go stale the next time a button moves, every section describes where
 * things are in words specific enough to find them (exact button text, exact
 * sidebar group). If real screenshots are wanted later, this is the file to
 * add them to.
 */

const STRINGS = {
  tr: {
    tocGettingStarted: "Başlarken",
    tocRoles: "Rolünüz Ne Yapabilir",
    tocDashboard: "Dashboard'u Okumak",
    tocCollections: "Koleksiyon Rehberi",
    tocStuck: "Sıkıştım, Ne Yapmalıyım?",
    gettingStartedTitle: "Başlarken",
    gettingStartedIntro:
      "Bu panele giriş, LDAP/AccessPoint hesabınızla yapılır — e-posta ve şifreniz, kullanıcı adınız ve rolünüz burada değil, orada yönetilir. Giriş ekranında sadece e-posta ve şifrenizi girip 'Giriş'e basmanız yeterli; 'Remember me' işaretlerseniz sadece e-posta adresiniz bir sonraki girişte hazır gelir, şifre asla saklanmaz.",
    gettingStartedLocale:
      "Panel Türkçe ve İngilizce'yi destekler — sağ üstteki hesap menüsünden dil değiştirebilirsiniz, tercihiniz oturumunuzla birlikte hatırlanır.",
    rolesTitle: "Rolünüz Ne Yapabilir",
    rolesIntro:
      "4 rol var, hepsi AccessPoint üzerinden atanır — CMS içinden kimseye rol verilemez veya değiştirilemez. Kendi rolünüzü sağ üstteki hesap menüsünden görebilirsiniz.",
    rolesMakerCheckerNote:
      "Genel kural, Kampanyalar dışındaki HER koleksiyonda aynı: bir Maker taslak oluşturur/düzenler ama yayınlayamaz ve yayındaki bir kayda hiç dokunamaz; bir Checker create yapamaz ama her Maker'ın gönderdiğini görüp onaylayıp yayınlayabilir. Kampanyalar'ın kendine özel, biraz daha zengin bir onay/red akışı var (aşağıdaki koleksiyon rehberinde).",
    dashboardTitle: "Dashboard'u Okumak",
    dashboardKpi:
      "Üstteki 4 kutu (Toplam İçerik, Sayfalar, Kullanıcılar, Sık Sorulanlar) panelin genel büyüklüğünü gösterir — 'Sayfalar' hem CMS'te oluşturduğunuz sayfaları hem sitenin sabit rotalarını (anasayfa, kampanyalar listesi vb.) birlikte sayar.",
    dashboardMakerWidget:
      "'Onaya Gönderdikleriniz' (sadece Maker'lar görür) — SİZİN gönderdiğiniz, henüz onaylanmamış veya reddedilmiş her şeyi, hangi koleksiyondan olduğunu gösteren bir etiketle listeler. Reddedilen bir kayıtta red sebebini de burada görürsünüz.",
    dashboardCheckerWidget:
      "'Onayınızı Bekleyen İçerikler' (sadece Checker'lar görür) — kapsamınızdaki HER koleksiyonda, HANGİ Maker'dan geldiğine bakmaksızın, yayını bekleyen her şeyi listeler. Satıra tıklamak sizi doğrudan o kaydın düzenleme ekranına götürür.",
    dashboardTable:
      "Altındaki 'Site Sayfaları' tablosu sitenin GERÇEK URL'lerinin tam listesidir (statik rotalar + CMS sayfaları + kampanya/blog gibi dinamik sayfalar) — bir adres satırına tıklamak sizi canlı sayfaya götürür, yeni sekmede açılır.",
    collectionsTitle: "Koleksiyon Rehberi",
    collectionsIntro:
      "Aşağıda, panelde göreceğiniz her bölümün kısa bir özeti var — daha ayrıntılısı için o koleksiyonun kendi ekranındaki '?' butonuna bakın (varsa, aynı içerik orada da açılır).",
    stuckTitle: "Sıkıştım, Ne Yapmalıyım?",
    stuckLocked:
      "Hesabım kilitlendi (5 başarısız girişten sonra 15 dakika) — kendi kendinize açamazsınız. Bir New Vertical Maker, Kullanıcılar listesinde ilgili hesabı açıp 'Hesap Kilidini Aç' ile açabilir.",
    stuckPassword:
      "Şifremi unuttum / değiştirmek istiyorum — panel içinden mümkün değil, kasıtlı olarak kapalı (kimlik LDAP/AccessPoint'in). AccessPoint üzerinden şifre sıfırlama talebinde bulunun.",
    stuckReject:
      "Kampanyam reddedildi ama sebebini göremiyorum — Dashboard'daki 'Onaya Gönderdikleriniz' widget'ında, o kaydın yanında red sebebi görünür; görünmüyorsa kaydı açıp üstteki durum panelini kontrol edin.",
    stuckUnpublish:
      "Yayındaki bir hata çok acil, hemen düzeltmem lazım — bir Maker'sanız yayındaki kayda hiç dokunamazsınız; önce bir Checker'dan 'Yayından Kaldır' yapmasını isteyin (toolbar'daki buton), o taslağa döndükten sonra siz düzenleyip tekrar onaya gönderin. Kampanyalar'da ayrıca 'Acil Düzeltme' ikinci bir onay adımıyla yayındayken doğrudan düzenlemeye izin verir.",
    stuckMissingCollection:
      "Aradığım koleksiyonu sidebar'da bulamıyorum — bazı koleksiyonlar (Ücret/Limit Tabloları, Dokümanlar) kendi sidebar girişleri yerine özel bir ekrandan yönetiliyor: 'Ücretler ve Limitler' ve 'Sözleşmeler ve Formlar'. Çeviriler hiçbir rolde görünmez, sadece arka planda panelin kendi metinlerini besler.",
    stuckFeedback:
      "Bir şey mantıklı gelmiyor / öneri iletmek istiyorum — sidebar'ın en altındaki 'Geri Bildirim Gönder'e yazın, kimse geri okuyup size cevap veremez ama düzenli kontrol edilir.",
  },
  en: {
    tocGettingStarted: "Getting Started",
    tocRoles: "What Your Role Can Do",
    tocDashboard: "Reading the Dashboard",
    tocCollections: "Collection Guide",
    tocStuck: "Stuck? What Do I Do?",
    gettingStartedTitle: "Getting Started",
    gettingStartedIntro:
      "You sign into this panel with your LDAP/AccessPoint account — your email, password, username and role live there, not here. Just enter your email and password on the login screen and click 'Login'; ticking 'Remember me' only keeps your email ready for next time, your password is never stored.",
    gettingStartedLocale:
      "The panel supports Turkish and English — switch languages from the account menu top-right; your preference is remembered with your session.",
    rolesTitle: "What Your Role Can Do",
    rolesIntro:
      "There are 4 roles, all assigned through AccessPoint — nobody can grant or change a role from inside the CMS. You can see your own role from the account menu top-right.",
    rolesMakerCheckerNote:
      "The general rule is the same in every collection except Campaigns: a Maker creates/edits drafts but can't publish and can't touch anything already live; a Checker can't create but can see and publish every Maker's submissions. Campaigns has its own, somewhat richer approve/reject cycle (see the collection guide below).",
    dashboardTitle: "Reading the Dashboard",
    dashboardKpi:
      "The 4 boxes at the top (Total Content, Pages, Users, FAQ) show the panel's overall size — 'Pages' counts both pages you created in the CMS and the site's fixed routes (homepage, campaign listing, etc.) together.",
    dashboardMakerWidget:
      "'Your Submissions' (Makers only) — lists everything YOU submitted that's still pending or was rejected, each tagged with which collection it's from. A rejected item's rejection reason shows here too.",
    dashboardCheckerWidget:
      "'Content Awaiting Your Approval' (Checkers only) — lists everything pending publish across every collection in your scope, regardless of which Maker sent it. Clicking a row takes you straight to that record's edit screen.",
    dashboardTable:
      "The 'Site Pages' table below it is the real, full list of the site's URLs (static routes + CMS pages + dynamic pages like campaigns/blog) — clicking an address opens the live page in a new tab.",
    collectionsTitle: "Collection Guide",
    collectionsIntro:
      "A short summary of every section you'll see in the panel — for more detail, use that collection's own '?' button (where one exists, it shows the same content).",
    stuckTitle: "Stuck? What Do I Do?",
    stuckLocked:
      "My account got locked (5 failed logins locks it for 15 minutes) — you can't unlock yourself. A New Vertical Maker can unlock the account from the Users list with 'Unlock Account'.",
    stuckPassword:
      "I forgot my password / want to change it — not possible from inside the panel, deliberately disabled (identity belongs to LDAP/AccessPoint). Request a password reset through AccessPoint.",
    stuckReject:
      "My campaign was rejected but I can't see why — the 'Your Submissions' dashboard widget shows the rejection reason next to that record; if it's not there, open the record and check the status panel at the top.",
    stuckUnpublish:
      "A live bug is urgent, I need to fix it right now — as a Maker you can't touch a live record at all; ask a Checker to 'Unpublish' it first (the toolbar button), then edit the resulting draft and resubmit. Campaigns additionally has an 'Emergency Fix' path that allows editing live directly behind a second confirmation step.",
    stuckMissingCollection:
      "I can't find a collection in the sidebar — a few (Fee/Limit Tables, Documents) are managed from a dedicated screen instead of their own sidebar entry: 'Fees and Limits' and 'Legal Documents and Forms'. Translations never shows for any role — it only feeds the panel's own text in the background.",
    stuckFeedback:
      "Something doesn't make sense / I want to suggest something — write it in 'Send Feedback' at the bottom of the sidebar; nobody replies to you directly there, but it's checked regularly.",
  },
} as const;

/** Sidebar-group order, mirroring payload.config.ts's `collections` array. */
const GROUPS: { key: string; label: { tr: string; en: string }; slugs: string[] }[] = [
  {
    key: "content",
    label: { tr: "İçerik Yönetimi", en: "Content Management" },
    slugs: ["categories", "campaigns", "pages", "faq-items", "blog-posts", "representatives", "announcements", "fee-rows", "limit-tables"],
  },
  {
    key: "structure",
    label: { tr: "Site Yapısı", en: "Site Structure" },
    slugs: ["nav-links", "legal-pages", "cookie-rows", "page-meta"],
  },
  {
    key: "system",
    label: { tr: "Sistem", en: "System" },
    slugs: ["users", "media", "documents", "audit-logs"],
  },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="guide__section">
      <h2 className="guide__section-title">{title}</h2>
      {children}
    </section>
  );
}

export default function GuideApp() {
  const locale = useAdminLocale();
  const t = STRINGS[locale];
  const { user } = useAuth();
  const myRole = (user as { role?: string } | undefined)?.role;
  const roles = getRoleDirectory();

  const toc = [
    ["getting-started", t.tocGettingStarted],
    ["roles", t.tocRoles],
    ["dashboard", t.tocDashboard],
    ["collections", t.tocCollections],
    ["stuck", t.tocStuck],
  ] as const;

  return (
    <div className="guide">
      <nav className="guide__toc" aria-label={locale === "tr" ? "İçindekiler" : "Table of contents"}>
        {toc.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="guide__toc-link">
            {label}
          </a>
        ))}
      </nav>

      <Section id="getting-started" title={t.gettingStartedTitle}>
        <p>{t.gettingStartedIntro}</p>
        <p>{t.gettingStartedLocale}</p>
      </Section>

      <Section id="roles" title={t.rolesTitle}>
        <p>{t.rolesIntro}</p>
        <ul className="guide__role-list">
          {roles.map((r) => (
            <li key={r.role} className={`guide__role${r.role === myRole ? " guide__role--mine" : ""}`}>
              <p className="guide__role-name">
                {r.roleLabel[locale]}
                {r.role === myRole && (
                  <span className="guide__role-badge">{locale === "tr" ? "Siz" : "You"}</span>
                )}
              </p>
              <p className="guide__role-summary">{r.summary[locale]}</p>
            </li>
          ))}
        </ul>
        <p>{t.rolesMakerCheckerNote}</p>
      </Section>

      <Section id="dashboard" title={t.dashboardTitle}>
        <p>{t.dashboardKpi}</p>
        <p>{t.dashboardMakerWidget}</p>
        <p>{t.dashboardCheckerWidget}</p>
        <p>{t.dashboardTable}</p>
      </Section>

      <Section id="collections" title={t.collectionsTitle}>
        <p>{t.collectionsIntro}</p>
        {GROUPS.map((group) => (
          <div key={group.key} className="guide__group">
            <h3 className="guide__group-title">{group.label[locale]}</h3>
            <dl className="guide__collection-list">
              {group.slugs.map((slug) => {
                const help = HELP_CONTENT[slug];
                const label = COLLECTION_LABELS[slug]?.[locale] ?? slug;
                if (!help) return null;
                return (
                  <div key={slug} className="guide__collection">
                    <dt>{label}</dt>
                    <dd>{help[locale].steps[0]}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </Section>

      <Section id="stuck" title={t.stuckTitle}>
        <ul className="guide__stuck-list">
          <li>{t.stuckLocked}</li>
          <li>{t.stuckPassword}</li>
          <li>{t.stuckReject}</li>
          <li>{t.stuckUnpublish}</li>
          <li>{t.stuckMissingCollection}</li>
          <li>{t.stuckFeedback}</li>
        </ul>
      </Section>
    </div>
  );
}
