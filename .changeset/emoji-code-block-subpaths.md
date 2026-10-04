---
"@slash-editor/core": minor
"@slash-editor/react": minor
---

Emoji and highlighted code blocks move to their own entries (`@slash-editor/core`, `@slash-editor/react`):

- **Breaking: `@slash-editor/core/emoji` and `@slash-editor/core/code-block` subpaths.** `Emoji`, `emoji`, `searchEmojis` and the `EmojiItem`/`EmojiMenuState`/`EmojiMenuStorage`/`EmojiOptions` types now import from `@slash-editor/core/emoji`; `CodeBlock`, `codeBlock` and the `CodeBlockOptions`/`Lowlight` types from `@slash-editor/core/code-block`. The root entry no longer exports them.
- **Breaking: `createBlockKit` takes the built node.** `emoji` and `codeBlock` accept the extension instead of its options (`codeBlock` still accepts `false` for no code block), so the kit never imports the emoji dataset or lowlight. `createBlockKit()` drops from ~323 KB to ~198 KB gzipped (minified browser bundle, dependencies included) when neither is used.
- **`"sideEffects": false`** in both packages, so bundlers can drop unused modules.

Migration:

```ts
// Before
import { CodeBlock, createBlockKit } from "@slash-editor/core";

createBlockKit({ emoji: { limit: 24 }, codeBlock: { lowlight } });
createBlockKit({ codeBlock: false, extend: [CodeBlock.extend({ addNodeView })] });

// After
import { createBlockKit } from "@slash-editor/core";
import { CodeBlock, codeBlock } from "@slash-editor/core/code-block";
import { emoji } from "@slash-editor/core/emoji";

createBlockKit({ emoji: emoji({ limit: 24 }), codeBlock: codeBlock({ lowlight }) });
createBlockKit({ codeBlock: CodeBlock.extend({ addNodeView }) });
```
