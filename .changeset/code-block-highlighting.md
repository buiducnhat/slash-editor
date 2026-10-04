---
"@slash-editor/core": minor
---

Syntax-highlighted code blocks (`@slash-editor/core`):

- **`codeBlock` option.** `createBlockKit({ codeBlock: {} })` swaps StarterKit's plain code block for `@tiptap/extension-code-block-lowlight` under the same `codeBlock` name, so block types, slash items, and markdown are unchanged. Opt-in; pass `lowlight` to choose grammars (default: lowlight's `common` set). `codeBlock: false` leaves it to a `CodeBlock.extend(...)` via `extend`.
- **`CodeBlock` / `codeBlock()` exports**, plus the `code-block-node-view` registry item: a language selector and `hljs-*` token CSS themed from shadcn tokens.
