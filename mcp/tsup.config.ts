import { defineConfig } from "tsup"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, "..")

export default defineConfig({
  entry: { "qollabi-mcp": path.join(here, "server.ts") },
  outDir: path.join(repoRoot, "dist"),
  format: ["esm"],
  target: "node20",
  clean: true,
  splitting: false,
  sourcemap: false,
  dts: false,
  banner: { js: "#!/usr/bin/env node" },
  // Ship as .mjs so Node treats it as ESM without needing "type": "module"
  // in the repo package.json (which would conflict with Next.js tooling).
  outExtension() {
    return { js: ".mjs" }
  },
  // Resolve the @/* alias used by lib/customer-database.ts & friends.
  esbuildOptions(options) {
    options.alias = {
      "@": repoRoot,
    }
  },
})
