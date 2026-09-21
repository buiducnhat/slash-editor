# Testing and Verification

## What earns a test

A test must fail for a plausible bug in observable behavior: document output, ranking order, option contracts, error paths. Tests that pin wording, implementation details, or incidental defaults are deleted, not re-pinned.

Current suites (`vp test`, Node environment, no DOM):

| File                                         | Covers                                                                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/tests/ai-block.test.ts`       | opt-in wiring (no `StreamAdapter` -> no `aiBlock`), `node: false` opt-out, `createAiSlashItems` action list, schema defaults/JSON round trip, `when` gating |
| `packages/core/tests/block-kit.test.ts`      | schema node/mark inventory, doc JSON round trip, `extend` registration, `history: false`, heading levels, slash/bubble opt-out                              |
| `packages/core/tests/block-nodes.test.ts`    | callout icon default, task item checked default, toggle (`details`) open/`level` defaults, JSON round trips                                                 |
| `packages/core/tests/bubble-toolbar.test.ts` | default items per baseline mark, `when` gating, `isActive` reflecting the live selection                                                                    |
| `packages/core/tests/link-editor.test.ts`    | `canOpenLinkEditor` gating (mark presence, editability, selection/active-link), kit opt-out, `link` mark editing config                                     |
| `packages/core/tests/media-nodes.test.ts`    | image/file/video/embed attribute defaults, JSON round trips, `false` opt-out                                                                                |
| `packages/core/tests/mention.test.ts`        | opt-in wiring (no provider -> no `mention`), schema defaults/JSON round trip, `char`/`debounce`/`minQueryLength` pass-through                               |
| `packages/core/tests/placeholder.test.ts`    | placeholder slot resolution per node type, heading level and containing block; code blocks excluded; kit opt-out                                            |
| `packages/core/tests/slash-items.test.ts`    | empty-query ordering, ranking precedence, keyword shorthands, no-match, `when` gating, tie stability                                                        |
| `packages/core/tests/table-columns.test.ts`  | table/columns/column schema inventory, JSON round trip, `columns{2,}` minimum enforced by the schema, `false` opt-out                                       |
| `packages/core/tests/upload.test.ts`         | `findNodeById` at any depth, `PendingUploadRegistry` replace/abort/delete                                                                                   |

Core logic is written so it can be tested without a DOM: schemas via `getSchema(...)`, ranking as a pure function. Anything that needs a live `Editor` is verified in a browser instead of mocked.

## Browser regression suite (Playwright)

`site/tests/e2e` (`vp run -F site test:e2e`, config in `site/playwright.config.ts`) drives the actual playground in Chromium — the automated counterpart to the manual checklist below, covering what unit tests structurally cannot: real pointer drags and real paste events.

| File                        | Covers                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `insert.spec.ts`            | slash menu: alias insert, Escape leaves typed text, popover closes after selection                                                                        |
| `reorder.spec.ts`           | gutter-handle drag reorders a top-level block relative to a sibling                                                                                       |
| `nest.spec.ts`              | rightward drag past the indent threshold nests a block inside a list item                                                                                 |
| `paste-notion.spec.ts`      | representative Notion clipboard HTML normalizes into the block schema                                                                                     |
| `paste-google-docs.spec.ts` | representative Google Docs clipboard HTML: inline-style marks, guid wrapper unwrap                                                                        |
| `media-upload.spec.ts`      | image placeholder → real upload → ready; failed upload → error → retry → ready, against the mock `UploadAdapter`                                          |
| `structure.spec.ts`         | table/columns/embed insertion via the slash menu, embed URL input → bookmark card                                                                         |
| `mention.spec.ts`           | async directory search → chip insertion, empty-result state, Escape leaves typed text                                                                     |
| `link-editor.spec.ts`       | drafting a link over a selection, click-to-edit an existing link, remove                                                                                  |
| `ai-actions.spec.ts`        | slash action → real stream → Keep (paragraph)/Discard, and error → retry, against the mock `StreamAdapter`                                                |
| `toggle-blocks.spec.ts`     | `>` makes a toggle and `"` a quote; `# ` + `> ` and in-title `##` set the level; level and block id survive open/close; Advanced blocks slash rows        |
| `slash-menu-ux.spec.ts`     | arrow-key scrolling keeps the highlight in view, one-line rows with icons, a shown `shortcut` really converts the block, per-block placeholders, `/` hint |

`tests/e2e/support.ts` holds the shared helpers:

- `dragBlock(page, source, target)` replays `useBlockDrag`'s exact pointer protocol (`mousemove` past the 4px click threshold, `mousemove` to the drop point, `mouseup`) against the real gutter grip — no HTML5 drag-and-drop APIs, because the app doesn't use them.
- `pasteHtml(page, html, text)` dispatches a real `ClipboardEvent("paste", { clipboardData })` on `document.activeElement`, exercising the exact `handleDOMEvents`/DOMParser path a browser paste takes.
- `focusTrailingParagraph(page)` clicks the last paragraph and asserts focus landed (`toBeFocused()`) before returning — React 19 StrictMode double-mounts the editor in dev, and an unguarded click can focus a DOM node from the throwaway mount that's about to be torn down.

Gotchas that cost time getting this suite green, worth knowing before touching it:

- `slashCommand`'s suggestion plugin runs with `allowSpaces: false`; a query containing a space exits the menu. Tests type single-token queries (`/h1`, `/todo`), never `/heading 1`.
- Slash queries rank against `title`/`aliases`/`keywords`, never an item's `id`: `/continue-writing` matches nothing (the hyphen breaks the title-prefix/word-prefix checks against title `"Continue writing"`) while `/continue` scores a title match. Assert the result via `[data-value="<id>"]`, but type a query that actually ranks it.
- `INITIAL_CONTENT` in `app.tsx` must end with a node Tiptap's trailing-node behavior treats as needing a follow-up paragraph (a table, not a plain `<p>`) — `focusTrailingParagraph` depends on that auto-appended _empty_ paragraph existing and being the actual last `<p>` in the doc; ending the seed content on non-empty paragraphs instead breaks every test that calls it, not just new ones.
- Base UI's `Popover.Popup` stays mounted (with `data-closed`) after its first open, for the exit animation, rather than being removed — once more than one popover has been opened during a test (e.g. the bubble toolbar and the link editor both fire off the same text selection), `[data-slot="popover-content"]` matches multiple stale-closed nodes and any `toBeHidden()`/`toBeVisible()` on it becomes a strict-mode violation. Assert on a popover's own content (e.g. its input by placeholder) instead of the generic slot selector once a test's flow could have opened more than one.
- A Tiptap command that needs to dispatch a transaction from an async callback (upload/stream completion, a deferred retry) must never do so synchronously inside another command's own body: the outer command's own dispatch is still assembling, and a second, independently-built transaction inside it is applied against a doc that has already moved out from under it (`RangeError: Applying a mismatched transaction`). `runUpload`/`runAiStream` are only ever invoked from a `queueMicrotask`, and the callback closure captures every out-of-band write it needs to make together — see `retryAiAction` and `retryImage` for the exact shape. Prefer mutating the `tr` the command was already handed (`acceptAiAction`/`discardAiAction`, `block-drag.ts`) when a transaction is available synchronously; reach for `editor.view.dispatch` only when it genuinely isn't.
- Likewise, never call `editor.commands.X()` (a full, independent command dispatch) from inside another command's own body — refocusing the document there is `editor.view.focus()` (no transaction), not `editor.commands.focus()`.
- `[data-slot=command-item]` carries `data-value` equal to the `SlashItem.id`, the most stable selector for a specific menu entry.

## Ad hoc browser verification

For behavior the Playwright suite doesn't cover yet, or while developing a new interaction before it earns a spec: drive the running playground directly.

```bash
vp run -F site dev
```

Then either surface:

- **Orca embedded browser** — `orca tab create --url <url>`, `orca snapshot`, `orca click --element @eN`, `orca eval --expression <js>`, `orca screenshot`.
  Caveats observed in this project: `orca type` and `orca keypress` may not reach the page (verify with a capture-phase `keydown` listener before trusting them); use `orca inserttext` for text. `orca screenshot` needs the Orca window visible/focused.
- **Headless automation tab** — reliable synthetic key events (`press("ArrowDown")`), useful for keyboard-path checks.

Assert on DOM facts, not screenshots alone: `[data-slot=popover-content]` presence, `[data-slot=command-item][data-value]` lists, `data-selected`, and the resulting block tags in `.slash-content`.

## Manual checklist for editor changes

1. Menu opens at the caret and closes on `Escape` without losing typed text.
2. Arrow keys move the highlight, wrap, and keep it scrolled into view; `Enter` applies and consumes the `/query` text.
3. Mouse click applies the same item as the keyboard.
4. Trigger is inert where it should be (code blocks today).
5. Reload with StrictMode on — the editor survives the double mount.
6. Selecting text opens the bubble toolbar anchored above the selection; collapsing the
   selection or blurring the editor closes it; clicking a mark button never steals focus.
7. Typing `@` opens the mention menu with a loading state, then results; arrow keys and Enter behave
   like the slash menu; Escape leaves the typed `@query` text.
8. Placing the cursor inside an existing link auto-opens the link popover with edit controls; selecting
   plain text and clicking "Link" in the bubble toolbar opens it empty; typing in the popover's input
   never loses focus to the editor mid-keystroke.
9. An AI slash action streams visibly into a dashed placeholder block; Keep replaces it with a real
   paragraph in one undo step, Discard removes it, and Try again restarts the same request.
10. Typing `/` shows the "Type to search" hint next to the caret, which disappears at the first
    character; applying a block leaves an empty block naming itself ("Heading 1", "List", "To-do").
