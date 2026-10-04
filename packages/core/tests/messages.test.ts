import { expect, test } from "vite-plus/test";
import {
  createBlockKit,
  defaultBlockMenuItems,
  defaultBubbleToolbarItems,
  filterSlashItems,
  localizeBlockMenuItems,
  localizeItems,
  type BlockType,
  type BubbleToolbarItem,
  type SlashEditorMessages,
  type SlashItem,
  type StreamAdapter,
} from "../src/index.ts";

const adapter: StreamAdapter = {
  stream: async function* stream() {
    yield "mock";
  },
};

const vi: SlashEditorMessages = {
  hint: "Gõ để tìm kiếm",
  groups: { "Basic blocks": "Khối cơ bản", Media: "Phương tiện", AI: "Trợ lý AI" },
  items: {
    "heading-1": { title: "Tiêu đề 1", description: "Tiêu đề lớn", aliases: ["h1", "tieu de"] },
    image: { title: "Hình ảnh" },
    summarize: { title: "Tóm tắt" },
  },
  placeholder: { paragraph: "Nhấn '/' để chọn lệnh…", heading1: "Tiêu đề 1" },
  blockMenu: { delete: "Xóa" },
  bubbleToolbar: { bold: "In đậm" },
};

function extension<T = Record<string, unknown>>(
  options: Parameters<typeof createBlockKit>[0],
  name: string,
) {
  const found = createBlockKit(options).find((candidate) => candidate.name === name);
  expect(found, `${name} extension`).toBeDefined();
  return found!.options as T;
}

test("slash items are translated by id, and untouched ones keep their English text", () => {
  const { items } = extension<{ items: SlashItem[] }>({ messages: vi }, "slashCommand");
  const byId = (id: string) => items.find((item) => item.id === id)!;

  expect(byId("heading-1")).toMatchObject({
    title: "Tiêu đề 1",
    description: "Tiêu đề lớn",
    aliases: ["h1", "tieu de"],
    group: "Khối cơ bản",
  });
  expect(byId("image")).toMatchObject({ title: "Hình ảnh", group: "Phương tiện" });
  // Partial translation: only the fields given are replaced.
  expect(byId("image").description).toBe("Upload or embed an image");
  expect(byId("heading-2").title).toBe("Heading 2");
  expect(byId("heading-2").group).toBe("Khối cơ bản");
});

test("translated aliases are what the query matches", () => {
  const { items } = extension<{ items: SlashItem[] }>({ messages: vi }, "slashCommand");

  expect(filterSlashItems(items, "tieu de").map((item) => item.id)).toEqual(["heading-1"]);
  expect(filterSlashItems(items, "Tiêu đề 1").map((item) => item.id)).toContain("heading-1");
});

test("AI actions and their slash items are translated", () => {
  const kit = { messages: vi, ai: { adapter } };
  const { items } = extension<{ items: SlashItem[] }>(kit, "slashCommand");
  const { actions } = extension<{ actions: { id: string; title: string }[] }>(kit, "ai");
  const slashItem = items.find((item) => item.id === "summarize")!;

  expect(slashItem).toMatchObject({ title: "Tóm tắt", group: "Trợ lý AI" });
  expect(actions.find((action) => action.id === "summarize")!.title).toBe("Tóm tắt");
});

test("block types are translated for every surface that reads them", () => {
  const { types } = extension<{ types: BlockType[] }>({ messages: vi }, "blockTypes");

  expect(types.find((type) => type.id === "heading-1")!.title).toBe("Tiêu đề 1");
  expect(types.find((type) => type.id === "paragraph")!.title).toBe("Text");
});

test("the slash hint falls back to messages but an explicit option wins", () => {
  expect(extension<{ hint: string }>({ messages: vi }, "slashCommand").hint).toBe("Gõ để tìm kiếm");
  expect(
    extension<{ hint: string }>({ messages: vi, slash: { hint: "Search" } }, "slashCommand").hint,
  ).toBe("Search");
  expect(extension<{ hint: string }>({}, "slashCommand").hint).toBe("Type to search");
});

test("placeholder text merges messages under the explicit option", () => {
  const { text } = extension<{ text: Record<string, string> }>(
    { messages: vi, placeholder: { text: { heading1: "Tiêu đề lớn" } } },
    "placeholder",
  );

  expect(text).toEqual({ paragraph: "Nhấn '/' để chọn lệnh…", heading1: "Tiêu đề lớn" });
});

test("bubble toolbar labels are translated for defaults, arrays, and resolvers", () => {
  const labels = (items: BubbleToolbarItem[]) => items.map((item) => item.label);
  const fromDefaults = extension<{ items: BubbleToolbarItem[] }>({ messages: vi }, "bubbleToolbar");
  const fromResolver = extension<{ items: (editor: never) => BubbleToolbarItem[] }>(
    { messages: vi, bubbleToolbar: { items: () => defaultBubbleToolbarItems } },
    "bubbleToolbar",
  );

  expect(labels(fromDefaults.items)[0]).toBe("In đậm");
  expect(labels(fromDefaults.items)[1]).toBe("Italic");
  expect(labels(fromResolver.items(undefined as never))[0]).toBe("In đậm");
});

test("block menu titles are translated and the editor exposes the messages", () => {
  const titles = localizeBlockMenuItems(defaultBlockMenuItems, vi).map((item) => item.title);

  expect(titles).toEqual(["Duplicate", "Xóa"]);
  expect(
    extension<{ messages: SlashEditorMessages }>({ messages: vi }, "messages").messages,
  ).toEqual(vi);
});

test("without messages nothing is copied or changed", () => {
  const items = [{ id: "x", title: "X", group: "G" }];

  expect(localizeItems(items, undefined)).toBe(items);
  expect(localizeItems(items, {})).toBe(items);
  expect(localizeBlockMenuItems(defaultBlockMenuItems, {})).toBe(defaultBlockMenuItems);
});
