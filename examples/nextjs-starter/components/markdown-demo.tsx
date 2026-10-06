"use client";

import type { Editor } from "@tiptap/core";
import { CheckIcon, ClipboardIcon, CodeXmlIcon, DownloadIcon, UploadIcon } from "lucide-react";
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { DemoHeader } from "@/components/demo-header.tsx";
import { DocumentStats, EditorSurface } from "@/components/editor-surface.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { BLOCK_KIT } from "@/lib/editor-kit.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";

const FILE_NAME = "slash-editor.md";
const SYNC_DELAY_MS = 250;
const COPIED_MS = 1500;
const PANE_HEIGHT = "h-[70vh]";

/**
 * Covers every block the markdown entry round-trips. Callouts and toggles use
 * the syntax GitHub renders (`> [!TIP]`, `<details>`); columns have no GFM
 * equivalent, so they are carried by `<!-- slash:… -->` comments.
 */
const SEED = `# Markdown in, markdown out

Edit the **source** on the left or the *document* on the right; the other side follows. Inline: ~~strike~~, \`code\` and [links](https://github.com/).

## Lists

- A bullet
  - A nested bullet
- Another

1. First
2. Second

- [x] Ship the markdown entry
- [ ] Read the round-trip table

## Blocks GitHub renders

> [!TIP]
> Callouts are GitHub alerts: NOTE, TIP, IMPORTANT, WARNING and CAUTION.

<details>
<summary>Toggles are details elements</summary>

Hidden until opened.

</details>

\`\`\`mermaid
flowchart LR
    A[Markdown] --> B[Document] --> C[Markdown]
\`\`\`

## Blocks that carry markers

<!-- slash:columns -->

Column one

<!-- slash:column -->

Column two

<!-- /slash:columns -->

## Code and tables

\`\`\`ts
const md = editor.getMarkdown();
editor.commands.setContent(md, { contentType: "markdown" });
\`\`\`

| Block   | Markdown          |
| ------- | ----------------- |
| Callout | \`> [!TIP]\`        |
| Toggle  | \`<details>\`       |
| Mermaid | A \`mermaid\` fence |
`;

/** What typing each shortcut at the start of a line (or around text) turns into. */
const SHORTCUTS: [typed: string, result: string][] = [
  ["# ", "Heading 1"],
  ["## ", "Heading 2"],
  ["### ", "Heading 3"],
  ["- ", "Bullet list"],
  ["1. ", "Numbered list"],
  ["[] ", "Task list"],
  ["> ", "Toggle"],
  ['" ', "Quote"],
  ["```ts ", "Code block (any language)"],
  ["```mermaid ", "Mermaid diagram"],
  ["---", "Divider"],
  ["**text**", "Bold"],
  ["*text*", "Italic"],
  ["~~text~~", "Strikethrough"],
  ["`text`", "Inline code"],
  ["/callout", "Callout, via the slash menu"],
  ["/columns", "Columns, via the slash menu"],
];

/** Text of a transient label that reverts after `COPIED_MS`. */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), COPIED_MS);
  }

  return [copied, copy] as const;
}

function ShortcutTable({ rows }: { rows: typeof SHORTCUTS }) {
  return (
    <table className="w-full text-sm">
      <thead className="sr-only">
        <tr>
          <th scope="col">Type</th>
          <th scope="col">Result</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([typed, result]) => (
          <tr key={typed} className="border-border border-b last:border-b-0">
            <th scope="row" className="w-1/3 py-1.5 pr-3 text-left font-normal">
              <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs whitespace-pre">
                {typed}
              </kbd>
            </th>
            <td className="text-muted-foreground py-1.5">{result}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function MarkdownDemo() {
  const [source, setSource] = useState(SEED);
  // Which side the latest change came from. Only a change that began in the
  // source is pushed into the editor; one that began in the editor is written
  // to the source and must not be fed back, or `setContent` would reset the
  // caret mid-typing.
  const lastChange = useRef<"editor" | "source">("editor");
  const fileInput = useRef<HTMLInputElement>(null);
  const [copied, copy] = useCopy();

  const onUpdate = useCallback(({ editor: instance }: { editor: Editor }) => {
    lastChange.current = "editor";
    setSource(instance.getMarkdown());
  }, []);

  const editor = useDemoEditor({
    content: SEED,
    contentType: "markdown",
    blockKit: BLOCK_KIT,
    onUpdate,
    editorProps: {
      attributes: {
        class: "slash-content min-h-[calc(70vh-2px)] py-8 pr-6 pl-20",
        "aria-label": "Document",
      },
    },
  });

  useEffect(() => {
    if (!editor || lastChange.current !== "source") return;

    const timer = window.setTimeout(() => {
      // `emitUpdate: false`: this write is not an editor-originated change.
      editor.commands.setContent(source, { contentType: "markdown", emitUpdate: false });
    }, SYNC_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [editor, source]);

  function edit(next: string) {
    lastChange.current = "source";
    setSource(next);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([source], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires `change`.
    event.target.value = "";
    if (file) edit(await file.text());
  }

  const half = Math.ceil(SHORTCUTS.length / 2);

  return (
    <>
      <DemoHeader
        title="Markdown"
        description="The source and the document stay in sync both ways: type markdown on the left, or edit blocks on the right and watch the source rewrite itself. Import and export use editor.getMarkdown() and setContent(…, { contentType: 'markdown' })."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <UploadIcon data-icon="inline-start" />
              Import .md
            </Button>
            <Button variant="outline" size="sm" onClick={download}>
              <DownloadIcon data-icon="inline-start" />
              Download .md
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!editor}
              onClick={() => copy("markdown", source)}
            >
              {copied === "markdown" ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <ClipboardIcon data-icon="inline-start" />
              )}
              {copied === "markdown" ? "Copied" : "Copy markdown"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!editor}
              onClick={() => editor && copy("html", editor.getHTML())}
            >
              {copied === "html" ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CodeXmlIcon data-icon="inline-start" />
              )}
              {copied === "html" ? "Copied" : "Copy as HTML"}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".md,.markdown,text/markdown"
              onChange={importFile}
              hidden
            />
            <span className="ml-auto" aria-live="polite">
              {editor && <DocumentStats editor={editor} />}
            </span>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="markdown-source" className="text-sm font-medium">
            Markdown source
          </label>
          <Textarea
            id="markdown-source"
            value={source}
            onChange={(event) => edit(event.target.value)}
            spellCheck={false}
            className={`${PANE_HEIGHT} field-sizing-fixed resize-none overflow-auto font-mono text-sm leading-6`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Document</h2>
          <EditorSurface editor={editor} comments={false} className={`${PANE_HEIGHT} overflow-y-auto`} />
        </div>
      </div>
      <section aria-labelledby="shortcuts-heading" className="mt-8 flex flex-col gap-3">
        <h2 id="shortcuts-heading" className="text-sm font-medium">
          Markdown shortcuts
        </h2>
        <p className="text-muted-foreground text-xs">
          Type these in the document; they convert as you go.
        </p>
        <div className="grid gap-x-10 lg:grid-cols-2">
          <ShortcutTable rows={SHORTCUTS.slice(0, half)} />
          <ShortcutTable rows={SHORTCUTS.slice(half)} />
        </div>
      </section>
    </>
  );
}
