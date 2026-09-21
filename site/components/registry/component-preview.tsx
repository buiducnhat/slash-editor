import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import registryData from "../../registry.json" with { type: "json" };

interface RegistryFile {
  path: string;
  type: string;
}

interface RegistryItem {
  name: string;
  title: string;
  description: string;
  files?: RegistryFile[];
}

interface RegistrySource {
  fileName: string;
  code: string;
}

const REGISTRY_DIR = path.join(process.cwd(), "registry");
const REGISTRY_ITEMS = registryData.items as RegistryItem[];

function findRegistryItem(name: string): RegistryItem {
  const item = REGISTRY_ITEMS.find((candidate) => candidate.name === name);
  if (!item) {
    throw new Error(`No registry item named "${name}" in registry.json`);
  }
  return item;
}

/** Every `registry.json` file path is `registry/<rest>`; strip that prefix before rejoining
 * under a literal `registry` segment, so Next's static analysis can scope the read instead of
 * tracing the whole project (see the `outputFileTracing` warning this silences). */
async function readRegistrySources(item: RegistryItem): Promise<RegistrySource[]> {
  const files = item.files ?? [];
  return Promise.all(
    files.map(async (file) => {
      const relative = file.path.replace(/^registry\//, "");
      return {
        fileName: file.path.split("/").at(-1) ?? file.path,
        code: await readFile(path.join(REGISTRY_DIR, relative), "utf-8"),
      };
    }),
  );
}

/**
 * Preview/Code tabs for one registry item, `<ComponentPreview name="slash-menu">`.
 * The Code tab reads straight from `registry/components/*` — the exact
 * files `shadcn add` installs — so a demo can never silently drift from the
 * shipped component. `children` is the live demo, already wrapped `ssr: false`
 * by `registry-demos.preview.tsx`.
 */
export async function ComponentPreview({ name, children }: { name: string; children: ReactNode }) {
  const item = findRegistryItem(name);
  const sources = await readRegistrySources(item);

  return (
    <Tabs items={["Preview", "Code"]} className="not-prose">
      <Tab value="Preview">
        <div className="bg-fd-background rounded-lg border p-6">{children}</div>
      </Tab>
      <Tab value="Code">
        {sources.length > 1 ? (
          <Tabs items={sources.map((source) => source.fileName)}>
            {sources.map((source) => (
              <Tab key={source.fileName} value={source.fileName}>
                <DynamicCodeBlock lang="tsx" code={source.code} />
              </Tab>
            ))}
          </Tabs>
        ) : (
          sources[0] && <DynamicCodeBlock lang="tsx" code={sources[0].code} />
        )}
      </Tab>
    </Tabs>
  );
}
