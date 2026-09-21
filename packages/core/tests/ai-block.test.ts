import { getSchema } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import {
  createAiSlashItems,
  createBlockKit,
  defaultAiSlashActions,
  type SlashItem,
  type StreamAdapter,
} from "../src/index.ts";

const adapter: StreamAdapter = {
  stream: async function* stream() {
    yield "mock";
  },
};

test("ai is left out of the baseline kit until a StreamAdapter is configured", () => {
  const names = (options?: Parameters<typeof createBlockKit>[0]) =>
    createBlockKit(options).map((extension) => extension.name);

  expect(names()).not.toContain("aiBlock");
  expect(names({ ai: { adapter } })).toContain("aiBlock");
});

test("ai: { node: false } keeps the slash actions but skips registering the built-in node", () => {
  const kit = createBlockKit({ ai: { adapter, node: false } });
  const names = kit.map((extension) => extension.name);
  const slash = kit.find((extension) => extension.name === "slashCommand");
  const aiItems = (slash!.options.items as SlashItem[]).filter((item) => item.group === "AI");

  expect(names).not.toContain("aiBlock");
  expect(aiItems.map((item) => item.id)).toEqual(defaultAiSlashActions.map((action) => action.id));
});

test("a custom actions list overrides the defaults in the generated slash items", () => {
  const items = createAiSlashItems({
    adapter,
    actions: [{ id: "translate", title: "Translate", prompt: "Translate the text." }],
  });

  expect(items.map((item) => item.id)).toEqual(["translate"]);
});

test("aiBlock defaults to an empty streaming state and persists a JSON round trip", () => {
  const schema = getSchema(createBlockKit({ ai: { adapter } }));

  const empty = schema.nodes.aiBlock!.create();
  expect(empty.attrs).toMatchObject({
    action: "",
    prompt: "",
    text: "",
    status: "streaming",
    error: null,
  });

  const doc = {
    type: "doc",
    content: [
      {
        type: "aiBlock",
        attrs: {
          id: null,
          action: "continue-writing",
          prompt: "Continue writing.",
          text: "Hello",
          status: "done",
          error: null,
        },
      },
    ],
  };
  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});

test("AI slash items are hidden when the aiBlock node is not in the schema", () => {
  const editor = { schema: { nodes: {} } } as unknown as Parameters<
    NonNullable<SlashItem["when"]>
  >[0];

  const items = createAiSlashItems({ adapter, actions: defaultAiSlashActions });
  expect(items.every((item) => item.when?.(editor) === false)).toBe(true);
});
