import { expect, test } from "@playwright/test";
import { dragBlock, editor } from "./support.ts";

test("dragging a block's gutter handle reorders it relative to a sibling", async ({ page }) => {
  await page.goto("/");
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
