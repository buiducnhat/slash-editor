import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "~/lib/source.ts";
import { baseOptions } from "~/lib/layout.shared.tsx";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
