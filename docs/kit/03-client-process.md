# 03 — Client process: discovery → scope → price → delivery

## Step 1 — Discovery (before any quote)
Send `templates/client-brief-AR.md`, or go through it on a call. You must have these:
- Store URL, current theme, and the Salla plan.
- **What they actually want changed.** Ask for a list, not a vibe.
- Brand assets: logo (SVG preferred), colors (hex), fonts, and high-quality product photos.
- 2–3 reference stores they like, and what they like about each.
- Pages in scope: home, product, category/listing, cart, custom pages, blog.
- Arabic only, or Arabic + English.
- Who updates the store afterwards, and whether they want monthly support.
- Deadline, and whether it's tied to a campaign (Ramadan, White Friday, National Day).

## Step 2 — Pick the approach
| Option | What it is | Effort | When |
|---|---|---|---|
| **A. Configure** | Use an existing marketplace theme plus the store designer: colors, fonts, home blocks, banners. **No code.** | 1–3 days | They want a clean, branded look. Most small stores. |
| **B. Reskin our base theme** | Fork our React base theme (built on the Raed React starter), apply brand tokens, and customize the header, footer, home blocks and product card | 1–2 weeks | They want a distinct look without new features. **Our default for custom work.** |
| **C. Full custom theme** | New layouts, custom routes and pages, custom components with merchant settings | 3–6 weeks | Unique features plus a budget for them. |

Push back on C unless the client can name a feature that A or B can't deliver. Remember the build ladder: a **setting**, then a **hook/slot**, then a **component override**, then a **whole page**.

## Step 3 — Price (SAR)
These ranges are our **starting assumptions**. Validate them against what Riyadh freelancers and agencies quote, and adjust after 2–3 projects.

| Option | Est. hours | Suggested price | Notes |
|---|---|---|---|
| A | 8–20 h | 1,500 – 3,500 | Fast win, low risk |
| B | 30–70 h | 6,000 – 14,000 | Reuse of the base theme is where the margin comes from |
| C | 90–200 h | 18,000 – 40,000+ | Fixed scope only; anything new is a change request |
| Support retainer | 3–8 h/mo | 600 – 1,500 / month | Fixes, banner swaps, Salla engine updates |

**Downside risks to price in:**
- **Salla review delay or rejection.** A theme submitted for review is frozen. Add 1–2 weeks of buffer for review cycles. Theme publishing has rules (uniqueness from Raed, size limit, Lighthouse scores); see 07-qa-release.
- **Scope creep.** Cap revisions at 2 rounds per phase. Extra work is billed hourly (suggested 150–250 SAR/h).
- **Engine updates.** Salla updates the theme engine and its starter. Themes are expected to keep up, which is why the support retainer exists.
- **Client assets late.** The timeline starts when the assets are received, so write that in the quote.

**Payment:** 50% upfront, 30% at design approval (header, home and product page on the demo store), 20% at launch. Don't start Phase 2 before the first payment.

**Theme price on Salla vs your fee.** A custom theme is a theme in the Partners Portal with its own price. Salla's tooling notes say private themes are priced 1,000–50,000 SAR and public themes 250–50,000, while the CLI docs mention 150–99,999 SAR. **Check the current rule and Salla's commission in the Partners Portal before quoting**, then decide one of these:
- (a) The client pays **you** the development fee directly, and the Salla theme price is set to the minimum.
- (b) Part of your fee is collected through the Salla theme price.

Keep it simple, and write in the quote which option you chose.

## Step 4 — Access (least privilege)
- Ask the client to add you as a **staff user** with only the permissions needed. **Never take the owner password.**
- Develop on **your demo store** with `salla theme dev --store <demo-id>`.
- To show the theme on the client's live store, use the Partners Portal flow for a private theme: set the theme as private, then send an install request to the store URL or share the private installation link. The owner approves it from their dashboard.
- The theme's live switch-over is done by the client (or by you, with their written OK) at an agreed low-traffic time, Asia/Riyadh.

## Step 5 — Delivery
1. Run the QA checklist (07) and fix everything marked blocker.
2. Submit for publication or review (needed even for private themes). Expect review time.
3. After approval: install on the client store, preview it, get written approval, then switch.
4. Hand over a 1-page guide (Arabic) covering how to edit home blocks, banners and colors in the theme editor.
5. Start the support retainer, or close the project in writing.
