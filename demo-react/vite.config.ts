import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Develop against package sources so HMR covers the whole workspace.
      "@slash-editor/core": fileURLToPath(
        new URL("../packages/core/src/index.ts", import.meta.url),
      ),
      "@slash-editor/react": fileURLToPath(
        new URL("../packages/react/src/index.ts", import.meta.url),
      ),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
