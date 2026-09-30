# PEREGRINUS.md

Peregrinus is a fork of [TREK](https://github.com/liketrek/TREK). This file maps
what differs. The upstream `CLAUDE.md` files remain the guide to the codebase.

## Where the fork lives
- `shared/src/brand/` — `BRAND`, `applyBrand`, notification branding, compass mark.
- `client/src/brand/` — `CompassMark`, `peregrinus.css`, brand tests.
- `brand-tools/` — regenerates `client/public` brand SVGs (`npm run build --prefix brand-tools`).
- `shared/scripts/brand-check.mjs` + `brand-check.baseline.json` — the brand-leak gate.
- `docker-compose.peregrinus.yml`, `.env.example` — local/VPS run.
- Everything else: `git grep -nE "peregrinus:|BRAND\b" -- ':!docs' ':!shared/src/brand' ':!client/src/brand'`.

## Rules
- User-facing "TREK" → `BRAND`. Internal "TREK" (MCP descriptions, plugin compatibility, logs, headers) stays and is baselined. Wiki links stay upstream.
- Never rename `@trek/*`, `TREK_*`, `trek-plugin-sdk`.
- Do not set `TREK_MANAGED` (it locks settings). Donation notices are filtered in `server/src/systemNotices/registry.ts`.

## Syncing upstream
1. `git fetch upstream && git checkout -b upstream-sync/$(date +%F) main && git merge upstream/main`
2. Conflicts:
   - brand SVGs in `client/public` → keep ours (`git checkout --ours <file>`), then `npm run build --prefix brand-tools`.
   - `package-lock.json` → take theirs, then `npm install @fontsource/familjen-grotesk@^5.3.0 --workspace=client`.
   - any other file → keep upstream's change and re-apply the `peregrinus:` / `BRAND` line.
3. `npm ci && npm run build --workspace=shared && npm run brand:check && npm run test && npm run lint`
4. `brand:check` NEW entries: patch if user-facing, else `npm run brand:check -- --update` and review.
5. Merge the sync branch into `main` (merge, never rebase).
