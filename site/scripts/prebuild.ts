#!/usr/bin/env bun
/**
 * Runs before `next build` (see `package.json`'s `build` script). Builds
 * `/r/:name.json` — the shadcn registry, from `registry.json` + `registry/**`
 * — directly into `public/r/`.
 *
 * Path is a hard constraint: published `components.json` files already
 * point at `/r/{name}.json`.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { $ } from "bun";

const siteDir = fileURLToPath(new URL("..", import.meta.url));

async function buildRegistry() {
  console.log("[prebuild] shadcn build (registry)");
  await $`bunx --bun shadcn build`.cwd(siteDir);

  const src = path.join(siteDir, "public", "r");
  if (!existsSync(src)) {
    throw new Error(`registry build did not produce ${src}`);
  }
  console.log(`[prebuild] registry -> public/r`);
}

await buildRegistry();
