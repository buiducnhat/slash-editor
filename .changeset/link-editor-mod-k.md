---
"@slash-editor/core": patch
---

Bind `Mod-k` to `openLinkEditor`, matching the bubble toolbar's advertised `⌘K`. The key falls through when there is nothing to link; change or remove it with `linkEditor: { shortcut: "…" | false }`.
