import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

test.describe("media & structure slash items", () => {
  test("inserts a table via the slash menu", async ({ page }) => {
    await page.goto("/");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/table");
    await expect(page.locator('[data-slot="command-item"][data-value="table"]')).toBeVisible();
    await page.keyboard.press("Enter");

    await expect(editor(page).locator("table").last()).toBeVisible();
    await expect(editor(page).locator("table").last().locator("tr")).toHaveCount(3);
  });

  test("inserts a two-column layout via the slash menu", async ({ page }) => {
    await page.goto("/");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/columns");
    await expect(page.locator('[data-slot="command-item"][data-value="columns"]')).toBeVisible();
    await page.keyboard.press("Enter");

    const columns = editor(page).locator('[data-type="columns"]').last();
    await expect(columns).toBeVisible();
    await expect(columns.locator('[data-type="column"]')).toHaveCount(2);
  });

  test("inserts an embed placeholder and turns a pasted URL into a bookmark card", async ({
    page,
  }) => {
    await page.goto("/");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/embed");
    await expect(page.locator('[data-slot="command-item"][data-value="embed"]')).toBeVisible();
    await page.keyboard.press("Enter");

    const node = editor(page).locator('[data-status="empty"]').last();
    await expect(node).toBeVisible();

    await node.getByPlaceholder("Paste a link…").fill("https://example.com");
    await node.getByRole("button", { name: "Embed" }).click();

    await expect(editor(page).locator('a[href="https://example.com"]').last()).toBeVisible();
  });
});
