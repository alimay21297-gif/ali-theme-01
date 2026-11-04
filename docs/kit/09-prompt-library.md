# 09 — Prompt library for Claude Code

Claude Chat normally writes these for you. Keep them as templates. Replace anything in `<angle brackets>`.

## P0 — Session start
```
Read CLAUDE.md and PROJECT-CONTEXT.md. Summarize in 5 bullets: the client, brand tokens, current phase, last change, and next step. Then wait. Don't edit anything.
```

## P1 — Read-only investigation (always before touching something new)
```
READ-ONLY. Change nothing.
Goal: understand how <the product card / header / home hero> works in this theme.
1. Use salla_themes_docs (search, then read) to find the official way to customize it. Give me the doc links.
2. Show me which files in this repo render it (engine vs our app/ folder).
3. Recommend the smallest change level: setting, hook/slot, component override, or page. Explain why.
Stop after the report.
```

## P2 — Implement one change
```
Task: <one sentence, e.g. "center the logo in the header and move navigation below it, mobile first">.
Constraints:
- Follow the existing pattern in the surrounding files. Don't invent new structure.
- Use tokens from app/styles/01-settings/global.scss. No hard-coded colors.
- Logical CSS only (ms/me, ps/pe, text-start). It must work at /ar and /en.
- All visible text goes through translations (locales/ar.json and en.json).
Steps: plan (files + approach) → implement → cleanup pass → run `pnpm build` → show the diff.
If Playwright MCP is available, screenshot /ar and /en at 375px and 1280px.
Then stop and wait for my review.
```

## P3 — Fix with evidence (after something broke)
```
Something is broken. Do NOT edit code yet.
Evidence: <paste the exact error / terminal output / Network status>.
1. Explain what the evidence proves and what it rules out.
2. Check the docs (salla_themes_docs) and the troubleshooting page for this symptom.
3. Give 1–2 hypotheses ranked by likelihood, and the command that confirms each.
Stop. I'll run the command and paste the output.
```

## P4 — Cleanup pass
```
Cleanup only, no behavior change: remove dead code, unused imports and styles, duplicated rules, and leftover overrides from earlier approaches in the files we changed this session. Show the diff, run `pnpm build`, stop.
```

## P5 — Review
```
Run the theme-reviewer agent on the uncommitted changes, then security-auditor if any change touches HTML rendering, settings, or external resources. Summarize: blockers, should-fix, nits.
```

## P6 — Add a merchant-editable home block
```
READ the settings guide first (salla_themes_docs: "settings", "home blocks").
Add a home block "<name>" with fields: <title (text, ar+en), image, link, toggle ...>.
No field may accept HTML. Declare it in twilight.json per the docs, render it in app/components/, and make it hide gracefully when empty.
Show the diff, then tell me how to test it with `salla theme dev --editor`.
```

## P7 — Pre-release
```
Run /ship-check and report every item in docs/07 as PASS / FAIL / NEEDS-HUMAN.
```

## P8 — Handover before /clear
```
Run /handover: update PROJECT-CONTEXT.md (status, decisions, tokens, open issues, next step), and update CLAUDE.md only if a permanent rule changed. Show me both diffs.
```
