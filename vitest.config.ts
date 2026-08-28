import { defineConfig } from "vitest/config";
import path from "node:path";

const rootDir = import.meta.dirname;

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "server-only": path.resolve(rootDir, "src/test/server-only-stub.ts"),
      "@": path.resolve(rootDir, "src"),
    },
  },
});
