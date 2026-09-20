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
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
  test: {
    // Playwright owns `demo-react/tests/e2e/**`; its `test()` fixture isn't
    // Vitest's, and the two must never share a test runner pass.
    exclude: ["**/node_modules/**", "**/demo-react/tests/e2e/**"],
  },
});
