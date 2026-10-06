import {
  EyeIcon,
  FileTextIcon,
  LanguagesIcon,
  LayoutIcon,
  PuzzleIcon,
  SparklesIcon,
  UploadIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { FileCodeIcon } from "lucide-react";
import type { Demo } from "@/lib/demos.ts";

const ICONS: Record<Demo["icon"], LucideIcon> = {
  layout: LayoutIcon,
  pages: FileTextIcon,
  users: UsersIcon,
  sparkles: SparklesIcon,
  markdown: FileCodeIcon,
  languages: LanguagesIcon,
  upload: UploadIcon,
  eye: EyeIcon,
  puzzle: PuzzleIcon,
};

export function DemoIcon({ name, className }: { name: Demo["icon"]; className?: string }) {
  const Icon = ICONS[name];

  return <Icon className={className} aria-hidden />;
}
