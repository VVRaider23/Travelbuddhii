import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Only pure logic in src/lib gets unit tested. API routes are verified with curl
// against a running dev server, and the whole flow is walked in a browser, so
// there is no jsdom or React testing setup here on purpose.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    // Mirrors the "@/*" path alias in tsconfig.json so tests import the same way
    // the app does.
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
