import { expect, test } from "vite-plus/test";
import { Doc as YDoc } from "yjs";
import { createBlockKit } from "../src/index.ts";

const names = (options?: Parameters<typeof createBlockKit>[0]) =>
  createBlockKit(options).map((extension) => extension.name);

test("collaboration is off by default: no Collaboration/CollaborationCaret extension registered", () => {
  const kit = names();
  expect(kit).not.toContain("collaboration");
  expect(kit).not.toContain("collaborationCaret");
});

test("collaboration registers Collaboration once a document is supplied", () => {
  const kit = names({ collaboration: { document: new YDoc() } });
  expect(kit).toContain("collaboration");
  expect(kit).not.toContain("collaborationCaret");
});

test("collaborationCaret only registers alongside a provider", () => {
  const provider = { awareness: {} } as never;
  const kit = names({ collaboration: { document: new YDoc(), provider } });
  expect(kit).toContain("collaborationCaret");
});

test("collaboration forces history off regardless of the history option", () => {
  const [starterKit] = createBlockKit({
    history: true,
    collaboration: { document: new YDoc() },
  });
  expect(starterKit.options.undoRedo).toBe(false);
});

test("history stays configurable when collaboration is not enabled", () => {
  const [starterKit] = createBlockKit({ history: false });
  expect(starterKit.options.undoRedo).toBe(false);
});

test('field defaults to "content" and can be overridden', () => {
  const document = new YDoc();
  const [collaboration] = createBlockKit({ collaboration: { document } }).filter(
    (extension) => extension.name === "collaboration",
  );
  expect(collaboration?.options.field).toBe("content");

  const [customField] = createBlockKit({
    collaboration: { document, field: "body" },
  }).filter((extension) => extension.name === "collaboration");
  expect(customField?.options.field).toBe("body");
});
