import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

test.describe("code block highlighting", () => {
  test("highlights tokens and the selector changes the language", async ({ page }) => {
    await page.goto("/playground");
    const block = editor(page).locator('[data-type="code-block"]').first();

    // The seeded block is `language-ts` (an alias, kept as-is): a keyword is wrapped in an `hljs-*` token.
    await expect(block.locator(".hljs-keyword").first()).toBeVisible();
    const select = block.getByLabel("Code language");
    await expect(select).toHaveValue("ts");

    await select.selectOption("python");
    await expect(select).toHaveValue("python");
    await expect(block.locator("code")).toHaveClass(/language-python/);
  });

  test("a new block typed with ``` keeps the typed text", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    await page.keyboard.type("```js ");
    await page.keyboard.type("const answer = 42;");

    const block = editor(page).locator('[data-type="code-block"]').last();
    await expect(block.locator("code")).toHaveText("const answer = 42;");
    await expect(block.locator(".hljs-keyword")).toHaveText("const");
    await expect(block.locator(".hljs-number")).toHaveText("42");
    // `js` is an alias lowlight does not list by name; the selector keeps it.
    await expect(block.getByLabel("Code language")).toHaveValue("js");
  });
});
