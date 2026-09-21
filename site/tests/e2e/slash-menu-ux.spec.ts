import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

const item = (value: string) => `[data-slot="command-item"][data-value="${value}"]`;

test.describe("slash menu affordances", () => {
  test("arrow keys keep the highlighted item inside the scroll viewport", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/");

    const list = page.locator('[data-slot="command-list"]');
    await expect(list).toBeVisible();
    // The list is taller than its max height; nothing scrolls until we walk past
    // the fold, and the editor — not the palette — owns these keys.
    expect(await list.evaluate((node) => node.scrollTop)).toBe(0);

    for (let index = 0; index < 12; index += 1) {
      await page.keyboard.press("ArrowDown");
    }

    const selected = page.locator('[data-slot="command-item"][data-selected="true"]');
    await expect(selected).toHaveCount(1);
    expect(await list.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    expect(
      await selected.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const view = node.closest('[data-slot="command-list"]')!.getBoundingClientRect();
        return box.top >= view.top - 1 && box.bottom <= view.bottom + 1;
      }),
    ).toBe(true);
  });

  test("every row is one line and carries an icon", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/");

    await expect(page.locator(item("task-list"))).toBeVisible();

    const rows = await page.locator('[data-slot="command-item"]').evaluateAll((nodes) =>
      nodes.map((node) => ({
        value: node.getAttribute("data-value"),
        height: Math.round(node.getBoundingClientRect().height),
        hasIcon: node.querySelector("svg") !== null,
      })),
    );

    const single = Math.min(...rows.map((row) => row.height));
    expect(rows.filter((row) => row.height > single)).toEqual([]);
    expect(rows.filter((row) => !row.hasIcon)).toEqual([]);
    // The AI group is resolved from its own icon keys, the historic blank slot.
    expect(rows.some((row) => row.value === "continue-writing")).toBe(true);
  });

  test("the markdown shorthand shown for an item actually converts the block", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/");

    const shortcut = await page
      .locator(`${item("task-list")} [data-slot="command-shortcut"]`)
      .textContent();
    expect(shortcut).toBe("[]");

    await page.keyboard.press("Escape");
    // Escape leaves the trigger character behind; clear it before retyping.
    await page.keyboard.press("Backspace");
    await page.keyboard.type(`${shortcut} Ship it`);

    await expect(editor(page).locator('li[data-block-type="taskItem"]').last()).toContainText(
      "Ship it",
    );
  });

  test("the empty block under the caret names itself", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);

    const placeheld = editor(page).locator("[data-placeholder]");
    await expect(placeheld).toHaveAttribute("data-placeholder", "Press '/' for commands…");

    await page.keyboard.type("/h2");
    await page.keyboard.press("Enter");
    await expect(placeheld).toHaveAttribute("data-placeholder", "Heading 2");

    // A list item's empty child is a paragraph: the hint has to come from the
    // block that contains it, not from the node type.
    await page.keyboard.type("Plans");
    await page.keyboard.press("Enter");
    await page.keyboard.type("/bullet");
    await page.keyboard.press("Enter");
    await expect(editor(page).locator("li [data-placeholder]")).toHaveAttribute(
      "data-placeholder",
      "List",
    );
  });

  test("the trigger prompts for a query until one is typed", async ({ page }) => {
    await page.goto("/playground");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/");

    const trigger = editor(page).locator("[data-decoration-id]");
    await expect(trigger).toHaveAttribute("data-decoration-content", "Type to search");
    await expect(trigger).toHaveClass(/is-empty/);

    await page.keyboard.type("h");

    await expect(trigger).not.toHaveClass(/is-empty/);
  });
});
