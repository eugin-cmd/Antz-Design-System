---
name: antz-design-system
description: Moved. The Antz Design System skill is now /systemdesigner in the Antz Design System plugin (antz-design-system). Use this only to tell someone how to install the plugin.
disable-model-invocation: true
---

# Moved: the Antz Design System agent is a plugin now

This skill became **/systemdesigner** in the **Antz Design System** Claude Code plugin, alongside **/systemauditor**
and **/openvisualguide**. Install it once in your product repository, pinned to the release you build against:

```
/plugin marketplace add eugin-cmd/Antz-Design-System#v1.2.0-beta.8
/plugin install antz-design-system@antz
```

With a local clone, add the marketplace from its folder instead: `/plugin marketplace add ./antz-design-system`.
Then delete this folder from your project's `.claude/skills/`. Guide: `docs/agent-onboarding.md` in the repository.
