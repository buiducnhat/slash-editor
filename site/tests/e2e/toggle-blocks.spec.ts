import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

const toggle = (page: Parameters<typeof editor>[0], title: string) =>
  editor(page).locator(`[data-type="details"]`, {
    has: page.locator("summary", { hasText: title }),
  });

test.describe("toggle shorthands", () => {
  test('`>` makes a toggle and `"` makes a quote', async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    await page.keyboard.type("> Collapsible");

    const created = toggle(page, "Collapsible");
    await expect(created).toHaveCount(1);
    await expect(created).not.toHaveAttribute("data-level");

    await page.keyboard.press("Enter");
    await page.keyboard.type('" Quoted');

    await expect(editor(page).locator("blockquote").last()).toHaveText("Quoted");
  });

  test("`# ` then `> ` makes a toggle heading", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    await page.keyboard.type("# ");
    await page.keyboard.type("> Big section");

    await expect(toggle(page, "Big section")).toHaveAttribute("data-level", "1");
  });

  test("`##` typed in a toggle's title levels that toggle", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    // The caret lands in the (empty) title, where the heading rule declines
    // because `heading` cannot live inside `details`.
    await page.keyboard.type("> ");
    await page.keyboard.type("## Re-levelled");

    await expect(toggle(page, "Re-levelled")).toHaveAttribute("data-level", "2");
  });

  test("a toggle heading keeps its level and id across open/close", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    await page.keyboard.type("# ");
    await page.keyboard.type("> Keeps level");

    const created = toggle(page, "Keeps level");
    const id = await created.getAttribute("data-block-id");

    await created.locator("> button").click();

    await expect(created).toHaveClass(/is-open/);
    await expect(created).toHaveAttribute("data-level", "1");
    await expect(created).toHaveAttribute("data-block-id", id ?? "");
  });

  test("Advanced blocks inserts a toggle heading from the slash menu", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/th3");

    await expect(
      page.locator('[data-slot="command-item"][data-value="toggle-heading-3"]'),
    ).toBeVisible();
    await page.keyboard.press("Enter");
    await page.keyboard.type("Appendix");

    await expect(toggle(page, "Appendix")).toHaveAttribute("data-level", "3");
  });
});
