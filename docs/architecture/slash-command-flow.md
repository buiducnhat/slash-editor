# Slash Command Flow

End-to-end path from a typed `/` to an applied block.

```
keystroke "/"
  → @tiptap/suggestion plugin (packages/core/src/slash-command.ts)
      allow(): false inside code blocks
      items(): filterSlashItems(registry, query, editor)
  → render().onStart/onUpdate
  → editor.storage.slashCommand.setActive(props)      ← single source of truth
      state = { open, query, items, activeIndex, getClientRect }
      listeners.forEach(notify)
  → useSlashMenu(editor)  [useSyncExternalStore]      (packages/react)
  → <SlashMenu>: Popover(anchor=caret rect) + Command  (site/registry)
```

Selection runs the reverse path: `storage.select(index)` → suggestion `command({ editor, range, props: item })` → `item.run({ editor, range })`, which deletes the `/query` range and applies its block in one chain.

## Who owns the keyboard

The editor **keeps focus the whole time**. The popup renders with `initialFocus={false}` / `finalFocus={false}`, so Base UI never pulls focus out of the document.

| Key                     | Handled by                                | Behavior                                                       |
| ----------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `ArrowDown` / `ArrowUp` | suggestion `onKeyDown` → `setActiveIndex` | Wraps around the item list                                     |
| `Enter` / `Tab`         | suggestion `onKeyDown` → `select()`       | No-op (falls through) when zero items match                    |
| `Escape`                | suggestion plugin's own dismissal         | Closes, leaves typed text, stays dismissed until a new trigger |
| Everything else         | ProseMirror                               | Normal typing; query updates on every transaction              |

`Command` runs with `shouldFilter={false}` and a controlled `value`, because ranking lives in core. Mouse hover feeds `onValueChange` back into `setActiveIndex`, which is a no-op when the index is unchanged, so hover and keyboard cannot loop.

**Scrolling is the cost of that ownership.** `cmdk` scrolls the highlighted row into view from its own `setState("value", …)` path — the one its key handler and pointer handler use. A controlled `value` prop takes a different branch that deliberately skips the scroll, so arrow keys moved the highlight off-screen with the list frozen. `useActiveItemScroll` (in `@slash-editor/react`) closes the gap from the outside rather than handing the keys back to `cmdk`, which would split keyboard ownership.

## The trigger's own decorations

`@tiptap/suggestion` wraps the live `/query` text in a span carrying `data-decoration-id`, `data-decoration-content` (from `SlashCommandOptions.hint`), and the class `is-empty` while the query is empty. The UI layer renders the hint with `[data-decoration-id].is-empty::after { content: attr(data-decoration-content) }` — the prompt appears with the `/` and disappears at the first character typed. `is-empty` is the only third-party class the content styles depend on.

## Empty-block placeholders

A separate extension (`placeholder.ts`) decorates the empty block holding the caret with `data-placeholder`, so pressing Enter after choosing a block type leaves a named empty block rather than a blank line. Its decorations are derived from the state they are drawn against, never from `editor.state`: mid-transaction those are different documents, and resolving a parent in the stale one mislabels every nested block (a list item's empty child reads as a plain paragraph).

## Ranking

`filterSlashItems(items, query, editor?)` drops items whose `when(editor)` is false, then scores the rest:

| Score | Match                              |
| ----- | ---------------------------------- |
| 100   | Title starts with the query        |
| 80    | A title word starts with the query |
| 60    | An alias starts with the query     |
| 40    | Title contains the query           |
| 20    | A keyword contains the query       |
| 0     | Dropped                            |

Sorting is stable, so equal scores keep registry order and an empty query returns the registry as-is.

## Storage is per-editor, addressed through `this`

Tiptap hands every editor its own storage object. Storage methods therefore read and write through `this` (`editor.storage.slashCommand`) and the plugin resolves storage lazily via `editor.storage.slashCommand`. Closing over a local object in `addStorage()` updates a copy the React layer never reads — the menu then stays closed while the plugin fires normally.

## Failure handling

`item.run` is wrapped by the suggestion `command` callback. A throw is routed to `SlashCommandOptions.onError` when provided (rethrown otherwise); because the failure happens before the chain dispatches, the document keeps its prior state rather than landing half-mutated.
