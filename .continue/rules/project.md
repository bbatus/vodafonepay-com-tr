<!-- AUTO-GENERATED from AGENTS.md — do not edit directly.
     Run `bash scripts/sync-agent-rules.sh` to regenerate. -->

---
description: Project conventions for AI Website Clone Template
alwaysApply: true
---
<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Website Reverse-Engineer Template

## What This Is
A reusable template for reverse-engineering any website into a clean, modern Next.js codebase using AI coding agents. The Next.js + shadcn/ui + Tailwind v4 base is pre-scaffolded — just run `/clone-website <url1> [<url2> ...]`.

## Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **UI:** shadcn/ui (Radix primitives, Tailwind CSS v4, `cn()` utility)
- **Icons:** Lucide React (default — will be replaced/supplemented by extracted SVGs)
- **Styling:** Tailwind CSS v4 with oklch design tokens
- **Deployment:** Vercel

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript check
- `npm run check` — Run lint + typecheck + build

## Code Style
- TypeScript strict mode, no `any`
- Named exports, PascalCase components, camelCase utils
- Tailwind utility classes, no inline styles
- 2-space indentation
- Responsive: mobile-first

## Design Principles
- **Pixel-perfect emulation** — match the target's spacing, colors, typography exactly
- **No personal aesthetic changes during emulation phase** — match 1:1 first, customize later
- **Real content** — use actual text and assets from the target site, not placeholders
- **Beauty-first** — every pixel matters

## Project Structure

Two fully independent projects live side by side in this repo — `vodafonepaycomtr/` (this Next.js site) and `cms/` (Payload CMS). Neither is an npm workspace of the other; each has its own `package.json`/`node_modules`/lockfile, and every `npm run <script>` below must be run from inside `vodafonepaycomtr/`, not the repo root. `docker-compose.yml`, `scripts/`, and `docs/` stay at the repo root because they span both projects.

```
vodafonepaycomtr/     # this Next.js site — run `npm run <script>` from here
  src/
    app/              # Next.js routes
    components/       # React components
      ui/             # shadcn/ui primitives
      icons.tsx       # Extracted SVG icons as React components
    lib/
      utils.ts        # cn() utility (shadcn)
    types/            # TypeScript interfaces
    hooks/            # Custom React hooks
  public/
    images/           # Downloaded images from target site
    videos/           # Downloaded videos from target site
    seo/              # Favicons, OG images, webmanifest
cms/                  # Payload CMS — separate project, own package.json
docs/
  research/           # Inspection output (design tokens, components, layout)
  design-references/  # Screenshots and visual references
scripts/              # Cross-project scripts (Sonar/Trivy scans, cache warm-up, asset download)
```

## MOST IMPORTANT NOTES
- When launching Claude Code agent teams, ALWAYS have each teammate work in their own worktree branch and merge everyone's work at the end, resolving any merge conflicts smartly since you are basically serving the orchestrator role and have full context to our goals, work given, work achieved, and desired outcomes.
- After editing `AGENTS.md`, run `bash scripts/sync-agent-rules.sh` to regenerate platform-specific instruction files.
- After editing `.claude/skills/clone-website/SKILL.md`, run `node scripts/sync-skills.mjs` to regenerate the skill for all platforms.
- **After any large component or code change** (new component, non-trivial refactor, new collection/route), run a SonarQube scan before committing/pushing:
  1. `docker compose -f tools/sonarqube/docker-compose.yml up -d` (starts SonarQube on `http://localhost:9002` if not already running)
  2. `SONAR_TOKEN=<token> scripts/sonar-scan.sh all` (or `web` / `cms` to scope it) — generate a token once from the SonarQube UI (My Account > Security)
  3. Fix everything the scan reports before commit/push. The script exits non-zero if any open issue remains.
  - This is a local/dev-only stack, not part of `docker-compose.yml`'s prod services — never expose it, never bundle it into a deploy.
- **After any change to a Dockerfile or a dependency** (package.json/package-lock.json), run `scripts/trivy-scan.sh all` (Trivy — covers both container image and dependency/SCA scanning) and fix everything it reports before commit/push. Requires the app/cms images to be built first (`docker compose -p vodafonepaycomtr up -d --build app cms`).
- Both Dockerfiles use `node:24-alpine` (not `-slim`) specifically because Trivy found the Debian-slim base carried far more OS-level CVEs; the runner stages also strip `npm`/`npx`/`corepack` since they're never invoked at runtime and their bundled deps carry their own CVEs. Don't revert either of these without re-running `scripts/trivy-scan.sh images` to confirm the tradeoff.
- `npm test` / `npm run test:coverage` exist in both `vodafonepaycomtr/` and `cms/` (Vitest) — run from inside whichever project you touched. Keep coverage reasonably close to what's there now (~83% site, CMS access/hooks/collections near-100%) — write tests for new logic (access control, hooks, data transforms) rather than letting coverage silently regress.
- **Every custom Payload admin component** (anything under `cms/src/components/` wired via `admin.components.*`) must render its UI strings through `useAdminLocale()` (`cms/src/components/useAdminLocale.ts`), not hardcode Turkish or English — the admin panel supports tr/en (`cms/payload.config.ts` → `i18n`) and a component that ignores the current admin language breaks that for anyone using the EN switch. See `ReorderWidget.tsx` and `HelpButton.tsx` for the pattern (a `STRINGS = { tr: {...}, en: {...} }` map keyed by the hook's return value).
- **CMS user accounts are entirely LDAP/AccessPoint-managed — never build a case where email, username, role, or password change through the CMS.** Every account is provisioned by LDAP with a fixed vodafone.local email and username that never change; role is requested and granted through AccessPoint (LDAP's access-request system) as one of exactly 4 roles (`cms/src/access/roles.ts` → `ROLES`), never hand-picked in the CMS after creation. Only an LDAP-active employee holding one of those 4 roles can log in at all. Practical consequence for `cms/src/collections/Users.ts`: email/username/role are `admin.readOnly: true` + `access.update: () => false` — view-only, for every role including New Vertical Maker; password changes are blocked unconditionally in a `beforeChange` hook (`blockPasswordChange` — Payload has no real, declarable "password" field to gate via field access, confirmed against its Field type) with the "Change Password" button also hidden via CSS; the only account-modifying power any role (New Vertical Maker) has over ANOTHER user's account is unlocking it after a lockout (`access.unlock`, separate from `access.update`) — nothing else. The only genuinely self-service fields on a user's own account are avatar, preferredLocale, and delegateTo/delegationExpiresAt (checker delegation, RFP §3.1). Do not reintroduce editable email/username/role or a password-change flow without the user explicitly overriding this.
- **Tightening validation on an existing field is a data migration, not a field edit — sweep the existing rows in the same change.** `Pages`' `faqList.category` is free text that later grew `validate: categoryExistsValidate(CATEGORY_SCOPES.FAQ)`; the rows already holding `aninda-bakiye` and `batuhan` were never swept, and neither slug is a real FAQ category. The result (found live 29.08.2026) is worse than a broken block: **`/aninda-bakiye`, a published product page, could not be saved by anyone** — every role got "Lütfen geçersiz alanı düzeltin: Layout > Blok 5 (SSS Bloğu) > Kategori" for a field they had not touched, and the block itself rendered nothing to visitors, so nobody had a reason to look. Payload validates the whole document on save, so one stale value anywhere locks the entire record. Before adding a `validate` (or `required`, or a narrowed `options` list) to a field that already has rows, run the check as a query first and fix or migrate what fails.
- **A Growth Checker cannot take anything off the live site through the admin UI**, on any of the 13 standard collections — the server allows it (unpublish is an `update`, which the Checker has; verified with a REST PATCH that returned 200), but two independent things hide the control: Payload's dot-menu is gated on `hasCreatePermission || hasDeletePermission` (`DocumentControls/index.js`) and the Checker has neither by design, and `UnpublishButton` additionally requires `typeof versions.drafts === 'object'` while these collections declare `drafts: true`. So the one role whose job is controlling what is live can publish but never unpublish. Campaigns is unaffected — it has its own unpublish-request flow. Fixing this needs both a visible control outside the dot menu and `drafts: {}` in place of `drafts: true`; until then the only way back down is a New Vertical Maker or a direct API call.
- **Never show an admin control the server will refuse.** Payload derives its built-in buttons from collection `access` only — it knows nothing about our `beforeChange` guards (`denyMakerPublish`, `denyMakerEditPublished`), and hand-rolled admin views (`FeesAndLimitsApp`, anything under `cms/src/components/`) derive nothing at all unless you write the check. Both cases shipped live and were only caught by walking the UI (28.08.2026): a Growth Maker got a Publish button whose sole possible outcome was a 403 toast, and a Growth Checker — who has `create: false` everywhere by design — got a "Yeni Ücret Satırı" button that 403'd on save. Gate custom views on `useAuth().permissions?.collections?.[slug]?.<op>`, and replace a built-in button a hook will reject with an override that renders the real state instead (`MakerAwarePublishButton`).
- **Any change that adds a path to `admin.components.*` must add it to `cms/src/app/(payload)/admin/importMap.js` in the same commit, and be confirmed in a browser.** `payload generate:importmap` is broken here (ERR_REQUIRE_ASYNC_MODULE, see R-10), so the entry is hand-written. An unmapped component path throws no error and logs nothing — Payload renders **nothing** in that slot, for every role, and the empty space looks exactly like a deliberate "this role has no button." `MakerAwarePublishButton` shipped this way and the missing publish button was misread as success until a temporary `console.log` proved the component never mounted.
- **API-level access tests cannot verify admin UI behaviour — walk the browser.** A 196-assertion REST audit passed clean while three UI-only defects were live: the two above, plus admin relationship pickers showing "Seçenek yok" because newly drafts-enabled collections had empty `_v` version tables (the admin reads pickers from the version table; API callers pass relationship ids directly and never open a picker). When a change touches roles, drafts, or `admin.components`, log in as each affected role and open the actual screens.
- **Never create a CMS collection/field that isn't wired to a real render path in the same change.** Found live (28.08.2026): `ProductHeroes`/`FeatureCards`/`StepCards` were built as standalone collections, listed in the admin sidebar, but had zero rows and — for `StepCards` — weren't even called from any page; the real "Adım Kartları"-looking content editors could actually see on `/aninda-bakiye` etc. lived in Pages' own `hero`/`steps`/`stepPhones`/`featureHighlights` layout blocks instead, a second parallel system nobody had reconciled. An editor sees a collection in the sidebar and reasonably assumes editing it changes the live site — a collection that doesn't is worse than no collection, it's a silent trap. Before adding a new page-scoped collection, check whether Pages' block library (`cms/src/collections/Pages.ts`) already covers the same content shape — extend an existing block (optional fields, same as `iconCards.description`/`imageTextSlides.sideImage`/`videoList.darkBackgroundImage` added this same day) or add a new one there first; a dedicated standalone collection is for content genuinely shared/listed across many pages (Campaigns, BlogPosts, Representatives), not a single page's own hero/cards/steps. If a collection or field really is added, the same commit must make it actually render somewhere — no "wire it up later." **The trap also grows back sideways: `ContentBlocks` was wired to a real caller and still went dead** (retired 29.08.2026) — its only caller sat on `src/app/page.tsx`'s CMS-unreachable fallback branch, which stopped running the day an `anasayfa` Pages document was published, so the collection kept accepting edits through the full Maker→Checker flow while the homepage read its `stepPhones`/`featureHighlights` blocks instead. `PageMeta` had the mirror-image version: fine for the 16 hand-written routes, silently unread on every CMS Pages route — while its own field help offered `/aninda-bakiye`, a CMS page, as the example. So "it has a caller" is not the check; **the check is opening the rendered page and seeing your edit**, which is also the only way either of these surfaced.
- **The real AccessPoint role matrix — 3 of its 4 rows are accepted, implemented CMS reality (28.08.2026):** `RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW` → `ROLES.NEW_VERTICAL_CHECKER`, `ROLE_VODAFONEPAY_CMS_MAKER_RW` → `ROLES.GROWTH_MAKER`, `ROLE_VODAFONEPAY_CMS_CHECKER_RO` → `ROLES.GROWTH_CHECKER` (mapping unchanged in `cms/src/access/roleMapping.ts`, already correct since the 18.08 refactor). The 4th row, `RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW` → `ROLES.NEW_VERTICAL_MAKER`, is deliberately out of scope for this reconciliation — it's "us" (codebase-level developer access), left exactly as it was. **Growth Maker/Checker's scope changed from Campaigns-only to the full New Vertical content scope** (`cms/src/lib/collectionLabels.ts` → `NEW_VERTICAL_DASHBOARD_COLLECTIONS`/`GROWTH_DASHBOARD_COLLECTIONS`, now identical lists) — every "standard shape" collection (Pages, FaqItems, BlogPosts, Announcements, ContentBlocks, Representatives, LegalPages, FeeRows, LimitTables, NavLinks, CookieRows, PageMeta, Categories, Documents, Media) now uses the shared `standardCreate`/`standardReadWrite`/`standardDelete` access functions in `cms/src/access/roles.ts`, which fold in Growth alongside New Vertical. Growth Checker's create right was removed everywhere it existed (including Campaigns) — a Checker approves/publishes, it never originates content, full stop. Categories/Representatives/Documents didn't have a draft/publish concept before this and needed `versions.drafts: true` added (DB migration: `scripts/growth-role-migration-28-08.sql`) purely so Growth's maker→checker segregation of duties has something to gate. The actual maker/checker enforcement for every one of these (beyond Campaigns' own richer, bespoke `reviewStatus`/`unpublishRequest`/`forceLiveEdit` system, which was deliberately NOT replicated) is two small generic hooks: `denyMakerPublish` (blocks the draft→published transition) and `denyMakerEditPublished` (blocks touching an already-published doc at all) — a Growth Maker creates/edits drafts, never publishes, never edits something already live; a Growth Checker never creates, only reviews and publishes. Extend this same pair into any future collection rather than inventing a new review mechanism.

# Website Inspection Guide

## How to Reverse-Engineer Any Website

This guide outlines what to capture when inspecting a target website via Chrome MCP or browser DevTools.

## Phase 1: Visual Audit

### Screenshots to Capture
- [ ] Every distinct page — desktop, tablet, mobile
- [ ] Dark mode variants (if applicable)
- [ ] Light mode variants (if applicable)
- [ ] Key interaction states (hover, active, open menus, modals)
- [ ] Loading/skeleton states
- [ ] Empty states
- [ ] Error states

### Design Tokens to Extract
- [ ] **Colors** — background, text (primary/secondary/muted), accent, border, hover, error, success, warning
- [ ] **Typography** — font family, sizes (h1-h6, body, caption, label), weights, line heights, letter spacing
- [ ] **Spacing** — padding/margin patterns (look for a scale: 4px, 8px, 12px, 16px, 24px, 32px, etc.)
- [ ] **Border radius** — buttons, cards, avatars, inputs
- [ ] **Shadows/elevation** — card shadows, dropdown shadows, modal overlay
- [ ] **Breakpoints** — when does the layout shift? (inspect with DevTools responsive mode)
- [ ] **Icons** — which icon library? custom SVGs? sizes?
- [ ] **Avatars** — sizes, shapes, fallback behavior
- [ ] **Buttons** — all variants (primary, secondary, ghost, icon-only, danger)
- [ ] **Inputs** — text fields, textareas, selects, checkboxes, toggles

## Phase 2: Component Inventory

For each distinct UI component, document:
1. **Name** — what would you call this component?
2. **Structure** — what HTML elements / child components does it contain?
3. **Variants** — does it have different sizes, colors, or states?
4. **States** — default, hover, active, disabled, loading, error, empty
5. **Responsive behavior** — how does it change at different breakpoints?
6. **Interactions** — click, hover, focus, keyboard navigation
7. **Animations** — transitions, entrance/exit animations, micro-interactions

### Common Components to Look For
- Navigation (top bar, sidebar, bottom bar)
- Cards / list items
- Buttons and links
- Forms and inputs
- Modals and dialogs
- Dropdowns and menus
- Tabs and segmented controls
- Avatars and user badges
- Loading skeletons
- Toast notifications
- Tooltips and popovers

## Phase 3: Layout Architecture

- [ ] **Grid system** — CSS Grid? Flexbox? Fixed widths?
- [ ] **Column layout** — how many columns at each breakpoint?
- [ ] **Max-width** — main content area max-width
- [ ] **Sticky elements** — header, sidebar, floating buttons
- [ ] **Z-index layers** — navigation, modals, tooltips, overlays
- [ ] **Scroll behavior** — infinite scroll, pagination, virtual scrolling

## Phase 4: Technical Stack Analysis

- [ ] **Framework** — React? Vue? Angular? Check `__NEXT_DATA__`, `__NUXT__`, `ng-version`
- [ ] **CSS approach** — Tailwind (utility classes), CSS Modules, Styled Components, Emotion, vanilla CSS
- [ ] **State management** — Redux (check DevTools), React Query, Zustand, Pinia
- [ ] **API patterns** — REST, GraphQL (check network tab for `/graphql` requests)
- [ ] **Font loading** — Google Fonts, self-hosted, system fonts
- [ ] **Image strategy** — CDN, lazy loading, srcset, WebP/AVIF
- [ ] **Animation library** — Framer Motion, GSAP, CSS transitions only

## Phase 5: Documentation Output

After inspection, create these files in `docs/research/`:
1. `DESIGN_TOKENS.md` — All extracted colors, typography, spacing
2. `COMPONENT_INVENTORY.md` — Every component with structure notes
3. `LAYOUT_ARCHITECTURE.md` — Page layouts, grid system, responsive behavior
4. `INTERACTION_PATTERNS.md` — Animations, transitions, hover states
5. `TECH_STACK_ANALYSIS.md` — What the site uses and our chosen equivalents
