import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

test.describe("AI slash actions", () => {
  test("streams a continue-writing action and keeps it as a paragraph", async ({ page }) => {
    await page.goto("/");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/continue");
    await expect(
      page.locator('[data-slot="command-item"][data-value="continue-writing"]'),
    ).toBeVisible();
    await page.keyboard.press("Enter");

    const block = editor(page).locator("[data-status]").last();
    await expect(block).toBeVisible();
    await expect(block).toHaveAttribute("data-status", "done", { timeout: 5000 });

    await block.getByRole("button", { name: "Keep" }).click();

    await expect(editor(page).locator("[data-status]")).toHaveCount(0);
    // Not `.last()`: accepting replaces the aiBlock in place, and the doc's
    // actual trailing node is the empty paragraph Tiptap always keeps at
    // the end for a caret to land in.
    await expect(editor(page).locator("p", { hasText: "container nodes" })).toBeVisible();
  });

  test("discards a streamed response without touching the document", async ({ page }) => {
    await page.goto("/");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/summarize");
    await expect(page.locator('[data-slot="command-item"][data-value="summarize"]')).toBeVisible();
    await page.keyboard.press("Enter");

    const block = editor(page).locator("[data-status]").last();
    await expect(block).toHaveAttribute("data-status", "done", { timeout: 5000 });

    await block.getByRole("button", { name: "Discard" }).click();

    await expect(editor(page).locator("[data-status]")).toHaveCount(0);
  });

  test("a failed stream surfaces an error, and retry recovers it", async ({ page }) => {
    await page.goto("/");
    await focusTrailingParagraph(page);
    // The mock adapter (demo-react/src/lib/stream-adapter.ts) fails once
    // when the context contains this marker, exercising the real
    // error -> retry -> done transition, not a stub that always succeeds.
    await page.keyboard.type("trigger-ai-error ");
    await page.keyboard.type("/fix");
    await expect(
      page.locator('[data-slot="command-item"][data-value="fix-spelling-grammar"]'),
    ).toBeVisible();
    await page.keyboard.press("Enter");

    const block = editor(page).locator("[data-status]").last();
    await expect(block).toHaveAttribute("data-status", "error", { timeout: 5000 });
    await expect(block).toContainText("Mock AI stream failed");

    await block.getByRole("button", { name: "Try again" }).click();

    await expect(block).toHaveAttribute("data-status", "done", { timeout: 5000 });
  });
});
