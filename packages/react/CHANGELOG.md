# @slash-editor/react

## 0.3.1

### Patch Changes

- Fix bubble toolbar flickering when opening Turn into or Ask AI dropdowns
- Updated dependencies
  - @slash-editor/core@0.3.1

## 0.3.0

### Minor Changes

- Unify slash, bubble-toolbar, and block-menu actions around shared block and AI registries. AI adapters now live on editor storage and support cursor, selection, and block contexts with Replace/Insert-below acceptance modes.

  Move comment stores onto the comment extension, add store subscriptions and an anchored comment composer, add shared virtual-anchor helpers and the `useBlockTypes`, `useAiActions`, and `useBlockMenu` hooks. This removes `AiSlashAction`, `defaultAiSlashActions`, and the store argument from `useComments`.

### Patch Changes

- Updated dependencies
  - @slash-editor/core@0.3.0

## 0.2.1

### Patch Changes

- Ships with `@slash-editor/core` 0.2.1 (the two packages are released in lockstep), which fixes
  the block gutter handle sticking to the viewport on scroll. No API change here.
- Updated dependencies
  - @slash-editor/core@0.2.1

## 0.2.0

### Patch Changes

- Ships with `@slash-editor/core` 0.2.0 (the two packages are released in lockstep), which adds
  markdown import/export through `@slash-editor/core/markdown`. No API change here — add
  `markdown()` to `useSlashEditor({ blockKit: { extend: [markdown()] } })`.
- Updated dependencies
  - @slash-editor/core@0.2.0

## 0.1.1

### Patch Changes

- Ships with `@slash-editor/core` 0.1.1 (the two packages are released in lockstep): the
  gutter's hover controls anchor to a block's first line, and clicking the whitespace
  between blocks no longer turns the next keystroke into a new block. No API change here —
  the fix lives in core, which `useBlockDrag` reads its anchors from.
- Updated dependencies
  - @slash-editor/core@0.1.1

## 0.1.0

### Minor Changes

- 7b349d3: Initial documented OSS release. M0–M7 shipped: slash menu, block ids, drag handle,
  media/upload, mentions/AI, real-time collaboration, npm packages, shadcn registry,
  docs site, and playground.

### Patch Changes

- Updated dependencies [7b349d3]
- Updated dependencies
  - @slash-editor/core@0.1.0
