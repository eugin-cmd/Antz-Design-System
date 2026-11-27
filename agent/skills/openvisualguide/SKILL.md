---
name: openvisualguide
description: Open the official Antz Design System visual guide (the team website with every token, component, pattern, screen and version) in Google Chrome. Use it when someone asks to open, show or browse the Antz design system, the style guide, the visual guide, the component library or the docs site.
---

# /openvisualguide · Antz Design System

Open the **official** visual guide, never a local copy or an old release:

```sh
node <skill-dir>/../../scripts/antz.mjs guide
```

It opens https://antz-design-system.eugin-736.workers.dev/ in Chrome on macOS, Windows or Linux. If Chrome can't be
opened here (no browser, a remote machine), it prints the address instead: give the person the link and say why it
didn't open. Don't change any files, and don't build or serve a copy of the site.
