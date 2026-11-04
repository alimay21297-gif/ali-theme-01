---
name: salla-theme-workflow
description: Workflow, gates and hard-won lessons for building custom Salla store themes for clients with Twilight React (Salla CLI, twilight.json, TanStack Start) in an AI-builder setup where Claude Chat plans and Claude Code edits. Use this whenever the user mentions a Salla theme, Salla store design, Twilight, theme-raed, salla theme dev/preview/publish, a client store redesign on Salla, RTL storefront work, or Salla theme review/publishing, even if they don't say "theme".
---

# Salla Theme Workflow

## Know the stack
- New themes are **Twilight React** (`salla theme create -n <name>`, `salla theme dev`, `localhost:5173/ar`). The Twig engine (`salla theme preview`, `.twig`) is **deprecated**. Use it only to maintain old themes.
- **pnpm ≥10 only**, Node ≥20.19. Run `salla theme doctor` to check.
- The engine ships a full store; a theme only overrides what's different.
- Official AI tooling: the Salla Partners Agent Kit (`claude plugin marketplace add SallaApp/salla-partners-agent-kit`) and the Partners MCP (`https://partners.mcp.salla.dev`). Its `salla_themes_docs` tool searches the official docs. **Use it before writing Salla-specific code.**

## Roles and loop
Human = product owner and QA. Claude Chat = planner, reviewer and prompt writer. Claude Code = edits and runs.
Loop: discuss → Chat writes **one focused prompt** → Claude Code: read-only investigation, then implement, then cleanup, then diff → human checks `/ar` and `/en` at 375px → paste back → review → commit.

## Change ladder
Use the smallest level that works: **setting, then hook/slot, then component override, then whole page**. State the chosen level and why.

## Phases (each ends with a human-confirmed gate)
0 Setup → 1 Brand tokens → 2 Header/Footer → 3 Home blocks (merchant-editable) → 4 Product card/listing → 5 Product page → 6 Cart/polish/QA → 7 Release (`salla theme publish` submits the theme for review and freezes it).

## Rules that prevent the known failures
1. **Two failed fixes means stop.** Collect the exact error, the DevTools Network status, `salla theme doctor` output and the docs page before more code.
2. **Never delete** the GitHub repo or the Portal theme to "start fresh". The Theme ID is tied to the repo. Back up the folder first.
3. `Salla doesn't have enough access` means the Salla GitHub App needs "All repositories" on the correct account or org.
4. Product-description `<style>` gets stripped. Style descriptions from the theme SCSS with scoped classes.
5. Host images on Salla or a real CDN (jsDelivr), not `raw.githubusercontent.com`.
6. A `@salla.sa/*` 404 on install is a Salla packaging issue: confirm with curl against registry.npmjs.org, and don't hack `.npmrc`.
7. Twig preview showing unstyled HTML with a CORS/loopback error on `app.css` is Chrome Local Network Access: `chrome://flags#local-network-access-check` → Disabled.
8. Claude can't see the browser. Verify with the Playwright MCP or the human, never by assumption.
9. MCP writes (create, settings, components, publish) need an explicit human yes. `create` makes a repo and isn't idempotent. A settings write can replace the whole list.

## Quality bar (Salla review + ours)
Unique versus Raed, industry focus, rich component fields, size ≤1 MB public or ≤2 MB private, no static strings, Lighthouse performance ≥60 and accessibility ≥90 on home, product and category for mobile and desktop, no raw HTML from merchant input, RTL correct, works at 375px, 4+ screenshots, changelog in AR and EN of 25+ characters, real price set (the default is 250).

## Client side
Discovery brief → choose A (configure, no code), B (reskin the base theme, the default) or C (full custom) → quote in SAR with 50/30/20 payment terms, 2 revision rounds and a review-time buffer → staff access, never the owner password → private theme install request or link → client approval → switch at low traffic → handover guide in Arabic.

## Session hygiene
Write handover notes when a chat gets long. In Claude Code, run `/handover` (which updates PROJECT-CONTEXT.md) before `/clear`. Run `/clear` between finished features, never in the middle of a change.

## Where the details live
If the full kit is available: `docs/kit/01–09`, `templates/`, and `claude-code/CLAUDE.md` plus `.claude/agents`. Official docs: https://docs.salla.dev/twilight/react/start/what-is-a-theme (index at `/twilight/react/llms.txt`; add `.md` to any page).
