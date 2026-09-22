import { defineConfig } from "vite";

export default defineConfig({
  base: "/program-intelligence-hub/",
  build: { sourcemap: false },
  server: { port: 5173, strictPort: true },
});
