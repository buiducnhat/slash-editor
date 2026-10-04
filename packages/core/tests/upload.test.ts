import { Editor, getSchema, type JSONContent } from "@tiptap/core";
import { expect, test, vi } from "vite-plus/test";
import {
  type BlockKitOptions,
  createBlockKit,
  findNodeById,
  PendingUploadRegistry,
  type UploadAdapter,
  type UploadResult,
} from "../src/index.ts";
import { serializeMarkdown } from "../src/markdown.ts";

test("findNodeById locates a node by its BlockId at any depth", () => {
  const schema = getSchema(createBlockKit());
  const doc = schema.nodeFromJSON({
    type: "doc",
    content: [
      { type: "paragraph", attrs: { id: "p1" }, content: [{ type: "text", text: "hi" }] },
      {
        type: "image",
        attrs: { id: "img1", src: null, alt: null, width: null, status: "uploading", error: null },
      },
    ],
  });

  const found = findNodeById(doc, "img1");
  expect(found?.node.type.name).toBe("image");
  expect(found?.pos).toBe(doc.content.firstChild!.nodeSize);

  expect(findNodeById(doc, "missing")).toBeNull();
});

test("PendingUploadRegistry keeps the latest entry per id and aborts the one it replaces", () => {
  const registry = new PendingUploadRegistry();
  const file = new File(["a"], "a.png");
  const adapter = { upload: async () => ({ url: "x" }) };

  const first = new AbortController();
  registry.set("id1", { file, adapter, controller: first });
  expect(registry.get("id1")?.controller).toBe(first);

  const second = new AbortController();
  registry.set("id1", { file, adapter, controller: second });
  expect(first.signal.aborted).toBe(true);
  expect(registry.get("id1")?.controller).toBe(second);

  registry.delete("id1");
  expect(registry.get("id1")).toBeUndefined();
});

interface CanonicalResult extends UploadResult {
  name: string;
}

/** Headless editor: commands and transactions run without a DOM view. */
function headlessEditor(options: BlockKitOptions) {
  return new Editor({
    element: null,
    extensions: createBlockKit({ bubbleToolbar: false, ...options }),
    content: { type: "doc", content: [{ type: "paragraph" }] },
  });
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function onlyNode(editor: Editor, type: string) {
  let found: Record<string, unknown> | undefined;
  editor.state.doc.descendants((node) => {
    if (node.type.name === type) {
      found = node.attrs;
    }
  });
  return found!;
}

test("toAttrs maps the full upload result onto the node, on first success and on retry", async () => {
  let attempts = 0;
  const adapter: UploadAdapter<CanonicalResult> = {
    upload: async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("offline");
      }
      return { url: "https://cdn.example/f/42", name: "canonical.pdf" };
    },
  };
  const editor = headlessEditor({
    file: {
      toAttrs: (result) => ({ src: result.url, name: (result as CanonicalResult).name }),
    },
  });

  editor.commands.setFile({
    file: new File(["%PDF"], "picked.pdf", { type: "application/pdf" }),
    adapter,
  });
  await settle();
  const failed = onlyNode(editor, "file");
  expect(failed).toMatchObject({ status: "error", src: null, name: "picked.pdf" });

  expect(editor.commands.retryFile(failed.id as string)).toBe(true);
  await settle();
  expect(onlyNode(editor, "file")).toMatchObject({
    status: "ready",
    src: "https://cdn.example/f/42",
    name: "canonical.pdf",
    // Set from the picked `File` at insert; toAttrs merges over it.
    size: 4,
    mime: "application/pdf",
  });

  const imageEditor = headlessEditor({
    image: { toAttrs: (result) => ({ src: `${result.url}?v=1`, alt: "from server" }) },
  });
  imageEditor.commands.setImage({
    file: new File(["png"], "a.png"),
    adapter: { upload: async () => ({ url: "https://cdn.example/i/7" }) },
  });
  await settle();
  expect(onlyNode(imageEditor, "image")).toMatchObject({
    status: "ready",
    src: "https://cdn.example/i/7?v=1",
    alt: "from server",
  });

  editor.destroy();
  imageEditor.destroy();
});

test("resolveSrc is display-only: HTML and markdown keep the stored URL", () => {
  const resolveSrc = vi.fn(() => "https://signed.example/?token=secret");
  const kit = createBlockKit({
    image: { resolveSrc },
    file: { resolveSrc },
    video: { resolveSrc },
    embed: { resolveSrc },
  });
  const schema = getSchema(kit);
  const content: JSONContent = {
    type: "doc",
    content: [
      { type: "image", attrs: { src: "https://cdn.example/a.png" } },
      { type: "file", attrs: { src: "https://cdn.example/b.pdf", name: "b.pdf" } },
      { type: "video", attrs: { src: "https://cdn.example/c.mp4" } },
      { type: "embed", attrs: { url: "https://cdn.example/d", mode: "iframe" } },
    ],
  };
  const doc = schema.nodeFromJSON(content);

  const html = JSON.stringify(doc.content.content.map((node) => node.type.spec.toDOM!(node)));
  const markdown = serializeMarkdown(content, kit);
  for (const output of [html, markdown]) {
    expect(output).not.toContain("signed.example");
    for (const stored of ["a.png", "b.pdf", "c.mp4", "cdn.example/d"]) {
      expect(output).toContain(stored);
    }
  }
  expect(resolveSrc).not.toHaveBeenCalled();
});
