"use client";

import type { Editor } from "@tiptap/core";
import { FileIcon, ImageIcon, LinkIcon, TriangleAlertIcon, VideoIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { DemoHeader } from "@/components/demo-header.tsx";
import { EditorWorkspace } from "@/components/editor-surface.tsx";
import { Button } from "@/components/ui/button.tsx";
import { BLOCK_KIT, EDITOR_CLASS } from "@/lib/editor-kit.ts";
import { uploadAdapter } from "@/lib/upload-adapter.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";

const MEDIA_CONTENT = `
<h1>Media &amp; embeds</h1>
<p>Drag an image, video or any file onto this document, or paste one from the clipboard. Each becomes a block that shows upload progress and a retry button if the upload fails.</p>
<div data-type="image" data-src="/sample.svg" data-status="ready"><img src="/sample.svg" alt="Abstract gradient with a slash" /></div>
<p>This image is already uploaded. Use <code>/image</code>, <code>/file</code> and <code>/video</code> to add empty placeholders with a file picker, or the buttons below the editor.</p>
<a data-type="embed" data-mode="bookmark" href="https://tiptap.dev" data-title="Tiptap" data-description="The headless editor framework slash-editor builds on.">Tiptap</a>
<p>Bookmarks and iframe embeds take a URL directly; they never touch the upload adapter.</p>
`;

const TO_ATTRS_SNIPPET = `// POST /api/upload -> { url, name, size, type }
const uploadAdapter: UploadAdapter = {
  async upload(file, { signal }) {
    const body = new FormData();
    body.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body, signal });
    return res.json(); // the whole object reaches toAttrs
  },
};

// Image/File/Video options (defaults shown for \`toAttrs\`):
Image.configure({
  toAttrs: (result) => ({ src: result.url }),
  // Display-only rewrite (signed URLs, auth); the stored src stays canonical.
  resolveSrc: async (src) => signUrl(src),
});`;

type MediaKind = "image" | "video" | "file";

/** Inserts `file` as the matching media block; the node view shows progress and retry. */
function insertFile(editor: Editor, file: File, pos?: number) {
  const chain = editor.chain().focus(pos);
  const upload = { file, adapter: uploadAdapter };

  if (file.type.startsWith("image/")) chain.setImage(upload).run();
  else if (file.type.startsWith("video/")) chain.setVideo(upload).run();
  else chain.setFile(upload).run();
}

const PICKER: Record<MediaKind, { accept: string; label: string; icon: typeof ImageIcon }> = {
  image: { accept: "image/*", label: "Upload image", icon: ImageIcon },
  video: { accept: "video/*", label: "Upload video", icon: VideoIcon },
  file: { accept: "", label: "Upload file", icon: FileIcon },
};

function TryIt({ editor }: { editor: Editor }) {
  const input = useRef<HTMLInputElement>(null);

  function pick(kind: MediaKind) {
    if (!input.current) return;
    input.current.accept = PICKER[kind].accept;
    input.current.click();
  }

  // `fail-*` names are rejected once by `/api/upload`, which surfaces the retry button.
  async function insertFailing() {
    const blob = await (await fetch("/logo.png")).blob();

    insertFile(editor, new File([blob], "fail-demo.png", { type: "image/png" }));
  }

  return (
    <section aria-labelledby="media-try" className="bg-card border-border flex flex-col gap-6 rounded-xl border p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        <h2 id="media-try" className="text-sm font-medium">
          Try it
        </h2>
        <input
          ref={input}
          type="file"
          hidden
          aria-label="Choose a file to upload"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) insertFile(editor, file);
            event.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PICKER) as MediaKind[]).map((kind) => {
            const { label, icon: Icon } = PICKER[kind];

            return (
              <Button key={kind} variant="outline" size="sm" onClick={() => pick(kind)}>
                <Icon data-icon="inline-start" />
                {label}
              </Button>
            );
          })}
          <Button variant="outline" size="sm" onClick={() => editor.chain().focus().setImage().run()}>
            <ImageIcon data-icon="inline-start" />
            Empty image placeholder
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={insertFailing}>
            <TriangleAlertIcon data-icon="inline-start" />
            Upload a failing image
          </Button>
          <span className="text-muted-foreground text-xs">
            Files named <code>fail-*</code> are rejected once; press Retry on the block to resend.
            Dropping your own <code>fail-photo.png</code> works too.
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Embeds</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              editor
                .chain()
                .focus()
                .setEmbed({
                  url: "https://github.com/ueberdosis/tiptap",
                  mode: "bookmark",
                  title: "ueberdosis/tiptap",
                  description: "The headless rich text editor framework for web artisans.",
                })
                .run()
            }
          >
            <LinkIcon data-icon="inline-start" />
            Bookmark
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              editor
                .chain()
                .focus()
                .setEmbed({
                  url: "https://www.youtube.com/embed/jNQXAC9IVRw",
                  mode: "iframe",
                  title: "Me at the zoo",
                })
                .run()
            }
          >
            <PlayIcon data-icon="inline-start" />
            YouTube iframe
          </Button>
          <Button variant="outline" size="sm" onClick={() => editor.chain().focus().setEmbed().run()}>
            Empty embed
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          <code>mode: &quot;bookmark&quot;</code> renders a link card; <code>mode: &quot;iframe&quot;</code> a
          sandboxed player.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Server response mapping</h3>
        <p className="text-muted-foreground text-xs">
          <code>/api/upload</code> answers with JSON; <code>toAttrs</code> picks the attributes that
          are stored in the document, and <code>resolveSrc</code> rewrites the URL at display time
          only.
        </p>
        <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs leading-relaxed">
          <code>{TO_ATTRS_SNIPPET}</code>
        </pre>
      </div>
    </section>
  );
}

export function MediaDemo() {
  // `editorProps` are latched at creation, so the handlers reach the editor through a ref.
  const editorRef = useRef<Editor | null>(null);

  const editor = useDemoEditor({
    content: MEDIA_CONTENT,
    blockKit: BLOCK_KIT,
    editorProps: {
      attributes: { class: EDITOR_CLASS, "aria-label": "Media document" },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        const current = editorRef.current;

        if (!current || !files?.length) return false;

        event.preventDefault();
        // The first file goes where it was dropped; later ones follow it.
        let pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;

        for (const file of files) {
          insertFile(current, file, pos);
          pos = undefined;
        }
        return true;
      },
      handlePaste: (_view, event) => {
        const files = event.clipboardData?.files;
        const current = editorRef.current;

        if (!current || !files?.length) return false;

        event.preventDefault();
        for (const file of files) insertFile(current, file);
        return true;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  return (
    <>
      <DemoHeader
        title="Media & embeds"
        description="Drop or paste files into the document to upload them through /api/upload. Progress and retry live in the node views; the upload mechanics live in core."
      />
      <EditorWorkspace
        editor={editor}
        comments={false}
        footer={editor && <TryIt editor={editor} />}
      />
    </>
  );
}
