import { expect, test } from "@playwright/test";
import type { ElementHandle, Locator, Page } from "@playwright/test";
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

const GRIP = "Drag to reorder, click to open the block menu";

/** Vertical centre of a block's first line of text — the row its gutter handle rides. */
function firstLineCentre(block: ElementHandle<Element>): Promise<number> {
  return block.evaluate((element) => {
    const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT).nextNode();
    const range = document.createRange();
    range.setStart(text!, 0);
    range.setEnd(text!, 1);
    const { top, height } = range.getBoundingClientRect();
    return top + height / 2;
  });
}

async function centreY(locator: Locator): Promise<number> {
  const box = (await locator.boundingBox())!;
  return box.y + box.height / 2;
}

/** Rests the pointer on the playground's intro paragraph; returns the paragraph and pointer. */
async function hoverIntro(page: Page, height: number) {
  await page.setViewportSize({ width: 1280, height });
  await page.goto("/playground");

  const paragraph = editor(page).locator("p", { hasText: "Notion-style block editing" });
  await expect(paragraph).toBeVisible();
  const box = (await paragraph.boundingBox())!;
  const pointer = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(pointer.x, pointer.y);
  return { paragraph, pointer };
}

test("the gutter handle follows the block under a still pointer as the page scrolls", async ({
  page,
}) => {
  const { pointer } = await hoverIntro(page, 600);

  const grip = page.getByRole("button", { name: GRIP });
  await grip.waitFor({ state: "visible" });

  await page.evaluate(() => window.scrollBy(0, 150));

  // The block now under the (unmoved) pointer: the innermost hover target.
  const hovered = await page.evaluateHandle(
    ({ x, y }) => document.elementFromPoint(x, y)!.closest("li, .slash-content > *")!,
    pointer,
  );
  const line = await firstLineCentre(hovered);

  await expect.poll(async () => Math.abs((await centreY(grip)) - line)).toBeLessThanOrEqual(2);
});

test("an open block menu stays anchored to its block as the page scrolls", async ({ page }) => {
  const { paragraph } = await hoverIntro(page, 900);

  const grip = page.getByRole("button", { name: GRIP });
  await grip.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const menuOffset = (await menu.boundingBox())!.y - (await grip.boundingBox())!.y;

  await page.evaluate(() => window.scrollBy(0, 100));
  const line = await firstLineCentre((await paragraph.elementHandle())!);

  await expect.poll(async () => Math.abs((await centreY(grip)) - line)).toBeLessThanOrEqual(2);
  await expect
    .poll(async () => (await menu.boundingBox())!.y - (await grip.boundingBox())!.y)
    .toBeCloseTo(menuOffset, 0);
});
