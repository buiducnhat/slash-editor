import { searchDirectory } from "@/lib/directory.ts";

/** `GET /api/mentions?q=ada` → `MentionItem[]`. Swap `searchDirectory` for your user search. */
export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  return Response.json(searchDirectory(query));
}
