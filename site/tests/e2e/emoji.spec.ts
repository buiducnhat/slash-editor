import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

test.describe("emoji menu", () => {
  test("filters by shortcode query and inserts an emoji node", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type(":rocket");

    await expect(page.locator('[data-slot="command-item"][data-value="rocket"]')).toBeVisible();
    await page.keyboard.press("Enter");

    const node = editor(page).locator('[data-type="emoji"]').last();
    await expect(node).toHaveAttribute("data-name", "rocket");
    await expect(node).toHaveText("🚀");
  });

  test("arrow keys move the highlight before Enter inserts", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type(":smile");
    await expect(page.locator('[data-slot="command-item"]').first()).toBeVisible();

    await page.keyboard.press("ArrowDown");
    const second = await page
      .locator('[data-slot="command-item"]')
      .nth(1)
      .getAttribute("data-value");
    await page.keyboard.press("Enter");

    await expect(editor(page).locator('[data-type="emoji"]').last()).toHaveAttribute(
      "data-name",
      second!,
    );
  });

  test("typing a complete :shortcode: inserts the emoji", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type(":tada:");

    await expect(editor(page).locator('[data-type="emoji"]').last()).toHaveAttribute(
      "data-name",
      "tada",
    );
  });

  test("/emoji opens the picker", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/emoji");
    await page.keyboard.press("Enter");

    await expect(page.locator('[data-slot="command-item"]').first()).toBeVisible();
    await page.keyboard.type("heart");
    await page.keyboard.press("Enter");

    await expect(editor(page).locator('[data-type="emoji"]').last()).toBeVisible();
    await expect(editor(page).locator("p").last()).not.toContainText("/emoji");
  });

  test("shows an empty state and keeps typed text on Escape", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type(":zzzqqq");

    await expect(page.getByText("No emoji for \u201Czzzqqq\u201D.")).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(page.locator('[data-slot="popover-content"]')).toBeHidden();
    await expect(editor(page).locator("p").last()).toHaveText(":zzzqqq");
  });
});
