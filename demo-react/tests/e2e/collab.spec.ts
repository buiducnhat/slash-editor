import { expect, test } from "@playwright/test";
import { editor, focusTrailingParagraph } from "./support.ts";

function room(suffix: string): string {
  return `collab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${suffix}`;
}

test.describe("collaboration", () => {
  test("two browsers converge on concurrent edits and reconnect after offline edits", async ({
    browser,
  }) => {
    const roomId = room("sync");
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await pageA.goto(`/?collab=${roomId}`);
      await pageB.goto(`/?collab=${roomId}`);

      await focusTrailingParagraph(pageA);
      await pageA.keyboard.type("Hello from A");

      await expect(editor(pageB).locator("p").last()).toContainText("Hello from A", {
        timeout: 10_000,
      });

      // Presence: each browser's awareness sees exactly the other peer.
      await expect(pageA.getByTestId("presence-avatar")).toHaveCount(1, { timeout: 10_000 });
      await expect(pageB.getByTestId("presence-avatar")).toHaveCount(1, { timeout: 10_000 });

      // B goes offline and keeps editing locally; A keeps editing too. Both
      // sets of edits must be present on both sides once B reconnects —
      // Yjs's CRDT merge, not a manual conflict-resolution step.
      await contextB.setOffline(true);
      await focusTrailingParagraph(pageB);
      await pageB.keyboard.press("End");
      await pageB.keyboard.type(" — offline edit from B");

      await pageA.keyboard.type(" — online edit from A");

      await contextB.setOffline(false);

      await expect(editor(pageA).locator("p").last()).toContainText("offline edit from B", {
        timeout: 15_000,
      });
      await expect(editor(pageB).locator("p").last()).toContainText("online edit from A", {
        timeout: 15_000,
      });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test("comment sidebar anchors a thread on the selection and resolves it", async ({ page }) => {
    await page.goto(`/?collab=${room("comment")}`);
    await focusTrailingParagraph(page);
    await page.keyboard.type("Annotate this sentence.");

    await page.keyboard.press("Home");
    await page.keyboard.down("Shift");
    await page.keyboard.press("End");
    await page.keyboard.up("Shift");

    await page.getByPlaceholder("Comment on the selection…").fill("Looks good to me.");
    await page.getByRole("button", { name: "Comment" }).click();

    const thread = page.getByTestId("comment-thread");
    await expect(thread).toBeVisible({ timeout: 5000 });
    await expect(thread).toContainText("Looks good to me.");
    await expect(editor(page).locator('[data-type="comment"]')).toHaveCount(1);

    await thread.getByRole("button", { name: "Resolve" }).click();
    await expect(thread).toContainText("resolved");
  });
});
