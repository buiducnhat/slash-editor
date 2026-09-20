import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph, pasteHtml } from "./support.ts";

// Representative of Google Docs' clipboard export: everything wrapped in a
// non-semantic `<b id="docs-internal-guid-…">` marker (explicitly
// `font-weight:normal`, so it must NOT read as bold) with runs carrying
// weight/style through inline `style`, not `<strong>`/`<em>` tags.
const GOOGLE_DOCS_HTML = `<meta charset="utf-8"><b id="docs-internal-guid-abc123" style="font-weight:normal;">
<p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;">
  <span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:700;font-style:normal;">Quarterly Review</span>
</p>
<p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;">
  <span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:italic;">Draft notes</span>
</p>
<ul style="margin-top:0;margin-bottom:0;padding-inline-start:48px;">
  <li dir="ltr" style="list-style-type:disc;font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;" aria-level="1">
    <p dir="ltr" role="presentation"><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;">Revenue up 12%</span></p>
  </li>
</ul>
</b>`;

test("pasted Google Docs HTML normalizes inline-style runs and unwraps the guid marker", async ({
  page,
}) => {
  await page.goto("/");
  await focusTrailingParagraph(page);
  await pasteHtml(page, GOOGLE_DOCS_HTML, "Quarterly Review");

  const root = editor(page);

  const bold = root.locator("p", { hasText: "Quarterly Review" }).locator("strong");
  await expect(bold).toHaveText("Quarterly Review");

  const italic = root.locator("p", { hasText: "Draft notes" }).locator("em");
  await expect(italic).toHaveText("Draft notes");

  await expect(root.locator("ul > li", { hasText: "Revenue up 12%" })).toBeVisible();

  // The `docs-internal-guid` wrapper carries `font-weight:normal`; it must
  // never surface as a stray `<strong>` around the whole paste.
  const stray = root.locator("strong", { hasText: "Quarterly ReviewDraft notes" });
  await expect(stray).toHaveCount(0);
});
