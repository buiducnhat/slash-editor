---
"@slash-editor/core": minor
---

**`starterKit` option on `createBlockKit`.** Options are forwarded to Tiptap's `StarterKit`, so `createBlockKit({ starterKit: { underline: false } })` drops the underline mark (and `Mod-u` / `++text++` markdown) without reconfiguring the returned extension by hand. Keys the kit owns (`heading`, `undoRedo`, `link`, `codeBlock`, `blockquote`, `gapcursor`) are excluded from the `BlockKitStarterKitOptions` type; use `headingLevels`, `history`, `link`, and `codeBlock` for those.
