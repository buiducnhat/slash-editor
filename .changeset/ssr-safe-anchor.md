---
"@slash-editor/react": patch
"@slash-editor/core": patch
---

Importing `@slash-editor/react` no longer throws `DOMRect is not defined` during SSR/prerender: the empty fallback anchor rect is created on first use instead of at module scope. Registry: `popover`/`dropdown-menu` now declare `@base-ui/react` and `cn`, and components import `cn` directly instead of `@/lib/utils`, so `shadcn add @slash-editor/slash-editor-kit` works in an app that never ran `shadcn init`.
