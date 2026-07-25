# Behaviors — vodafonepay.com.tr (Homepage)

## Header / Nav
- **Interaction model:** static, sticky positioning only. `position: sticky; top: -1px; z-index: 999`.
- No background/shadow/size change observed on scroll (checked scrollY 0 vs 800 — identical computed styles).
- **Desktop (≥1024px):** logo left ("Vodafone | Pay" lockup), horizontal nav links right: Ürünler (has dropdown — not expanded/inspected in depth, treat as simple link for this PoC), Kampanyalar, Blog, Ücretler ve Limitler, Sıkça Sorulan Sorular.
- **Mobile (<1024px):** hamburger icon (left) + centered/right logo lockup; nav links collapse into a menu (not opened/inspected — build a standard slide-in/drawer menu with the same 5 links).

## App Download Banner (`widget_DownloadVpayApp`)
- **Interaction model:** static banner, dismiss on click (X button).
- Hidden entirely at desktop widths (height: 0, not rendered). **Visible only on mobile** (<1024px, confirmed at 390px): full-width black bar above the header, app icon + "Vodafone Pay uygulamasını indir" text + close (X) icon.
- Out of scope for real app-store deep-linking; implement as a static dismissible banner (local state, no persistence needed for PoC).

## Hero / Spotlight
- **Interaction model:** static (CSS comment referencing `.slide-image { background-position: center }` at ≥1024px suggests the original may support multiple slides/carousel via CMS, but only one slide is currently configured — build as a single static hero, not a carousel).
- **Desktop:** full-bleed rounded-corner card, background photo, headline text ("Vodafone Pay" / "Ödemenin Akıllı Hali") overlaid in white `VodafoneRegularBold`, bottom-left, Vodafone Pay logo lockup top-right of the image.
- **Mobile:** image and headline are NOT overlaid — image is full-bleed edge-to-edge (no rounded corners/card treatment), headline text sits BELOW the image on a light-gray (`#F3F4F6`-ish) background band, centered, large bold black text (not white-on-image).
- **Breakpoint:** layout switches ~1024px (`lg:` Tailwind prefix pattern observed elsewhere on the site, consistent with Tailwind's default `lg` breakpoint).

## "Bizi neler bekliyor" / Step Phones (5 products)
- **Interaction model:** static. Confirmed via `getComputedStyle(...).position === 'static'` on all 5 step blocks — this is NOT a sticky/scroll-driven showcase despite its large height; it's simply 5 stacked rows, each `flex flex-col lg:flex-row items-center`, phone mockup image + text block.
- **Desktop:** each row is horizontal (`lg:flex-row`) — phone image and text side by side, alternating sides is plausible but not confirmed; build them in a consistent alternating left/right pattern per row index (even rows: image left, text right; odd rows: reversed) as a reasonable default, OR verify visually during QA pass and adjust.
- **Mobile:** stacks vertically (`flex-col`) — phone image on top, text below, confirmed via mobile screenshot (first step: "Vodafone Pay'e hoş geldin" phone mockup above heading/body text).
- 5 items in order: Vodafone Pay Uygulaması, Faturana Yansıt, QR ile Faturana Yansıt, Anında Bakiye, Vodafone Pay Kart.

## "Akıllı Ödeme Yöntemleri" (Feature Highlights)
- **Interaction model:** static, 3-column grid on desktop.
- 2 of the 3 columns use a looping muted `<video>` (not a static icon/image) — same source video reused, likely a decorative product-demo loop. Treat as `autoplay muted loop playsinline`.
- 3rd column likely a static icon (only 2 `<video>` elements found vs 4 "col/item" containers — verify exact icon during build, fall back to a simple icon if unclear).
- CTA at bottom: "Kampanyalar İncele" button (links to /kampanyalar — build as a styled link, no real routing needed for PoC scope, can point to `#` or the campaigns section).

## Kampanyalar (Campaign Cards)
- **Interaction model:** likely a horizontal carousel — 3 unique campaign images appear twice each in the DOM (6 `<img>` total, 3 distinct `src` values), a common seamless-loop marquee/carousel duplication pattern.
- **Simplification for this PoC:** build as a simple horizontal row / scroll-snap carousel of the 3 unique campaign cards (image + title + short description + CTA), without replicating exact auto-scroll/loop timing. Note this as a known simplification.
- Cards: (1) "Vodafone Pay ile Çeşme Plajlarında 1.000 TL Nakit İade!", (2) "1 TL'ye Hayat Su Kapında!", (3) a third market-purchase themed campaign (verify exact copy from screenshot during build).

## SSS / FAQ
- **Interaction model:** click-driven accordion, independent per-item toggle (not verified as single-open — implement as independent toggles, the simpler/more common default).
- Structure: `.faq-item > .faq-question (click target, chevron icon rotates/toggles) + .faq-answer.is-hidden (toggled)`.
- Chevron icon: SVG downward chevron, `stroke="#E60000"` (brand red), rotates 180° when open (implement as a CSS transform on open state — exact rotation not measured, use standard 180°).
- Question style: `bg-white px-5 py-[22px] shadow-[0px_2px_8px_0px_#00000029] rounded flex items-center justify-between cursor-pointer` (exact Tailwind-equivalent classes already match the site's own utility-class system).
- Answer style: `.faq-answer-content { px-5 py-4 bg-gray-50 rounded }`.
- 4+ FAQ items total (first: "Vodafone Pay Nedir?").

## Footer
- **Interaction model:** static, multi-column link list (35 links total). No accordions observed on desktop; verify on mobile whether columns collapse into accordions (common pattern) — if unclear during build, keep as stacked static columns for simplicity (acceptable PoC simplification).

## Responsive Breakpoint Summary
- **Primary breakpoint:** ~1024px (Tailwind `lg:`), consistent with the site's own `lg:flex-row` / `lg:flex-col` classes.
- Tested at 1440px (desktop) and 390px (mobile). 768px (tablet) not separately verified — assume it behaves like mobile until 1024px per the `lg:` breakpoint convention, adjust during visual QA if it looks wrong.

## Known Out-of-Scope Items (per approved plan)
- OneTrust cookie consent SDK — real backend/3rd-party service, not replicated (a simple static banner shell only if needed for visual completeness).
- Live campaign/CMS data — content is hardcoded from the current live snapshot (2026-07-25), not dynamically fetched.
- "Ürünler" nav dropdown contents — not expanded/inspected in this pass; build as a simple link for the PoC, can be revisited if the user wants full nav fidelity.
