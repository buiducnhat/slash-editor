import {
  BlocksIcon,
  BrainIcon,
  KeyboardIcon,
  ScaleIcon,
  UsersIcon,
  WandSparklesIcon,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: BlocksIcon,
    title: "Headless core, any UI",
    description:
      "@slash-editor/core is Tiptap/ProseMirror extensions and commands only — no React, no CSS. The same logic can back another renderer later.",
  },
  {
    icon: ScaleIcon,
    title: "You own the markup",
    description:
      "The rendered UI installs as source through a shadcn registry, not a locked component library. Restyle with your own tokens from day one.",
  },
  {
    icon: KeyboardIcon,
    title: "Keyboard-first block UX",
    description:
      "Slash insertion, hover drag handles, reordering, nesting, block comments — the interaction model free tiptap+shadcn projects stop short of.",
  },
  {
    icon: UsersIcon,
    title: "Real-time collaboration",
    description:
      "Yjs + Hocuspocus, self-hosted — presence carets and a comment thread store included, no hosted sync server to pay for.",
  },
  {
    icon: WandSparklesIcon,
    title: "AI slash actions",
    description:
      "Continue writing, summarize, brainstorm, fix grammar — streamed through a StreamAdapter you implement against any model.",
  },
  {
    icon: BrainIcon,
    title: "100% MIT",
    description:
      "No paid tier, no hosted dependency, no relicensing risk hiding behind a free tier. Every dependency in the graph is MIT.",
  },
];

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="bg-fd-background flex flex-col gap-3 p-6">
          <feature.icon className="text-fd-primary size-5" aria-hidden />
          <h3 className="text-sm font-medium">{feature.title}</h3>
          <p className="text-fd-muted-foreground text-sm leading-6">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
