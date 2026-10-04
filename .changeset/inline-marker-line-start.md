---
"@slash-editor/core": patch
---

Markdown import reads a mention or page link that starts a line as inline content. Such a paragraph (including one holding only the mention, or a list item, blockquote or callout line starting with one) used to import as literal comment text or be dropped entirely, so `serializeMarkdown` output with a leading mention did not round-trip.
