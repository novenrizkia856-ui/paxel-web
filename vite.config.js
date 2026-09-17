import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    // Hashed bundles live in /bundle so they can be cached forever. Images and videos stay in /assets.
    assetsDir: "bundle",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        app: resolve(import.meta.dirname, "app.html"),
      },
    },
  },
});
