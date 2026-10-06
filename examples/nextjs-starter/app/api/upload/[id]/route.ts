import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { UPLOAD_DIR } from "@/lib/upload-store.ts";

export const runtime = "nodejs";

const ID = /^[0-9a-f-]{36}$/;

/** `GET /api/upload/:id` streams a stored file back with the content type it was uploaded with. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!ID.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const [body, meta] = await Promise.all([
      readFile(join(UPLOAD_DIR, id)),
      readFile(join(UPLOAD_DIR, `${id}.json`), "utf8"),
    ]);
    const { name, type } = JSON.parse(meta) as { name: string; type: string };

    return new Response(body, {
      headers: {
        "Content-Type": type || "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(name)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
