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
