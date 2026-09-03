import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      // Cliquet : la couverture ne peut pas baisser (constitution, principe VII).
      // Les seuils seront relevés au fil des fonctionnalités, jamais abaissés.
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: { lines: 0, functions: 0, branches: 0, statements: 0 },
    },
  },
});
