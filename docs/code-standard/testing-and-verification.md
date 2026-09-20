# Testing and Verification

## What earns a test

A test must fail for a plausible bug in observable behavior: document output, ranking order, option contracts, error paths. Tests that pin wording, implementation details, or incidental defaults are deleted, not re-pinned.

Current suites (`vp test`, Node environment, no DOM):

| File                                      | Covers                                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/core/tests/block-kit.test.ts`   | schema node/mark inventory, doc JSON round trip, `extend` registration, `history: false`, heading levels, slash registration/opt-out |
| `packages/core/tests/slash-items.test.ts` | empty-query ordering, ranking precedence, keyword shorthands, no-match, `when` gating, tie stability                                 |

Core logic is written so it can be tested without a DOM: schemas via `getSchema(...)`, ranking as a pure function. Anything that needs a live `Editor` is verified in a browser instead of mocked.

## Browser verification

Behavior that only exists in a real editor (suggestion triggering, focus ownership, key handling, popover anchoring) is verified by driving the running playground.

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
