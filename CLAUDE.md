# CLAUDE.md

This is a short adapter. The rules live in tool-neutral files so that any assistant follows the same ones:

- **Rules for AI assistants:** [`AGENTS.md`](AGENTS.md). Read it before making changes.
- **How the system works:** [`HOW-IT-WORKS.md`](HOW-IT-WORKS.md)
- **Rule register:** `governance/rules.json`

Before finishing any change: `node tools/build.mjs --check && node tools/check.mjs && node tools/test.mjs`.
