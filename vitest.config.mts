import { config } from "dotenv";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

config({ path: ".env.test" });

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit-frontend",
          environment: "jsdom",
          include: ["tests/unit/frontend/**/*.test.{ts,tsx}"],
          setupFiles: ["tests/setup/frontend.ts"],
          globals: true,
        },
      },
      {
        extends: true,
        test: {
          name: "unit-backend",
          environment: "node",
          include: ["tests/unit/backend/**/*.test.ts"],
          setupFiles: ["tests/setup/backend.ts"],
          globals: true,
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/setup/integration-global.ts"],
          setupFiles: ["tests/setup/backend.ts"],
          globals: true,
          fileParallelism: false,
        },
      },
    ],
  },
});