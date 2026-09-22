import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "slash-editor",
    },
    links: [
      {
        text: "Docs",
        url: "/docs",
      },
      {
        text: "Playground",
        url: "/playground",
      },
    ],
    githubUrl: "https://github.com/buiducnhat/slash-editor",
  };
}
