import { expect, test } from "@playwright/test";
import type { ElementHandle, Locator, Page } from "@playwright/test";
import { dragBlock, editor, revealGrip } from "./support.ts";

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

test("drag preview displays during drag and cleans up after drop", async ({ page }) => {
  await page.goto("/playground");
  const root = editor(page);

  const paragraph = root.locator("p", { hasText: "Notion-style block editing" });
  const grip = await revealGrip(page, paragraph);
  const gripBox = (await grip.boundingBox())!;

  const gx = gripBox.x + gripBox.width / 2;
  const gy = gripBox.y + gripBox.height / 2;

  await page.mouse.move(gx, gy);
  await page.mouse.down();
  await page.mouse.move(gx, gy + 15, { steps: 5 });

  const preview = page.locator("[data-block-drag-preview]");
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("Notion-style block editing");

  await page.mouse.up();
  await expect(preview).toBeHidden();
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

test("each row in a todo list has its own control buttons", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/playground");

  const taskItems = editor(page).locator('li[data-block-type="taskItem"]');
  await expect(taskItems).toHaveCount(2);

  const grip = page.getByRole("button", { name: GRIP });
  const insertButton = page.getByRole("button", { name: "Insert block below" });

  // Hover first task item
  const box1 = (await taskItems.nth(0).boundingBox())!;
  await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
  await expect(grip).toBeVisible();
  await expect(insertButton).toBeVisible();

  const gripBox1 = (await grip.boundingBox())!;
  const line1 = await firstLineCentre((await taskItems.nth(0).elementHandle())!);
  expect(Math.abs(gripBox1.y + gripBox1.height / 2 - line1)).toBeLessThanOrEqual(2);

  // Verify that line1 matches the task paragraph, not an offset checkbox/hidden label
  const p1Line = await taskItems
    .nth(0)
    .locator("p")
    .evaluate((p) => {
      const text = p.firstChild!;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 1);
      const rect = range.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
  expect(Math.abs(line1 - p1Line)).toBeLessThanOrEqual(1);
  // Hover second task item
  const box2 = (await taskItems.nth(1).boundingBox())!;
  await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
  await expect(grip).toBeVisible();
  await expect(insertButton).toBeVisible();

  const gripBox2 = (await grip.boundingBox())!;
  const line2 = await firstLineCentre((await taskItems.nth(1).elementHandle())!);
  expect(Math.abs(gripBox2.y + gripBox2.height / 2 - line2)).toBeLessThanOrEqual(2);
  expect(gripBox2.y).toBeGreaterThan(gripBox1.y + 10);
});

test("dragging a todo item reorders it within the task list", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/playground");

  const taskItems = editor(page).locator('li[data-block-type="taskItem"]');
  const task1 = taskItems.nth(0);
  const task2 = taskItems.nth(1);

  await expect(task1).toContainText("Ship the slash menu");
  await expect(task2).toContainText("Ship callout, toggle, and task-list nodes");

  const box2 = (await task2.boundingBox())!;
  await dragBlock(page, task1, { x: box2.x + 10, y: box2.y + box2.height - 2 });

  await expect(taskItems.nth(0)).toContainText("Ship callout, toggle, and task-list nodes");
  await expect(taskItems.nth(1)).toContainText("Ship the slash menu");
});

const GRIP = "Drag to reorder, click to open the block menu";

/** Vertical centre of a block's first line of text — the row its gutter handle rides. */
function firstLineCentre(block: ElementHandle<Element>): Promise<number> {
  return block.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const nonEditable = node.parentElement?.closest('[contenteditable="false"]');
        if (nonEditable && element.contains(nonEditable)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const text = walker.nextNode();
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
