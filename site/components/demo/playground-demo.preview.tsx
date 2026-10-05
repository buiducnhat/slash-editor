"use client";

import dynamic from "next/dynamic";

/** Matches the editor card's footprint so the page does not shift when it mounts. */
function DemoSkeleton() {
  return (
    <div
      aria-hidden
      className="bg-card border-border flex min-h-[50vh] flex-col gap-4 rounded-xl border px-8 py-8 shadow-sm md:pl-24"
    >
      <div className="bg-muted h-8 w-2/3 animate-pulse rounded-md motion-reduce:animate-none" />
      <div className="bg-muted h-4 w-full animate-pulse rounded-md motion-reduce:animate-none" />
      <div className="bg-muted h-4 w-4/5 animate-pulse rounded-md motion-reduce:animate-none" />
      <div className="bg-muted mt-4 h-4 w-1/2 animate-pulse rounded-md motion-reduce:animate-none" />
      <div className="bg-muted h-4 w-2/5 animate-pulse rounded-md motion-reduce:animate-none" />
    </div>
  );
}

const PlaygroundDemo = dynamic(
  () => import("./playground-demo.tsx").then((mod) => mod.PlaygroundDemo),
  {
    ssr: false,
    loading: () => <DemoSkeleton />,
  },
);

export { PlaygroundDemo };
