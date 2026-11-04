# 04 — Build playbook (Twilight React)

## How a React theme works (read once)
- The engine package `@salla.sa/twilight-theme-engine` ships a **complete working store**. Your theme only describes **what's different**.
- The engine owns: routing, data loading, translations and direction, the cart and login, and SSR.
- You own: look and feel, component overrides, custom pages, hook/slot UI, merchant settings (`twilight.json`) and wording (`locales/*.json`).
- **Smallest change first:** a setting, then a hook/slot, then a component override, then a whole page. The smaller the change, the less breaks when Salla updates the engine.

## Files you touch vs never touch
| Edit | Never hand-edit |
|---|---|
| `app/components/`, `app/hooks/` | `app/routeTree.gen.ts` |
| `app/styles/` (ITCSS: `01-settings` … `05-utilities`) | any route file starting with `// @auto-generated` |
| `app/routes.ts` (custom routes) + your own route files | `node_modules/` |
| `app/routes/__root.tsx` (page shell, layout) | |
| `locales/ar.json`, `locales/en.json` | |
| `twilight.json` (settings, home blocks) | |
| `public/` (static files) | |

## Phases and gates
Each phase ends with a **gate** that you confirm in the browser before moving on.

### Phase 0 — Setup
Do everything in 02-setup.
**Gate:** `/ar` and `/en` render styled, `salla theme list` shows the theme, and the git remote is correct.

### Phase 1 — Brand tokens
- Add the client tokens in `app/styles/01-settings/global.scss` under `:root`: colors, radius, spacing. **Define each token once.**
- Prefer the engine's tokens where they fit: `--color-primary`, `--color-primary-dark`, `--color-primary-light`, `--color-primary-reverse` and `--font-main`. These follow the merchant's dashboard choices.
- Fonts: Arabic first. For example, Tajawal, IBM Plex Sans Arabic or Almarai for Arabic, with a Latin pair for English.
**Gate:** colors and fonts are visible on `/ar` and `/en`, with no hard-coded hex values outside the token file.

### Phase 2 — Shell: header + footer
- Logo, navigation, cart and search, and the mobile menu.
- Only switch to a dark footer through the `footer_is_dark` setting if the client wants it.
**Gate:** works at 375px and at desktop width, the RTL mirror is correct, and the menu opens and closes.

### Phase 3 — Home page
- Use **home blocks with merchant settings** (declared in `twilight.json`) so the client edits the content, not you.
- Typical blocks: hero/slider, categories, featured products, banners, testimonials and store features.
**Gate:** every block is editable in the theme editor (`salla theme dev --editor`) and the page stays readable with empty data.

### Phase 4 — Product card + listing
- Product card: image ratio, price/sale, add-to-cart, and the out-of-stock state.
**Gate:** long Arabic names wrap, prices render, and empty or one-product categories look fine.

### Phase 5 — Product page
- Gallery, options/variants, quantity, add to cart, description and reviews.
- Description styling: merchant descriptions come from Salla's editor. Style them through a scoped class in your SCSS, **not** inline `<style>` in the description (see lesson L7).
**Gate:** a product with options adds to the cart, and a product without images still renders.

### Phase 6 — Cart, other pages, polish
- Cart, empty states, 404, blog and custom pages, and translations for every string.
**Gate:** run the full QA checklist (07) and the `/ship-check` command.

### Phase 7 — Release
- Screenshots (Salla requires them), categories, price, and changelogs in Arabic and English (25+ characters each).
- `git push`, then `salla theme publish`. **The theme is read-only while it's under review.**

## Change recipe (every task)
1. **Read-only:** "Use salla_themes_docs to find how X is done. Show me the existing code that handles X. Change nothing."
2. **Plan:** files to touch, approach, risk.
3. **Implement:** the smallest change, following existing patterns.
4. **Cleanup:** remove dead code, duplicates and unused imports.
5. **Review:** the `theme-reviewer` agent, plus `security-auditor` if you touched data or HTML.
6. **Verify:** you, at `/ar` and `/en`, at 375px and desktop.
7. **Commit.**
