# PROJECT-CONTEXT — ali-theme-01
_Kept in the theme repo root. Updated by Claude Code via /handover. Last update: 2026-11-04._

## Client
- Brand: LAMEEM — smart organizers (metal card wallet with tracking, key organizer). Store: <url> · Contact: <name, role>. Don't store phone numbers or passwords here.
- Option: A / B / C · Deadline: <date> · Languages: ar + en

## Theme
- Theme name / Theme ID: ali-theme-01 / 1225475942 · Repo: https://github.com/alimay21297-gif/ali-theme-01 · Demo store id: <ask>
- Stack: Twilight React (TanStack Start), Salla CLI 3.2.64, Node 26.13.0, pnpm 12.16.1

## Brand tokens (single source: app/styles/01-settings/global.scss)
| Token | Value | Use |
|---|---|---|
| primary | #0F2A1E | brand, dark shell |
| deep | #08170F | deepest dark surfaces |
| ink | #111111 | text on light |
| light | #F4F5F2 | light content sections |
| muted | #9FB2A6 | secondary text, calligraphy tint |
| fonts | Readex Pro (Arabic + Latin) | |

## Decisions (with reason)
- 2026-11-04 — Direction: dark green premium tech. Dark shell, light content sections.
- 2026-11-04 — Font: Readex Pro for both Arabic and Latin.
- 2026-11-04 — Calligraphy background: `public/images/patterns/calligraphy-on-dark.v1.svg` at 8% opacity, dark sections only (hero, dark bands, footer), never behind products/prices/body text; merchant can toggle it. Glyphs from Aref Ruqaa (OFL 1.1); generator script kept outside the repo.

## Status
| Phase | State | Notes |
|---|---|---|
| 0 Setup | ✅ | |
| 1 Tokens | 🔶 | Step 1 done (brand tokens, self-hosted Readex Pro v530, headings). Step 2 next: calligraphy background setting |
| 2 Header/Footer | ☐ | |
| 3 Home | ☐ | |
| 4 Card/Listing | ☐ | |
| 5 Product | ☐ | |
| 6 Cart/Polish | ☐ | |
| 7 Release | ☐ | |

## Open issues
- Home/product first paint uses fallback font — @font-face inside inlined critical CSS breaks the SSR build (vite:asset TypeError) — revisit in perf pass (preload + non-critical fonts.scss only for now)
- 10 tests fail on the untouched starter baseline (PageAdvertisements, ProductDetails wishlist) — not caused by our changes — confirm against a clean checkout before release
- Body font resolves to `Dubai` first (engine-loaded face, unicode-range all), so only headings use Readex Pro — decide whether body should override Dubai (observed in Playwright on /ar and /en)
- Settings labels: Arabic-only plain strings (matches the existing 29 settings; the local editor shows {ar,en} objects as the raw id). Verify with Salla docs/support before release whether the real dashboard supports bilingual setting labels.

## Next step
Phase 1 step 2: add the calligraphy background merchant setting (toggle) in twilight.json + locales ar/en, apply `calligraphy-on-dark.v1.svg` at 8% on dark sections only (hero, dark bands, footer); run `pnpm check:manifest`.
