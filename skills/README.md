# Antz Design System skill

`antz-design-system/` is an Agent Skill. It makes an AI assistant build Antz UI only from the Antz Design System: approved tokens, documented components and patterns. Every result is checked by the system's guardrails. Any team can use it in any project, with or without a copy of the design system repository.

## What it does

When someone asks their assistant for any Antz UI work (a screen, a component, a restyle, "make it pop"), the skill makes the assistant:

1. **Look up the system** through `scripts/antz.mjs`. It reads the pinned release from a local clone, or from the team site at https://antz-design-system.eugin-736.workers.dev when there is no clone.
2. **Use existing components first.** The assistant gets each component's classes, do's and don'ts, and copyable markup from the docs.
3. **Take every value from tokens.** No hex colours, no one-off sizes, fonts or timings.
4. **Run the guardrail check** on everything it writes, and fix what it finds until the check passes.
5. **Redirect requests that are outside the system.** It offers the closest approved option. If nothing fits, it writes a **proposal** for the System Owner instead of improvising.

It covers HTML/CSS prototypes, the Next.js + MUI dashboard and the React Native apps.

## What it can and can't guarantee

The skill steers the assistant. It can't stop a person from typing a hex colour by hand. Two things do the actual enforcing, so set both up:

- **The guardrail check in CI** for every product repository:
  ```sh
  node <path>/antz-design-system/skills/antz-design-system/scripts/antz.mjs check src/
  ```
  The command exits with an error when it finds a problem. Start with `--report` while a project is migrating.
- **Branch protection** on the design system repository, so the system itself only changes through review.

## Install

The same folder works everywhere. Use the release's copy, `releases/vX.Y.Z/skills/antz-design-system/` (for example `releases/v1.2.0-beta.6/skills/antz-design-system/`), so that every team gets the same version.

| Where | How |
|---|---|
| **Claude Code, one person** | Copy `skills/antz-design-system/` to `~/.claude/skills/antz-design-system/`. |
| **Claude Code, a whole project** (recommended for teams) | Copy it to `<project>/.claude/skills/antz-design-system/` and commit it. Everyone who opens the project gets it. |
| **Claude apps (claude.ai, desktop) for the organisation** | Zip the `antz-design-system` folder and upload it as an organisation skill. An admin enables it in the organisation's skills settings. |
| **Other assistants that support Agent Skills** | Put the folder wherever that tool loads skills from. If a tool has no skills support, it still follows `AGENTS.md` in the design system repository. |

Requirements: Node 18 or later, and either internet access to the team site or a clone of the repository.

**Pinning a version.** By default the skill uses the latest published release. To hold a project on one version:

1. Install the skill from that release's folder (above), so its instructions match the version.
2. Tell the helper the version. In Claude Code, add it to the project's `.claude/settings.json` and commit it:
   ```json
   { "env": { "ANTZ_DS_VERSION": "1.2.0-beta.6" } }
   ```
   Outside Claude Code, set the `ANTZ_DS_VERSION` environment variable, or pass `--version 1.2.0-beta.6` to each command.

Upgrade both together when you move to a new release.

**Where it reads the system from.** The helper looks for a clone first: the folder it runs in, or an `antz-design-system` folder there or in any parent folder. Without one, it reads the team site. With the site, the guardrail check downloads the release once to `~/.cache/antz-design-system/` and reuses it, which is safe because published releases never change. Prototypes you share should link a local clone's `releases/vX.Y.Z/` rather than the site, since the site is unlisted, not private.

## Using it well

- **You don't need to name the skill.** Ask for the work in plain words, for example "build the medical alerts screen with a header, three stats and a list". The skill loads on its own for UI work. To be sure, start with "Using the Antz design system, …".
- **Describe the need, not the styling.** "Overdue figures need to stand out" gets you the approved emphasis. "Make it red and 30px" gets a polite redirect.
- **Ask what exists first.** "What Antz components fit a feeding schedule?" lists the right patterns before anything is built.
- **Point it at a reference screen.** "Lay it out like the Home screen" makes it follow a documented composition.
- **Read the report at the end.** It lists the components and tokens used and the check result, plus any proposals to send on.
- **Send proposals on.** When the assistant writes `proposals/RFC-….md`, send it to the System Owner, Eugin Robinson. Approved proposals ship in the next release for every team.
- **When the check fails and the fix isn't obvious,** don't silence it. Ask the System Owner: either there is an approved way to do it, or it becomes a proposal or a time-limited exception, which needs the System Owner's approval.
- **Upgrade on purpose.** When a new version is released, update the skill folder and the project's pinned version together.

## The helper on its own

Designers and developers can use the helper without an assistant. Run it from your project folder, so it finds your clone (`<skill-dir>` is where you installed the skill, for example `.claude/skills/antz-design-system`):

```sh
node <skill-dir>/scripts/antz.mjs info                  # which source and version it is using
node <skill-dir>/scripts/antz.mjs components            # what exists
node <skill-dir>/scripts/antz.mjs component animal-card # classes, usage and markup
node <skill-dir>/scripts/antz.mjs tokens text secondary # find a token
node <skill-dir>/scripts/antz.mjs starter               # <head> links for a prototype
node <skill-dir>/scripts/antz.mjs check .               # the guardrail check
```

## Maintaining the skill

The skill lives in the design system repository and ships in each release under `releases/vX.Y.Z/skills/`. Change it through the normal review. Its tests are in `evals/`. They run each task with and without the skill, and can be re-run with `claude plugin eval .` from the skill folder.
