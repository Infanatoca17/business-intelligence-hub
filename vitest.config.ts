import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/components.test.tsx"],
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "http://localhost/program-intelligence-hub/" },
    },
    testTimeout: 20000,
  },
});
