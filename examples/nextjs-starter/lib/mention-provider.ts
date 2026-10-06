import type { MentionItem } from "@slash-editor/core";

/**
 * `blockKit.mention.items`: asks `/api/mentions` for matching people. The
 * editor aborts the signal when the query changes, so a slow response never
 * overwrites a newer one.
 */
export async function searchMentions(
  query: string,
  { signal }: { signal: AbortSignal },
): Promise<MentionItem[]> {
  const response = await fetch(`/api/mentions?q=${encodeURIComponent(query)}`, { signal });

  if (!response.ok) {
    throw new Error(`Mention search failed (${response.status})`);
  }

  return response.json();
}
