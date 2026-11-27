---
tags: [systemdesigner, mui]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, WebFetch]
---

In our Next.js dashboard (MUI) add a Pharmacy requests page at src/app/requests/page.tsx: a page title with the count, a "New request" button, and a table of requests (ID, requested by, waiting days, status). Status is one of Requested, Partly shipped, Shipped, Cancelled. Use our design system.

Input files: package.json, src/app/layout.tsx
