/**
 * Recovers the "Vodafone Pay Uygulaması" product page (30.08.2026).
 *
 * Found while rewriting docs/PROJECT-OVERVIEW.md: `pages.id` jumps from 7 to 9 —
 * id 8 (slug `vodafone-pay-uygulama`) is gone, with no audit-log entry and no
 * `_pages_v` row, so it was deleted outside the normal API path at some point
 * after the 19.08 pilot migration (`docs/STATUS.md` §2.10). The header's
 * "Ürünler" dropdown still has a published NavLinks row pointing at
 * `/vodafone-pay-uygulama` (position 1) — every visitor who opens that menu
 * item today gets a 404.
 *
 * Its Category (`vodafone-pay-uygulama` FAQ scope) and FAQItems were deleted
 * with it and are NOT recoverable — they were DB-only content, never in git.
 * This script restores only what IS recoverable: the hero heading/image and
 * the 3 "Nasıl Kazanırım?" steps, both real copy taken from the page's last
 * pre-CMS commit (`git show a0d65bf~1:src/app/vodafone-pay-uygulama/page.tsx`)
 * and its still-present static assets under `vodafonepaycomtr/public/images/`.
 * No FAQ block is added — fabricating question/answer content nobody wrote
 * would violate the project's own "no invented content" rule; an editor needs
 * to re-author that section.
 *
 * Idempotent: does nothing if a `vodafone-pay-uygulama` Pages doc already exists.
 *
 * Usage: node scripts/recover-vodafone-pay-uygulama-30-08.mjs
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, "..", "vodafonepaycomtr", "public", "images");

const CMS = process.env.CMS_URL ?? "http://localhost:3010";
const MAKER = { email: process.env.MAKER_EMAIL ?? "ece.boran@vodafone.com", password: process.env.MAKER_PASSWORD ?? "VodafonePay!2026" };
const CHECKER = { email: process.env.CHECKER_EMAIL ?? "mert.sarihan@vodafone.com", password: process.env.CHECKER_PASSWORD ?? "VodafonePay!2026" };

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

const auth = (token) => ({ Authorization: `JWT ${token}` });

async function uploadMedia(token, filename, alt) {
  const filePath = path.join(IMAGES_DIR, filename);
  const buffer = await readFile(filePath);
  const ext = path.extname(filename).slice(1);
  const mime = ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : "image/jpeg";
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mime }), filename);
  form.append("_payload", JSON.stringify({ alt }));
  const res = await fetch(`${CMS}/api/media`, { method: "POST", headers: auth(token), body: form });
  const json = await res.json();
  if (!json.doc?.id) throw new Error(`Medya yüklenemedi (${filename}): ${JSON.stringify(json.errors ?? json).slice(0, 200)}`);
  return json.doc.id;
}

async function main() {
  const [makerToken, checkerToken] = await Promise.all([login(MAKER), login(CHECKER)]);

  const existing = await fetch(`${CMS}/api/pages?where[slug][equals]=vodafone-pay-uygulama&depth=0`, {
    headers: auth(checkerToken),
  }).then((r) => r.json());
  if (existing.docs?.length) {
    console.log("Zaten var, atlandı: vodafone-pay-uygulama");
    return;
  }

  console.log("Görseller yükleniyor...");
  const [heroImg, stepsImg, iconBakiye, iconHarca, iconKazan] = await Promise.all([
    uploadMedia(makerToken, "uygulama-hero.jpg", "Vodafone Pay Uygulaması"),
    uploadMedia(makerToken, "step-nasil-kazanirim.png", "Vodafone Pay ile Nasıl Kazanırım?"),
    uploadMedia(makerToken, "icon-bakiye-yukle.svg", "Bakiye Yükle"),
    uploadMedia(makerToken, "icon-harca.svg", "Harca"),
    uploadMedia(makerToken, "icon-kazan.png", "Kazan"),
  ]);
  console.log("  5 görsel yüklendi.");

  const data = {
    title: "Vodafone Pay Uygulaması",
    slug: "vodafone-pay-uygulama",
    visibility: "public",
    layout: [
      {
        blockType: "hero",
        heading: "Vodafone Pay Uygulaması'nı indir",
        image: heroImg,
        ctaLabel: "Uygulamayı İndir",
        ctaUrl: "/vodafone-pay-uygulama#indir",
      },
      {
        blockType: "howToEarn",
        heading: "Vodafone Pay ile Nasıl Kazanırım?",
        image: stepsImg,
        steps: [
          { icon: iconBakiye, title: "Bakiye Yükle", description: "Banka/kredi kartınızdan, EFT ile veya tüm ATM'lerden dilediğiniz kadar bakiye yükleyin." },
          { icon: iconHarca, title: "Harca", description: "Tüm online ve fiziksel alışverişlerinizi Vodafone Pay Kart ile yapabilirsiniz." },
          { icon: iconKazan, title: "Kazan", description: "Kampanya kapsamında yaptığınız tüm harcamalardan yüzlerce TL nakit iade kazanın!" },
        ],
      },
    ],
  };

  const createRes = await fetch(`${CMS}/api/pages?draft=true`, {
    method: "POST",
    headers: { ...auth(makerToken), "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, _status: "draft" }),
  });
  const createJson = await createRes.json();
  if (!createJson.doc?.id) {
    console.error("OLUŞTURULAMADI:", JSON.stringify(createJson.errors ?? createJson).slice(0, 500));
    process.exit(1);
  }
  console.log(`Taslak oluşturuldu: pages/${createJson.doc.id}`);

  const pubRes = await fetch(`${CMS}/api/pages/${createJson.doc.id}`, {
    method: "PATCH",
    headers: { ...auth(checkerToken), "Content-Type": "application/json" },
    body: JSON.stringify({ _status: "published" }),
  });
  console.log(pubRes.ok ? "Yayınlandı." : `YAYINLANAMADI: HTTP ${pubRes.status}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
