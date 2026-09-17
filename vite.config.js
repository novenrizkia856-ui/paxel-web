import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const dir = import.meta.dirname;

// Docs pages are generated into docs/ by scripts/build-docs.mjs before Vite runs.
const docsPages = existsSync(resolve(dir, "docs"))
  ? Object.fromEntries(
      readdirSync(resolve(dir, "docs"))
        .filter((file) => file.endsWith(".html"))
        .map((file) => [`docs-${file.replace(/\.html$/, "")}`, resolve(dir, "docs", file)]),
    )
  : {};

export default defineConfig({
  build: {
    target: "es2020",
    // Hashed bundles live in /bundle so they can be cached forever. Images and videos stay in /assets.
    assetsDir: "bundle",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: resolve(dir, "index.html"),
        app: resolve(dir, "app.html"),
        ...docsPages,
      },
    },
  },
});
