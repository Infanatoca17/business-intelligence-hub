import { defineConfig } from "vitest/config";
import { basePath } from "./deployment-base.mjs";
export default defineConfig({
  base: basePath,
  test: {
    include: ["tests/components.test.tsx"],
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: `http://localhost${basePath}` },
    },
    testTimeout: 20000,
  },
});
