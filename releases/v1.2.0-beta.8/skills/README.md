# Skills: moved into the Antz Design System plugin

The Antz Design System skill is now part of the **Antz Design System** Claude Code plugin in [`../agent/`](../agent),
as `/systemdesigner`, next to `/systemauditor` and `/openvisualguide`. Install the plugin instead of copying skill
folders: see [`../docs/agent-onboarding.md`](../docs/agent-onboarding.md).

`skills/antz-design-system/` only tells anyone who still has the old copy how to switch. Releases up to 1.2.0-beta.7
keep their original skill under `releases/vX.Y.Z/skills/`.

## Maintaining the agent

- Skills: `agent/skills/<name>/SKILL.md` (keep the `description` a quoted string). Helper: `agent/scripts/antz.mjs`;
  the Chrome engine: `agent/scripts/browser.mjs` (shared with `tools/audit.mjs`).
- The plugin version is written by `node tools/build.mjs` from `VERSION`; never edit `agent/.claude-plugin/plugin.json`.
- `node tools/test.mjs` checks the manifests, the skills and the auditor; `claude plugin validate .` and
  `claude plugin validate agent` check the manifests the way Claude Code reads them.
- Evals: `agent/skills/*/evals/` (`claude plugin eval agent`).
- Test unreleased helper changes in a clone with `--version working`; products always use a release.
