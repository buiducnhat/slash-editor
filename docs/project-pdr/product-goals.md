# Product Goals

## Problem

Notion-style block editing is commoditized at the engine layer and scarce at the UI layer.

| Layer                                                       | State of the art | License                                                       |
| ----------------------------------------------------------- | ---------------- | ------------------------------------------------------------- |
| Engine (ProseMirror / Tiptap)                               | Mature           | MIT                                                           |
| Extensions (drag handle, details, emoji, TOC, math)         | Mature           | MIT since mid-2025                                            |
| Collaboration transport (Yjs, y-prosemirror, Hocuspocus v4) | Mature           | MIT, self-hostable                                            |
| Notion-grade block UI on shadcn/Tailwind                    | Missing          | Plate Plus €299/dev; Tiptap UI Components ship plain CSS/SCSS |
| Hosted collaboration / AI / comments                        | Tiptap Cloud     | Paid — deliberately out of scope                              |

Free "tiptap + shadcn" projects are toolbar-grade: formatting buttons over a flat document. None deliver the block interaction model — slash insertion, hover drag handles, reordering, nesting, block comments — on shadcn tokens.

## Goals

- Notion-parity block UX: keyboard-first, accessible, mouse-equivalent.
- shadcn/Tailwind native: semantic tokens only, `cn()` composition, dark mode for free.
- Users own the rendered markup (copy-paste registry) while behavior stays patchable (npm packages).
- 100% MIT dependency graph; any collaboration story must be self-hostable.

## Non-goals

- Hosted services (sync server, AI gateway, asset storage). Adapters only — bring your own backend.
- Non-React renderers in v1. The core stays framework-agnostic so this remains possible later.
- DOCX/PDF fidelity, pagination, track changes.

## Users and use cases

1. **Product teams embedding a document editor** — install two packages, copy the menu components, restyle with their own tokens.
2. **Developers who hit a paywall** — replace a Plate Plus template or Tiptap Cloud feature with owned code.
3. **Contributors extending blocks** — add a `SlashItem` and a node without forking the engine.

## Constraints

- Every custom node must stay Yjs-compatible from the start: deterministic attributes, identity assigned once at insert.
- The core must remain renderer-free (no React, no CSS) so the same logic can back other frameworks.
- The distribution model is npm for logic + shadcn registry for UI; neither may become the only path.

## Differentiation risk

Tiptap could ship a Tailwind UI kit, or relicense future extensions. Mitigation: core depends only on `@tiptap/core` + `@tiptap/pm`, custom nodes are ours, and the moat is the block interaction model plus registry ownership — not button styling.
