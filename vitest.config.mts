import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    maxWorkers: 1,
    testTimeout: 15_000,
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      include: [
        "app/products/new/product-form-schema.ts",
        "app/products/new/product-form-utils.ts",
        "store/draft-slice.ts",
        "store/ui-slice.ts",
      ],
      thresholds: {
        statements: 80.01,
        branches: 80.01,
        functions: 80.01,
        lines: 80.01,
      },
    },
  },
});
