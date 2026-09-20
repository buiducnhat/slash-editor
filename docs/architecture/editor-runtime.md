# Editor Runtime

How a live editor instance is assembled, and the schema decisions baked into it.

## Composition

```
createBlockKit(options)            → Extensions[]   (core)
      │  StarterKit.configure(...) + slashCommand(...) + extend
      ▼
useSlashEditor(options)            → Editor | null  (react)
      │  immediatelyRender: false, extensions latched once
      ▼
<EditorContent editor={editor} />                   (app)
```

`createBlockKit()` returns `[StarterKit, SlashCommand, ...extend]`. Options:

| Option          | Default                                   | Effect                                                              |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `headingLevels` | `[1, 2, 3]`                               | Levels offered by the heading extension                             |
| `history`       | `true`                                    | `false` drops `undoRedo`; required once a Yjs provider owns history |
| `slash`         | `{ char: "/", items: defaultSlashItems }` | `false` leaves the trigger character inert                          |
| `extend`        | `[]`                                      | Extensions appended last, so they win conflicting keymaps           |

## Document model

Canonical format is the Tiptap/ProseMirror JSON document — no parallel block model, no conversion layer.

Nesting uses **container nodes** (lists today; `details`, `callout`, `columns` planned), not a universal `blockContainer` wrapper. A wrapper schema would give uniform nesting but breaks third-party extension expectations, complicates markdown serialization, and doubles the Yjs node count.

Rules that keep the future Yjs integration (M4) safe, enforced from day one:

- No non-deterministic defaults in node attributes.
- Identity attributes are generated on insert/parse, never during render, and never regenerated on update.

## Lifecycle decisions in `useSlashEditor`

- `immediatelyRender: false` — the same component renders under SSR (Next.js App Router) without hydration mismatch.
- Extensions are resolved **once per editor instance** and latched in a ref. ProseMirror cannot swap a schema on a live document, so later changes to `blockKit`/`extensions` are ignored rather than half-applied.
- React 19 StrictMode double-mounts; `@tiptap/react` handles teardown, and the demo keeps StrictMode on so a remount-unsafe change fails loudly in development.

## Styling seam

Core never emits class names. The demo styles content through `.slash-content` element selectors in `demo-react/src/styles.css`, and menu surfaces come from shadcn components using semantic tokens (`bg-popover`, `text-muted-foreground`). Per-node `data-block-type` / `data-block-id` hooks arrive with the `BlockId` extension in M1.
