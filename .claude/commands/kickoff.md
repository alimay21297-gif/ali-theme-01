---
description: First-session setup check for this theme repo
---
Do this in order and stop at the first failure:
1. Read CLAUDE.md. If PROJECT-CONTEXT.md is missing, create it from the template shape in the kit (`templates/PROJECT-CONTEXT.md`) and ask me for the client details.
2. Run `node -v`, `pnpm -v`, `salla --version`, `salla theme doctor`, `salla theme list`, `git remote -v`. Report each one as PASS or FAIL with the fix.
3. Confirm that `twilight.json`, `app/routes/__root.tsx`, `app/styles/01-settings/` and `locales/ar.json` exist. Summarize the project structure in 8 lines or fewer.
4. Check that the MCP tools `salla_themes` and `salla_themes_docs` are available. If they aren't, tell me the install commands from docs/kit/02-setup.md.
5. Check whether the Playwright MCP is available, and say what that means for visual verification.
6. Tell me to run `salla theme dev` and to confirm that `/ar` and `/en` render styled. Then wait.
