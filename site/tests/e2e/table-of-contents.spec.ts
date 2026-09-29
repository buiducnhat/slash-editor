import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { editor } from "./support.ts";

/**
 * Browser regressions for the table-of-contents surfaces: the outline nav on
 * `/docs/components/table-of-contents` and the read-only viewer on
 * `/docs/guides/read-only`. Selectors come only from the shipped DOM contract
 * — `nav[data-testid="table-of-contents"]`, rows `[data-testid="toc-item"]`
 * with `data-toc-id`, `aria-current="location"` on the active row — plus the
 * named demo surfaces (the `max-h-64 overflow-y-auto` scroll pane).
 */
function tocRows(page: Page): Locator {
  return page.locator('nav[data-testid="table-of-contents"] [data-testid="toc-item"]');
}

function activeTocRow(page: Page): Locator {
  return page.locator(
    'nav[data-testid="table-of-contents"] [data-testid="toc-item"][aria-current="location"]',
  );
}

/** TableOfContentsDemo's seeded headings, in document order. */
const TOC_DEMO_HEADINGS = [
  "Trail Notes",
  "Before you go",
  "On the trail",
  "Creek crossing",
  "Back at camp",
];

/** ReadOnlyDemo's seeded headings, in document order (the demo is `editable: false`). */
const READ_ONLY_HEADINGS = ["Release checklist", "Before merging", "Cut the release"];

test.describe("table of contents", () => {
  test("rows list the document's headings in document order", async ({ page }) => {
    await page.goto("/docs/components/table-of-contents");

    // With labels and order asserted at once, a reshuffled outline, a stale
    // label, or a row per the wrong block all fail immediately.
    await expect(tocRows(page)).toHaveText(TOC_DEMO_HEADINGS);
    // The outline mirrors the document itself, element for element.
    await expect(editor(page).locator("h1, h2, h3")).toHaveText(TOC_DEMO_HEADINGS);
  });

  test("the active row follows the caret", async ({ page }) => {
    await page.goto("/docs/components/table-of-contents");
    await expect(tocRows(page)).toHaveText(TOC_DEMO_HEADINGS);

    // Nothing has crossed the pane's top edge yet and the caret is nowhere, so
    // no row claims to be the reader's position. (The caret-based "above the
    // first heading" null is unreachable on this document: the first heading
    // is its first block, so the caret can never sit above it.)
    await expect(activeTocRow(page)).toHaveCount(0);

    const paragraphs = editor(page).locator("p");
    await paragraphs.nth(1).click(); // first paragraph under "Before you go"
    await expect(editor(page)).toBeFocused();
    await expect(activeTocRow(page)).toHaveText("Before you go");

    await paragraphs.nth(3).click(); // the paragraph under "On the trail"
    await expect(editor(page)).toBeFocused();
    await expect(activeTocRow(page)).toHaveText("On the trail");

    // The caret resting in a heading highlights that heading's own row.
    await editor(page).locator("h1").click();
    await expect(editor(page)).toBeFocused();
    await expect(activeTocRow(page)).toHaveText("Trail Notes");
  });

  test("rows update live when a heading is edited and when one is added", async ({ page }) => {
    await page.goto("/docs/components/table-of-contents");
    await expect(tocRows(page)).toHaveText(TOC_DEMO_HEADINGS);

    // Triple-click selects the block's full inline content (ProseMirror's
    // block selection), so typing replaces exactly the heading's text.
    await editor(page).locator("h2", { hasText: "Back at camp" }).click({ clickCount: 3 });
    await expect(editor(page)).toBeFocused();
    await page.keyboard.type("Base camp");

    await expect(tocRows(page)).toHaveText([
      "Trail Notes",
      "Before you go",
      "On the trail",
      "Creek crossing",
      "Base camp",
    ]);

    // Append a heading at the end: collapse the triple-clicked paragraph to
    // its end, split it, and the heading input rule turns "## " into an h2.
    await editor(page).locator("p").last().click({ clickCount: 3 });
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await page.keyboard.type("## Extra mile");

    await expect(tocRows(page)).toHaveText([
      "Trail Notes",
      "Before you go",
      "On the trail",
      "Creek crossing",
      "Base camp",
      "Extra mile",
    ]);
    await expect(editor(page).locator("h2").last()).toHaveText("Extra mile");
  });

  test("clicking a row jumps to its heading in the pane", async ({ page }) => {
    await page.goto("/docs/components/table-of-contents");
    await expect(tocRows(page)).toHaveText(TOC_DEMO_HEADINGS);

    // The pane the demo drives with `scrollContainer`: the only max-h-64
    // scroller in the demo's two-column layout.
    const pane = page.locator("div.max-h-64.overflow-y-auto");
    const heading = editor(page).locator("h2", { hasText: "On the trail" });

    await tocRows(page).nth(2).click(); // the "On the trail" row

    // Jump, not mere highlight: the row is active AND the caret is in it.
    await expect(activeTocRow(page)).toHaveText("On the trail");
    await expect
      .poll(() =>
        heading.evaluate((el) => {
          const selection = el.ownerDocument.getSelection();
          return !!selection && el.contains(selection.anchorNode);
        }),
      )
      .toBe(true);

    // The scroll is smooth-animated, so poll until it settles: the heading
    // must end up pinned to the top of the pane the outline scrolls.
    await expect
      .poll(
        async () => {
          const headingBox = await heading.boundingBox();
          const paneBox = await pane.boundingBox();
          return headingBox && paneBox
            ? Math.abs(headingBox.y - paneBox.y)
            : Number.POSITIVE_INFINITY;
        },
        { timeout: 10_000 },
      )
      .toBeLessThan(8);
  });

  test("the read-only document is inert to typing but keeps its interactions", async ({
    page,
    context,
  }) => {
    await page.goto("/docs/guides/read-only");
    const doc = editor(page);
    await expect(doc).toHaveAttribute("contenteditable", "false");
    await expect(tocRows(page)).toHaveText(READ_ONLY_HEADINGS);

    // Typing cannot rewrite anything, not even the heading under the click.
    const heading1 = doc.locator("h1", { hasText: "Release checklist" });
    await heading1.click();
    await page.keyboard.type("junk");
    await expect(heading1).toHaveText("Release checklist");

    // Task checkboxes stay interactive in a viewer (`taskItem.onReadOnlyChecked`).
    const testsBox = doc.locator("li", { hasText: "Tests pass" }).locator('input[type="checkbox"]');
    const docsBox = doc
      .locator("li", { hasText: "Docs updated" })
      .locator('input[type="checkbox"]');
    await expect(testsBox).toBeChecked();
    await expect(docsBox).not.toBeChecked();
    await docsBox.click();
    await expect(docsBox).toBeChecked();

    // Link clicks navigate the browser again in a viewer: Tiptap's `openOnClick`
    // handler bails out without editability, so the anchor's own
    // `target="_blank"` default takes over and opens the hash in a new tab.
    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      doc.locator('a[href="#read-only-anchor"]').click(),
    ]);
    await expect(popup).toHaveURL(/#read-only-anchor$/);
  });

  test("the read-only active row follows the scroll position", async ({ page }) => {
    await page.goto("/docs/guides/read-only");
    await expect(tocRows(page)).toHaveText(READ_ONLY_HEADINGS);

    // The demo passes no `scrollContainer`, so the window is the scrolling
    // surface, and without a caret scroll position alone picks the active row:
    // the last heading at or above the window top. Park each heading 30px
    // above that edge and watch the highlight move with it.
    const beforeMerging = editor(page).locator("h2", { hasText: "Before merging" });
    await beforeMerging.evaluate((el) => {
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 30);
    });
    await expect(activeTocRow(page)).toHaveText("Before merging");

    const cutRelease = editor(page).locator("h2", { hasText: "Cut the release" });
    await cutRelease.evaluate((el) => {
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 30);
    });
    await expect(activeTocRow(page)).toHaveText("Cut the release");
  });
});
