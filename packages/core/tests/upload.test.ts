import { getSchema } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import { createBlockKit, findNodeById, PendingUploadRegistry } from "../src/index.ts";

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
