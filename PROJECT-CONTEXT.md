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
- 2026-11-04 — Calligraphy settings: `calligraphy_bg_enabled` (switch, default on) and `calligraphy_bg_strength` (subtle 5 / standard 8 / strong 12) in twilight.json; `useCalligraphy()` returns the class and `--calligraphy-opacity`. First applied to `.site-header__topnav`, only when `topnav_is_dark` is on (slider images would cover the pattern; the footer is an engine component). Plain Arabic labels because the local editor showed `{ar,en}` objects as the raw id.

## Status
| Phase | State | Notes |
|---|---|---|
| 0 Setup | ✅ | |
| 1 Tokens | ✅ | Brand tokens, self-hosted Readex Pro v530, headings, calligraphy background setting (toggle + strength) applied to the dark top bar |
| 2 Header/Footer | ☐ | Next. Include calligraphy on surfaces visible on mobile |
| 3 Home | ☐ | |
| 4 Card/Listing | ☐ | |
| 5 Product | ☐ | |
| 6 Cart/Polish | ☐ | |
| 7 Release | ☐ | |

## Open issues
- Home/product first paint uses fallback font — @font-face inside inlined critical CSS breaks the SSR build (vite:asset TypeError) — revisit in perf pass (preload + non-critical fonts.scss only for now)
- 10 tests fail on the untouched starter baseline (PageAdvertisements, ProductDetails wishlist) — not caused by our changes — confirm against a clean checkout before release
- ~~Body font resolves to `Dubai`~~ DECIDED 2026-11-04: body follows the merchant's dashboard font setting (engine-loaded, e.g. Dubai); headings stay Readex Pro. No override.
- Settings labels: Arabic-only plain strings (matches the existing 29 settings; the local editor shows {ar,en} objects as the raw id). Verify with Salla docs/support before release whether the real dashboard supports bilingual setting labels.
- The top bar is desktop-only (`display:none` below 1024px), so the calligraphy test surface isn't visible at 375px. Phase 2 must apply it to a mobile-visible dark surface.
- `salla.config.get('theme.settings').topnav_is_dark` was stale (false) while `theme.settings` and the body class were true. Read settings via `useTwilight()`, not `salla.config`.
- The dev editor iframe is ~799px wide, so the top bar is hidden in it; widen the window to review it.
- `pnpm build` after the calligraphy change passed; tests were not re-run this session.

## Next step
Phase 2: header + footer redesign in the LAMEEM dark-green style, including `useCalligraphy()` on dark surfaces visible on mobile (mobile header bar, footer). The footer is an engine component, so it needs a fork (record it in FORKS.md).
