import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { UPLOAD_DIR } from "@/lib/upload-store.ts";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

/** Files named `fail-*` are rejected once, so the retry button has something to recover from. */
const failedOnce = new Set<string>();

/**
 * `POST /api/upload` (multipart `file`) → `{ url, name, size, type }`.
 *
 * Files go to the OS temp directory so the starter works with zero setup, but
 * that disk is ephemeral (and not shared between serverless instances).
 * Replace the `writeFile` call with S3, R2, Vercel Blob, or similar and return
 * the public URL.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Expected a multipart `file` field" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File is larger than 10 MB" }, { status: 413 });
  }

  if (file.name.startsWith("fail-") && !failedOnce.has(file.name)) {
    failedOnce.add(file.name);
    return Response.json({ error: `Mock upload failed for "${file.name}"` }, { status: 500 });
  }

  const id = randomUUID();

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, id), Buffer.from(await file.arrayBuffer()));
  await writeFile(join(UPLOAD_DIR, `${id}.json`), JSON.stringify({ name: file.name, type: file.type }));

  return Response.json({
    url: `/api/upload/${id}`,
    name: file.name,
    size: file.size,
    type: file.type,
  });
}
