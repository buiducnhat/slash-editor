"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils.ts";

export function CopyCommand({ command, className }: { command: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      className={cn(
        "border-border bg-muted/50 flex items-center gap-3 rounded-xl border py-2 pr-2 pl-4",
        className,
      )}
    >
      <span aria-hidden className="text-brand font-mono text-sm select-none">
        $
      </span>
      <code className="text-foreground min-w-0 flex-1 font-mono text-[13px] leading-relaxed break-all">
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy command"}
        className="text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-ring inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 active:scale-95"
      >
        {copied ? (
          <CheckIcon className="text-brand size-4" strokeWidth={1.5} aria-hidden />
        ) : (
          <CopyIcon className="size-4" strokeWidth={1.5} aria-hidden />
        )}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Command copied" : ""}
      </span>
    </div>
  );
}
