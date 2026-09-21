import { useState } from "react";
import { cn } from "@/lib/utils.ts";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        "shrink-0 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
        "border-border bg-card hover:bg-muted/60",
      )}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** A copy-paste `shadcn add <registry-url>` box — shared by the overview and every item page. */
export function InstallCommand({ command }: { command: string }) {
  return (
    <div className="border-border bg-muted/40 flex items-center gap-2 rounded-md border p-2">
      <code className="min-w-0 flex-1 truncate text-xs">{command}</code>
      <CopyButton text={command} />
    </div>
  );
}

/** A copy-paste multi-line code box (e.g. the `components.json` registry snippet). */
export function CodeBlock({ code }: { code: string }) {
  return (
    <div className="border-border bg-muted/40 flex items-start gap-2 rounded-md border p-2">
      <pre className="min-w-0 flex-1 overflow-x-auto text-xs">
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  );
}
