import { expect, test } from "@playwright/test";
import { dragBlock, editor } from "./support.ts";

test("dragging a block rightward onto a list item nests it as an additional child", async ({
  page,
}) => {
  await page.goto("/playground");
  const root = editor(page);

  const paragraph = root.locator("p", { hasText: "Notion-style block editing" });
  const listItem = root.locator("li", { hasText: "Headings, lists, quotes" });

  const paragraphBox = (await paragraph.boundingBox())!;
  const listItemBox = (await listItem.boundingBox())!;

  // Travel past the 32px indent threshold (measured from the dragged
  // block's own left edge) while hovering the target list item's row.
  await dragBlock(page, paragraph, {
    x: paragraphBox.x + 45,
    y: listItemBox.y + listItemBox.height / 2,
  });

  const nestedParagraphs = listItem.locator("> p");
  await expect(nestedParagraphs).toHaveCount(2);
  await expect(nestedParagraphs.nth(1)).toContainText("Notion-style block editing");
});
