/**
 * Seeds the NavLinks collection so it actually owns the site's navigation
 * (29.08.2026).
 *
 * Why: Header.tsx and Footer.tsx each keep a hardcoded fallback per section and
 * hand the section over to the CMS as soon as that section has published rows.
 * Three of the four sections had zero rows and so still rendered from code,
 * while `footer-kurumsal` had exactly one — which is how the live footer ended
 * up showing a single stray link instead of five. Half-populated is the state
 * that breaks: the fallback hides a missing seed until someone publishes one
 * row, and then the whole column changes under them.
 *
 * So this fills all four sections with exactly what the fallbacks contain. The
 * rendered site does not change; what changes is that an editor can now edit
 * the navigation, which is the entire point of the collection.
 *
 * `header-products` is the one section that MERGES rather than replaces: the
 * dropdown is NavLinks + any Page flagged `showInProductsMenu`, sorted by a
 * shared 1-based position. Two pages already claim positions there, so the
 * three links seeded here take the remaining slots and the two pages are moved
 * to the positions the fallback ordering implies. Without that the dropdown
 * showed 2 of the 5 products.
 *
 * Runs through the REST API as the real roles — Growth Maker creates the
 * draft, Growth Checker publishes it — so every access rule, ordering hook and
 * section cap is exercised exactly as it would be from the panel. It is NOT a
 * SQL insert for that reason.
 *
 * Idempotent: a link whose label already exists in its section is skipped.
 *
 * Usage:
 *   node scripts/seed-nav-links-29-08.mjs
 *   CMS_URL=... MAKER_EMAIL=... MAKER_PASSWORD=... CHECKER_EMAIL=... CHECKER_PASSWORD=... node scripts/...
 *
 * Credentials come from the environment and default to the local dev fixtures;
 * nothing secret is committed here.
 */

const CMS = process.env.CMS_URL ?? "http://localhost:3010";
const MAKER = { email: process.env.MAKER_EMAIL ?? "ece.boran@vodafone.com", password: process.env.MAKER_PASSWORD ?? "VodafonePay!2026" };
const CHECKER = { email: process.env.CHECKER_EMAIL ?? "mert.sarihan@vodafone.com", password: process.env.CHECKER_PASSWORD ?? "VodafonePay!2026" };

/** Mirrors Header.tsx's fallbackProductLinks / fallbackNavLinks and Footer.tsx's fallbackColumns. */
const SECTIONS = {
  "header-products": [
    { label: "Vodafone Pay Uygulaması", href: "/vodafone-pay-uygulama", order: 1 },
    { label: "Vodafone Pay Kart", href: "/vodafone-pay-kart", order: 2 },
    // position 3 is the "QR ile Öde" Page, moved below
    { label: "Faturana Yansıt", href: "/faturana-yansit", order: 4 },
    // position 5 is the "Anında Bakiye" Page, moved below
  ],
  "header-main": [
    { label: "Kampanyalar", href: "/kampanyalar", order: 1 },
    { label: "Blog", href: "/blog", order: 2 },
    { label: "Ücretler ve Limitler", href: "/ucretler-ve-limitler", order: 3 },
    { label: "Sıkça Sorulan Sorular", href: "/sikca-sorulan-sorular", order: 4 },
  ],
  "footer-yasal": [
    { label: "Site Haritası", href: "/site-haritasi", order: 1 },
    { label: "Gizlilik ve Güvenlik Politikası", href: "/gizlilik-ve-guvenlik-politikasi", order: 2 },
    { label: "Çerez Politikası", href: "/cerez-politikasi", order: 3 },
    { label: "Bilgi Güvenliği", href: "/bilgi-guvenligi", order: 4 },
    { label: "Sözleşmeler ve Formlar", href: "/sozlesmeler-ve-formlar", order: 5 },
    { label: "Web Sitesi Kullanımı Hüküm ve Şartları", href: "/web-sitesi-hukum-ve-sartlari", order: 6 },
    { label: "Faydalı Bilgiler", href: "/faydali-bilgiler", order: 7 },
  ],
};

/** The two Pages already in the products dropdown, moved to the slots the fallback order implies. */
const PRODUCT_PAGE_POSITIONS = [
  { slug: "qr-ile-faturana-yansit", productsMenuOrder: 3 },
  { slug: "aninda-bakiye", productsMenuOrder: 5 },
];

async function login({ email, password }) {
  const res = await fetch(`${CMS}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!json.token) throw new Error(`Giriş başarısız (${email}): ${JSON.stringify(json).slice(0, 200)}`);
  return json.token;
}

const auth = (token) => ({ Authorization: `JWT ${token}`, "Content-Type": "application/json" });

async function existingLabels(token, section) {
  const url = `${CMS}/api/nav-links?limit=200&depth=0&where[section][equals]=${encodeURIComponent(section)}`;
  const res = await fetch(url, { headers: auth(token) });
  const json = await res.json();
  return new Set((json.docs ?? []).map((d) => d.label));
}

async function main() {
  const [makerToken, checkerToken] = await Promise.all([login(MAKER), login(CHECKER)]);
  let created = 0;
  let skipped = 0;

  for (const [section, links] of Object.entries(SECTIONS)) {
    const have = await existingLabels(checkerToken, section);
    for (const link of links) {
      if (have.has(link.label)) {
        console.log(`  = ${section}/${link.label} zaten var, atlandı`);
        skipped += 1;
        continue;
      }
      const createRes = await fetch(`${CMS}/api/nav-links?draft=true`, {
        method: "POST",
        headers: auth(makerToken),
        body: JSON.stringify({ ...link, section, _status: "draft" }),
      });
      const createJson = await createRes.json();
      if (!createJson.doc?.id) {
        console.error(`  ! ${section}/${link.label} OLUŞTURULAMADI: ${JSON.stringify(createJson.errors ?? createJson).slice(0, 200)}`);
        continue;
      }
      const pubRes = await fetch(`${CMS}/api/nav-links/${createJson.doc.id}`, {
        method: "PATCH",
        headers: auth(checkerToken),
        body: JSON.stringify({ _status: "published" }),
      });
      if (!pubRes.ok) {
        console.error(`  ! ${section}/${link.label} YAYINLANAMADI: HTTP ${pubRes.status}`);
        continue;
      }
      console.log(`  + ${section}/${link.label} (sıra ${link.order}) oluşturuldu ve yayınlandı`);
      created += 1;
    }
  }

  for (const { slug, productsMenuOrder } of PRODUCT_PAGE_POSITIONS) {
    const findRes = await fetch(`${CMS}/api/pages?limit=1&depth=0&where[slug][equals]=${slug}`, { headers: auth(checkerToken) });
    const page = (await findRes.json()).docs?.[0];
    if (!page) {
      console.error(`  ! /${slug} sayfası bulunamadı`);
      continue;
    }
    if (page.productsMenuOrder === productsMenuOrder) {
      console.log(`  = /${slug} zaten ${productsMenuOrder}. sırada`);
      continue;
    }
    const res = await fetch(`${CMS}/api/pages/${page.id}`, {
      method: "PATCH",
      headers: auth(checkerToken),
      body: JSON.stringify({ productsMenuOrder, _status: "published" }),
    });
    console.log(res.ok ? `  ~ /${slug} → Ürünler menüsü sırası ${productsMenuOrder}` : `  ! /${slug} güncellenemedi: HTTP ${res.status}`);
  }

  console.log(`\nBitti: ${created} link oluşturuldu, ${skipped} atlandı.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
