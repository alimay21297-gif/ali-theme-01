---
description: Review uncommitted changes with the review agents
---
Run the `theme-reviewer` agent on the current uncommitted changes. If the diff touches HTML rendering, `twilight.json` settings, dependencies, external URLs or forms, also run `security-auditor`. If it touches layout or text, also run `rtl-i18n-qa`. Merge the results into: BLOCKERS / SHOULD-FIX / NITS, and a SHIP or FIX FIRST verdict. Don't fix anything until I approve.
