/**
 * Seeds the Announcements collection (29.08.2026).
 *
 * Why: the collection had a single row, so /duyurular — a page the footer
 * links to from every screen — rendered one item. Nothing was broken; there
 * simply was not enough content to see the page work, or to demo it.
 *
 * The four added here are the kinds of notice this page exists for: planned
 * maintenance, a regulatory/limit change, a new capability, and a security
 * warning. Two carry a `deeplink` so the clickable-announcement path is
 * exercised too, rather than only the plain-text one.
 *
 * Goes through the REST API as the real roles — Growth Maker creates the
 * draft, Growth Checker publishes — so ordering hooks and access rules run
 * exactly as they would from the panel.
 *
 * Idempotent: an announcement whose title already exists is skipped.
 *
 * Usage: node scripts/seed-announcements-29-08.mjs
 */

const CMS = process.env.CMS_URL ?? "http://localhost:3010";
const MAKER = { email: process.env.MAKER_EMAIL ?? "ece.boran@vodafone.com", password: process.env.MAKER_PASSWORD ?? "VodafonePay!2026" };
const CHECKER = { email: process.env.CHECKER_EMAIL ?? "mert.sarihan@vodafone.com", password: process.env.CHECKER_PASSWORD ?? "VodafonePay!2026" };

const ANNOUNCEMENTS = [
  {
    title: "15.09.2026 Vodafone Pay Kart Aylık Harcama Limiti Güncellemesi",
    body: `Değerli Müşterimiz,

15 Eylül 2026 tarihinden itibaren Vodafone Pay Kart aylık harcama limitleri, kimlik doğrulaması tamamlanmış hesaplar için güncellenecektir.

Güncel limitleri Ücretler ve Limitler sayfasından takip edebilirsiniz. Mevcut bakiyeniz ve tanımlı limitleriniz bu değişiklikten etkilenmeyecektir.

Bilginize sunarız.`,
    deeplink: "/ucretler-ve-limitler",
  },
  {
    title: "Ulaşım Kartı Bakiye Yükleme Artık Vodafone Pay'de",
    body: `Değerli Müşterimiz,

İstanbulkart, Ankarakart ve anlaşmalı diğer ulaşım kartlarınıza artık Vodafone Pay uygulaması üzerinden bakiye yükleyebilirsiniz.

Yükleme işlemi için otomat aramanıza gerek yok; işlem tamamlandıktan sonra bakiyeniz genellikle birkaç dakika içinde kartınıza tanımlanır.

Keyifli kullanımlar dileriz.`,
    deeplink: "/kampanyalar",
  },
  {
    title: "Sahte SMS ve Dolandırıcılık Girişimlerine Karşı Uyarı",
    body: `Değerli Müşterimiz,

Son dönemde Vodafone Pay adı kullanılarak gönderilen sahte SMS ve e-postalarda artış gözlenmektedir.

Vodafone Pay hiçbir koşulda sizden şifrenizi, SMS doğrulama kodunuzu veya kart bilgilerinizi telefon, SMS veya e-posta yoluyla talep etmez. Bu tür bir mesaj aldığınızda içerdiği bağlantılara tıklamayınız ve bilgilerinizi paylaşmayınız.

Şüpheli bir durumda müşteri hizmetlerimizle iletişime geçebilirsiniz.`,
    deeplink: "/bilgi-guvenligi",
  },
  {
    title: "22.08.2026 02:00-06:00 Kart Servislerinde Planlı Bakım Tamamlandı",
    body: `Değerli Müşterimiz,

22 Ağustos 2026 tarihinde 02:00-06:00 saatleri arasında gerçekleştirilen planlı bakım çalışması tamamlanmıştır.

Çalışma süresince geçici olarak kullanıma kapalı olan kart ve cüzdan servislerimiz yeniden hizmete alınmıştır. Bakiyeniz ve hesap bilgileriniz bu çalışmadan etkilenmemiştir.

Anlayışınız için teşekkür ederiz.`,
  },
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

async function main() {
  const [makerToken, checkerToken] = await Promise.all([login(MAKER), login(CHECKER)]);

  const listRes = await fetch(`${CMS}/api/announcements?limit=200&depth=0`, { headers: auth(checkerToken) });
  const existing = new Set(((await listRes.json()).docs ?? []).map((d) => d.title));

  let created = 0;
  for (const item of ANNOUNCEMENTS) {
    if (existing.has(item.title)) {
      console.log(`  = "${item.title.slice(0, 45)}…" zaten var, atlandı`);
      continue;
    }
    // `order` deliberately omitted — assignNextOrder appends to the end, which
    // is what an editor adding a notice would get.
    const createRes = await fetch(`${CMS}/api/announcements?draft=true`, {
      method: "POST",
      headers: auth(makerToken),
      body: JSON.stringify({ ...item, _status: "draft" }),
    });
    const createJson = await createRes.json();
    if (!createJson.doc?.id) {
      console.error(`  ! OLUŞTURULAMADI "${item.title.slice(0, 40)}…": ${JSON.stringify(createJson.errors ?? createJson).slice(0, 200)}`);
      continue;
    }
    const pubRes = await fetch(`${CMS}/api/announcements/${createJson.doc.id}`, {
      method: "PATCH",
      headers: auth(checkerToken),
      body: JSON.stringify({ _status: "published" }),
    });
    console.log(pubRes.ok ? `  + "${item.title.slice(0, 45)}…" oluşturuldu ve yayınlandı` : `  ! YAYINLANAMADI: HTTP ${pubRes.status}`);
    if (pubRes.ok) created += 1;
  }
  console.log(`\nBitti: ${created} duyuru eklendi.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
