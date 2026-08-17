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
      // Page/layout files are thin data-fetching + JSX wrappers, not worth
      // unit-testing directly; API routes have real logic (see revalidate).
      include: ["src/lib/**/*.ts", "src/components/**/*.{ts,tsx}", "src/data/**/*.ts", "src/app/api/**/*.ts"],
      exclude: ["src/components/ui/**", "src/**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
