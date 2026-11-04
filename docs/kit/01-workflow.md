# 01 — Workflow: how we build with AI

## The loop
1. **Discuss** in Claude Chat (Project): what we're building next and why.
2. **Chat writes the prompt.** It covers one focused task and names the files, the constraints and how to verify the result.
3. **Paste it into Claude Code** in the theme folder.
4. **Claude Code** reads the docs or code first, makes the change, shows the diff and runs the checks.
5. **You verify in the browser** at `localhost:5173/ar` and `/en`, at mobile width (375px) and desktop.
6. **Paste the result back into Chat**: the diff summary, any errors, and what you saw.
7. Chat reviews it, and you either **commit** or have Chat write a fix prompt.

## Rhythm per change
```
read-only investigation → plan → implement → cleanup pass → review agent → you verify → commit
```
- Run a **read-only** prompt first on anything unfamiliar ("explain how the header is built, change nothing"). This kills guessing.
- **Cleanup in the same session:** remove dead code, duplicate styles and leftover overrides.
- Commit small and often: `git add -p` then `git commit -m "header: centered logo"`.

## Context files (keep sessions consistent)
| File | Lives in | Updated by | Purpose |
|---|---|---|---|
| `CLAUDE.md` | theme repo root | Claude Code (when rules change) | Permanent rules and the stack |
| `PROJECT-CONTEXT.md` | theme repo root | Claude Code via `/handover` | Client, brand tokens, decisions, status, next steps |
| handover note | pasted into Chat | Claude Chat | Continue when a chat gets long |

When a chat gets long, Chat writes a handover. You open a new chat in the same Project and paste the handover plus the latest `PROJECT-CONTEXT.md`.

## Claude Code `/clear` rules
- **Run `/clear`:** after a feature is committed, between unrelated tasks, or when Claude Code starts looping or forgetting rules.
- **Don't run `/clear`:** in the middle of a multi-file change, or before the cleanup pass and the commit.
- **Always run `/handover` before `/clear`**, so `PROJECT-CONTEXT.md` is current.

## Stop-the-loop rule
If the same problem survives **two** fix attempts, stop changing code and collect:
1. the exact error text (terminal and browser console),
2. the DevTools → Network status of the failing request,
3. `salla theme doctor` output,
4. the relevant Salla docs page.

Then diagnose. This rule exists because we once spent five days editing SCSS while the real cause was the GitHub link plus a Chrome policy.
