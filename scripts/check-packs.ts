/**
 * Pre-publish gate of the release workflow: `bun scripts/check-packs.ts <pack-dir> <version>`.
 *
 * Reads the manifest inside every tarball under <pack-dir> and fails unless both lockstep packages
 * are there at <version>, no dependency still uses a workspace-only protocol (`workspace:`,
 * `catalog:`) that consumers cannot resolve, and every internal `@slash-editor/*` dependency pins
 * <version> — `bun pm pack` fills `workspace:*` from bun.lock, which can lag a version bump.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const EXPECTED = ["@slash-editor/core", "@slash-editor/react"];
const DEPENDENCY_FIELDS = [
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
  "devDependencies",
] as const;

type Manifest = { name: string; version: string } & Partial<
  Record<(typeof DEPENDENCY_FIELDS)[number], Record<string, string>>
>;

const [packDir, version] = process.argv.slice(2);
if (!packDir || !version) {
  throw new Error("Usage: bun scripts/check-packs.ts <pack-dir> <version>");
}

const tarballs = readdirSync(packDir, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".tgz"))
  .map((file) => join(packDir, file));

const errors: string[] = [];
const seen = new Set<string>();

for (const tarball of tarballs) {
  const manifest = JSON.parse(
    execFileSync("tar", ["-xzOf", tarball, "package/package.json"], { encoding: "utf8" }),
  ) as Manifest;
  seen.add(manifest.name);
  if (!EXPECTED.includes(manifest.name))
    errors.push(`${tarball}: unexpected package ${manifest.name}`);
  if (manifest.version !== version) {
    errors.push(`${manifest.name}: version ${manifest.version}, expected ${version}`);
  }
  for (const field of DEPENDENCY_FIELDS) {
    for (const [dependency, range] of Object.entries(manifest[field] ?? {})) {
      if (/^(workspace|catalog):/.test(range)) {
        errors.push(`${manifest.name}: ${field}.${dependency} is unresolved "${range}"`);
      } else if (EXPECTED.includes(dependency) && range !== version) {
        errors.push(
          `${manifest.name}: ${field}.${dependency} is "${range}", expected "${version}"`,
        );
      }
    }
  }
}

for (const name of EXPECTED) {
  if (!seen.has(name)) errors.push(`missing tarball for ${name}`);
}
if (seen.size !== tarballs.length) errors.push("more than one tarball for the same package");

if (errors.length > 0) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}
console.log(`✓ ${tarballs.length} tarballs at ${version}: ${[...seen].join(", ")}`);
