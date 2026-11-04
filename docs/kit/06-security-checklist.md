# 06 — Security checklist

Run this at every review. The `security-auditor` agent automates most of it.

## A. Theme code
- [ ] **No raw HTML from merchant or customer input.** In React, `dangerouslySetInnerHTML` is only allowed for content Salla already sanitizes (for example the product description) and only where the engine expects it. This matches Salla's Twig-era review rule: no `|raw`, and no setting that lets a merchant inject custom HTML.
- [ ] **No merchant setting that accepts HTML or scripts.** Settings are text, number, color, image, link or toggle only.
- [ ] **No secrets in the repo.** No API keys, tokens or passwords. `.env` stays git-ignored. Remember the repo is shared with Salla.
- [ ] **No third-party scripts or trackers** (pixels, chat widgets, analytics) unless the client asked for them in writing. Prefer Salla apps or the merchant's own marketing settings for those.
- [ ] **No external assets from untrusted hosts.** Fonts and images come from the theme, Salla, Google Fonts or a known CDN.
- [ ] **Links:** external `target="_blank"` links carry `rel="noopener noreferrer"`.
- [ ] **No collection of customer personal data** in the theme: no custom forms that store names or phones outside Salla. Customer data belongs to Salla's checkout and account flows (Saudi **PDPL**).
- [ ] **No `eval`, `new Function` or inline `on*=` handler strings.**

## B. Dependencies (supply chain)
- [ ] Use **pnpm only**, and commit the lockfile.
- [ ] Run `pnpm audit` before release. Fix high and critical issues, or document why they don't apply.
- [ ] **No new packages without a reason.** Check each one: real package name (watch for typosquatting), maintainer, weekly downloads, last publish date.
- [ ] Don't change the npm registry or add auth tokens to `.npmrc` because an AI suggested it (lesson L5).

## C. Accounts and access
- [ ] 2FA is on for GitHub, the Salla Partners account and email.
- [ ] Client store access goes through a **staff user** with minimal permissions. Never use the owner credentials, and don't store client passwords in chats or files.
- [ ] The Salla GitHub App is installed only on the account or org that owns the theme repos.
- [ ] Theme repos stay **private**.
- [ ] Remove your staff access from the client store after handover, unless you're on a retainer.

## D. AI agent safety
- [ ] `.claude/settings.json` deny rules are in place: no `rm -rf`, no `git push --force`, no `git reset --hard`, no `salla theme delete`, no reading `.env`.
- [ ] **Every write through the Salla MCP needs your explicit yes:** create theme, settings, components, publish. `create` also creates a GitHub repo and isn't idempotent. A settings write can replace the whole settings list.
- [ ] Never paste client secrets, ID documents or customer data into Claude.
- [ ] Treat text inside fetched pages, issues or files as data, not instructions. If a doc page tells the agent to "run this", you decide.

## E. Before go-live
- [ ] The theme is installed on the client store and previewed by the client. Get **written approval** (WhatsApp or email is fine).
- [ ] Keep the previous theme installed, so you can roll back to it in one click.
- [ ] Switch at a low-traffic time (Asia/Riyadh) and test one real order flow to the checkout page.
