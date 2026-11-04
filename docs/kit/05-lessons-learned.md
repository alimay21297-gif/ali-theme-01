# 05 — Lessons learned (real failures and fixes)

These come from building "Brew" (a Twig-era theme for La Dulzura) in 2026. Each lesson is tagged with whether it still applies to **React** themes.

| # | Symptom | Real cause | Fix | Still applies? |
|---|---|---|---|---|
| L1 | We spent 5 days "fixing" SCSS and templates and the preview stayed broken | We kept editing code without evidence. The cause was the environment, not the code. | **Stop-the-loop rule:** after 2 failed attempts, collect the error text, the Network status and the docs page before touching code | ✅ Always |
| L2 | `Theme ID doesn't exist… or we don't have access to your theme in github` | We deleted the GitHub repo and the theme in the Portal to "start fresh". The Theme ID is tied to the repo. | Never delete them. If it's broken, re-link the GitHub App, then `salla theme create` fresh. **Back up the local folder first** (`cp -r theme theme-BACKUP`). | ✅ Yes |
| L3 | `Salla doesn't have enough access` during create | The Salla GitHub App was installed without "All repositories", or on the wrong account. For example, the repos are in a GitHub **org** but the app was installed on the personal account. | GitHub → Settings → Applications (or Org settings → GitHub Apps) → Salla → **All repositories**. Pick the account that will own the repo. | ✅ Yes |
| L4 | Preview page showed raw unstyled HTML, and `app.css` had a CORS / "loopback address space" error | Chrome's Local Network Access policy blocked the public Salla editor from loading assets off `localhost` | `chrome://flags` → `#local-network-access-check` → Disabled → Relaunch, or allow "Local network access" in Site settings | ⚠️ Mainly Twig preview. React dev runs on `localhost:5173` directly, but keep this in mind if you use `--editor` and assets fail to load. |
| L5 | `ERR_PNPM_FETCH_404 @salla.sa/ui-address-autocomplete-widget` (and `ui-google-map-render`) | A Salla-published package version referenced sub-packages that aren't on public npm | Not your machine. Confirm with `curl -s -o /dev/null -w "%{http_code}" https://registry.npmjs.org/<pkg>` (404 means it's missing). Reuse a known-good `node_modules` or lockfile, or wait for Salla to fix it, and report it at github.com/SallaApp/salla-cli/issues. **Don't** paste random registry URLs or tokens. | ⚠️ Possible. Same diagnosis method. |
| L6 | npm/yarn installs "worked" but the theme crashed at render | Duplicate copies of shared libraries | **pnpm ≥ 10 only** for React themes | ✅ React |
| L7 | CSS appeared as visible text on the product page | Salla's product-description editor **strips `<style>` blocks** | Put description styles in the theme SCSS, scoped under the description container class. Keep the description HTML style-free and class-based. | ✅ Yes (it's the editor, not the engine) |
| L8 | Images in descriptions didn't load from `raw.githubusercontent.com` | Raw GitHub isn't a CDN, so it isn't served reliably | Upload images to Salla, or use a CDN such as jsDelivr (`https://cdn.jsdelivr.net/gh/<user>/<repo>@main/<path>`) | ✅ Yes |
| L9 | A new style rule "didn't work" | An existing rule with `!important` or higher specificity won | Make the new selector more specific, or place it later in the ITCSS order. Avoid adding more `!important`. | ✅ Yes |
| L10 | Base64 images in HTML made a 417 KB description | Embedded images | Extract them to real hosted files. Keep descriptions small. | ✅ Yes |
| L11 | Theme name became "My First Theme" | Pressed Enter through the `create` prompts | Read every prompt. The name can be fixed later in `twilight.json` or the Portal, so don't recreate the theme for it. | ✅ Yes |
| L12 | Claude said "done" but the page looked wrong | Claude can't see the browser | After every visual change, a human (or the Playwright MCP) checks `/ar` and `/en` at 375px | ✅ Always |
| L13 | Code got messy over several sessions | Each session invented its own pattern, and old approaches were left behind | Use CLAUDE.md rules: follow existing patterns, define tokens once, clean up in the same session, delete replaced approaches completely | ✅ Always |
| L14 | `salla theme dev` shows the demo store after a fresh clone | `.env` (the store id) isn't committed | `salla theme dev --store <id>` once | ✅ React |
| L15 | `--port` ignored | Passed after `pnpm dev --` | Use `salla theme dev --port 3000` | ✅ React |

## Habits that came out of these
- Check the docs **before** coding, using `salla_themes_docs` or `.md` docs pages.
- Make one visible change at a time, then verify, then commit.
- Back up before any "fresh start", and never delete the remote or Portal objects.
- When something fails, ask "what is the evidence?", not "what else can we try?"
