import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";

const REGISTRY_NAMESPACE = "@slash-editor";

/** `<InstallCommand item="slash-menu" />` — the exact `shadcn add` invocation for one item. */
export function InstallCommand({ item }: { item: string }) {
  return (
    <DynamicCodeBlock
      lang="bash"
      code={`bunx --bun shadcn@latest add ${REGISTRY_NAMESPACE}/${item}`}
    />
  );
}

/** `components.json` snippet every consumer adds once, before installing any item. */
export function RegistrySnippet() {
  const code = JSON.stringify(
    { registries: { [REGISTRY_NAMESPACE]: `https://slash-editor-eta.vercel.app/r/{name}.json` } },
    null,
    2,
  );
  return <DynamicCodeBlock lang="json" code={code} />;
}
