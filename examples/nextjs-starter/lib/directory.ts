import type { MentionItem } from "@slash-editor/core";

/**
 * Sample people the `@` menu searches. Server-side only: the browser reaches it
 * through `/api/mentions`. Replace with a query against your user table.
 */
export const DIRECTORY: MentionItem[] = [
  { id: "1", label: "Ada Lovelace", description: "ada@example.com" },
  { id: "2", label: "Alan Turing", description: "alan@example.com" },
  { id: "3", label: "Grace Hopper", description: "grace@example.com" },
  { id: "4", label: "Katherine Johnson", description: "katherine@example.com" },
  { id: "5", label: "Margaret Hamilton", description: "margaret@example.com" },
  { id: "6", label: "Linus Torvalds", description: "linus@example.com" },
  { id: "7", label: "Barbara Liskov", description: "barbara@example.com" },
];

export function searchDirectory(query: string, limit = 8): MentionItem[] {
  const normalized = query.trim().toLowerCase();
  const matches = normalized
    ? DIRECTORY.filter(
        (item) =>
          item.label.toLowerCase().includes(normalized) ||
          item.description?.toLowerCase().includes(normalized),
      )
    : DIRECTORY;

  return matches.slice(0, limit);
}
