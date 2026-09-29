"use client";

import dynamic from "next/dynamic";

const PlaygroundDemo = dynamic(
  () => import("./playground-demo.tsx").then((mod) => mod.PlaygroundDemo),
  {
    ssr: false,
  },
);

export { PlaygroundDemo };
