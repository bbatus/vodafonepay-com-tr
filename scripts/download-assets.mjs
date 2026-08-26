import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolved from this script's own location, not process.cwd() — the "public/"
// paths below are site-relative, and the site now lives one level down from
// the repo root (vodafonepaycomtr/), not at the repo root itself.
const SITE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "vodafonepaycomtr");

const assets = [
  // fonts
  ["https://www.vodafonepay.com.tr/assets/dist/fonts/vodafone-light.woff", "public/fonts/vodafone-light.woff"],
  ["https://www.vodafonepay.com.tr/assets/dist/fonts/vodafone-bold.woff", "public/fonts/vodafone-bold.woff"],
  ["https://www.vodafonepay.com.tr/assets/dist/fonts/vodafone-regular.woff", "public/fonts/vodafone-regular.woff"],
  // seo
  ["https://www.vodafonepay.com.tr/favicon.ico", "public/seo/favicon.ico"],
  ["https://www.vodafonepay.com.tr/assets/images/og-image.jpg", "public/seo/og-image.jpg"],
  // logo
  ["https://cms.vodafone.com.tr/static/vpay/img/content/25-12/22/vpay-logo.svg", "public/images/vpay-logo.svg"],
  // hero
  ["https://cms.vodafone.com.tr/static/vpay/img/content/26-01/19/3090x960-copy-3-1768828280.jpg", "public/images/hero-spotlight.jpg"],
  // step phones
  ["https://cms.vodafone.com.tr/static/vpay/img/content/25-12/31/5x-vpay-home_mkkkkkkkkkkk.png", "public/images/step-app.png"],
  ["https://cms.vodafone.com.tr/static/vpay/img/content/25-12/31/desktop-mockup-copy-1.png", "public/images/step-faturana-yansit.png"],
  ["https://cms.vodafone.com.tr/static/vpay/img/content/25-12/31/desktop-mockup-copy-2.png", "public/images/step-qr-faturana-yansit.png"],
  ["https://cms.vodafone.com.tr/static/vpay/img/content/25-12/31/desktop-mockup-copy-3.png", "public/images/step-aninda-bakiye.png"],
  ["https://cms.vodafone.com.tr/static/vpay/img/content/25-12/31/desktop-mockup-copy-4.png", "public/images/step-vpay-kart.png"],
  // feature video
  ["https://cms.vodafone.com.tr/static/vpay/import/26-01/07/251231_vf_webrazzi_56sn_wip01-1767776449.mp4", "public/videos/feature-loop.mp4"],
  // campaigns
  ["https://cms.vodafone.com.tr/static/vpay/img/content/26-07/06/1080x1080-1783346138.jpg", "public/images/campaign-cesme.jpg"],
  ["https://cms.vodafone.com.tr/static/vpay/img/content/26-07/13/vfpay-750-600.jpg", "public/images/campaign-hayat-su.jpg"],
  ["https://cms.vodafone.com.tr/static/vpay/img/content/26-06/26/640_427.jpg", "public/images/campaign-market.jpg"],
  // footer
  ["https://cms.vodafone.com.tr/static/vpay/img/content/26-01/09/sticky-qr.png", "public/images/sticky-qr.png"],
  ["https://cms.vodafone.com.tr/static/vpay/img/content/26-01/27/linkedin-light.svg", "public/images/linkedin-light.svg"],
];

async function downloadOne(url, dest) {
  const destPath = path.join(SITE_ROOT, dest);
  await mkdir(path.dirname(destPath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAILED ${res.status} ${url}`);
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  console.log(`OK  ${dest}  (${(buf.length / 1024).toFixed(1)} KB)`);
  return true;
}

async function main() {
  const batchSize = 4;
  for (let i = 0; i < assets.length; i += batchSize) {
    const batch = assets.slice(i, i + batchSize);
    await Promise.all(batch.map(([url, dest]) => downloadOne(url, dest)));
  }
}

main();
