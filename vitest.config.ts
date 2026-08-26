import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // cms/ is a separate app with its own vitest.config.ts and `@` alias — see tsconfig.json/eslint.config.mjs for the same split.
    // .claude/worktrees/** are separate git worktree checkouts (see AGENTS.md) with their own
    // node_modules/React copy — picking their tests up here mixes two React instances and breaks hooks.
    exclude: ["**/node_modules/**", "cms/**", ".claude/worktrees/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // layout.tsx is excluded: it loads local font files via next/font/local,
      // which needs build-time tooling this test environment doesn't have —
      // not a "too thin to bother" judgment call like the old page.tsx
      // exclusion, an actual tooling constraint. Every other src/app/ file
      // (page.tsx included — each mocks its own CMS getters and asserts the
      // CMS-vs-fallback branch, same pattern as SimpleProductPage/Header/
      // Footer) is covered like any other source.
      include: ["src/lib/**/*.ts", "src/components/**/*.{ts,tsx}", "src/data/**/*.ts", "src/app/**/*.{ts,tsx}"],
      exclude: ["src/components/ui/**", "src/**/*.d.ts", "src/app/layout.tsx"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
