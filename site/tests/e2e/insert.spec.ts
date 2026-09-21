import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

test.describe("slash menu insert", () => {
  test("inserts a heading via alias", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    // No spaces in the query: `allowSpaces: false` on the suggestion plugin
    // exits the menu on the first space.
    await page.keyboard.type("/h1");

    await expect(page.locator('[data-slot="command-item"][data-value="heading-1"]')).toBeVisible();
    await page.keyboard.press("Enter");
    await page.keyboard.type("Roadmap");

    await expect(editor(page).locator("h1").last()).toHaveText("Roadmap");
    await expect(page.locator('[data-slot="popover-content"]')).toBeHidden();
  });

  test("inserts a to-do list via alias", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/todo");

    await expect(page.locator('[data-slot="command-item"][data-value="task-list"]')).toBeVisible();
    await page.keyboard.press("Enter");
    await page.keyboard.type("Ship it");

    await expect(editor(page).locator('li[data-block-type="taskItem"]').last()).toContainText(
      "Ship it",
    );
  });

  test("closes on Escape without losing the typed text", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/xyz");
    await expect(page.locator('[data-slot="popover-content"]')).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.locator('[data-slot="popover-content"]')).toBeHidden();
    await expect(editor(page).locator("p").last()).toHaveText("/xyz");
  });
});
