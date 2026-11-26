---
tags: [antz-design-system]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, WebFetch]
---

In our React Native app I need a SpeciesStatCard component (TypeScript) for the species overview: species name, the number of animals, and a small trend label like "+3 this month". Card should work in light and dark. Put it in src/components/SpeciesStatCard.tsx and use our design system theme, which is in src/theme/antz-theme.ts.

Input files: src/theme/antz-theme.ts, package.json
