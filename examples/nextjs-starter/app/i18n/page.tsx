import type { Metadata } from "next";
import { I18nDemo } from "@/components/i18n-demo.tsx";

export const metadata: Metadata = {
  title: "Localization",
  description: "Translate the slash menu, toolbars and placeholders with the messages option.",
};

export default function I18nPage() {
  return <I18nDemo />;
}
