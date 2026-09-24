import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image src="/logo.png" alt="" width={22} height={22} priority className="dark:invert" />
          slash-editor
        </>
      ),
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
