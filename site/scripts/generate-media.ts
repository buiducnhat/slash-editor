import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "../..");
const galleryDir = path.join(rootDir, ".github/assets/gallery");
const assetsDir = path.join(rootDir, ".github/assets");

if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

async function run() {
  console.log("Launching Chromium...");
  const browser = await chromium.launch();

  // 1. Capture high-res marketing gallery images
  console.log("Capturing marketing gallery screenshots...");
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  await page.goto("https://slasheditor.dev/playground", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Screenshot 1: Full Playground Editor Overview
  await page.screenshot({
    path: path.join(galleryDir, "01-playground-overview.png"),
    clip: { x: 120, y: 70, width: 1200, height: 800 },
  });
  console.log("✓ Captured 01-playground-overview.png");

  // Screenshot 2: Slash Menu in action
  const editor = page.locator(".slash-content");
  const trailingP = editor.locator("p").last();
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
  await page.goto("https://slasheditor.dev", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(galleryDir, "04-landing-hero.png"),
    clip: { x: 120, y: 60, width: 1200, height: 800 },
  });
  console.log("✓ Captured 04-landing-hero.png");

  await context.close();

  // 2. Record interactive demo video
  console.log("Recording interactive demo video...");
  const tempVideoDir = path.join(galleryDir, "temp-video");
  if (!fs.existsSync(tempVideoDir)) {
    fs.mkdirSync(tempVideoDir, { recursive: true });
  }

  const recordContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 1280, height: 720 },
    },
  });

  const recordPage = await recordContext.newPage();
  await recordPage.goto("https://slasheditor.dev/playground", { waitUntil: "networkidle" });
  await recordPage.waitForTimeout(800);

  const recEditor = recordPage.locator(".slash-content");
  const p = recEditor.locator("p").last();
  await p.click();
  await recordPage.waitForTimeout(500);
  // 1. Text selection and Bubble Toolbar demo
  await recordPage.keyboard.type("Build Notion-style block editors", { delay: 40 });
  await recordPage.waitForTimeout(300);
  for (let i = 0; i < "block editors".length; i++) {
    await recordPage.keyboard.press("Shift+ArrowLeft");
    await recordPage.waitForTimeout(30);
  }
  await recordPage.waitForSelector('[data-slot="popover-content"]', { state: "visible" });
  await recordPage.waitForTimeout(600);

  // Click Bold button on the bubble toolbar
  const boldBtn = recordPage.getByRole("button", { name: "Bold" });
  await boldBtn.click();
  await recordPage.waitForTimeout(500);

  // Move cursor to end of line
  await recordPage.keyboard.press("ArrowRight");
  await recordPage.waitForTimeout(300);
  await recordPage.keyboard.press("Enter");
  await recordPage.waitForTimeout(400);

  // 2. Type slash command for Callout
  await recordPage.keyboard.type("/", { delay: 90 });
  await recordPage.waitForTimeout(350);
  await recordPage.keyboard.type("callout", { delay: 60 });
  await recordPage.waitForTimeout(350);
  await recordPage.keyboard.press("Enter");
  await recordPage.waitForTimeout(400);

  // 3. Type inside callout
  await recordPage.keyboard.type("100% MIT — No paid tier, no hosted dependency.", { delay: 40 });
  await recordPage.waitForTimeout(600);

  // Exit callout to new block
  await recordPage.keyboard.press("Enter");
  await recordPage.keyboard.press("Enter");
  await recordPage.waitForTimeout(300);

  // 4. Type slash again and navigate
  await recordPage.keyboard.type("/", { delay: 80 });
  await recordPage.waitForTimeout(350);
  for (let i = 0; i < 4; i++) {
    await recordPage.keyboard.press("ArrowDown");
    await recordPage.waitForTimeout(160);
  }
  await recordPage.waitForTimeout(400);
  await recordPage.keyboard.press("Escape");
  await recordPage.waitForTimeout(400);

  // 5. Hover over a block to show gutter grip
  const calloutBlock = recEditor.locator('[data-type="callout"]').last();
  const box = await calloutBlock.boundingBox();
  if (box) {
    await recordPage.mouse.move(box.x - 10, box.y + box.height / 2, { steps: 5 });
    await recordPage.waitForTimeout(800);
  }

  await recordPage.close();
  await recordContext.close();

  // Find generated video
  const videoFiles = fs.readdirSync(tempVideoDir).filter((f) => f.endsWith(".webm"));
  if (videoFiles.length > 0) {
    const rawVideo = path.join(tempVideoDir, videoFiles[0]);
    const finalMp4 = path.join(assetsDir, "demo.mp4");
    const finalGif = path.join(assetsDir, "demo.gif");

    console.log("Converting recorded video to MP4...");
    execSync(
      `ffmpeg -y -i "${rawVideo}" -c:v libx264 -pix_fmt yuv420p -r 30 -filter:v "crop=1280:720" "${finalMp4}"`,
      { stdio: "inherit" },
    );

    console.log("Generating high quality animated GIF with palettegen...");
    execSync(
      `ffmpeg -y -i "${rawVideo}" -filter_complex "[0:v] fps=20,scale=960:-1:flags=lanczos,split [a][b];[a] palettegen=max_colors=128 [p];[b][p] paletteuse=dither=bayer:bayer_scale=3" "${finalGif}"`,
      { stdio: "inherit" },
    );

    // Clean up temp
    fs.rmSync(tempVideoDir, { recursive: true, force: true });
    console.log("✓ Generated demo.mp4 and demo.gif in .github/assets/");
  }

  await browser.close();
  console.log("All media generated successfully!");
}

await run();
