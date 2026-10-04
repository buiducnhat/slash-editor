import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

const subPages = (page: Page) => editor(page).locator('[data-testid="sub-page"]');
const treeRow = (page: Page, title: string) =>
  page.locator('[data-testid="page-tree"] [role="treeitem"]').filter({ hasText: title });

test.describe("pages", () => {
  test("/page creates a sub-page, opens it, and the breadcrumb shows the trail", async ({
    page,
  }) => {
    await page.goto("/playground?page=home");
    await expect(subPages(page)).toHaveText(/Getting started/);
    await focusTrailingParagraph(page);
    await page.keyboard.type("/page");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/page=(?!home$)[\w-]+$/);
    const crumbs = page.getByTestId("page-breadcrumb");
    await expect(crumbs).toContainText("Home");
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText("Untitled");

    // The block is in the parent document, so going back finds it.
    await crumbs.getByRole("button", { name: "Home" }).click();
    await expect(subPages(page)).toHaveCount(2);
  });

  test("renaming in the header updates the parent's block and the tree", async ({ page }) => {
    await page.goto("/playground?page=guide");
    const title = page.getByLabel("Page title");
    await expect(title).toHaveValue("Getting started");

    await title.fill("Quickstart");
    await expect(treeRow(page, "Quickstart")).toBeVisible();

    await page.getByTestId("page-breadcrumb").getByRole("button", { name: "Home" }).click();
    await expect(subPages(page)).toHaveText(/Quickstart/);
  });

  test("@ lists pages, inserts a link chip, and the chip navigates", async ({ page }) => {
    await page.goto("/playground?page=home");
    await focusTrailingParagraph(page);
    await page.keyboard.type("@getting");

    await expect(page.locator('[data-slot="command-item"][data-value="guide"]')).toBeVisible({
      timeout: 3000,
    });
    await page.keyboard.press("Enter");

    const chip = editor(page).locator('[data-testid="page-link"]');
    await expect(chip).toContainText("Getting started");

    await chip.click();
    await expect(page).toHaveURL(/page=guide$/);
  });

  test("deleting a sub-page block trashes the page and undo restores it", async ({ page }) => {
    await page.goto("/playground?page=home");
    await expect(treeRow(page, "Getting started")).toBeVisible();

    await focusTrailingParagraph(page);
    // ArrowUp from the empty last line selects the atom block above it.
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Backspace");

    await expect(subPages(page)).toHaveCount(0);
    await expect(treeRow(page, "Getting started")).toHaveCount(0);

    await page.keyboard.press("ControlOrMeta+z");

    await expect(subPages(page)).toHaveCount(1);
    await expect(treeRow(page, "Getting started")).toBeVisible();
  });

  test("backlinks list the pages that reference the open page", async ({ page }) => {
    await page.goto("/playground?page=guide");

    await expect(page.getByTestId("page-backlinks")).toContainText("Home");
  });

  test("ArrowUp at the document start returns to the title, Enter goes back down", async ({
    page,
  }) => {
    await page.goto("/playground?page=guide");
    const title = page.getByLabel("Page title");
    await editor(page).locator("p").first().click();
    await expect(editor(page)).toBeFocused();
    // The seed paragraph is a single line, so Home lands on the document's first position.
    await page.keyboard.press("Home");
    // ProseMirror adopts the DOM selection asynchronously, so an ArrowUp sent
    // right after Home can still see the old caret; resending is harmless.
    await expect(async () => {
      await page.keyboard.press("ArrowUp");
      await expect(title).toBeFocused({ timeout: 500 });
    }).toPass();

    await page.keyboard.press("Enter");
    await expect(editor(page)).toBeFocused();
  });
});
