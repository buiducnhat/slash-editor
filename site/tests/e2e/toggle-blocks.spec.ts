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
    const body = created.locator('[data-type="detailsContent"]');

    // Starts collapsed; expand then collapse again, and the level and id
    // ride through both.
    await expect(body).toBeHidden();
    await created.locator("> button").click();
    await expect(body).toBeVisible();

    await created.locator("> button").click();
    await expect(body).toBeHidden();
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

test.describe("toggle navigation", () => {
  test("Enter on a title fills the body, and an empty last line exits the toggle", async ({
    page,
  }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    await page.keyboard.type("> Title", { delay: 15 });
    const created = toggle(page, "Title");
    await expect(created).toHaveCount(1);
    // Let the title settle before Enter: ProseMirror reads contenteditable
    // mutations asynchronously, and an unsettled title splits the keystrokes.
    await expect(created.locator("summary")).toHaveText("Title");

    // Enter on the title lands in the body, not after the toggle.
    await page.keyboard.press("Enter");
    await page.keyboard.type("body line", { delay: 15 });
    await expect(created.locator('[data-type="detailsContent"]')).toContainText("body line");

    // A second Enter opens an empty line inside the body; Enter on it leaves
    // the toggle, so the following text is no longer part of the toggle.
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("outside", { delay: 15 });

    await expect(created.locator('[data-type="detailsContent"]')).not.toContainText("outside");
    // Exiting drops the empty line it left from, never the content above it.
    await expect(created.locator('[data-type="detailsContent"]')).toContainText("body line");

    const outside = editor(page).locator("> p", { hasText: "outside" });
    await expect(outside).toHaveCount(1);
    await expect(outside).toHaveText("outside");
  });

  test("Entering a closed toggle reopens it", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    await page.keyboard.type("> Reopened", { delay: 15 });
    const created = toggle(page, "Reopened");
    const body = created.locator('[data-type="detailsContent"]');

    // A picked toggle starts collapsed; Enter on its title opens it and puts
    // the caret inside, so the next block is a body block.
    await expect(body).toBeHidden();

    await created.locator("summary").click();
    await page.keyboard.press("Enter");

    await expect(body).toBeVisible();
  });

  test("ArrowDown leaves the body and ArrowUp returns to the title", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    await page.keyboard.type("> Arrows", { delay: 15 });
    const created = toggle(page, "Arrows");
    await expect(created).toHaveCount(1);
    // Let the title settle before Enter: ProseMirror reads contenteditable
    // mutations asynchronously, and an unsettled title splits the keystrokes.
    await expect(created.locator("summary")).toHaveText("Arrows");

    await page.keyboard.press("Enter");
    await page.keyboard.type("body line", { delay: 15 });
    await expect(created.locator('[data-type="detailsContent"]')).toContainText("body line");

    // At the end of the last body line, ArrowDown leaves the toggle.
    await page.keyboard.press("ArrowDown");
    await page.keyboard.type("after", { delay: 15 });

    const after = editor(page).locator("> p", { hasText: "after" });
    await expect(after).toHaveCount(1);
    await expect(toggle(page, "Arrows")).not.toContainText("after");
  });

  test("ArrowUp from the first body line returns to the title", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    await page.keyboard.type("> Arrows", { delay: 15 });
    const created = toggle(page, "Arrows");
    await expect(created).toHaveCount(1);
    await expect(created.locator("summary")).toHaveText("Arrows");

    // Enter lands the caret at the top of the empty body, where ArrowUp hands
    // it back to the end of the title.
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => {
      const node = window.getSelection()?.anchorNode ?? null;
      const element = node instanceof Element ? node : node?.parentElement;
      return Boolean(element?.closest('[data-type="detailsContent"]'));
    });

    await page.keyboard.press("ArrowUp");
    await page.waitForFunction(() => {
      const node = window.getSelection()?.anchorNode ?? null;
      const element = node instanceof Element ? node : node?.parentElement;
      return Boolean(element?.closest("summary"));
    });
    await page.keyboard.type("!", { delay: 15 });

    await expect(toggle(page, "Arrows!")).toHaveCount(1);
  });

  test("each body line gets its own gutter handle", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    await page.keyboard.type("> Gutter", { delay: 15 });
    const created = toggle(page, "Gutter");
    await expect(created).toHaveCount(1);
    // Let the title settle before Enter: ProseMirror reads contenteditable
    // mutations asynchronously, and an unsettled title splits the keystrokes.
    await expect(created.locator("summary")).toHaveText("Gutter");

    await page.keyboard.press("Enter");
    await page.keyboard.type("body line", { delay: 15 });

    const line = created.locator('[data-type="detailsContent"] p', { hasText: "body line" });
    await expect(line).toHaveCount(1);

    const box = (await line.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    // Hovering a line inside the toggle reveals the same block controls a
    // top-level block gets, so the line is movable on its own.
    await expect(page.getByRole("button", { name: "Insert block below" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Drag to reorder, click to open the block menu" }),
    ).toBeVisible();
  });

  test("a toggle's own handle sits on its title line", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    await page.keyboard.type("> Tall", { delay: 15 });
    const created = toggle(page, "Tall");
    await expect(created).toHaveCount(1);
    await expect(created.locator("summary")).toHaveText("Tall");

    // Grow the body so the toggle is markedly taller than its title line.
    await page.keyboard.press("Enter");
    await page.keyboard.type("first line", { delay: 15 });
    await page.keyboard.press("Enter");
    await page.keyboard.type("second line", { delay: 15 });
    await expect(created.locator('[data-type="detailsContent"]')).toContainText("second line");

    const summary = created.locator("summary");
    const summaryBox = (await summary.boundingBox())!;
    const blockBox = (await created.boundingBox())!;
    expect(blockBox.height).toBeGreaterThan(summaryBox.height);

    await page.mouse.move(summaryBox.x + 30, summaryBox.y + summaryBox.height / 2);

    // The gutter row rides the title, not the centre of the expanded body.
    const handle = await page
      .getByRole("button", { name: "Drag to reorder, click to open the block menu" })
      .boundingBox();
    const centre = (handle?.y ?? 0) + (handle?.height ?? 0) / 2;
    expect(centre).toBeGreaterThanOrEqual(summaryBox.y);
    expect(centre).toBeLessThanOrEqual(summaryBox.y + summaryBox.height);
  });
});
