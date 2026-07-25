# Page Topology — vodafonepay.com.tr (Homepage)

Source: https://www.vodafonepay.com.tr/
Total body height: ~6442px (desktop 1440px viewport)

## Global
- Brand font: `VodafoneRegular` / `VodafoneRegularBold` (self-hosted woff, proprietary Vodafone typeface) at `/assets/dist/fonts/vodafone-{light,regular,bold}.woff`
- Body fallback font stack: `ui-sans-serif, system-ui, sans-serif, ...`
- Base text color: `#000000`, base font-size `16px` / line-height `24px`
- Primary brand red: `rgb(230, 0, 0)` = `#E60000`
- Secondary dark navy (accent, seen on a card bg): `rgb(39, 69, 92)` = `#27455C`
- Neutral grays: `#F3F4F6`, `#EEEEEE`, `#F9FAFB`, `#F8F8F8`
- Favicon: `/favicon.ico`
- OG image: `/assets/images/og-image.jpg`
- Title: "Vodafone Pay | Yeni Nesil Mobil Cüzdan"
- Meta description: "Vodafone Pay ile cüzdanınıza bakış açınız kökten değişiyor, hazır mısınız? Vodafone Pay hakkında detaylı bilgi almak için tıklayın."
- Cookie consent banner (OneTrust) appears on load — bottom overlay, dismissible ("Çerezleri reddet" / "Çerezleri kabul et" / "Çerez ayarları"). Out of scope to replicate the real OneTrust SDK; will mock a simple static banner shell if needed, otherwise omit (backend/3rd-party service, out of scope per skill defaults).
- Original site uses a "lazy-component" class pattern on several widgets (their own lazy-mount system) — not something to replicate; Next.js handles this natively.

## Sections (top → bottom, in DOM order)

1. **Header / Nav** (`#widget_Header_6`) — height 90px, sticky top, white bg. Logo (Vodafone + Pay lockup) left, nav links right: Ürünler (dropdown), Kampanyalar, Blog, Ücretler ve Limitler, Sıkça Sorulan Sorular. Static (no scroll-shrink observed yet — to verify in interaction sweep).

2. **Hero / Spotlight** (`#widget_Homepage_VpaySpotlight_3`) — height ~420px. Full-bleed red background image (photo of woman with phone), rounded corners, Vodafone Pay logo top-right, headline "Vodafone Pay — Ödemenin Akıllı Hali" bottom-left in white `VodafoneRegularBold`. CSS comment in DOM shows a `@media (min-width:1024px) { .slide-image { background-position: center } }` rule — likely a background-image carousel/slide component.

3. **"Bizi neler bekliyor" / Step Phones** (`#widget_Homepage_VpayStepPhones_5`) — height ~3356px (by far the largest section). Heading "Vodafone Pay'de bizi neler bekliyor?" + subtext, followed by a tall step-based showcase of 5 products (Uygulama, Faturana Yansıt, QR ile Faturana Yansıt, Anında Bakiye, Kart) each paired with a phone-mockup screenshot. Given the height (~670px per product), this is very likely a **sticky/scroll-driven** layout: phone mockup pinned while text steps scroll past, OR simple stacked sections each with their own phone image — interaction model TBD, needs a dedicated scroll sweep (see BEHAVIORS.md).

4. **"Akıllı Ödeme Yöntemleri" / Ayrıcalıklar Dünyası** (`#widget_Homepage_VpayAyricaliklarDunyasi_7`) — height 716px. 3-column feature highlight grid (smart payment methods / earn rewards while spending / personalized limits), icon + heading + short text per column.

5. **Kampanyalar** (`#widget_Homepage_VpayKampanya_8`) — height 348px. Horizontal row of campaign cards (currently: Çeşme plajları 1.000 TL nakit iade + 2 others), image + title + CTA per card.

6. **SSS / FAQ** (`#widget_General_FAQs_9`) — height 1055px. Accordion list, first item "Vodafone Pay Nedir?" — click-driven expand/collapse (needs interaction sweep to confirm single-open vs multi-open accordion).

7. **Footer** (`#widget_Footer_1`) — height 376px. Columns: Temsilciliklerimiz (representative offices), İletişim, Kurumsal/legal links, social (LinkedIn), blog highlights, campaign highlights, legal docs (gizlilik, kullanım koşulları, çerez politikası), site haritası.

Hidden/non-visual widgets present in DOM but not rendered content: `widget_DownloadVpayApp` (height 0, likely a mobile app-download modal/banner that only activates on mobile or after a scroll trigger — check on mobile viewport), `widget_EnableVarnishCache` (height 0, pure caching utility — ignore entirely).

## Scope for This Clone
Per approved plan: **homepage only**, static marketing content. Real backend (FAQ data source, campaign CMS, cookie consent SDK, app download deep-linking) out of scope — will use real extracted text/images as static content, no live backend wiring.
