import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  outputFileTracingRoot: fileURLToPath(new URL("..", import.meta.url)),
  async rewrites() {
    return [{ source: "/docs/:slug*.md", destination: "/llms.mdx/docs/:slug*/content.md" }];
  },
};

export default withMDX(config);
