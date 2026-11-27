# The Antz Design System agent: onboarding

The agent is a **Claude Code plugin**, *Antz Design System* (`antz-design-system`), published from this repository.
It gives everyone the same three commands:

| Command | What it does |
| --- | --- |
| `/systemdesigner` | Builds or changes Antz screens and components **only** from the approved system, checks its own work and reports the version, the parts used and the check result. When something is missing it writes a proposal instead of inventing it. |
| `/systemauditor` | Audits a product or prototype against the system, **read-only**: code checks (CSS, HTML, MUI, React Native) and, with an address, the rendered screens (contrast in four modes, tap targets, focus, labels). Report graded Critical, Major, Minor, Accessibility. |
| `/openvisualguide` | Opens the official visual guide, https://antz-design-system.eugin-736.workers.dev/, in Chrome. |

Claude also picks the right one from a plain request ("build…", "audit…", "open the design system"). If another
plugin uses the same short name, type the full one: `/antz-design-system:systemdesigner`.

## Install (once per product repository)

Needs Claude Code 2.1 or later and Node 18+ (Node 22+ and Chrome for rendered audits).

1. Open Claude Code in **your product's** repository.
2. Add the catalog, pinned to the design system release you build against, and install the plugin:
   ```
   /plugin marketplace add eugin-cmd/Antz-Design-System#v1.2.0-beta.8
   /plugin install antz-design-system@antz
   ```
   With a local clone instead: `/plugin marketplace add ./antz-design-system`.
3. Restart Claude Code if it asks. Check with `/plugin`: *antz-design-system* is enabled with three skills.
4. Optional, for the whole team: run `claude plugin marketplace add eugin-cmd/Antz-Design-System#v1.2.0-beta.8 --scope project`
   and commit `.claude/settings.json`. Teammates get the catalog after accepting the folder's trust prompt, then run
   `claude plugin install antz-design-system@antz --scope project` once.

Nobody needs write access to this repository to use the agent.

## Versions and updates

- The plugin's version **is** the design system version: installing from tag `v1.2.0-beta.8` pins both.
- `/systemdesigner` and `/systemauditor` name the version in every report. Ask "which design system version are you
  using?" any time; the helper's `info` also shows the latest release and any drift.
- **Upgrade:** `/plugin marketplace remove antz`, then add it again with the new tag and reinstall (or
  `claude plugin marketplace update antz` if you track `main`). Read the CHANGELOG entry first.
- **Older products:** audit them against the release they use: "audit src/ against version 1.2.0-beta.6".
- Deprecated names keep working until a major release; the check warns about them with the replacement.

## By role

**Designers.** Ask for a screen in plain words or paste a Figma link: "/systemdesigner build the Pharmacy home for a
phone with today's requests". You get an HTML prototype linked to the pinned release, in every colour mode. Then
"/systemauditor audit it" and share the link.

**Web developers (Next.js + MUI).** "/systemdesigner add a requests page with a status column". The agent uses the
Antz MUI theme and tokens; `sx` values come from the theme or `var(--…)`. The check reads `sx`, `style` and
`styled(…)` objects.

**React Native developers.** Install the theme in the app (`npm install github:eugin-cmd/Antz-Design-System#v1.2.0-beta.8`).
"/systemdesigner build a species stat card". Every value comes from `antzTheme` and its colour roles; the check reads
`StyleSheet.create` and inline styles. There is no shared React Native component package yet.

**Reviewers and leads.** "/systemauditor audit src/ and http://localhost:3000/animals". Fix Critical and
Accessibility findings first. The auditor never changes files.

**Managers.** The agent's reports are the evidence: version, parts used, checks run, findings. The visual guide shows
what exists; the Versions and Brand history pages show what changed.

## When the system doesn't have something

The agent offers the closest approved option. If nothing fits, it writes a proposal (an RFC) instead of inventing a
colour, size or component. Send it to the System Owner (an issue or a pull request on this repository). Approved
changes ship in the next release for everyone.

## Troubleshooting

- **Commands not listed:** `/plugin` → is *antz-design-system* enabled? Restart Claude Code after installing.
- **"Can't reach the system":** the helper needs the site or a local clone. Check the connection, or clone the
  repository next to your project (`antz-design-system/`).
- **Rendered audit skipped:** install Chrome (or set `CHROME=/path/to/chrome`) and use Node 22+.
- **An older copied skill (`.claude/skills/antz-design-system`):** delete it; it now only points here.

Questions, proposals and exceptions go to the System Owner.
