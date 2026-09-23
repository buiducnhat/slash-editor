import { getSchema, type JSONContent } from "@tiptap/core";
import { marked } from "marked";
import { expect, test } from "vite-plus/test";
import { createBlockKit, type StreamAdapter } from "../src/index.ts";
import { parseMarkdown, serializeMarkdown } from "../src/markdown.ts";

const adapter: StreamAdapter = {
  stream: async function* stream() {
    yield "mock";
  },
};
const kit = createBlockKit({ mention: { items: () => [] }, ai: { adapter } });
const schema = getSchema(kit);

const text = (value: string, marks?: JSONContent["marks"]): JSONContent => ({
  type: "text",
  text: value,
  ...(marks ? { marks } : {}),
});
const p = (value?: string): JSONContent => ({
  type: "paragraph",
  content: value ? [text(value)] : [],
});
const doc = (...content: JSONContent[]): JSONContent => ({ type: "doc", content });
const toggle = (
  attrs: { open: boolean; level: number },
  title: string,
  ...body: JSONContent[]
): JSONContent => ({
  type: "details",
  attrs,
  content: [
    { type: "detailsSummary", content: [text(title)] },
    { type: "detailsContent", content: body },
  ],
});

/** Parses back what `serializeMarkdown` wrote and compares as schema nodes, defaults included. */
function expectRoundTrip(input: JSONContent) {
  const markdown = serializeMarkdown(input, kit);
  const parsed = schema.nodeFromJSON(parseMarkdown(markdown, kit));

  parsed.check();
  expect(parsed.toJSON()).toEqual(schema.nodeFromJSON(input).toJSON());
  expect(serializeMarkdown(parsed.toJSON(), kit)).toBe(markdown);
}

test("every custom node survives a markdown round trip", () => {
  expectRoundTrip(
    doc(
      { type: "heading", attrs: { level: 2 }, content: [text("Title")] },
      {
        type: "paragraph",
        content: [
          text("Hi "),
          { type: "mention", attrs: { id: "u-1", label: "Ada Lovelace" } },
          text(" and "),
          text("bold", [{ type: "bold" }]),
        ],
      },
      { type: "callout", attrs: { icon: "💡" }, content: [p("tip"), p("second")] },
      { type: "callout", attrs: { icon: "🔥" }, content: [p("custom icon")] },
      toggle(
        { open: true, level: 2 },
        "Heading toggle",
        p("inside"),
        toggle({ open: false, level: 0 }, "nested", {
          type: "codeBlock",
          attrs: { language: "html" },
          content: [text("</details>")],
        }),
      ),
      {
        type: "columns",
        content: [
          {
            type: "column",
            content: [p("left"), { type: "callout", attrs: { icon: "⚠️" }, content: [p("warn")] }],
          },
          { type: "column", content: [p("right")] },
        ],
      },
      { type: "image", attrs: { src: "https://x.test/a b.png", alt: "An [image]", width: 320 } },
      { type: "image", attrs: { src: "https://x.test/b.png", alt: "plain" } },
      {
        type: "file",
        attrs: {
          src: "https://x.test/r.pdf",
          name: "report.pdf",
          size: 1234,
          mime: "application/pdf",
        },
      },
      { type: "video", attrs: { src: "https://x.test/v.mp4", poster: "https://x.test/p.jpg" } },
      {
        type: "embed",
        attrs: {
          url: "https://example.com",
          mode: "iframe",
          title: "Example",
          description: "x --> y",
        },
      },
      {
        type: "taskList",
        content: [{ type: "taskItem", attrs: { checked: true }, content: [p("done")] }],
      },
    ),
  );
});

test("empty paragraphs inside and after containers keep their count", () => {
  expectRoundTrip(
    doc(toggle({ open: false, level: 0 }, "t", p("a"), p(), p(), p("b"), p()), p("x"), p(), p("y")),
  );
});

test("custom blocks use syntax GitHub renders, with identity in hidden markers", () => {
  const markdown = serializeMarkdown(
    doc(
      { type: "callout", attrs: { icon: "⚠️" }, content: [p("careful")] },
      { type: "callout", attrs: { icon: "🔥" }, content: [p("hot")] },
      toggle({ open: true, level: 1 }, "More", p("body")),
      { type: "file", attrs: { src: "https://x.test/f", name: "f", mime: "a--b" } },
    ),
    kit,
  );

  expect(markdown).toBe(
    [
      "> [!WARNING]\n> careful",
      '<!-- slash:callout {"icon":"🔥"} -->\n> [!NOTE]\n> hot',
      "<details open>\n<summary><h1>More</h1></summary>\n\nbody\n\n</details>",
      '<!-- slash:file {"mime":"a\\u002d\\u002db"} -->\n[f](https://x.test/f)',
    ].join("\n\n"),
  );
});

test("AI drafts and uploads without a URL are left out without leaving a blank line behind", () => {
  const markdown = serializeMarkdown(
    doc(
      p("a"),
      { type: "aiBlock", attrs: { text: "draft" } },
      { type: "image", attrs: { src: null, status: "uploading" } },
      { type: "file", attrs: { src: "https://x.test/f", name: "f", status: "error" } },
      p("b"),
    ),
    kit,
  );

  expect(markdown).toBe("a\n\nb");
});

test("comment anchors are dropped, keeping their text", () => {
  const markdown = serializeMarkdown(
    doc({
      type: "paragraph",
      content: [text("anchored", [{ type: "comment", attrs: { threadId: "t1" } }]), text(" rest")],
    }),
    kit,
  );

  expect(markdown).toBe("anchored rest");
});

test("GitHub-authored alerts and toggles import as callouts and toggles", () => {
  const parsed = parseMarkdown(
    "> [!caution]\n> Hello\n\n<details><summary>Hi</summary>\nbody\n</details>",
    kit,
  );

  expect(schema.nodeFromJSON(parsed).toJSON()).toEqual(
    schema
      .nodeFromJSON(
        doc(
          { type: "callout", attrs: { icon: "⛔" }, content: [p("Hello")] },
          toggle({ open: false, level: 0 }, "Hi", p("body")),
        ),
      )
      .toJSON(),
  );
});

test("a marker that cannot be used disappears and leaves its block as plain markdown", () => {
  const cases = {
    malformed: '<!-- slash:file {"size":12 -->\n[r.pdf](https://x.test/r.pdf)',
    orphaned: "<!-- slash:column -->\n\n[r.pdf](https://x.test/r.pdf)",
    oneColumn: "<!-- slash:columns -->\n\n[r.pdf](https://x.test/r.pdf)\n\n<!-- /slash:columns -->",
  };
  const link = doc({
    type: "paragraph",
    content: [text("r.pdf", [{ type: "link", attrs: { href: "https://x.test/r.pdf" } }])],
  });

  for (const markdown of Object.values(cases)) {
    expect(schema.nodeFromJSON(parseMarkdown(markdown, kit)).toJSON()).toEqual(
      schema.nodeFromJSON(link).toJSON(),
    );
  }
});

test("an unclosed toggle stays literal text rather than swallowing the rest", () => {
  const parsed = parseMarkdown("<details>\n<summary>t</summary>\n\nbody", kit);

  expect(parsed.content?.map((node) => node.type)).toEqual(["paragraph", "paragraph"]);
  expect(parsed.content?.[1]).toEqual(p("body"));
});

test("an image inside running text or a badge link keeps a valid document", () => {
  const parsed = parseMarkdown(
    "[![build](https://x.test/b.svg)](https://ci.test) and ![i](https://x.test/i.png)",
    kit,
  );

  expect(() => schema.nodeFromJSON(parsed).check()).not.toThrow();
  expect(parsed.content?.map((node) => node.type)).toEqual(["paragraph"]);
});

test("parsing leaves the global marked instance alone", () => {
  parseMarkdown("> [!NOTE]\n> x", kit);

  expect(marked.parse("> [!NOTE]\n> x")).toContain("<blockquote>");
});
