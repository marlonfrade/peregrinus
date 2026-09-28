# Peregrinus — Sub-project A: Fork, Rebrand, Local Run

- **Date:** 2026-09-28
- **Status:** Approved (written spec approved 2026-09-28; Revision 1 applied after code survey, see §11)
- **Author:** Marlon Frade (with Claude)
- **Upstream:** [liketrek/TREK](https://github.com/liketrek/TREK) (AGPL-3.0), v4.3.0 at time of writing

## 1. Context and intent

Peregrinus is a travel planner for Marlon and the people he travels with. It is built as a fork of TREK, a self-hosted, real-time collaborative travel planner (NestJS + SQLite server, React 19 + Vite PWA client, offline-first, MCP server, plugin system).

**Goal sequence (stated by the owner):**
1. Personal / friends-group use first.
2. SaaS later, only after the product is validated in real use.

**Decisions already made:**
- Fork TREK rather than rewrite. Accepted consequence: the project stays AGPL-3.0 forever, so a future SaaS must publish its full source to network users.
- Fork from `liketrek/TREK` directly. `kayodante/TREK` (the originally shared link) is a fork of it with 0 commits ahead and 120 behind, so it adds nothing.
- Product name: **Peregrinus** (Latin: traveller, foreigner). TREK's trademark policy forbids using "TREK", variations or translations as the product name.

**Decomposition.** The full ambition splits into three sub-projects, each with its own spec, plan and implementation cycle:

| Sub-project | Scope | When | Core impact |
|---|---|---|---|
| **A (this spec)** | Fork, rebrand, pt-BR default, local run | Now | Minimal |
| B | Brazil focus (holidays, Pix in cost split, flight/hotel search, WhatsApp notifications); plugins first, small core patches only where a plugin cannot reach | After A, driven by real use | Low |
| C | SaaS readiness (multi-tenancy, billing, onboarding, database decision) | After validation | High |

C is deliberately deferred: TREK's data layer has ~851 raw `better-sqlite3` `.prepare()` calls across 88 files and a 243 KB SQLite migration file. Replacing the database now would end clean upstream merges during the phase where upstream features are most valuable. Notes gathered for C are in §9.

## 2. Success criteria

Sub-project A is done when all of these hold:

1. The image builds and runs via `docker compose -f docker-compose.peregrinus.yml up --build`; admin signup and login work; the UI opens in pt-BR with no visible "TREK" outside the credits.
2. Teal/coral theme renders correctly in light and dark mode, with Familjen Grotesk as the UI font and the compass mark in the navbar, login page, favicon and installed PWA icon.
3. PDF export, the passkey (WebAuthn) prompt and the admin version check all show Peregrinus.
4. The About tab links to the Peregrinus source repository and credits TREK; `NOTICE.md` carries the modification notice.
5. A trial upstream sync (`git merge upstream/main`) produces no conflicts outside `peregrinus:`-marked patch points.
6. The project is registered in POP (`categories/applications/peregrinus/`) and in `fradev-skills/memory/PROJECTS.md`.
7. All upstream gates stay green: `test`, `lint`, `typecheck`, `i18n:parity:strict`, `lint:pages`. The new `brand:check` gate is green.

**Out of scope for A:** deploying to the VPS (the owner has one, but A runs locally only), README screenshots, a hero image for the welcome notice, any Brazil-specific feature (B), any SaaS feature (C).

## 3. Repository and upstream flow

- Create the fork with `gh repo fork liketrek/TREK --fork-name peregrinus`, giving `marlonfrade/peregrinus`.
- Local checkout at `~/FraDev/fradev-lab/peregrinus`. This spec already lives there, so the checkout is created in place: `git init`, add remotes, fetch, check out `main`, then commit this spec.
- Remotes: `origin = marlonfrade/peregrinus`, `upstream = liketrek/TREK`.
- Branches:
  - `main`: Peregrinus line (upstream plus the rebrand).
  - `upstream-sync/<YYYY-MM-DD>`: short-lived branch per upstream merge. Tests run there before it merges into `main`.
- Sync procedure: `git fetch upstream && git checkout -b upstream-sync/<date> main && git merge upstream/main`, run the full gate suite, then merge into `main`. **Merge, never rebase:** history is shared with upstream.
- **Fork surface is concentrated** so conflicts stay rare:
  - `shared/src/brand/`: brand identity module.
  - `client/src/brand/`: brand stylesheet.
  - `client/public/brand/` and the replaced asset files listed in §5.
  - Small patches in upstream files. A patch is either marked with a `peregrinus:` comment (`// peregrinus:`, `{/* peregrinus: */}`, `<!-- peregrinus: -->` or `# peregrinus:` as the file type requires) or is a line that references `BRAND` from `@trek/shared`. `git grep -nE "peregrinus:|BRAND\b"` lists the entire core surface of the fork.
- `PEREGRINUS.md` at the repo root records what differs from TREK, the patch-point list and the sync procedure. It complements the upstream `CLAUDE.md`, which remains authoritative for the codebase.

## 4. Brand module and text substitution

### 4.1 Brand module

`shared/src/brand/index.ts` is the single source of the identity:

```ts
export const BRAND = {
  name: 'Peregrinus',
  repoUrl: 'https://github.com/marlonfrade/peregrinus',
  upstream: { name: 'TREK', url: 'https://github.com/liketrek/TREK' },
} as const

/** Replaces the whole word "TREK" with BRAND.name. */
export function applyBrand(s: string): string
```

`applyBrand` rules:
- Replaces `/\bTREK\b/g` with `BRAND.name`, so `TREK's` becomes `Peregrinus's`.
- Is case-sensitive: `trek`, `trekking`, `@trek/…` and `trek_session` are untouched.
- Is idempotent: `applyBrand(applyBrand(s)) === applyBrand(s)`.

Exported from the `@trek/shared` barrel so client and server both consume it.

### 4.2 Patch points

**Rule for what gets patched.** A literal containing "TREK" is patched when a Peregrinus user sees it: the app UI (including `alt` text), public share pages, e-mails, webhook and ntfy messages, exported files (GPX, ICS, PDF), OS prompts (passkey, TOTP issuer) and the admin version check. Everything else keeps "TREK" and is recorded in the `brand:check` baseline (§4.5): MCP tool descriptions (LLM-facing), plugin-compatibility messages (they refer to the TREK version contract that plugins declare), log lines, HTTP `User-Agent` and OAuth realm values, the upstream-hosted TREK Places integration (disabled, §4.4), demo-mode banners, doc-sync folder and tag names, and links to upstream documentation (the wiki).

| # | Location | Change |
|---|---|---|
| 1 | `client/src/i18n/TranslationContext.tsx` | Map each loaded locale dictionary (including the synchronous `en` fallback) through `applyBrand` once, at load time. No per-`t()` cost. |
| 2 | Server notification i18n resolution (`server/src/nest/notifications/notification-events.ts`, `mailer/email-html.ts`) | Apply `applyBrand` where the locale dictionary is resolved. |
| 3 | `server/src/nest/notifications/mailer/mailer.service.ts` | Three hardcoded `TREK — …` subjects use `BRAND.name`. |
| 4 | `server/src/nest/notifications/transports/ntfy.service.ts` | ntfy test message uses `BRAND.name`. |
| 5 | `server/src/nest/auth/webauthn-config.service.ts` | WebAuthn `rpName` uses `BRAND.name` (shown in the OS passkey prompt). |
| 6 | `server/src/nest/places/gpx-export.helpers.ts` | GPX `creator` attribute uses `BRAND.name`. |
| 7 | `client/src/components/Settings/AccountTab.tsx` | MFA backup-codes document title and heading use `BRAND.name`. |
| 8 | `client/src/components/Studio/StudioWordmark.tsx` | Wordmark renders Peregrinus. |
| 9 | `client/index.html` | `<title>` and meta description. |
| 10 | `client/vite.config.js` | PWA manifest `name`, `short_name`, `theme_color: '#0B2E33'`. |
| 11 | `server/src/nest/admin/admin.service.ts` | Release checks query `marlonfrade/peregrinus` releases (derived from `BRAND.repoSlug`), not `liketrek/TREK`. |
| 12 | `shared/src/i18n/externalNotifications/index.ts` | E-mail strings and event-text functions pass through the brand layer (supersedes row 2: this is where the server's notification locales are built). |
| 13 | `server/src/nest/notifications/mailer/email-html.ts` | Header logo, name and subtitle, and the footer credit. |
| 14 | `server/src/nest/notifications/transports/webhook.service.ts` | Webhook payload names and test message. |
| 15 | `server/src/nest/auth/auth.service.ts` | TOTP issuer (shown in authenticator apps). |
| 16 | `server/src/nest/calendar/calendar.service.ts` | ICS `PRODID` and default event name. |
| 17 | `server/src/nest/collections/collection-gpx.helpers.ts` | GPX creator of exported collections. |
| 18 | Client `alt` texts and footers: `Navbar`, `LoginPage`, `AddonManager`, `MAdminAddonManager`, `MDashboard`, `TripLoadingSplash`, `MTripLoadingSplash`, `JourneyPublicPage`, `SharedTripPage`, `ErrorBoundary`, `MSettingsAccount` | `BRAND.name` / `BRAND.repoUrl`. |
| 19 | Client repository links: `GitHubPanel`, `MAdminGitHubPanel`, `MSettingsAbout`, `MSettings`, `SettingsPage`, `AboutTab` | Issues, discussions and source links point to `BRAND.repoUrl`; wiki links keep pointing to the upstream wiki. |
| 20 | Inline logo components: `TrekIcon`, `TrekMark`, `StudioWordmark`, the `MARK` path in `MDancingTrek` | Render the compass mark (§5.4). Export names and props unchanged, so no consumer changes. |

Rows 1–2 route translated strings; rows 3–20 are hardcoded literals. The complete, current list lives in `PEREGRINUS.md`.

### 4.3 Explicitly unchanged

Internal identifiers stay as-is, because renaming them only buys merge conflicts: `@trek/*` package names, `TREK_*` environment variables, `trek-plugin-sdk`, code comments, file and directory names, cookie names.

### 4.4 TREK Places (resolved)

`server/src/nest/maps/trek-places.client.ts` calls `https://places.liketrek.com` by default and sends an `X-TREK-Instance` header. Upstream provides `TREK_PLACES_ENABLED=false`, under which place search falls back to OpenStreetMap. Peregrinus sets it in `.env.example` and `docker-compose.peregrinus.yml`. No code change.

### 4.5 Brand-leak guards

- **Locale test** (`shared/src/brand/brand-leak.spec.ts`): loads all 23 locales, applies `applyBrand` to every string and fails if any `\bTREK\b` remains.
- **`brand:check` script** (`shared/scripts/brand-check.mjs`, exposed as the root npm script `brand:check`): parses every non-test `.ts`/`.tsx` file under `client/src` and `server/src` (excluding i18n locale tables) with the TypeScript compiler API and collects string literals, template-literal parts and JSX text that match `\bTREK\b`. Hits are compared, as `path` + literal text (no line numbers, so unrelated edits do not churn it), with the reviewed baseline `shared/scripts/brand-check.baseline.json`. The check fails on a hit missing from the baseline (a new leak) **and** on a baseline entry that no longer occurs (a stale exemption). `--update` rewrites the baseline; its diff is reviewed like code. Runs in CI. An upstream merge that introduces a new hardcoded brand string therefore fails the build instead of leaking silently.

## 5. Visual identity

The chosen identity combines the **compass mark from direction A** with the **palette and type of direction C**, variant **V1 (coral needle)**.

### 5.1 Palette

| Token role | Light | Dark |
|---|---|---|
| Accent | `#0E7C86` (teal) | `#FF6B57` (coral) |
| Text on accent | `#FFFFFF` | `#071B1E` |
| Page background | `#F2F7F7` | `#071B1E` |
| Surface | `#FFFFFF` | `#0B2E33` |
| Primary content | `#0B2E33` | `#DDEFF0` |
| Edge | `#D7E6E7` | `#0E3A40` |

Accent hover, accent-on and accent-subtle values are derived during implementation and checked against WCAG AA. Target ratios: teal on white ≈ 4.9:1, petrol on coral ≈ 7:1.

### 5.2 Delivery: override the default scheme, do not add a scheme

Adding a scheme id means touching the `shared` appearance enum and adding a label key to all 23 locales, which the i18n parity gate enforces. Instead:
- The default scheme is the absence of a `data-scheme` attribute (`applyAppearance.ts` and `theme-boot.js` remove it for `default`). `client/src/brand/peregrinus.css`, imported after `index.css`, therefore redefines accent, surface, content and edge tokens under `:root:not([data-scheme])` and `.dark:not([data-scheme])`. Alpha-bearing tokens (`--bg-elevated`, `--bg-hover`, `--border-faint`) are left alone so the "transparency off" setting keeps working.
- `index.css` routes legacy hardcoded classes (`bg-slate-900`, `bg-indigo-600`, …) to the accent only under a non-default scheme. The brand stylesheet repeats that legacy bridge for `html:not([data-scheme])`, so un-migrated components follow the brand accent too.
- `client/src/theme/schemes.ts`: one-line `peregrinus:` patch to the `default` swatch (`light: '#0E7C86', dark: '#FF6B57'`).
- The other six schemes and the custom accent picker remain available.
- `theme:lint` continues to apply. No color literals outside the brand stylesheet.

### 5.3 Typography

- **Familjen Grotesk** (SIL OFL), bundled from `@fontsource/familjen-grotesk` (weights 400–700) the same way upstream bundles Poppins in `client/src/main.tsx`, and wired through `--font-system` and `--font-subtext`, replacing Poppins/Geist as the UI face.
- No Google Fonts CDN, because the PWA precaches everything for offline use.
- The wordmark SVGs are outlined paths, so they never depend on the font loading.

### 5.4 Mark and icons

The compass mark (V1): outer ring and N–S needle in petrol (`currentColor`), dashed inner ring in teal, north tip in coral, faint E–W axis.

| File | Content |
|---|---|
| `client/public/logo-light.svg`, `logo-dark.svg` | Mark + wordmark |
| `client/public/text-light.svg`, `text-dark.svg` | Wordmark only (outlined) |
| `client/public/icons/icon.svg` | Master app icon (petrol tile, light mark). Keeps upstream's `<g transform="translate(56,51) scale(0.267)">` wrapper so `scripts/generate-icons.mjs` produces the PWA PNGs, maskable variants and apple-touch icon at `prebuild`, unchanged |
| `client/public/icons/icon-dark.svg`, `icon-white.svg` | Mark alone for in-app use on light and dark surfaces |
| `client/public/icons/favicon.svg` (new) | Simplified mark on the petrol tile: outer ring + needle only, no dashed ring or E–W axis. `client/index.html` points its favicon here |
| Inline marks | `TrekIcon`, `TrekMark`, `StudioWordmark` and the mascot body in `MDancingTrek` render the compass (§4.2 row 20). The mascot keeps its eyes, props and animation |
| E-mail header | The compass as an inline SVG data URI, as upstream does with its logo |

Replacing asset files in place (rather than repointing references) means no reference changes. It does create a modify/modify conflict if upstream changes those exact files; the resolution is always "keep ours".

## 6. AGPL compliance, trademark and defaults

### 6.1 AGPL obligations

- **§13, source for network users:** the About tab (`client/src/components/Settings/AboutTab.tsx`) gets a "Source code" link to `BRAND.repoUrl`. The upstream issue, discussion and wiki links are repointed to the Peregrinus repository.
- **Credits:** "Based on TREK, © TREK contributors, AGPL-3.0" with a link to `BRAND.upstream.url`. This is hardcoded in the component, not routed through i18n, so `applyBrand` cannot rewrite it.
- **Modification notice:** a new top section in `NOTICE.md` states that Peregrinus is a modified version of TREK, with the date. Existing third-party data attributions (geoBoundaries CC BY 4.0, OpenStreetMap ODbL, and others) stay intact. `LICENSE` is untouched.

### 6.2 Trademark

- All TREK logos are removed (§5.4).
- "TREK" appears only in credits, describing the software's origin. The upstream `TRADEMARKS.md` permits this use.

### 6.3 Maintainer notices

- `TREK_MANAGED` is **not** used. The survey found it does far more than hide donation notices: it locks settings keys (map-provider tokens, LLM provider), hides integration settings and changes About and admin screens. That is wrong for a personal install.
- Instead, `server/src/systemNotices/registry.ts` gets a `peregrinus:` filter that drops the `release-notes` (TREK release notes with donation buttons) and `thank-you-support` notices.
- `AboutTab.tsx`: the upstream support/Discord/issues grid is not rendered, the "Source code" link (upstream shows it only when managed) is always rendered and points to `BRAND.repoUrl`, and the "made by" line is replaced with the TREK credit (§6.1).
- The welcome notice stays, rebranded through i18n, without its hero image.

### 6.4 Defaults (configuration only, no code)

- `DEFAULT_LANGUAGE=br` (already supported by `server/src/app-config`).
- Addons: upstream defaults. Lists, Costs, Documents, Collab, Vacay and Atlas are on. Journey, Collections, MCP, AI Parsing and AirTrail are off and can be enabled from the admin panel.

## 7. Local run and CI

### 7.1 Local run

- The upstream `docker-compose.yml` pulls `mauriceboe/trek:latest` (stock TREK), so it stays untouched. A new `docker-compose.peregrinus.yml` uses `build: .`, image `peregrinus:local`, port mapping as upstream, and volumes `./data` and `./uploads` (both git-ignored).
- `.env.example` is committed and `.env` is ignored. Keys: `DEFAULT_LANGUAGE=br`, `TREK_PLACES_ENABLED=false`, `ENCRYPTION_KEY=` (generate with `openssl rand -hex 32`).
- Development: `npm run dev` (server on 3001, Vite proxying the API).
- Image validation: `docker compose -f docker-compose.peregrinus.yml up --build`. This is the same image the VPS will run later.

### 7.2 CI

- Unwanted upstream workflows are disabled with `gh workflow disable`, not deleted, because deleting them causes modify/delete conflicts whenever upstream edits them. Disabled: `docker.yml`, `docker-dev.yml`, `publish-plugin-sdk.yml`, `wiki.yml`, `close-stale-invalid-titles.yml`, `close-stale-wrong-branch.yml`, `close-untitled-issues.yml`, `enforce-target-branch.yml`.
- Kept: `test.yml`, `lint-prettier.yml`, `security.yml`.
- `brand:check` is added as a step in `test.yml` (a `peregrinus:`-marked patch). If `test.yml` references Sonar or other upstream-only secrets, those steps are skipped when the secret is absent, not deleted.

## 8. Testing

TDD applies to all new code:

- **`applyBrand` unit tests:** whole-word replacement, possessive (`TREK's`), untouched `trek`, `trekking`, `@trek/shared`, `TREK_MANAGED`, idempotence, empty string.
- **Brand-leak locale test:** §4.5.
- **`brand:check`:** fixture-based test for the script (hit, allowlisted hit, comment ignored).
- **Upstream suite:** `npm run test`, `npm run lint`, `npm run typecheck --workspace=…` (all three), `npm run i18n:parity:strict --workspace=shared`, `cd client && npm run lint:pages`.
- **Manual verification checklist** (recorded in the PR description): login page, dashboard, a trip with a day plan, light/dark toggle, PWA install on a phone or desktop, passkey registration prompt, PDF export, About tab, admin version check.

## 9. Notes carried forward to sub-project C

- `client/src/managed/index.tsx` is an upstream-sanctioned attachment point for "managed install" screens (subscriptions, billing), designed to be replaced at build time. This is the natural home for SaaS surfaces.
- `TREK_MANAGED` already models "someone operates this install for its users" (locked settings keys, AGPL source link). Sub-project C should adopt it rather than the fork-level patches A uses for a personal install.
- Database: SQLite with raw prepared statements, single instance. Multi-tenant SaaS needs a decision among per-tenant instances, a Postgres port (high merge cost) or leaving the fork for a rewrite. Decide with usage data from A and B.
- AGPL: SaaS users must be offered the complete corresponding source, including any `managed/` screens.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Upstream adds a new hardcoded "TREK" string | `brand:check` fails CI on the sync branch |
| Upstream edits a replaced asset file | Modify/modify conflict, resolved "keep ours" (documented in `PEREGRINUS.md`) |
| Upstream refactors `TranslationContext.tsx` or the notification i18n | Conflict limited to one marked patch point; the locale leak test catches a missed re-application |
| Upstream edits the notice registry or About tab | Conflict limited to marked lines; `brand:check` and the manual checklist catch regressions |
| Upstream moves fast (120 commits in weeks) | Sync on a regular cadence, small merges beat large ones |

## 11. Revision log

**Revision 1 (2026-09-28, code survey before planning).** Reading the upstream code at the patch points changed five decisions. The intent of the approved design is unchanged.
1. The default colour scheme has no `data-scheme` attribute, so the brand stylesheet targets `:not([data-scheme])` and repeats the legacy accent bridge (§5.2).
2. `TREK_MANAGED` locks settings and hides integrations, so it is replaced by a registry filter and an About-tab patch (§6.3).
3. TREK Places is disabled with the existing `TREK_PLACES_ENABLED=false` (§4.4).
4. An AST scan found 187 non-i18n literals containing "TREK". About 40 are user-facing and are patched (§4.2); the rest are recorded in a generated, reviewed baseline with stale-entry detection, instead of a hand-written allowlist (§4.5).
5. The font is bundled from `@fontsource`; the icon master is `icon.svg`, with a new `favicon.svg`; the inline logo components and the e-mail header are rebranded too (§5.3, §5.4).
