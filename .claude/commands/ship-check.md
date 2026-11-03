---
description: Full pre-release check before submitting to Salla review
---
Run the `release-checker` agent. It should call or request `theme-reviewer`, `security-auditor`, `rtl-i18n-qa` and `perf-a11y-auditor`. Then output every item of the QA and release checklist as PASS / FAIL / NEEDS-HUMAN, with a final GO / NO-GO. Never run `salla theme publish` yourself.
