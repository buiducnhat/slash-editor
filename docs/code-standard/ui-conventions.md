# UI Conventions

The project's selling point is UI you own that still looks native to a shadcn app. These rules keep it that way.

## shadcn usage

- The demo is configured for **Base UI** (`base`), preset `nova`, icon library `lucide`. Check `demo-react/components.json` before assuming an API — Base UI uses `render` props and `Popover.Positioner`, not Radix's `asChild`/`PopoverAnchor`.
- Add components with the CLI, never by hand-copying files: `bunx --bun shadcn@latest add <component>`.
- Read added files afterwards. Fix registry imports that do not match this project's aliases, and swap icon imports to `lucide-react`.
- Local edits to `src/components/ui/*` are allowed (we own the code) but must be minimal and commented. Current example: `popover.tsx` forwards `anchor` to `Popover.Positioner` for caret anchoring.
- `cn` comes from the `cn` package, re-exported by `@/lib/utils.ts`.

## Styling

- Semantic tokens only: `bg-popover`, `text-muted-foreground`, `border-border`. No raw colors, no manual `dark:` overrides — the theme layer handles both modes.
- `className` carries layout, not component identity: no overriding a component's own colors or typography.
- Spacing uses `flex` + `gap-*`, never `space-x-*` / `space-y-*`. Equal dimensions use `size-*`, not `w-* h-*`.
- Never set `z-index` on overlay components; Dialog/Popover manage their own stacking.
- Icons inside components get no sizing classes — the component sizes them. Icons in buttons use `data-icon="inline-start" | "inline-end"`.
- Editor content is styled through the `.slash-content` layer with plain element selectors, because the core emits no class names.

## Composition

- Items live inside their group: `CommandItem` → `CommandGroup`, `SelectItem` → `SelectGroup`.
- Prefer an existing component over custom markup: `Alert` for callouts, `Empty` for empty states, `Separator` instead of `<hr>`, `Skeleton` for loading, `Badge` instead of styled spans.
- Dialog/Sheet/Drawer always need a title (`className="sr-only"` if visually hidden).

## Editor UI rules

- Menus and toolbars must not steal focus from the document: pass `initialFocus={false}` and `finalFocus={false}` to the popup.
- Filtering and ranking belong to core. UI renders with `shouldFilter={false}` and a controlled `value`.
- Core ships icon **keys**; components resolve them to icon components locally. Never import icons into `packages/core`. Resolution must have a fallback: an unmapped key renders a placeholder icon, never a blank slot.
- Anchor floating surfaces to the caret with the virtual element from `useSlashMenu().anchor`.
- Suggestion lists must scroll their highlighted row into view with `useActiveItemScroll`. The palette never sees the arrow keys, so it will not do it on its own.
- Menu rows stay one line: `truncate` the label and put any hint in `CommandShortcut`. Longer copy belongs in the row's `title` tooltip.
- Editor placeholders and the slash hint are `::before`/`::after` on `[data-placeholder]` and `[data-decoration-id].is-empty`, and ship to consumers through the `css` block on the registry's `slash-editor-kit` item.
