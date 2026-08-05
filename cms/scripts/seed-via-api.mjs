/**
 * Seeds Campaigns + FaqItems through the CMS's own REST API instead of the
 * `payload run` CLI (which hits a CJS/ESM interop bug in its env loader on
 * current Node). Requires the CMS dev/prod server to already be running and
 * the first admin user to already exist.
 *
 * Usage: node scripts/seed-via-api.mjs
 * Env:   CMS_URL, CMS_ADMIN_EMAIL, CMS_ADMIN_PASSWORD, SITE_IMAGES_DIR
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const CMS_URL = process.env.CMS_URL || "http://localhost:3000";
const EMAIL = process.env.CMS_ADMIN_EMAIL || "admin@vodafonepay.local";
const PASSWORD = process.env.CMS_ADMIN_PASSWORD;
const IMAGES_DIR = process.env.SITE_IMAGES_DIR || path.resolve(dirname, "../../public/images");

if (!PASSWORD) {
  console.error("Set CMS_ADMIN_PASSWORD before running this script.");
  process.exit(1);
}

const featuredCampaigns = [
  { title: "Vodafone Pay ile Çeşme Plajlarında 1.000 TL Nakit İade!", image: "campaign-cesme.jpg", description: "Çeşme'de bulunan ALMare, Playa, Fly Inn ve OM Paparazzi plajlarından birinde yapacağın tek seferde 2.000 TL ve üzeri harcamana 1.000 TL nakit iade!" },
  { title: "1 TL'ye Hayat Su Kapında!", image: "campaign-hayat-su.jpg", description: "Hayat Su'da \"Vodafone Pay ile Faturana Yansıt\" ile sipariş ver, damacana su siparişini 1 TL'ye satın alma fırsatını yakala!" },
  { title: "Market harcamanı ilk kez QR ile faturana yansıt, 100 TL indirim kazan!", image: "campaign-market.jpg", description: "Market harcamanı ilk kez QR ile faturana yansıt, 100 TL indirim kazan!" },
];

const allCampaigns = [
  { title: "Kurum Faturalarını Vodafone Pay ile Öde 100 TL Nakit İade Kazan!", image: "camp-01.jpg" },
  { title: "Vodafone Telefon Faturalarına %10 Nakit İade!", image: "camp-02.jpg" },
  { title: "Yaz Alışverişin Cebinde, Nakit İaden Vodafone Pay'de!", image: "camp-03.jpg" },
  { title: "Kolay Paket Yüklemelerine %20 Nakit İade!", image: "camp-04.jpg" },
  { title: "Vodafone Pay'de Red'lilere Özel 50 TL Cüzdanım Kodu Hediye!", image: "camp-05.jpg" },
  { title: "Vodafone Pay ile Çeşme Restoranlarında 750 TL Nakit İade!", image: "camp-06.jpg" },
  { title: "Anında Bakiye'de %20 İndirim!", image: "camp-08.jpg" },
  { title: "İstanbulkart'ına Vodafone Pay ile Bakiye Yükle 100 TL Nakit İade Kazan!", image: "camp-09.jpg" },
  { title: "Biletinal'da Vodafone'lulara 400 TL İndirim!", image: "camp-10.jpg" },
  { title: "Vodafone Ev İnterneti Faturalarına 100 TL Nakit İade!", image: "camp-11.jpg" },
  { title: "İlk QR Harcamanı Yap, %20 İndirim Kazan!", image: "camp-12.jpg" },
  { title: "5 GB Hediye!", image: "camp-13.jpg" },
  { title: "Vodafone Pay ile Deponu Doldururken Kazan!", image: "camp-14.jpg" },
  { title: "Pazarama'da %50 İndirim!", image: "camp-16.png" },
  { title: "Dijital Platform Üyelikleriniz 3 Ay Bedava!", image: "camp-17.jpg" },
  { title: "Vodafone Pay'li Yaz Boyunca Obilet'te Kazanıyor!", image: "camp-19.jpg" },
].map((c) => ({ ...c, description: c.title }));

const faqItems = [
  { question: "Vodafone Pay Nedir?", answer: "Vodafone Pay, Cüzdan, Faturana Yansıt ve Vodafone Pay Kart ile finansal işlemlerinizi kolayca ve güvenli şekilde gerçekleştirmenizi sağlayan bir finansal teknoloji şirketidir.", category: "anasayfa" },
  { question: "Vodafone Pay ile Nasıl Alışveriş Yapılır?", answer: "Vodafone Pay'in sunduğu ödeme yöntemleri ile hem fiziksel hem online alışverişlerinizi gerçekleştirebilirsiniz. Kartlarınıza banka/kredi kartı, EFT veya ATM ile bakiye yükleyip harcamalarınızdan nakit iade kazanabilirsiniz.", category: "anasayfa" },
  { question: "Mobil Ödeme nedir?", answer: "Vodafone Mobil Ödeme alışverişlerinizi hızlı ve güvenli bir şekilde gerçekleştirmenizi sağlayan tahsilat aracıdır. Faturalı veya faturasız fark etmeksizin, kredi kartı veya banka kartına ihtiyaç duymadan alışverişlerinizi gerçekleştirebilirsiniz.", category: "anasayfa" },
  { question: "Vodafone Pay Nerelerde Kullanılır?", answer: "Vodafone Pay Kart, VISA ve TROY seçenekleriyle tüm POS cihazlarında fiziksel ve online harcamalarda kullanılabilir. Faturana Yansıt ise uygulama mağazaları ve anlaşmalı markalarda geçerlidir.", category: "anasayfa" },
  { question: "Anında Bakiye nedir? Kimler kullanabilir?", answer: "Anında Bakiye, Vodafone Pay tarafından sana özel olarak tanımlanan Faturana Yansıt limitini Vodafone Pay Sanal Kart'ına aktarabileceğin bir hizmettir.", category: "aninda-bakiye" },
  { question: "Anında Bakiye ile yapılan işlemler ücretli mi?", answer: "Anında Bakiye yüklemelerinde komisyon uygulanır. Faturana Yansıt hizmet bedeline web sitemizden ulaşabilirsin.", category: "aninda-bakiye" },
  { question: "Anında Bakiye'mi nerelerde kullanabilirim?", answer: "Sana özel tanımlanan Anında Bakiye'ni yurtiçi ve yurtdışında Visa kart geçerli olan tüm kurum ve platformlarda kullanabilirsin.", category: "aninda-bakiye" },
  { question: "Vodafone Pay Uygulaması Nedir?", answer: "Vodafone Pay Uygulaması, herhangi bir banka müşterisi olmadan ve hangi operatörü kullandığınız fark etmeden finansal işlemlerinizi tek bir uygulama içerisinden yönetmenizi sağlayan yeni nesil bir mobil cüzdan uygulamasıdır.", category: "vodafone-pay-uygulama" },
  { question: "Vodafone Pay Uygulaması Nasıl Kullanılır?", answer: "Google Play Store ya da App Store üzerinden indirip, 12 yaşından büyük bir kullanıcı olarak kaydolabilirsiniz.", category: "vodafone-pay-uygulama" },
  { question: "Vodafone Pay Kart Nedir?", answer: "Vodafone Pay Kart herhangi bir banka müşterisi olmadan ve hangi operatör müşterisi olduğunuz fark etmeksizin kullanabileceğiniz ön ödemeli bir karttır.", category: "vodafone-pay-kart" },
  { question: "Vodafone Pay Kart Limiti Ne Kadar?", answer: "Hesabı doğrulanmış müşterilerin aylık limitleri 75.000 TL; hesabı doğrulanmamış müşterilerin limitleri 2.000 TL'dir.", category: "vodafone-pay-kart" },
  { question: "QR ile Faturana Yansıt nedir?", answer: "Vodafone Pay Uygulaması'nda TR Kare kod (QR) ile ödemede Faturana Yansıt'ı hem faturalı hem faturasız Vodafone mobil müşterileri kullanabilir.", category: "qr-ile-faturana-yansit" },
  { question: "Vodafone Pay kampanyalarına nasıl katılabilirim?", answer: "Vodafone Pay Uygulaması üzerinden kampanyaları inceleyerek katılmak istedikleriniz için \"Kampanyaya Katıl\" butonuna tıklayabilir veya kampanya esaslarında yer alan yönlendirmeleri uygulayarak kampanyalara katılabilirsiniz.", category: "kampanyalar" },
];

async function login() {
  const res = await fetch(`${CMS_URL}/api/users/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.token;
}

async function uploadMedia(token, filename, alt) {
  const filePath = path.join(IMAGES_DIR, filename);
  const buffer = fs.readFileSync(filePath);
  const mimetype = filename.endsWith(".png") ? "image/png" : "image/jpeg";
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimetype }), filename);
  form.append("_payload", JSON.stringify({ alt }));

  const res = await fetch(`${CMS_URL}/api/media`, {
    method: "POST",
    headers: { Authorization: `JWT ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Media upload failed for ${filename}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.doc.id;
}

async function createDoc(token, collection, data) {
  const res = await fetch(`${CMS_URL}/api/${collection}`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Create ${collection} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function run() {
  console.log("Logging in...");
  const token = await login();

  console.log("Seeding campaigns...");
  const campaigns = [
    ...featuredCampaigns.map((c) => ({ ...c, featured: true })),
    ...allCampaigns.map((c) => ({ ...c, featured: false })),
  ];
  for (const c of campaigns) {
    const mediaId = await uploadMedia(token, c.image, c.title);
    await createDoc(token, "campaigns", {
      title: c.title,
      description: c.description,
      image: mediaId,
      featured: c.featured,
      category: "genel",
      ctaLabel: "Detayları gör",
      _status: "published",
    });
    console.log(`  ✓ ${c.title}`);
  }

  console.log("Seeding FAQ items...");
  for (let i = 0; i < faqItems.length; i++) {
    const item = faqItems[i];
    await createDoc(token, "faq-items", { ...item, order: i, _status: "published" });
    console.log(`  ✓ ${item.question}`);
  }

  console.log(`Done: ${campaigns.length} campaigns, ${faqItems.length} FAQ items.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
