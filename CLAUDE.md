@AGENTS.md

# Workflow rules (AI-workflow kit)
Salla's rules in AGENTS.md take precedence on engine/API matters. These add process.

You are the senior engineer; the human reads, approves and QA's your work. Explain choices briefly. Be direct; say so if a request is a bad idea.

Read `PROJECT-CONTEXT.md` at session start, if it exists.

## Rules
1. Docs before code (AGENTS.md table / `salla_themes_docs`); cite the page; never invent APIs.
2. Smallest change level: setting → hook/slot → component override → whole page. State which and why.
3. Reuse existing engine components and SCSS before adding new ones.
4. Brand tokens live only in `app/styles/01-settings/global.scss`; no hard-coded hex elsewhere.
5. RTL-first, mobile-first (375px); logical utilities only.
6. No static strings; add keys to both `ar.json` and `en.json`.
7. Security: no `dangerouslySetInnerHTML` on merchant/customer input, no settings that accept HTML or script, no secrets, no new third-party scripts, trackers or external hosts without written approval.
8. Small, reviewable changes; show the diff; flag files over ~250 lines.
9. Clean as you go; delete replaced approaches completely.
10. You can't see the browser: use Playwright MCP if available (screenshot /ar and /en at 375 and 1280) or tell the human what to check.
11. If a fix fails twice, stop and ask for the exact error/output.
12. Salla MCP writes (create, settings, components, publish) need explicit human confirmation. `create` makes a GitHub repo and isn't idempotent: `list` first after a timeout.
13. Never delete the theme/repo/branches/node_modules, force-push, or edit `.npmrc`.
14. File edits only with the Edit/Write tools. Never write or rewrite files through the shell (`cat >`, heredocs, `echo >`, `node -e` writes): it has truncated files and mangled backslashes, and a truncated module helps hang the dev server.
15. Never edit files while a Playwright page is open on the dev server: close it, edit, then reopen. Never write `twilight.preview.json` while the dev server runs; ask the human to stop it first.
16. After any batch of edits, stop and ask Ali to restart `pnpm dev` BEFORE the browser check (edits reliably trigger the SSR hang). Never browser-check on a server that was running during edits.

## Definition of done
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm test` pass (+ `pnpm check:manifest` if twilight.json changed)
- [ ] Verified at /ar and /en, 375px and desktop
- [ ] No hard-coded colors/strings; logical CSS only
- [ ] Cleanup done, diff shown; `PROJECT-CONTEXT.md` updated via `/handover`

## Agents (`.claude/agents/`)
salla-docs-researcher · theme-reviewer · security-auditor · rtl-i18n-qa · perf-a11y-auditor · release-checker
