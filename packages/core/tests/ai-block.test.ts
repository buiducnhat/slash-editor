import { getSchema } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import {
  createAiSlashItems,
  createBlockKit,
  defaultAiActions,
  type AiAction,
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

  expect(names()).not.toContain("ai");
  expect(names()).not.toContain("aiBlock");
  expect(names({ ai: { adapter } })).toContain("ai");
  expect(names({ ai: { adapter } })).toContain("aiBlock");
});

test("ai: { node: false } keeps slash actions but skips the built-in node", () => {
  const kit = createBlockKit({ ai: { adapter, node: false } });
  const names = kit.map((extension) => extension.name);
  const slash = kit.find((extension) => extension.name === "slashCommand");
  const aiItems = (slash!.options.items as SlashItem[]).filter((item) => item.group === "AI");
  const slashActions = defaultAiActions.filter((action) => action.contexts.includes("slash"));

  expect(names).toContain("ai");
  expect(names).not.toContain("aiBlock");
  expect(aiItems.map((item) => item.id)).toEqual(slashActions.map((action) => action.id));
});

test("a custom action list controls generated slash items", () => {
  const actions: AiAction[] = [
    {
      id: "translate",
      title: "Translate",
      prompt: "Translate the text.",
      contexts: ["slash"],
    },
  ];
  expect(createAiSlashItems(actions).map((item) => item.id)).toEqual(["translate"]);
});

test("actions without slash context are not generated as slash items", () => {
  const actions: AiAction[] = [
    {
      id: "selection-only",
      title: "Selection only",
      prompt: "Rewrite.",
      contexts: ["selection"],
    },
  ];
  expect(createAiSlashItems(actions)).toEqual([]);
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
  const editor = { schema: { nodes: {} }, storage: { ai: { adapter } } } as unknown as Parameters<
    NonNullable<SlashItem["when"]>
  >[0];

  const items = createAiSlashItems(defaultAiActions);
  expect(items.every((item) => item.when?.(editor) === false)).toBe(true);
});
