# TypeScript Conventions

## Modules

- Relative imports carry the `.ts`/`.tsx` extension (`./slash-items.ts`) — `allowImportingTsExtensions` is on and the bundler rewrites them.
- `verbatimModuleSyntax` is on: type-only imports must say `import type` or use inline `type` specifiers.
- Public API lives in `src/index.ts` as an explicit export list — no `export *`. Types are exported alongside their values in the same statement.

## Types and data shapes

- Small static string-keyed lookups are `Record<K, V>` object literals (e.g. the icon map in `slash-menu.tsx`). Reach for `Set`/`Map` only for dynamic membership, insertion/deletion at runtime, or when `.size`/iteration order matters (e.g. the listener set in `SlashCommandStorage`).
- Prefer explicit interfaces on public surfaces; let inference do the work internally.
- Avoid single-expression wrapper functions. Inline the expression unless the name is a durable public contract, a type guard, or needed for callback identity.

## Naming

| Kind             | Style                                      | Example                                 |
| ---------------- | ------------------------------------------ | --------------------------------------- |
| Files            | kebab-case                                 | `use-slash-menu.ts`, `slash-command.ts` |
| Types/interfaces | PascalCase                                 | `SlashItem`, `SlashMenuState`           |
| Functions/hooks  | camelCase, hooks prefixed `use`            | `filterSlashItems`, `useSlashMenu`      |
| Extension names  | camelCase, match the Tiptap extension name | `slashCommand`                          |
| Slash item ids   | kebab-case, stable                         | `heading-1`, `bullet-list`              |
| Constants        | SCREAMING_SNAKE for module-level literals  | `DEFAULT_HEADING_LEVELS`, `CLOSED`      |

## Comments

Comments explain _why_, not _what_. The ones that exist in this codebase all encode a constraint that is invisible from the code — schema immutability, Yjs determinism rules, Tiptap's per-editor storage copies, focus ownership. Delete any comment that only restates the next line.

Use JSDoc on exported symbols and on non-obvious option fields; mark internals with `@internal`.

## Tiptap-specific rules

- Extension storage methods are declared with an explicit `this: Storage` parameter and mutate through `this`. Never close over the object returned from `addStorage()` — each editor receives its own copy.
- Read storage from plugins lazily (`() => editor.storage.<name>`); the extension manager wires storage after plugins are created.
- Augment `@tiptap/core`'s `Storage` interface from the module that defines the storage, so consumers get typed access.
- Never generate identity or other non-deterministic attribute values during render; only on insert/parse. Collaboration (M4) depends on it.
