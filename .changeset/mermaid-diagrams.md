---
"@slash-editor/core": minor
---

Mermaid diagram blocks. `@slash-editor/core` adds a `mermaid` node (source kept as document text, so collaborative edits merge per character) with `setMermaid`/`toggleMermaid`, ` ```mermaid ` / `~~~mermaid` input rules, a `mermaid` block type that feeds `/mermaid` and every "Turn into" menu, a `createBlockKit({ mermaid })` option, and ` ```mermaid ` fence markdown import/export. The new `mermaid-node-view` registry item renders the diagram in place, opens the source with a live preview while the caret is inside, themes diagrams from your shadcn tokens (light and dark), and lazy-loads `mermaid`.
