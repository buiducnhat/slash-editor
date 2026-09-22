import { defineConfig, devices } from "@playwright/test";

const SIGNALING_PORT = 4444;
const SIGNALING_URL = `ws://localhost:${SIGNALING_PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // A self-hosted signaling server so tests/e2e/collab.spec.ts's
      // WebRTC peers find each other over localhost instead of the public
      // internet (deterministic, no external network dependency in CI) —
      // see registry/lib/collaboration.ts's NEXT_PUBLIC_WEBRTC_SIGNALING_URL.
      command: "bun run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { NEXT_PUBLIC_WEBRTC_SIGNALING_URL: SIGNALING_URL },
    },
    {
      // Started for collab.spec.ts only — every other spec never touches
      // WebRTC, so a slow/dead signaling server can't flake them.
      command: "bun run signaling:server",
      port: SIGNALING_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { PORT: String(SIGNALING_PORT) },
    },
  ],
});
