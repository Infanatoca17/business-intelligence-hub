import { defineConfig } from "@playwright/test";
import { basePath } from "./deployment-base.mjs";
const previewURL = `http://127.0.0.1:4173${basePath}`;
export default defineConfig({
  testDir: "./tests/ui",
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: previewURL,
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: "npm run preview",
    url: previewURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
