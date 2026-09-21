import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

test.describe("mention menu", () => {
  test("filters the mock directory and inserts a mention chip", async ({ page }) => {
    await page.goto("/");
    await focusTrailingParagraph(page);
    await page.keyboard.type("@turing");

    await expect(page.locator('[data-slot="command-item"][data-value="2"]')).toBeVisible({
      timeout: 3000,
    });
    await page.keyboard.press("Enter");

    const chip = editor(page).locator('[data-type="mention"]').last();
    await expect(chip).toBeVisible();
    await expect(chip).toHaveText("@Alan Turing");
    await expect(chip).toHaveAttribute("data-id", "2");
  });

  test("shows an empty state for a query matching nobody", async ({ page }) => {
    await page.goto("/");
    await focusTrailingParagraph(page);
    await page.keyboard.type("@zzz");

    await expect(page.getByText("No matches for \u201Czzz\u201D.")).toBeVisible({ timeout: 3000 });
  });

  test("closes on Escape without losing the typed text", async ({ page }) => {
    await page.goto("/");
    await focusTrailingParagraph(page);
    await page.keyboard.type("@turing");
    await expect(page.locator('[data-slot="popover-content"]')).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Escape");

    await expect(page.locator('[data-slot="popover-content"]')).toBeHidden();
    await expect(editor(page).locator("p").last()).toHaveText("@turing");
  });
});
