import { HomeLayout } from "fumadocs-ui/layouts/home";
import Image from "next/image";

import { LinkButton } from "~/components/landing/link-button.tsx";
import { baseOptions } from "~/lib/layout.shared.tsx";

/**
 * Logo mark on an accent tile, so the nav carries the brand colour in both
 * themes. Fumadocs already wraps the title in a link to `/`.
 */
function HomeTitle() {
  return (
    <>
      <span className="bg-brand flex size-8 items-center justify-center rounded-lg">
        <Image src="/logo.png" alt="" width={20} height={20} priority />
      </span>
      slash-editor
    </>
  );
}

export default function Layout({ children }: LayoutProps<"/">) {
  const base = baseOptions();
  return (
    <div data-home className="contents">
      <HomeLayout
        {...base}
        nav={{ ...base.nav, title: <HomeTitle /> }}
        links={[
          ...(base.links ?? []),
          {
            type: "custom",
            secondary: true,
            children: (
              <LinkButton href="/docs/getting-started/installation" className="h-9 px-4">
                Get started
              </LinkButton>
            ),
          },
        ]}
      >
        {children}
      </HomeLayout>
    </div>
  );
}
