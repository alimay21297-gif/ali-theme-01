# 02 — Setup: accounts, tools, health check

Do all of this **before** you promise the client a date.

## A. Accounts
| Account | Why | Notes |
|---|---|---|
| Salla Partners (portal.salla.partners) | Create, manage and publish themes; create demo stores | Complete **ID verification** early. Salla's publish checks require the company ID and services certificate to be verified. |
| GitHub | Salla stores each theme in a GitHub repo it creates | Turn on 2FA. Install the **Salla GitHub App** on the account or org that will own the repos, with access to **all repositories**. |
| Claude (Pro/Max) | Claude Chat Project + Claude Code | |
| Demo store | Develop and preview on it | Create it from the Partners Portal. **Never develop on the client's live store.** |

**Partner role permission:** your Partners user needs `manage-themes`. A 403 from the MCP means the company owner must grant it. A 401 on `get`/`create` while `list` works means your company isn't enabled for themes, so ask Salla support.

## B. Machine tools
| Tool | Version | Check |
|---|---|---|
| Node | ≥ 20.19 | `node -v` |
| pnpm | ≥ 10 (**themes are pnpm-only**; npm and yarn break the render) | `pnpm -v` |
| git | any recent | `git --version` |
| Salla CLI | latest | `npm install -g @salla.sa/cli` then `salla --version` |
| Claude Code | latest | `claude --version` |
| Chrome | latest | for testing |

Run the official checker. It tells you exactly what to fix:
```bash
salla theme doctor
```

## C. Salla Partners Agent Kit + MCP (official AI tooling)
Salla publishes skills plus an MCP built for Claude Code. Install both:
```bash
# 1) Skills (includes salla-theme-builder, salla-docs, salla-storefront-ui, salla-live-testing...)
claude plugin marketplace add SallaApp/salla-partners-agent-kit
# then inside Claude Code: /plugin  → install "salla-partners" from that marketplace

# 2) Partners MCP (account actions + the Twilight React docs search tool)
claude mcp add --transport http salla-partners https://partners.mcp.salla.dev
# then inside Claude Code: /mcp  → authorize in the browser (login lasts ~14 days)
```
What it gives you:
- `salla_themes`: list, get, create themes; read `twilight.json` components and settings.
- `salla_themes_docs`: **search and read the official Twilight React docs.** Make Claude Code use this before writing theme code.

Without the MCP, any Salla docs page can be read as markdown by adding `.md` to its URL, and the full page index is at `https://docs.salla.dev/twilight/react/llms.txt`.

⚠️ Do **not** let the agent push theme settings or components outside the documented tools. The Portal's settings write **replaces the whole list**, so sending one setting deletes the rest. Make settings changes in the Partners Portal or in `twilight.json` via git.

## D. Recommended extra Claude Code tools
| Tool | Why | Install |
|---|---|---|
| Playwright MCP | Lets Claude Code open `localhost:5173`, take screenshots at mobile width and check `/ar` RTL. This fixes the "Claude can't see the browser" problem. | `claude mcp add playwright -- npx @playwright/mcp@latest` |
| Lighthouse CLI | Salla's review requires Lighthouse performance ≥ 60 and accessibility ≥ 90 | `npx lighthouse <url> --preset=desktop` (no install needed) |
| `frontend-design` skill | Better visual design choices | Built into claude.ai. For Claude Code, check `/plugin` for Anthropic's official frontend-design plugin. |

## E. Create the theme
Interactive mode is the safe choice because it asks about GitHub, and the GitHub step is what publishing needs:
```bash
cd ~/salla-themes
salla login
salla theme create --type react          # answer the prompts; link GitHub when asked
cd <theme-folder>
salla theme dev                           # opens http://localhost:5173/ar
```
Then copy `claude-code/CLAUDE.md` and the `claude-code/.claude/` folder from this kit into the theme root, and commit.

Daily start:
```bash
cd <theme-folder> && salla theme dev
```
Useful flags: `--store <id>` renders your demo store's real data, `--editor` opens the merchant theme editor around your local server, and `--port 3000` changes the port. Pass options to `salla theme dev`, **not** after `pnpm dev --`.

## F. Health check (paste the outputs to Claude Chat)
```bash
node -v && pnpm -v && git --version && salla --version
salla theme doctor
salla theme list                     # your theme appears with an id
git remote -v                        # points at the theme's GitHub repo
```
Then in Chrome:
1. Open `http://localhost:5173/ar`. It should be styled and right-to-left. A blank page at `/` alone is normal, because the storefront lives under `/ar` or `/en`.
2. Open `/en`. It should be styled and left-to-right.
3. In DevTools → Network, hard-reload. There should be **no red requests**.

**Gate:** every check passes, and only then start Phase 1 of the build playbook.
