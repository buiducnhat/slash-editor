import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph, pasteHtml } from "./support.ts";

// Representative of Notion's clipboard export: semantic tags, wrapper ids
// Notion adds for its own reconciliation, no foreign block wrappers.
const NOTION_HTML = `<meta charset="utf-8">
<h1 id="a1">Project Plan</h1>
<p id="a2">Some <strong>bold</strong> and <em>italic</em> text.</p>
<ul id="a3">
<li>First</li>
<li>Second</li>
</ul>
<blockquote id="a4">Ship it.</blockquote>`;

test("pasted Notion HTML normalizes into the block schema", async ({ page }) => {
  await page.goto("/playground");
  await focusTrailingParagraph(page);
  await pasteHtml(page, NOTION_HTML, "Project Plan");

  const root = editor(page);
  await expect(root.locator("h1", { hasText: "Project Plan" })).toBeVisible();

  const paragraph = root.locator("p", { hasText: "Some bold and italic text." });
  await expect(paragraph.locator("strong")).toHaveText("bold");
  await expect(paragraph.locator("em")).toHaveText("italic");

  await expect(root.locator("ul > li", { hasText: "First" })).toBeVisible();
  await expect(root.locator("ul > li", { hasText: "Second" })).toBeVisible();
  await expect(root.locator("blockquote", { hasText: "Ship it." })).toBeVisible();
});
