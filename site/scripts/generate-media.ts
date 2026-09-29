/**
 * Regenerates the repo's marketing media into `.github/assets/`:
 *
 *   bun run scripts/generate-media.ts [screenshots|video|all]
 *
 * - `screenshots` — the high-res gallery PNGs in `.github/assets/gallery/`.
 * - `video` — `demo.mp4` + `demo.gif`, one continuous take over the
 *   playground that walks every headline feature: the slash menu, markdown
 *   input rules, the bubble toolbar + links, mentions, task lists, the
 *   block menu, drag-to-reorder, toggles, AI streaming, comments, the
 *   markdown view, read-only mode, and a real two-tab collaboration sync
 *   to close.
 * - `all` (default) — both.
 *
 * `DEMO_BASE_URL` overrides the server (default `http://localhost:3000`);
 * a `next start` is spawned if nothing answers there. The take is recorded
 * by Playwright at 1440x900 with a synthetic on-page cursor, so mouse-driven
 * scenes read on video the way they do in a real capture.
 */
import { chromium, type Browser, type Locator, type Page } from "@playwright/test";
import { execSync, spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "../..");
const galleryDir = path.join(rootDir, ".github/assets/gallery");
const assetsDir = path.join(rootDir, ".github/assets");

type Stage = "screenshots" | "video" | "all";
const stage = (process.argv[2] ?? "all") as Stage;
const baseUrl = process.env.DEMO_BASE_URL ?? "http://localhost:3000";

if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

function sleep(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

/** A designed pause — long enough to read what just happened. */
const beat = (ms: number) => sleep(ms);

// ---------------------------------------------------------------------------
// Synthetic demo cursor
// ---------------------------------------------------------------------------

interface DemoCursor {
  move(x: number, y: number): void;
  setPressed(pressed: boolean): void;
  setVisible(visible: boolean): void;
}

/**
 * Injected before any page script: an on-page pointer that mirrors the
 * Playwright mouse. Playwright's screencast does not capture a real cursor,
 * so hover/drag/click scenes would otherwise play with no visible actor.
 * The element is `pointer-events: none` and painted above everything else.
 */
function installDemoCursor() {
  const holder = document.createElement("div");
  holder.id = "__demo-cursor";
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "z-index:2147483647",
    "pointer-events:none",
    "opacity:0",
    "transition:opacity 200ms ease",
    "will-change:transform",
  ].join(";");
  holder.innerHTML = `
    <div style="position:absolute;left:-6px;top:-6px;width:22px;height:22px;border-radius:999px;
                border:2px solid rgba(37,99,235,.55);opacity:0;"></div>
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
         style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));">
      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z"
            fill="#1f2937" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`;
  document.documentElement.append(holder);

  const ring = holder.firstElementChild as HTMLElement;
  const arrow = holder.lastElementChild as HTMLElement;
  let x = -100;
  let y = -100;
  let pressed = false;

  const render = () => {
    holder.style.transform = `translate(${x}px, ${y}px)`;
    arrow.style.transformOrigin = "3px 2px";
    arrow.style.transform = `translate(-3px,-2px)${pressed ? " scale(.86)" : ""}`;
    ring.style.opacity = pressed ? "1" : "0";
    ring.style.transform = pressed ? "scale(.6)" : "scale(1.6)";
    ring.style.transition = pressed ? "none" : "opacity 220ms ease, transform 220ms ease";
  };

  (window as unknown as { __demoCursor?: DemoCursor }).__demoCursor = {
    move(nextX: number, nextY: number) {
      x = nextX;
      y = nextY;
      render();
    },
    setPressed(next: boolean) {
      pressed = next;
      render();
    },
    setVisible(visible: boolean) {
      holder.style.opacity = visible ? "1" : "0";
    },
  };
}

async function cursorMove(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(
    ([px, py]) => {
      (window as unknown as { __demoCursor?: DemoCursor }).__demoCursor?.move(px, py);
    },
    [x, y],
  );
}

async function cursorPressed(page: Page, pressed: boolean): Promise<void> {
  await page.evaluate((down) => {
    (window as unknown as { __demoCursor?: DemoCursor }).__demoCursor?.setPressed(down);
  }, pressed);
}

async function cursorVisible(page: Page, visible: boolean): Promise<void> {
  await page.evaluate((show) => {
    (window as unknown as { __demoCursor?: DemoCursor }).__demoCursor?.setVisible(show);
  }, visible);
}

// ---------------------------------------------------------------------------
// Pointer helpers — the real mouse and the visible cursor move together
// ---------------------------------------------------------------------------

const pointer = { x: 720, y: 450 };

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** Glides both the Playwright mouse and the visible cursor to (x, y). */
async function glide(page: Page, x: number, y: number, durationMs = 550): Promise<void> {
  const distance = Math.hypot(x - pointer.x, y - pointer.y);
  const steps = Math.max(2, Math.min(28, Math.round(distance / 26)));
  for (let i = 1; i <= steps; i += 1) {
    const t = easeInOutQuad(i / steps);
    const px = pointer.x + (x - pointer.x) * t;
    const py = pointer.y + (y - pointer.y) * t;
    await page.mouse.move(px, py);
    await cursorMove(page, px, py);
    await sleep(durationMs / steps);
  }
  pointer.x = x;
  pointer.y = y;
}

async function clickAt(page: Page, x: number, y: number): Promise<void> {
  await glide(page, x, y);
  await sleep(140);
  await page.mouse.down();
  await cursorPressed(page, true);
  await sleep(100);
  await page.mouse.up();
  await cursorPressed(page, false);
  await sleep(180);
}

async function centreOf(target: Locator): Promise<{ x: number; y: number }> {
  await target.scrollIntoViewIfNeeded();
  await target.waitFor({ state: "visible" });
  const box = await target.boundingBox();
  if (!box) throw new Error("Target has no bounding box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function clickLocator(page: Page, target: Locator): Promise<void> {
  const { x, y } = await centreOf(target);
  await clickAt(page, x, y);
}

/** Types with a human cadence so the copy is readable on video. */
async function typeText(page: Page, text: string, delay = 38): Promise<void> {
  await page.keyboard.type(text, { delay });
  await sleep(220);
}

async function selectLeft(page: Page, chars: number): Promise<void> {
  for (let i = 0; i < chars; i += 1) {
    await page.keyboard.press("Shift+ArrowLeft");
    await sleep(28);
  }
  await sleep(240);
}

async function selectRight(page: Page, chars: number): Promise<void> {
  for (let i = 0; i < chars; i += 1) {
    await page.keyboard.press("Shift+ArrowRight");
    await sleep(28);
  }
  await sleep(240);
}

const editorRoot = (page: Page) => page.locator(".slash-content");

/**
 * Parks the caret on a fresh empty line at the document end: click the last
 * top-level block, jump to its end, and step out with Enter unless the line
 * is already empty. Clicking a block's centre can land inside a container
 * (callout, toggle), so End precedes Enter.
 */
async function freshLine(page: Page): Promise<void> {
  const lastTop = editorRoot(page).locator(":scope > *").last();
  await clickLocator(page, lastTop);
  await page.keyboard.press("End");
  const lastLineEmpty = await editorRoot(page).evaluate((root) => {
    const last = root.lastElementChild;
    return last?.tagName === "P" && (last.textContent ?? "") === "";
  });
  if (!lastLineEmpty) await page.keyboard.press("Enter");
  await beat(350);
}

/** Reveals a block's gutter grip by hovering it, then drags it to `target`. */
async function dragBlockTo(page: Page, block: Locator, target: { x: number; y: number }) {
  const { x, y } = await centreOf(block);
  await glide(page, x, y);
  await beat(500);
  const grip = page.getByRole("button", {
    name: "Drag to reorder, click to open the block menu",
  });
  const from = await centreOf(grip);
  await glide(page, from.x, from.y);
  await page.mouse.down();
  await cursorPressed(page, true);
  // Cross the 4px click threshold so the gesture becomes a drag, not a click.
  await page.mouse.move(from.x, from.y + 7, { steps: 3 });
  await cursorMove(page, from.x, from.y + 7);
  await sleep(160);
  await glide(page, target.x, target.y, 850);
  await sleep(220);
  await page.mouse.up();
  await cursorPressed(page, false);
  await beat(500);
}

// ---------------------------------------------------------------------------
// Screenshots stage (gallery PNGs)
// ---------------------------------------------------------------------------

async function captureGallery(browser: Browser) {
  console.log("Capturing marketing gallery screenshots...");
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  await page.goto(`${baseUrl}/playground`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  // Screenshot 1: Full Playground Editor Overview
  await page.screenshot({
    path: path.join(galleryDir, "01-playground-overview.png"),
    clip: { x: 120, y: 70, width: 1200, height: 800 },
  });
  console.log("✓ Captured 01-playground-overview.png");

  // Screenshot 2: Slash Menu in action
  const trailingP = editorRoot(page).locator("p").last();
  await trailingP.click();
  await page.keyboard.type("/");
  await page.waitForSelector('[data-slot="command-list"]', { state: "visible" });
  await page.waitForTimeout(400);

  await page.screenshot({
    path: path.join(galleryDir, "02-slash-menu.png"),
    clip: { x: 120, y: 350, width: 1200, height: 700 },
  });
  console.log("✓ Captured 02-slash-menu.png");

  // Screenshot 3: Selection Bubble Toolbar
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  // Clear trailing line cleanly
  await trailingP.click();
  await page.keyboard.press("Backspace");
  await page.keyboard.type("Rich inline formatting powered by shadcn.");
  await page.waitForTimeout(200);
  for (let i = 0; i < "powered by shadcn.".length; i++) {
    await page.keyboard.press("ArrowLeft");
  }
  for (let i = 0; i < "inline formatting".length; i++) {
    await page.keyboard.press("Shift+ArrowLeft");
  }
  await page.waitForSelector('[data-slot="popover-content"]', { state: "visible" });
  await page.waitForTimeout(400);

  await page.screenshot({
    path: path.join(galleryDir, "03-bubble-toolbar.png"),
    clip: { x: 120, y: 350, width: 1200, height: 500 },
  });
  console.log("✓ Captured 03-bubble-toolbar.png");

  // Screenshot 4: Landing page Hero
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(galleryDir, "04-landing-hero.png"),
    clip: { x: 120, y: 60, width: 1200, height: 800 },
  });
  console.log("✓ Captured 04-landing-hero.png");

  await context.close();
}

// ---------------------------------------------------------------------------
// Video stage — one continuous feature tour
// ---------------------------------------------------------------------------

/** Re-mounts the visible cursor after a navigation and parks it on screen. */
async function wakeCursor(page: Page) {
  await cursorMove(page, pointer.x, pointer.y);
  await cursorVisible(page, true);
}

/** Joins the collab room from the solo playground's join form. */
async function joinRoom(page: Page, room: string) {
  const input = page.getByLabel("Collaboration room name");
  const { x, y } = await centreOf(input);
  await clickAt(page, x, y);
  await typeText(page, room, 42);
  await clickLocator(page, page.getByRole("button", { name: "Join", exact: true }));
  await page.getByRole("heading", { name: /^Room / }).waitFor({ state: "visible" });
  await wakeCursor(page);
  await beat(1400);
}

async function recordDemo(browser: Browser) {
  console.log("Recording interactive demo video...");
  const tempVideoDir = path.join(galleryDir, "temp-video");
  if (!fs.existsSync(tempVideoDir)) {
    fs.mkdirSync(tempVideoDir, { recursive: true });
  }

  const recordContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await recordContext.newPage();
  await page.addInitScript(installDemoCursor);
  await page.goto(`${baseUrl}/playground`, { waitUntil: "networkidle" });
  await editorRoot(page).waitFor({ state: "visible" });
  await beat(900);

  // Scene 1 — Overview: scroll the whole document into view and back.
  await wakeCursor(page);
  await glide(page, 980, 420, 700);
  const scrollable = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  const chunks = Math.max(2, Math.round(scrollable / 560));
  for (let i = 0; i < chunks; i += 1) {
    await page.mouse.wheel(0, scrollable / chunks);
    await beat(300);
  }
  await beat(800);
  for (let i = 0; i < chunks; i += 1) {
    await page.mouse.wheel(0, -scrollable / chunks);
    await beat(280);
  }
  await beat(400);

  // Scene 2 — Markdown input rules: `## `, `> `, `" ` all shape blocks.
  await freshLine(page);
  await typeText(page, "## ", 130);
  await beat(260);
  await typeText(page, "Markdown input rules");
  await beat(650);
  await page.keyboard.press("Enter");
  await typeText(page, "> ", 130);
  await beat(260);
  await typeText(page, "Toggles from two keystrokes");
  await beat(650);
  await page.keyboard.press("Enter");
  await typeText(page, "Nested content, no mouse required.");
  await beat(450);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await typeText(page, '" ', 130);
  await beat(260);
  await typeText(page, "Quotes, toggles, headings — from plain text.");
  await beat(700);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  // Scene 3 — Slash menu: browse the block gallery, insert a callout.
  await typeText(page, "/", 150);
  await beat(950);
  for (let i = 0; i < 5; i += 1) {
    await page.keyboard.press("ArrowDown");
    await beat(330);
  }
  await beat(350);
  await typeText(page, "callout", 75);
  await beat(550);
  await page.keyboard.press("Enter");
  await beat(650);
  await typeText(page, "Blocks, menus, and toolbars — all headless.");
  await beat(550);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await beat(450);

  // Scene 4 — Bubble toolbar: bold, italic, and an inline link editor.
  await typeText(page, "Rich text, blocks, and a caret that feels native.");
  await beat(500);
  await selectLeft(page, "feels native.".length);
  await beat(650);
  await clickLocator(page, page.getByRole("button", { name: "Bold" }));
  await beat(650);
  await clickLocator(page, page.getByRole("button", { name: "Italic" }));
  await beat(650);
  await page.keyboard.press("Home");
  await selectRight(page, "Rich text".length);
  await beat(550);
  await clickLocator(page, page.getByRole("button", { name: "Link", exact: true }));
  const linkInput = page.getByPlaceholder("Paste a link…");
  await linkInput.waitFor({ state: "visible" });
  await clickLocator(page, linkInput);
  await typeText(page, "https://slasheditor.dev", 42);
  await page.keyboard.press("Enter");
  await beat(1200);
  await page.keyboard.press("Escape");
  await beat(400);

  // Scene 5 — Mentions: `@` picks a teammate from the directory.
  await freshLine(page);
  await typeText(page, "cc @ada", 70);
  await beat(750);
  await clickLocator(page, page.locator('[data-slot="command-item"]').first());
  await beat(500);
  await typeText(page, " — ready for review.");
  await beat(650);

  // Scene 6 — Task lists: a checkbox flips with one click.
  const checkbox = page
    .locator('.slash-content input[type="checkbox"][aria-label*="Ship callout"]')
    .first();
  await clickLocator(page, checkbox);
  await beat(800);

  // Scene 7 — Block menu: the gutter grip opens it, "Turn into" previews types.
  const callout = editorRoot(page).locator('[data-type="callout"]').last();
  const calloutPoint = await centreOf(callout);
  await glide(page, calloutPoint.x, calloutPoint.y);
  await beat(900);
  const grip = page.getByRole("button", {
    name: "Drag to reorder, click to open the block menu",
  });
  await clickLocator(page, grip);
  await beat(1100);
  const turnInto = page
    .locator('[data-slot="dropdown-menu-sub-trigger"]')
    .filter({ hasText: "Turn into" });
  const turnIntoPoint = await centreOf(turnInto);
  await glide(page, turnIntoPoint.x + 40, turnIntoPoint.y);
  await beat(1300);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await beat(450);

  // Scene 8 — Drag to reorder: the gutter handle drags a block to a new slot.
  const quote = editorRoot(page).locator("blockquote").last();
  const toggle = editorRoot(page).locator('[data-type="details"]').last();
  const quotePoint = await centreOf(quote);
  await dragBlockTo(page, toggle, { x: quotePoint.x + 8, y: quotePoint.y + 60 });
  await beat(700);

  // Scene 9 — Toggles collapse and expand nested content.
  await clickLocator(page, toggle.locator("> button"));
  await beat(1100);

  // Scene 10 — AI: a slash action streams a response that can be accepted.
  await freshLine(page);
  await typeText(page, "/continue", 65);
  await beat(550);
  await clickLocator(page, page.locator('[data-value="continue-writing"]'));
  await beat(900);
  await editorRoot(page).locator('[data-status="done"]').waitFor({ state: "visible" });
  await beat(700);
  const aiBlock = editorRoot(page).locator("[data-status]").last();
  await clickLocator(page, aiBlock.getByRole("button", { name: "Insert below" }));
  await beat(800);

  // Scene 11 — Comments: anchor a thread on a selection, then resolve it.
  await freshLine(page);
  await typeText(page, "This line needs a second pair of eyes.");
  await selectLeft(page, "second pair of eyes.".length);
  await beat(650);
  await clickLocator(page, page.getByLabel("Comment"));
  const composerInput = page.getByPlaceholder("Write a comment…");
  await composerInput.waitFor({ state: "visible" });
  await typeText(page, "Wording tweak — see thread.", 38);
  const composer = page.locator('[data-slot="popover-content"]').filter({ has: composerInput });
  await clickLocator(page, composer.getByRole("button", { name: "Comment", exact: true }));
  const thread = page.locator('[data-testid="comment-thread"]').first();
  await thread.waitFor({ state: "visible" });
  await beat(1000);
  await clickLocator(page, thread.getByRole("button", { name: "Resolve" }));
  await beat(900);

  // Scene 12 — Table of contents jumps to a heading.
  await clickLocator(page, page.getByRole("button", { name: "Mentions, links & AI", exact: true }));
  await beat(1000);

  // Scene 13 — Markdown view and read-only mode.
  await clickLocator(page, page.getByRole("button", { name: "Markdown", exact: true }));
  await beat(1300);
  await clickLocator(page, page.getByRole("button", { name: "Markdown", exact: true }));
  await beat(500);
  await clickLocator(page, page.getByRole("button", { name: "Read-only", exact: true }));
  await beat(1300);
  await clickLocator(page, page.getByRole("button", { name: "Read-only", exact: true }));
  await beat(500);

  // Scene 14 — Real-time collaboration: a second tab types into the room and
  // its caret, name label, and edits land live (WebRTC + BroadcastChannel).
  await joinRoom(page, "launch-day");
  const roomUrl = page.url();
  const peer = await recordContext.newPage();
  await peer.goto(roomUrl, { waitUntil: "networkidle" });
  await editorRoot(peer).waitFor({ state: "visible" });
  await beat(1200);
  await peer.locator(".slash-content p").last().click();
  await peer.keyboard.type("Landing the release notes now.", { delay: 45 });
  await page.getByText("Landing the release notes now.").waitFor({ state: "visible" });
  await beat(1200);
  await freshLine(page);
  await typeText(page, "Ship it 🚀", 55);
  await beat(2200);
  await peer.close();

  const video = page.video();
  await recordContext.close();
  if (!video) throw new Error("Playwright produced no video for the demo take");

  const rawVideo = path.join(tempVideoDir, "demo-raw.webm");
  await video.saveAs(rawVideo);
  const finalMp4 = path.join(assetsDir, "demo.mp4");
  const finalGif = path.join(assetsDir, "demo.gif");

  console.log("Converting recorded video to MP4...");
  execSync(
    `ffmpeg -y -i "${rawVideo}" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart -an "${finalMp4}"`,
    { stdio: "inherit" },
  );

  console.log("Generating high quality animated GIF with palettegen...");
  execSync(
    `ffmpeg -y -i "${rawVideo}" -filter_complex "[0:v] fps=12,scale=840:-1:flags=lanczos,split [a][b];[a] palettegen=max_colors=96:stats_mode=diff [p];[b][p] paletteuse=dither=bayer:bayer_scale=3" "${finalGif}"`,
    { stdio: "inherit" },
  );

  fs.rmSync(tempVideoDir, { recursive: true, force: true });
  console.log("✓ Generated demo.mp4 and demo.gif in .github/assets/");
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

async function ensureServer(): Promise<ChildProcess | null> {
  try {
    const res = await fetch(baseUrl, { method: "HEAD" });
    if (res.ok) return null;
    throw new Error("not ok");
  } catch {
    console.log(`Starting local Next.js server for ${baseUrl}...`);
    const port = new URL(baseUrl).port || "3000";
    const serverProc = spawn("bun", ["run", "start", "-p", port], {
      cwd: path.resolve(rootDir, "site"),
      stdio: "ignore",
    });
    for (let i = 0; i < 30; i += 1) {
      await sleep(500);
      try {
        const res = await fetch(baseUrl);
        if (res.ok) return serverProc;
      } catch {}
    }
    serverProc.kill();
    throw new Error(`Could not reach ${baseUrl}`);
  }
}

async function run() {
  const serverProc = await ensureServer();
  console.log("Launching Chromium...");
  const browser = await chromium.launch();

  try {
    if (stage === "screenshots" || stage === "all") {
      await captureGallery(browser);
    }
    if (stage === "video" || stage === "all") {
      await recordDemo(browser);
    }
  } finally {
    await browser.close();
    serverProc?.kill();
  }
  console.log("All media generated successfully!");
}

await run();
