import { defineConfig, devices } from "@playwright/test";

/*
  Smoke tests for the recruiter path. Uses the installed Microsoft Edge, so no
  browser download is needed. Reuses a dev server already running on :3000.
*/
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "list",
  // Each page runs a WebGL field; give assertions room when many windows share the GPU.
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    channel: "msedge",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Edge"], channel: "msedge" } },
    { name: "phone", use: { ...devices["Pixel 7"], channel: "msedge" } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
