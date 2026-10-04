import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

test.describe("link editor popover", () => {
  test("creates a link over a text selection via the bubble toolbar", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("visit example");
    for (let i = 0; i < "example".length; i += 1) {
      await page.keyboard.press("Shift+ArrowLeft");
    }

    await page.getByRole("button", { name: "Link", exact: true }).click();
    const input = page.getByPlaceholder("Paste a link\u2026");
    await expect(input).toBeVisible();
    await input.fill("https://example.com");
    await input.press("Enter");

    await expect(editor(page).locator('a[href="https://example.com"]').last()).toHaveText(
      "example",
    );
    // Setting the link keeps the popover open in editing mode: the
    // selection still rests on the freshly created link, and LinkEditor
    // auto-opens for any selection inside one (see the next test).
    await expect(page.getByRole("button", { name: "Remove link" })).toBeVisible();
  });

  test("Mod+k opens the popover over a text selection, not the docs search", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("visit example");
    for (let i = 0; i < "example".length; i += 1) {
      await page.keyboard.press("Shift+ArrowLeft");
    }

    await page.keyboard.press("ControlOrMeta+k");
    const input = page.getByPlaceholder("Paste a link\u2026");
    await expect(input).toBeFocused();
    // The site-wide search hotkey shares the chord; it must yield once the editor handled it.
    await expect(page.getByPlaceholder("Search", { exact: true })).toHaveCount(0);
    await input.fill("https://example.com");
    await input.press("Enter");

    await expect(editor(page).locator('a[href="https://example.com"]').last()).toHaveText(
      "example",
    );
  });

  test("clicking an existing link auto-opens the popover with edit controls", async ({ page }) => {
    await page.goto("/playground");
    // The seeded document already links "link" text to prosemirror.net.
    await editor(page).locator('a[href="https://prosemirror.net"]').click();

    const input = page.getByPlaceholder("Paste a link\u2026");
    await expect(input).toHaveValue("https://prosemirror.net");
    await expect(page.getByRole("button", { name: "Remove link" })).toBeVisible();

    await page.getByRole("button", { name: "Remove link" }).click();

    await expect(editor(page).locator('a[href="https://prosemirror.net"]')).toHaveCount(0);
  });
});
