import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    deps: { resolveDepSubpath: true },
    dts: {
      generator: "tsgo",
    },
    exports: true,
  },
  lint: {
    // `examples/*` are standalone apps with their own installs (published
    // packages, shadcn-generated code); they're verified by their own
    // `next build`, not the workspace toolchain.
    ignorePatterns: ["examples/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ["examples/**"],
  },
  test: {
    // Playwright owns `site/tests/e2e/**`; its `test()` fixture isn't
    // Vitest's, and the two must never share a test runner pass.
    exclude: ["**/node_modules/**", "**/site/tests/e2e/**", "examples/**"],
  },
});
