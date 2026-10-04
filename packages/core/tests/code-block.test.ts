import { getSchema } from "@tiptap/core";
import { common, createLowlight } from "lowlight";
import { expect, test } from "vite-plus/test";
import { CodeBlock, createBlockKit } from "../src/index.ts";
import { parseMarkdown, serializeMarkdown } from "../src/markdown.ts";

const codeBlocks = (options?: Parameters<typeof createBlockKit>[0]) =>
  createBlockKit(options).filter((extension) => extension.name === "codeBlock");

test("an option swaps StarterKit's codeBlock for the lowlight one; false leaves none", () => {
  const schemaOf = (options?: Parameters<typeof createBlockKit>[0]) =>
    getSchema(createBlockKit(options)).nodes;

  // Same node either way: slash items, block types and markdown address `codeBlock`.
  expect(schemaOf().codeBlock).toBeDefined();
  expect(schemaOf({ codeBlock: {} }).codeBlock?.spec.attrs).toHaveProperty("language");
  expect(schemaOf({ codeBlock: false }).codeBlock).toBeUndefined();

  // Exactly one top-level extension registers it (StarterKit's is disabled, not duplicated).
  expect(codeBlocks({ codeBlock: {} })).toHaveLength(1);
  expect(codeBlocks({ codeBlock: {} })[0]?.options).toHaveProperty("lowlight");
  expect(codeBlocks()).toHaveLength(0);
  expect(codeBlocks({ codeBlock: false })).toHaveLength(0);
});

test("a host lowlight instance replaces the default grammar set", () => {
  const lowlight = createLowlight(common);
  lowlight.register({ tiny: () => ({ name: "tiny", contains: [] }) });

  const [extension] = codeBlocks({ codeBlock: { lowlight } });
  expect(extension?.options.lowlight.listLanguages()).toContain("tiny");
  const defaults = codeBlocks({ codeBlock: {} })[0]?.options.lowlight.listLanguages();
  expect(defaults).toContain("typescript");
  expect(defaults).not.toContain("tiny");
});

test("fences keep their language through markdown with highlighting on", () => {
  const kit = createBlockKit({ codeBlock: {} });
  const source = "```mermaid\ngraph TD\n```\n\n```ts\nconst a = 1;\n```";

  const parsed = parseMarkdown(source, kit);
  expect(parsed.content?.map((node) => node.type)).toEqual(["mermaid", "codeBlock"]);
  expect(parsed.content?.[1]?.attrs?.language).toBe("ts");
  expect(serializeMarkdown(parsed, kit)).toBe(source);
});

test("extending the exported node keeps the default grammars", () => {
  const extended = CodeBlock.extend({ addNodeView: () => () => ({ dom: {} as HTMLElement }) });
  expect(
    getSchema([...createBlockKit({ codeBlock: false }), extended]).nodes.codeBlock,
  ).toBeDefined();
  expect(extended.options.lowlight.listLanguages()).toContain("typescript");
});
