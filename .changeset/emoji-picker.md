---
"@slash-editor/core": minor
"@slash-editor/react": minor
---

Emoji picker (`@slash-editor/core`, `@slash-editor/react`):

- **`emoji` extension.** Wraps `@tiptap/extension-emoji` (MIT) with a `:`-triggered picker that exposes the same subscribe/state shape as `mention`. `:shortcode:` input and paste rules, unicode-to-node conversion, and markdown (`:shortcode:`, unknown shortcodes stay text) are included. Opt-in: `createBlockKit({ emoji: {} })`.
- **`/emoji` slash item.** Shown only while the node is registered; types the `:` that opens the picker.
- **`useEmoji` hook and `emoji-menu` registry item.** Command-in-Popover surface that follows the `mention-menu` pattern. Included in `slash-editor-kit`.
