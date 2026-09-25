import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

test.describe("bubble toolbar dropdowns", () => {
  test("clicking turn into dropdown does not flicker/close and allows converting block", async ({
    page,
  }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("heading test");
    for (let i = 0; i < "test".length; i += 1) {
      await page.keyboard.press("Shift+ArrowLeft");
    }

    const turnIntoButton = page.getByRole("button", { name: "Text" });
    await expect(turnIntoButton).toBeVisible();

    await turnIntoButton.click();

    const dropdownMenu = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(dropdownMenu).toBeVisible();

    const heading1Item = dropdownMenu.getByRole("menuitem", { name: "Heading 1", exact: true });
    await expect(heading1Item).toBeVisible();
    await heading1Item.click();

    await expect(editor(page).locator("h1", { hasText: "heading test" })).toBeVisible();
  });

  test("clicking ask ai dropdown does not flicker/close and allows selecting action", async ({
    page,
  }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("summarize this text");
    for (let i = 0; i < "this text".length; i += 1) {
      await page.keyboard.press("Shift+ArrowLeft");
    }

    const askAiButton = page.getByRole("button", { name: "Ask AI" });
    await expect(askAiButton).toBeVisible();

    await askAiButton.click();

    const dropdownMenu = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(dropdownMenu).toBeVisible();

    const summarizeItem = dropdownMenu.getByRole("menuitem", { name: "Summarize" });
    await expect(summarizeItem).toBeVisible();
    await summarizeItem.click();

    const block = editor(page).locator("[data-status]").last();
    await expect(block).toBeVisible();
    await expect(block).toHaveAttribute("data-status", "done", { timeout: 5000 });
  });

  test("clicking outside closes the bubble toolbar", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("dismiss test");
    for (let i = 0; i < "test".length; i += 1) {
      await page.keyboard.press("Shift+ArrowLeft");
    }

    const turnIntoButton = page.getByRole("button", { name: "Text" });
    await expect(turnIntoButton).toBeVisible();

    // Click on playground title outside the editor
    await page.getByRole("heading", { name: "Playground", level: 1 }).click();

    await expect(turnIntoButton).toBeHidden();
  });

  test("clicking outside while dropdown is open closes dropdown and toolbar", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("dropdown dismiss test");
    for (let i = 0; i < "dismiss test".length; i += 1) {
      await page.keyboard.press("Shift+ArrowLeft");
    }

    const turnIntoButton = page.getByRole("button", { name: "Text" });
    await expect(turnIntoButton).toBeVisible();
    await turnIntoButton.click();

    const dropdownMenu = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(dropdownMenu).toBeVisible();
    // Click on playground title outside closes the dropdown
    await page.getByRole("heading", { name: "Playground", level: 1 }).click();
    await expect(dropdownMenu).toBeHidden();

    // Clicking into the editor collapses the selection and hides the bubble toolbar
    await editor(page).locator("p").first().click();
    await expect(turnIntoButton).toBeHidden();
  });
});
