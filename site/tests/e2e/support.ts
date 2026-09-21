import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** The rendered editor root; `.slash-content` is the class `app.tsx` gives `EditorContent`. */
export function editor(page: Page): Locator {
  return page.locator(".slash-content");
}

/**
 * Clicks the trailing empty paragraph every document ends with, placing the
 * caret there. Waits for focus to land before returning: React 19 StrictMode
 * double-mounts the editor, and a click that lands during the throwaway
 * mount's brief window would focus a DOM node about to be torn down.
 */
export async function focusTrailingParagraph(page: Page): Promise<void> {
  const root = editor(page);
  await root.locator("p").last().click();
  await expect(root).toBeFocused();
}

/**
 * Dispatches a native `paste` event carrying `html` on the currently focused
 * element, exercising the same `handleDOMEvents`/DOMParser path a real
 * clipboard paste takes. Uses `document.activeElement` rather than
 * re-querying `.slash-content` so it never targets a stale StrictMode mount.
 */
export async function pasteHtml(page: Page, html: string, text = ""): Promise<void> {
  await page.evaluate(
    ({ html, text }) => {
      const target = document.activeElement;
      if (!target || !target.classList.contains("slash-content")) {
        throw new Error("Expected the editor to be focused before pasting");
      }
      const dataTransfer = new DataTransfer();
      dataTransfer.setData("text/html", html);
      dataTransfer.setData("text/plain", text);
      const event = new ClipboardEvent("paste", {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(event);
    },
    { html, text },
  );
}

/** Reveals the gutter grip for `block` by hovering it; the grip only renders on hover. */
async function revealGrip(page: Page, block: Locator): Promise<Locator> {
  const box = await block.boundingBox();
  if (!box) {
    throw new Error("Target block has no bounding box");
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const grip = page.getByRole("button", {
    name: "Drag to reorder, click to open the block menu",
  });
  await grip.waitFor({ state: "visible" });
  return grip;
}

/**
 * Drags `source`'s gutter handle to `target` client coordinates: hover to
 * reveal the grip, press, cross the click threshold, move to the drop point,
 * release. Mirrors `useBlockDrag`'s pointer protocol so the same
 * `pointermove`/`pointerup` listeners the app relies on actually fire.
 */
export async function dragBlock(
  page: Page,
  source: Locator,
  target: { x: number; y: number },
): Promise<void> {
  const grip = await revealGrip(page, source);
  const gripBox = await grip.boundingBox();
  if (!gripBox) {
    throw new Error("Grip has no bounding box");
  }
  const gx = gripBox.x + gripBox.width / 2;
  const gy = gripBox.y + gripBox.height / 2;

  await page.mouse.move(gx, gy);
  await page.mouse.down();
  // Cross the 4px click threshold so the gesture becomes a drag, not a click.
  await page.mouse.move(gx, gy + 6, { steps: 3 });
  await page.mouse.move(target.x, target.y, { steps: 8 });
  await page.mouse.up();
}
