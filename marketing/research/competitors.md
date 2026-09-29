# Competitor fact sheet: slash-editor vs Tiptap, BlockNote, Novel, Plate

Research date: 2026-09-29. Stars, versions, and dates come from the GitHub API (`gh api repos/<owner>/<repo>`) and the npm registry (`https://registry.npmjs.org/<pkg>`) on that date. Re-check before publishing because they drift.

Legend: ✅ available free/open source · 💰 paid or commercially licensed · ⚠️ partial, conditional, or not fully verified · ❌ not provided by the project itself (third-party options may exist)

## 1. Comparison table

|                         | slash-editor                                                     | Tiptap                                                                                                                           | BlockNote                                                                                    | Novel                                                    | Plate                                                             |
| ----------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| Core license            | MIT                                                              | MIT                                                                                                                              | MPL-2.0                                                                                      | Apache-2.0                                               | MIT                                                               |
| Paid/proprietary pieces | ❌ none                                                          | 💰 Platform plans (Cloud collab, Comments, history, import/export, Notion-like template), AI Toolkit and Tracked Changes add-ons | 💰 `@blocknote/xl-*` (AI, multi-column, PDF/DOCX/ODT/email export) are GPL-3.0 or commercial | ❌ none                                                  | 💰 Plate Plus (premium components and templates, one-time fee)    |
| UI delivery             | shadcn registry (copy-in source) + headless npm packages         | Copy-in source via `@tiptap/cli` (not on npm); extensions on npm                                                                 | Styled npm packages (`@blocknote/mantine`, `@blocknote/shadcn`, `@blocknote/ariakit`)        | npm package (`novel`)                                    | shadcn registry (copy-in source) + npm plugins                    |
| Engine                  | Tiptap v3 / ProseMirror                                          | ProseMirror                                                                                                                      | Tiptap v3 / ProseMirror                                                                      | Tiptap v2 / ProseMirror                                  | Slate                                                             |
| Real-time collab (Yjs)  | ✅ bring-your-own provider                                       | ✅ OSS extension + Hocuspocus; 💰 Tiptap Cloud                                                                                   | ✅                                                                                           | ❌                                                       | ✅ `@platejs/yjs`                                                 |
| AI                      | ✅ bring-your-own stream adapter                                 | ⚠️/💰 AI in Platform plans; AI Toolkit listed as paid add-on                                                                     | 💰 `@blocknote/xl-ai` (GPL-3.0 or commercial)                                                | ✅ autocompletions (OpenAI in demo app)                  | ✅ `@platejs/ai` (MIT); 💰 extra AI UI in Plate Plus              |
| Drag handle             | ✅                                                               | ✅ `@tiptap/extension-drag-handle` (MIT)                                                                                         | ✅                                                                                           | ✅ via third-party `tiptap-extension-global-drag-handle` | ✅ `@platejs/dnd` (MIT)                                           |
| Mermaid                 | ✅                                                               | ❌ no official extension found                                                                                                   | ⚠️ `@blocknote/diagram-block` (MPL-2.0) published, depends on `mermaid`                      | ❌                                                       | ✅ `@platejs/code-drawing` (MIT)                                  |
| Comments                | ✅ bring-your-own thread store                                   | 💰 Comments extension (Start plan+)                                                                                              | ✅                                                                                           | ❌                                                       | ✅ `@platejs/comment` (MIT); 💰 extra discussion UI in Plate Plus |
| React-only?             | UI and hooks are React; core extensions have no React dependency | No: framework-agnostic (React, Vue, and others)                                                                                  | React UI packages                                                                            | React (community Svelte/Vue ports)                       | React                                                             |
| Latest version (date)   | 0.5.0                                                            | `@tiptap/core` 3.31.3 (2026-09-04)                                                                                               | 0.55.0 (2026-09-22)                                                                          | 1.0.2 (npm 2025-01-18; GitHub release 2025-02-11)        | `platejs` 53.3.14 (2026-09-19)                                    |
| GitHub stars (approx.)  | ~1 (new)                                                         | ~38.6k                                                                                                                           | ~10.2k                                                                                       | ~16.5k                                                   | ~16.6k                                                            |

## 2. Per-competitor notes

### slash-editor (verified from this repo)

- MIT, version 0.5.0: `packages/core/package.json`.
- Built on Tiptap v3: core dependencies are `@tiptap/*` `^3.31.3`, and peer deps are `@tiptap/core`, `@tiptap/pm`, `yjs` (`packages/core/package.json`). React peer deps are `react`/`react-dom` `^18.3.0 || ^19.0.0` plus `@tiptap/react` (`packages/react/package.json`).
- Feature modules in `packages/core/src/`: `slash-command`, `block-id`, `block-drag`, `block-menu`, `callout`, `toggle`, `quote`, `columns`, `table`, `image`, `video`, `file`, `embed`, `upload`, `mention`, `ai-block`, `collaboration`, `comment`, `mermaid`, `table-of-contents`, `markdown`, `markdown-syntax`, `link-editor`, `bubble-toolbar`, `placeholder`.
- Collaboration (`collaboration.ts`) wraps `@tiptap/extension-collaboration` and `collaboration-caret`. It accepts any provider exposing Yjs awareness (the doc comment names Hocuspocus, y-websocket, and y-webrtc). The host owns the transport, persistence, and server. No hosted backend is included.
- AI (`ai-block.ts`) streams through a host-supplied `StreamAdapter`. No model or API key is bundled.
- Comments (`comment.ts`) is a mark plus a host-supplied `CommentThreadStore`. No hosted backend is included.
- Registry items (`site/registry.json`): slash-editor, slash-menu, bubble-toolbar, block-handle, mention-menu, link-editor-popover, comment-panel, comment-composer, icons, presence-avatars, table-of-contents, node-views, mermaid-node-view, popover, dropdown-menu, slash-editor-kit.
- Stars: ~1 (`gh api repos/buiducnhat/slash-editor`).

### Tiptap

- Editor license is MIT. The pricing page says "The Tiptap Editor is open source (MIT) and free. Only platform features and cloud documents are priced." https://tiptap.dev/pricing. Repo license is MIT: https://github.com/ueberdosis/tiptap
- Paid plans: Start $59/mo ($49 annual), Team $179/mo, Business $1,199/mo, and Enterprise at a custom price. Plans include real-time collaboration (cloud), in-line AI, DOCX import/export, document history, and comments. The AI Toolkit and Tracked Changes are custom-priced add-ons. https://tiptap.dev/pricing
- Notion-like template is "available starting from the Start plan". The Simple Editor and its components are open source. It installs with `npx @tiptap/cli add notion-like-editor`. https://tiptap.dev/templates/notion-like-template
- UI components "are not published as an npm package"; the CLI copies source into your project. Components for paid features (Comments, Version History) "are not open source". https://tiptap.dev/docs/ui-components/getting-started/overview
- The same page notes that UI components currently "work best with React 18" while React 19 support is in progress. https://tiptap.dev/docs/ui-components/getting-started/overview
- Comments: "Available in Start plan", installed from the private `@tiptap-pro` registry. https://tiptap.dev/docs/editor/extensions/functionality/comments
- Drag handle: `@tiptap/extension-drag-handle` 3.31.3, MIT, with React and Vue variants. https://registry.npmjs.org/@tiptap/extension-drag-handle and the `packages/` directory in https://github.com/ueberdosis/tiptap
- Collaboration: `@tiptap/extension-collaboration` is MIT (https://registry.npmjs.org/@tiptap/extension-collaboration). Hocuspocus server is MIT with ~2.6k stars (https://github.com/ueberdosis/hocuspocus).
- AI Toolkit licensing is contested. `@tiptap/ai-toolkit` 0.4.0 (2026-08-24) is on public npm with an MIT license field (https://registry.npmjs.org/@tiptap/ai-toolkit), but the pricing page lists "AI Toolkit" as a paid add-on (https://tiptap.dev/pricing). Treat its free status as unclear.
- Mermaid: the Tiptap monorepo `packages/` directory has no mermaid package (https://github.com/ueberdosis/tiptap/tree/main/packages).
- Latest `@tiptap/core` is 3.31.3, released 2026-09-04 (https://github.com/ueberdosis/tiptap/releases). Stars ~38.6k.

### BlockNote

- Core license is MPL-2.0. XL packages are GPL-3.0, "Additionally, a commercial license is available." https://github.com/TypeCellOS/BlockNote/blob/main/LICENSE.txt
- The npm license field for `@blocknote/xl-ai` is `GPL-3.0 OR PROPRIETARY` (https://registry.npmjs.org/@blocknote/xl-ai). `@blocknote/core` is MPL-2.0 (https://registry.npmjs.org/@blocknote/core).
- XL packages in the repo: xl-ai, xl-ai-server, xl-multi-column, xl-docx-exporter, xl-pdf-exporter, xl-odt-exporter, xl-email-exporter, xl-typst-exporter, xl-typst-compiler. https://github.com/TypeCellOS/BlockNote/tree/main/packages
- Pricing: the Community plan is free and includes all blocks and UI components, drag-and-drop, slash menus, real-time collaboration, comments, and XL packages for OSS under GPL-3.0. Business costs $195/mo on annual billing ($390/mo monthly, $2,340/yr) and adds the commercial XL license (AI, multi-column, PDF/Docx/ODT/Email export). Enterprise is custom-priced. https://www.blocknotejs.org/pricing
- Commercial license terms (single application and production environment): https://www.blocknotejs.org/legal/blocknote-xl-commercial-license
- UI ships as npm packages: `@blocknote/mantine`, `@blocknote/shadcn` (MPL-2.0, 0.55.0), `@blocknote/ariakit`, `@blocknote/react`. https://github.com/TypeCellOS/BlockNote/tree/main/packages and https://registry.npmjs.org/@blocknote/shadcn
- The `@blocknote/shadcn` package uses shadcn-styled components but is installed from npm. It is not a shadcn registry.
- Engine: `@blocknote/core` depends on `@tiptap/core` `^3.31.3` and `y-prosemirror`/`yjs`. https://github.com/TypeCellOS/BlockNote/blob/main/packages/core/package.json
- Mermaid: `@blocknote/diagram-block` 0.55.0 (MPL-2.0) is published and depends on `mermaid`. https://github.com/TypeCellOS/BlockNote/blob/main/packages/diagram-block/package.json. Docs coverage was not verified, so the table marks it ⚠️.
- Latest version 0.55.0 (2026-09-22), https://github.com/TypeCellOS/BlockNote/releases. Stars ~10.2k.

### Novel

- License is Apache-2.0. https://github.com/steven-tey/novel/blob/main/LICENSE
- Described as "Notion-style WYSIWYG editor with AI-powered autocompletions". The demo app uses `OPENAI_API_KEY`. https://github.com/steven-tey/novel
- Built on Tiptap v2 (`@tiptap/core` `^2.11.2`). Drag handle comes from the third-party `tiptap-extension-global-drag-handle`. No Yjs or comments dependency is listed. https://github.com/steven-tey/novel/blob/main/packages/headless/package.json
- Framework: React, with community-maintained Svelte and Vue packages (README).
- Maintenance status: latest npm version is 1.0.2, published 2025-01-18 (https://registry.npmjs.org/novel). The latest GitHub release is `novel@1.0.2` on 2025-02-11, and the last commit was 2025-01-18 (https://github.com/steven-tey/novel/commits/main). The repo is not archived.
- Stars ~16.5k.

### Plate (udecode)

- License is MIT at the repo root ("Unless otherwise specified in a LICENSE file within an individual package directory"). https://github.com/udecode/plate/blob/main/LICENSE. `platejs`, `@platejs/ai`, and `@platejs/yjs` are MIT on npm (https://registry.npmjs.org/platejs).
- Engine: Slate. Plugin packages include `slate`, `yjs`, `ai`, `comment`, `suggestion`, `dnd`, `code-drawing`, `toc`, `markdown`, `docx`. https://github.com/udecode/plate/tree/main/packages
- UI is a shadcn registry: `npx shadcn@latest add @plate/editor`, with the registry at `https://platejs.org/r/registry.json`. https://platejs.org/docs/installation/next
- Mermaid: `@platejs/code-drawing` covers "PlantUml, Graphviz, Flowchart, Mermaid", MIT. https://github.com/udecode/plate/blob/main/packages/code-drawing/package.json
- Plate Plus pricing: Personal is €299 one-time, Teams is €799 one-time (up to 5 users). It includes "100+ premium components", the Potion AI template, and lifetime updates. https://pro.platejs.org/pricing
- Latest version `platejs` 53.3.14 (2026-09-19), https://github.com/udecode/plate/releases. Stars ~16.6k.

## 3. Public claims

### Safe to make

- "slash-editor is MIT-licensed with no paid tier or proprietary packages." (repo `package.json`, LICENSE)
- "Built on Tiptap v3 / ProseMirror."
- "UI ships as a shadcn registry: you own the component source." Plate also does this, so don't call it unique.
- "Includes real-time collaboration (Yjs, bring your own provider such as Hocuspocus or y-webrtc), comments, AI streaming, Mermaid, drag handle, table of contents, and markdown import/export in the MIT packages."
- "No hosted backend or API key required. You plug in your own collaboration server, comment store, and AI model."
- Neutral comparison: "Some Notion-style editors put AI, comments, or templates behind commercial licenses (e.g., BlockNote XL packages, Tiptap Platform features, Plate Plus). slash-editor's equivalents are MIT." Link the pricing pages cited above.
- "Headless core: `@slash-editor/core` has no React or CSS dependency." Only the core package qualifies. The UI is React.

### Avoid

- "The only free / open-source Notion-style editor with X." BlockNote, Plate, and Novel all have free open-source cores. Plate ships free Yjs, comments, Mermaid, and AI plugins under MIT. BlockNote's free tier includes collab and comments.
- "The only shadcn-registry editor." Plate uses a shadcn registry, and Tiptap copies source via its CLI.
- "Tiptap AI Toolkit is paid" or "is free." These sources conflict: npm says MIT, pricing says paid add-on.
- "BlockNote has no Mermaid." `@blocknote/diagram-block` exists.
- "Novel is dead / abandoned." Say only the facts: last npm release 1.0.2 on 2025-01-18, not archived.
- "Tiptap doesn't support React 19." The docs only say UI components "work best with React 18" for now.
- Any production-readiness, performance, bundle-size, or accessibility superiority claims. None were measured.
- Star or adoption comparisons that favor slash-editor. It currently has ~1 star against 10k–38k for competitors.
- "Framework-agnostic." Only `@slash-editor/core` avoids React. Registry UI and hooks are React-only.
- Anything that sounds like disparagement ("locked-in", "paywalled", "bloated"). Use neutral wording like "commercially licensed" or "available on paid plans".
