# Testing and Verification

## What earns a test

A test must fail for a plausible bug in observable behavior: document output, ranking order, option contracts, error paths. Tests that pin wording, implementation details, or incidental defaults are deleted, not re-pinned.

Current suites (`vp test`, Node environment, no DOM):

| File                                         | Covers                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `packages/core/tests/block-kit.test.ts`      | schema node/mark inventory, doc JSON round trip, `extend` registration, `history: false`, heading levels, slash/bubble opt-out |
| `packages/core/tests/block-nodes.test.ts`    | callout icon default, task item checked default, toggle (`details`) open default, JSON round trips for all three               |
| `packages/core/tests/bubble-toolbar.test.ts` | default items per baseline mark, `when` gating, `isActive` reflecting the live selection                                       |
| `packages/core/tests/media-nodes.test.ts`    | image/file/video/embed attribute defaults, JSON round trips, `false` opt-out                                                   |
| `packages/core/tests/slash-items.test.ts`    | empty-query ordering, ranking precedence, keyword shorthands, no-match, `when` gating, tie stability                           |
| `packages/core/tests/table-columns.test.ts`  | table/columns/column schema inventory, JSON round trip, `columns{2,}` minimum enforced by the schema, `false` opt-out          |
| `packages/core/tests/upload.test.ts`         | `findNodeById` at any depth, `PendingUploadRegistry` replace/abort/delete                                                      |

Core logic is written so it can be tested without a DOM: schemas via `getSchema(...)`, ranking as a pure function. Anything that needs a live `Editor` is verified in a browser instead of mocked.

## Browser regression suite (Playwright)

`demo-react/tests/e2e` (`vp run -F demo-react test:e2e`, config in `demo-react/playwright.config.ts`) drives the actual playground in Chromium — the automated counterpart to the manual checklist below, covering what unit tests structurally cannot: real pointer drags and real paste events.

| File                        | Covers                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `insert.spec.ts`            | slash menu: alias insert, Escape leaves typed text, popover closes after selection                               |
| `reorder.spec.ts`           | gutter-handle drag reorders a top-level block relative to a sibling                                              |
| `nest.spec.ts`              | rightward drag past the indent threshold nests a block inside a list item                                        |
| `paste-notion.spec.ts`      | representative Notion clipboard HTML normalizes into the block schema                                            |
| `paste-google-docs.spec.ts` | representative Google Docs clipboard HTML: inline-style marks, guid wrapper unwrap                               |
| `media-upload.spec.ts`      | image placeholder → real upload → ready; failed upload → error → retry → ready, against the mock `UploadAdapter` |
| `structure.spec.ts`         | table/columns/embed insertion via the slash menu, embed URL input → bookmark card                                |

`tests/e2e/support.ts` holds the shared helpers:

- `dragBlock(page, source, target)` replays `useBlockDrag`'s exact pointer protocol (`mousemove` past the 4px click threshold, `mousemove` to the drop point, `mouseup`) against the real gutter grip — no HTML5 drag-and-drop APIs, because the app doesn't use them.
- `pasteHtml(page, html, text)` dispatches a real `ClipboardEvent("paste", { clipboardData })` on `document.activeElement`, exercising the exact `handleDOMEvents`/DOMParser path a browser paste takes.
- `focusTrailingParagraph(page)` clicks the last paragraph and asserts focus landed (`toBeFocused()`) before returning — React 19 StrictMode double-mounts the editor in dev, and an unguarded click can focus a DOM node from the throwaway mount that's about to be torn down.

Gotchas that cost time getting this suite green, worth knowing before touching it:

- `slashCommand`'s suggestion plugin runs with `allowSpaces: false`; a query containing a space exits the menu. Tests type single-token queries (`/h1`, `/todo`), never `/heading 1`.
- The sandbox/CI environment sets `CI=true`, which flips Playwright's `webServer.reuseExistingServer` to `false`. Stop any dev server already on port 5173 before `test:e2e`, or the run fails immediately with "already used".
- `[data-slot=command-item]` carries `data-value` equal to the `SlashItem.id`, the most stable selector for a specific menu entry.

## Ad hoc browser verification

For behavior the Playwright suite doesn't cover yet, or while developing a new interaction before it earns a spec: drive the running playground directly.

```bash
vp run -F demo-react dev
```

Then either surface:

- **Orca embedded browser** — `orca tab create --url <url>`, `orca snapshot`, `orca click --element @eN`, `orca eval --expression <js>`, `orca screenshot`.
  Caveats observed in this project: `orca type` and `orca keypress` may not reach the page (verify with a capture-phase `keydown` listener before trusting them); use `orca inserttext` for text. `orca screenshot` needs the Orca window visible/focused.
- **Headless automation tab** — reliable synthetic key events (`press("ArrowDown")`), useful for keyboard-path checks.

Assert on DOM facts, not screenshots alone: `[data-slot=popover-content]` presence, `[data-slot=command-item][data-value]` lists, `data-selected`, and the resulting block tags in `.slash-content`.

## Manual checklist for editor changes

1. Menu opens at the caret and closes on `Escape` without losing typed text.
2. Arrow keys move the highlight and wrap; `Enter` applies and consumes the `/query` text.
3. Mouse click applies the same item as the keyboard.
4. Trigger is inert where it should be (code blocks today).
5. Reload with StrictMode on — the editor survives the double mount.
6. Selecting text opens the bubble toolbar anchored above the selection; collapsing the
   selection or blurring the editor closes it; clicking a mark button never steals focus.
