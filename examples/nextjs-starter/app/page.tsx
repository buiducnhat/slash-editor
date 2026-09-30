import { Editor } from "@/components/editor";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">slash-editor starter</h1>
        <p className="text-muted-foreground text-sm">
          Type <kbd>/</kbd> for blocks, <kbd>@</kbd> for mentions, or select text to format it.{" "}
          <a className="underline underline-offset-4" href="https://slasheditor.dev/docs">
            Docs
          </a>
        </p>
      </header>
      <Editor />
    </main>
  );
}
