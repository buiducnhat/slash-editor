"use client";

import type { Editor } from "@tiptap/core";
import { useEditorState } from "@slash-editor/react";
import { DownloadIcon, RotateCcwIcon, UploadIcon } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";

const FILE_NAME = "slash-editor.md";

/**
 * Live `editor.getMarkdown()` beside the document, for exercising the
 * `@slash-editor/core/markdown` round trip by hand: edit the text and apply it,
 * import a `.md` file, or download the current document as one.
 *
 * The textarea mirrors the editor until it is edited; from then on it holds a
 * draft that editor changes no longer overwrite, until it is applied or
 * reverted.
 */
export function MarkdownPanel({ editor }: { editor: Editor }) {
  const markdown = useEditorState({
    editor,
    selector: ({ editor: instance }) => instance.getMarkdown(),
  });
  const [draft, setDraft] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function load(source: string) {
    editor.commands.setContent(source, { contentType: "markdown" });
    setDraft(null);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
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
    if (file) {
      load(await file.text());
    }
  }

  return (
    <section aria-label="Markdown" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">
          Markdown
          {draft !== null && (
            <span className="text-muted-foreground font-normal"> · edited, not applied</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {draft !== null && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
                <RotateCcwIcon data-icon="inline-start" />
                Revert
              </Button>
              <Button size="sm" onClick={() => load(draft)}>
                Apply to editor
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            <UploadIcon data-icon="inline-start" />
            Import .md
          </Button>
          <Button variant="outline" size="sm" onClick={download}>
            <DownloadIcon data-icon="inline-start" />
            Download .md
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".md,.markdown,text/markdown"
            onChange={importFile}
            hidden
          />
        </div>
      </div>
      <Textarea
        value={draft ?? markdown}
        onChange={(event) => setDraft(event.target.value)}
        spellCheck={false}
        aria-label="Document as markdown"
        className="max-h-[60vh] min-h-48 font-mono"
      />
    </section>
  );
}
