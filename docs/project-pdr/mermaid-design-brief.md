# Mermaid Diagrams — Design Brief

Accepted design for rendering and editing Mermaid diagrams as a block inside the editor.

## Foundation

Users write Mermaid source in a block and read the rendered diagram in place: preview by default,
source revealed while the caret is inside the block (Notion-style "click to edit"). Diagrams must
look native to the host's shadcn theme, survive collaboration and markdown round-trips, and cost
nothing for apps that never render one.

**Goals**

- A `mermaid` block reachable from `/mermaid`, the ` ```mermaid ` shorthand, and "Turn into"
  (slash, bubble toolbar, block menu — all fed by one `BlockType`).
- Preview/click-to-edit `NodeView` in the registry, lazily loading `mermaid` in the browser only.
- Diagram colours and font derived from the shadcn tokens (`--background`, `--foreground`,
  `--secondary`, `--muted-foreground`, …), re-rendered on light/dark switch.
- Markdown: exported as a ` ```mermaid ` fence (which GitHub renders), imported back as the block.

**Non-goals:** Mermaid in Fumadocs MDX pages, syntax highlighting of the source, a visual diagram
editor, exporting diagrams as images.

```mermaid
flowchart LR
  subgraph core [@slash-editor/core]
    N["mermaid node<br/>text* content, code: true"]
    BT[BlockType 'mermaid']
    MD[markdown hooks]
  end
  subgraph registry [site/registry]
    NV[MermaidNodeView]
    LIB["lib/mermaid.ts<br/>lazy import, render queue, theme"]
  end
  BT -->|setMermaid| N
  N -->|ReactNodeViewRenderer| NV
  NV --> LIB
  LIB -->|"import('mermaid')"| M[(mermaid)]
```

**Approach:** a dedicated core node whose source is real document text (`content: "text*"`), not an
attribute. Chosen over (B) a `codeBlock` with `language: "mermaid"` — which would force one
`NodeView` to branch for every code block and blur block-type identity — and (C) an atom with a
`source` attribute, whose last-write-wins semantics under Yjs clobber concurrent edits.

## Technical details

### Core (`packages/core/src/mermaid.ts`)

`Mermaid = CodeBlock.extend({ name: "mermaid", priority: 110, … })` — inheriting code-block editing
behaviour (literal newlines, triple-Enter / ArrowDown exit, Backspace-at-start clears, optional Tab
indentation) while overriding everything that would collide with the real `codeBlock`:

| Field                   | Override                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `addAttributes`         | none (no `language`)                                                                                   |
| `parseHTML`             | `pre[data-type="mermaid"]`, and `pre` whose `<code>` carries `language-mermaid` (paste from GitHub)    |
| `renderHTML`            | `<pre data-type="mermaid"><code>…</code></pre>` — degrades to a code block; no class (core emits none) |
| `addCommands`           | `setMermaid` / `toggleMermaid` only; the inherited `setCodeBlock` would shadow the real one            |
| `addKeyboardShortcuts`  | parent's, minus `Mod-Alt-c` (belongs to `codeBlock`)                                                   |
| `addInputRules`         | ` ```mermaid ` / `~~~mermaid` + space or Enter                                                         |
| `addProseMirrorPlugins` | none — the parent's VS Code paste plugin reuses a fixed `PluginKey` and would throw as a duplicate     |
| markdown                | `markdownTokenName: "code"`; `parseMarkdown` claims only fenced `lang === "mermaid"` tokens            |

`priority: 110` (> `codeBlock`'s 100) orders the node's input rule, HTML parse rule, and markdown
`code` handler ahead of `codeBlock`'s, so ` ```mermaid ` never becomes a plain code block.

`createBlockKit({ mermaid })`: `Partial<CodeBlockOptions> | false`, on by default like `callout`/
`embed` — the node carries no runtime dependency. `false` is the seam a host uses to append a
`NodeView`-augmented `Mermaid.extend(...)` through `extend`.

`defaultBlockTypes` gains `{ id: "mermaid", group: "Advanced blocks", icon: "workflow", shortcut:
"```mermaid" }`, so the slash item and every "Turn into" menu come from one entry. Conversion is
`setNode`: text is kept, marks are dropped (`marks: ""`).

### Registry

- `registry/lib/mermaid.ts` — `renderMermaid(source, element)`:
  - `import("mermaid")` once, memoised; never at module scope, so SSR and bundles that never show a
    diagram stay clear of it.
  - Renders are **serialised** through one promise chain: Mermaid's `initialize` config is global
    and concurrent `render` calls interfere.
  - Theme: reads token values from `getComputedStyle(element)`, converts each to hex by painting it
    on a 1×1 canvas over `--card`, the view's surface (tokens are `oklch()`, sometimes with alpha, which Mermaid's
    colour maths cannot parse), and calls `initialize({ theme: "base", themeVariables, securityLevel:
"strict" })` only when the resolved variables change.
  - Cleans up the temporary `#d<id>` element Mermaid leaves in `<body>` when a render throws.
- `registry/components/nodes/mermaid-node-view.tsx` — `MermaidNodeView`:
  - `editing` = the selection lies strictly inside the node (`useEditorState`).
  - Editing: `<pre><NodeViewContent as="code" /></pre>` above a live preview (debounced 300 ms).
  - Not editing: source hidden; the rendered SVG, an empty-state hint, or the parse error. A
    mouse-down on the preview places the caret at the end of the source.
  - A failed render keeps the last good SVG (dimmed while editing) and shows Mermaid's message.
  - Re-renders on `<html>` `class`/`style` changes (next-themes' light/dark switch).
- `registry.json`: new `mermaid-node-view` item (`dependencies: ["mermaid", …]`), included in
  `slash-editor-kit`. `lib/node-view-extensions.tsx` wires it for the playground and docs demos.

### Edge cases and risks

| Case                                       | Handling                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Untrusted source from a collaborator/paste | `securityLevel: "strict"` (DOMPurify-sanitised SVG, no click bindings); `%%{init}%%` cannot lower it |
| Concurrent edits                           | Source is PM text → Yjs merges per character                                                         |
| Remote edits while previewing              | Preview re-renders from the new text; local view mode unaffected                                     |
| Empty source                               | No render call; hint shown                                                                           |
| No `NodeView` installed                    | Renders as `pre > code.language-mermaid`, readable and styled like code                              |
| Heavy dependency                           | Registry-only, lazy; core never imports `mermaid`                                                    |
| Render ids                                 | Local DOM ids from a module counter — never document attributes, so Yjs determinism holds            |

## Delivery

- **Core tests (DOM-free):** markdown round trip, and ` ```mermaid ` fences import as diagrams while
  ` ```js ` and bare fences stay code blocks.
- **Browser:** playground — insert via `/mermaid`, ` ```mermaid ` + space, `~~~mermaid` + Enter
  (` ```js ` still a code block), turn-into from a code block keeps text, click-to-edit, live
  preview, parse error, undo, light/dark re-theme.
- **Docs:** component page with a live demo, markdown guide mapping row, `docs/` API/SUMMARY/milestones.
- **Release:** changeset — minor for `@slash-editor/core` (new node, block type, kit option).
