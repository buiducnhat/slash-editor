import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

/** A minimal valid 1x1 PNG, so the mock adapter's `FileReader.readAsDataURL` has real image bytes to encode. */
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function pngFile(name: string) {
  return { name, mimeType: "image/png", buffer: Buffer.from(PNG_BASE64, "base64") };
}

test.describe("media upload", () => {
  test("inserts an image placeholder and uploads to a ready state", async ({ page }) => {
    await page.goto("/");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/image");
    await expect(page.locator('[data-slot="command-item"][data-value="image"]')).toBeVisible();
    await page.keyboard.press("Enter");

    const node = editor(page).locator("[data-status]").last();
    await expect(node).toHaveAttribute("data-status", "ready");
    await expect(node.getByRole("button", { name: "Upload" })).toBeVisible();

    await node.locator('input[type="file"]').setInputFiles(pngFile("ok-photo.png"));

    await expect(node).toHaveAttribute("data-status", "uploading");
    await expect(node).toHaveAttribute("data-status", "ready", { timeout: 3000 });
    await expect(node.locator("img")).toHaveAttribute("src", /^data:image\/png;base64,/);
  });

  test("a failed upload surfaces the error, and retry recovers it", async ({ page }) => {
    await page.goto("/");
    await focusTrailingParagraph(page);
    await page.keyboard.type("/image");
    await page.keyboard.press("Enter");

    const node = editor(page).locator("[data-status]").last();
    // The mock adapter (demo-react/src/lib/upload-adapter.ts) rejects a
    // `fail-`-prefixed filename exactly once, so this exercises the real
    // error → retry → ready transition, not a stub that always succeeds.
    await node.locator('input[type="file"]').setInputFiles(pngFile("fail-photo.png"));

    await expect(node).toHaveAttribute("data-status", "error", { timeout: 3000 });
    await expect(node).toContainText("Mock upload failed");
    await expect(node.locator("img")).toHaveCount(0);

    await node.getByRole("button", { name: "Retry" }).click();

    await expect(node).toHaveAttribute("data-status", "uploading");
    await expect(node).toHaveAttribute("data-status", "ready", { timeout: 3000 });
    await expect(node.locator("img")).toHaveAttribute("src", /^data:image\/png;base64,/);
  });
});
