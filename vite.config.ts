import { defineConfig } from "vite";
import { basePath } from "./deployment-base.mjs";

export default defineConfig({
  base: basePath,
  build: { sourcemap: false },
  server: { port: 5173, strictPort: true },
});
