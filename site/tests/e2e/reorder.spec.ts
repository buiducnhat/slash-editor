import { expect, test } from "@playwright/test";
import { dragBlock, editor } from "./support.ts";

test("dragging a block's gutter handle reorders it relative to a sibling", async ({ page }) => {
  await page.goto("/playground");
  const root = editor(page);

  const heading = root.locator("h1").first();
  const paragraph = root.locator("p", { hasText: "Notion-style block editing" });

  await expect(heading).toHaveText("slash-editor");
  const headingBox = (await heading.boundingBox())!;

  // Drop just above the heading's top edge, well left of the indent threshold.
  await dragBlock(page, paragraph, { x: headingBox.x + 10, y: headingBox.y + 2 });

  const topLevelBlocks = root.locator("> *");
  await expect(topLevelBlocks.first()).toContainText("Notion-style block editing");
  await expect(topLevelBlocks.nth(1)).toHaveText("slash-editor");
});

test("a tall block's gutter handle rides its first line", async ({ page }) => {
  // The columns demo sits below the default viewport: grow the window rather
  // than scroll, so the handle is measured without a scroll moving the block
  // between the hover and the read.
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto("/playground");

  const columns = editor(page).locator('[data-type="columns"]').first();
  await expect(columns).toBeVisible();

  const box = (await columns.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  const handle = await page
    .getByRole("button", { name: "Drag to reorder, click to open the block menu" })
    .boundingBox();
  const centre = (handle?.y ?? 0) + (handle?.height ?? 0) / 2;

  // Where the block's own first line of text sits, measured through the
  // browser's text layout.
  const line = await columns.evaluate((element) => {
    const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT).nextNode();
    const range = document.createRange();
    range.setStart(text!, 0);
    range.setEnd(text!, 1);
    const { top, height } = range.getBoundingClientRect();
    return top + height / 2;
  });

  expect(Math.abs(centre - line)).toBeLessThanOrEqual(2);
});
