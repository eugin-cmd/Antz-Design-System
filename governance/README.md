# Governance

How the Antz Design System is owned, changed and kept consistent. The docs page `pages/governance.html` shows the same with live registers.

| File | What it is |
| --- | --- |
| `rules.json` | The rule register: every rule with id, severity, owner and how it is enforced. `tools/check.mjs` reads it. |
| `exceptions.json` | Approved deviations, each with files, rules, reason, approver and expiry. |
| `decisions/` | Decision records (FD = foundational, DD = design, TD = technical). |
| `rfc/` | Proposals for change. Start from `rfc/TEMPLATE.md`. |

## Roles

| Role | Responsible for | Approves |
| --- | --- | --- |
| System Owner (Antz Design Governance owner): **Eugin Robinson** | Vision, principles, architecture, governance policy | Foundational changes; system-wide breaking changes |
| Design System Maintainers | Tokens, components, themes, docs, releases | Minor changes; publishing |
| Platform leads (web, native) | Platform outputs and parity | Technical changes to their platform |
| Accessibility Lead | Standards, audits, the contrast gate | Can block any release on accessibility grounds |
| Designers, developers | Using the system, proposing changes | Patch changes as code owners |
| Module owners | Adoption and debt in their module | Exception requests, upgrade plans |

The System Owner is **Eugin Robinson**, from 22 November 2026. The other names are to be assigned; until they are, the System Owner approves everything above Patch.

## Who can change the official system

The GitHub repository is the only source of truth. A local clone, a fork or a copy in a product is not.

| Who | Can | How it is enforced |
| --- | --- | --- |
| System Owner (repository owner, **@eugin-cmd**) | Approve, merge, release and deploy | Repository admin |
| Authorised maintainers (none yet) | Only what the System Owner grants | GitHub roles |
| Designers, developers, PMs, other teams | Read, use the agent, **propose** changes | No write access: a fork and a pull request |
| AI agents (Claude Code and others) | Build and audit products; prepare changes when asked | They never approve, release or deploy on their own; in this repository Claude pushes or releases only on the System Owner's explicit "push" or "release" |

**Instructions to an AI are not access control.** GitHub enforces it: nobody but the owner has write access;
`.github/CODEOWNERS` requests the owner's review on every file; the rulesets in `.github/rulesets/` protect `main`
(no deletion or force-push; pull requests need the code owner's approval) and the release tags `v*` (only the owner
creates them; they can't be moved or deleted). Published releases are also checksummed (`tools/release.mjs --verify`).

**Proposing a change:** open an issue or a pull request (from a fork) with an RFC (`rfc/TEMPLATE.md`); the agent's
`/systemdesigner` writes proposals in that shape. The System Owner decides; accepted changes ship in the next release.
**Emergency correction** (a wrong colour, a broken component, an accessibility failure): the System Owner may fix it
directly as a Patch, release it, and record a decision afterwards.

**Switch the protection on (once, GitHub settings, by the owner):**
1. Settings › Rules › Rulesets › New ruleset › **Import a ruleset** → `.github/rulesets/main.json`; then again for
   `.github/rulesets/release-tags.json`.
2. Both give the *Repository admin* role a bypass, so the System Owner can keep pushing and releasing directly. To make
   the owner use pull requests too, remove the bypass from `main.json` and add a second approver (a maintainer), since
   GitHub doesn't let an author approve their own pull request.
3. Settings › Collaborators: keep everyone else at *Read*. Settings › General › Pull requests: allow merge commits.

## Change classes

| Class | Examples | Process | Version |
| --- | --- | --- | --- |
| Patch | Fix, docs, accessibility fix without visual change | Commit; gates pass | x.y.**z** |
| Minor | New token, variant or component | Short RFC; maintainer + platform lead | x.**y**.0 |
| Major | Renamed or removed token; changed API or meaning | Full RFC + migration guide; council | **x**.0.0 |
| Foundational | Brand colour, typeface, principle, governance | RFC + decision record; System Owner | by impact |

## Exceptions

1. **Submit:** requirement, module and screens, the rule it departs from.
2. **Alternatives:** why existing tokens and components cannot meet it.
3. **Review:** design and technical review by a maintainer (weekly triage).
4. **Accessibility:** the Accessibility Lead signs if any accessibility property changes.
5. **Decision:** approved or rejected with reasons. An approved exception is added to `exceptions.json` by a maintainer.
6. **Expiry:** default six months; the owner reviews it before then. `tools/check.mjs` fails once it expires.
7. **Promotion:** if three or more modules need the same exception, it becomes an RFC. An exception never silently becomes a standard.

## Cadence

Weekly RFC and exception triage · a release when there is something to ship (gated) · quarterly review of rules, debt and trends.
