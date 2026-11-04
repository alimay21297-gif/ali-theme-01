# 07 — QA and release checklist

Salla reviews every theme before it goes live, **including private themes and updates**. Requirements marked (Salla) come from Salla's published review docs. Those docs were written for the Twig engine, so confirm with `salla_themes_docs` whether anything changed for React themes.

## 1. Salla review requirements
- [ ] (Salla) **Clear industry focus.** Pick 1–3 categories, for example Food and drink.
- [ ] (Salla) **Uniqueness.** It must be substantively different from the Raed starter: its own art direction, a cohesive look across all pages, and its own customization options. A copy of Raed with new colors gets rejected.
- [ ] (Salla) **Custom components have rich fields**, so the merchant can customize them.
- [ ] (Salla) **Size:** public theme ≤ 1 MB, private theme ≤ 2 MB.
- [ ] (Salla) **Localization, no static strings.** Every text goes through translations (`locales/*.json` or `useTranslation`).
- [ ] (Salla) **Lighthouse:** average **performance ≥ 60** and **accessibility ≥ 90** across the home, product and category pages, on desktop **and** mobile.
- [ ] (Salla) No excessive network requests (for example one request per product card).
- [ ] (Salla) Responsive on all screen sizes, and works in Chrome, Safari, Firefox and Edge.
- [ ] (Salla) Security: no raw HTML injection paths (see 06).
- [ ] (Salla) Keep up with updates to the Raed starter and the engine.

## 2. Our QA gates
**RTL and language**
- [ ] `/ar` is fully right-to-left: icons, arrows, sliders, drawers and the breadcrumb all mirror.
- [ ] `/en` works if English is in scope.
- [ ] Use logical CSS (`ms-`/`me-`, `ps-`/`pe-`, `text-start`). No `ml-`/`mr-`/`text-left` unless intentional.
- [ ] Long Arabic product names wrap without breaking cards.

**Mobile first** (test at 375px, 390px, 768px and 1280px+)
- [ ] Tap targets are at least 44px, with no horizontal scroll.
- [ ] Sticky add-to-cart and header behave correctly. Test the menu drawer, cart drawer and search.

**Data edge cases**
- [ ] Empty category, empty cart, and a product without images.
- [ ] Products with options or variants, out-of-stock products, and sale prices.
- [ ] Merchant settings left empty: blocks hide gracefully.

**Functional**
- [ ] Add to cart, update quantity, remove, go to checkout.
- [ ] Login and register open, and wishlist works if enabled.
- [ ] 404 page, search with no results.

**Performance**
- [ ] Images are sized, use modern formats and lazy-load below the fold. Don't lazy-load the main hero image.
- [ ] No unused libraries. Check the bundle size after `pnpm build`.

**Code**
- [ ] The `theme-reviewer` and `security-auditor` agents return no blockers.
- [ ] `pnpm build` passes and `pnpm audit` is clean (or documented).
- [ ] No console errors on the home, product, category or cart pages.

## 3. Publish preconditions
- [ ] `salla login`, `twilight.json` present, and the git remote equals the theme repo shown in the Portal.
- [ ] Screenshots uploaded. The CLI docs say at least 1, while Salla's MCP notes say **4 or more** for publish, so upload 4+.
- [ ] Categories set, the real price set (new themes default to 250), and the company ID and services certificate verified.
- [ ] Changelog written in Arabic **and** English, at least 25 characters each.
- [ ] All commits pushed (`git status`, `git push`). The CLI only offers to commit what's uncommitted.
- [ ] Run `salla theme publish`. The theme is **read-only while under review**; withdraw the request to edit.

## 4. Go-live
See 06-security, section E.
