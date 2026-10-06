"use client";

import type { Content } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import { DemoHeader } from "@/components/demo-header.tsx";
import { EditorWorkspace } from "@/components/editor-surface.tsx";
import { Button } from "@/components/ui/button.tsx";
import { BLOCK_KIT, EDITOR_CLASS } from "@/lib/editor-kit.ts";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n-messages.ts";
import { useDemoEditor } from "@/lib/use-demo-editor.ts";

const STORAGE_KEY = "slash-editor-starter:i18n:locale";

const INITIAL_CONTENT = `
<h1>Translate the editor, keep the document</h1>
<p>Pick a language above, then type <code>/</code> on the empty line below. The menu, its groups and descriptions, the placeholders, the selection toolbar and the block handle menu all switch language. What you write stays as it is.</p>
<h2>Try this</h2>
<ul>
  <li><p>Select a few words to see the translated toolbar labels.</p></li>
  <li><p>Switch language mid-document: the content carries over.</p></li>
</ul>
<p></p>
`;

function isLocale(value: string | null): value is Locale {
  return LOCALES.some((locale) => locale.code === value);
}

function Skeleton() {
  return (
    <div className="bg-card border-border min-h-[60vh] animate-pulse rounded-xl border" aria-hidden />
  );
}

/**
 * Messages are latched when an editor is created, so each locale gets its own
 * instance (`key={locale}` in the parent). The parent hands the latest
 * document back through `content`, which is how the text survives a switch.
 */
function LocalizedEditor({
  locale,
  content,
}: {
  locale: Locale;
  content: { current: Content };
}) {
  const { messages } = LOCALES.find(({ code }) => code === locale)!;

  const editor = useDemoEditor({
    content: content.current,
    blockKit: { ...BLOCK_KIT, messages },
    // `content` is a ref, so this callback stays valid for the editor's lifetime.
    onUpdate: ({ editor: instance }) => {
      content.current = instance.getJSON();
    },
    editorProps: { attributes: { class: EDITOR_CLASS, "aria-label": "Document" } },
  });

  return <EditorWorkspace editor={editor} comments={false} />;
}

export function I18nDemo() {
  // `null` until storage has been read: the server can't know the saved language.
  const [locale, setLocale] = useState<Locale | null>(null);
  const content = useRef<Content>(INITIAL_CONTENT);

  useEffect(() => {
    let saved: string | null = null;

    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage blocked: start from the default language.
    }

    setLocale(isLocale(saved) ? saved : DEFAULT_LOCALE);
  }, []);

  function choose(next: Locale) {
    setLocale(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode or quota: the choice just won't survive a reload.
    }
  }

  const current = LOCALES.find(({ code }) => code === locale);

  return (
    <>
      <DemoHeader
        title="Localization"
        description={
          <>
            Every string the core renders is translated through one <code>messages</code> option.
            {current && (
              <>
                {" "}
                Type <code>/{current.search}</code> to find the table block in this language.
              </>
            )}
          </>
        }
        actions={
          <div role="group" aria-label="Language" className="bg-muted flex gap-0.5 rounded-lg p-0.5">
            {LOCALES.map(({ code, label }) => (
              <Button
                key={code}
                variant={code === locale ? "default" : "ghost"}
                size="sm"
                lang={code}
                aria-pressed={code === locale}
                onClick={() => choose(code)}
              >
                {label}
              </Button>
            ))}
          </div>
        }
      />

      {locale ? (
        // The wrapper carries `lang` so screen readers and spellcheck follow the editor's language.
        <div lang={locale}>
          <LocalizedEditor key={locale} locale={locale} content={content} />
        </div>
      ) : (
        <Skeleton />
      )}

      <section className="text-muted-foreground mt-8 flex max-w-3xl flex-col gap-2 text-sm">
        <h2 className="text-foreground text-sm font-medium">What is translated</h2>
        <p>
          <code>lib/i18n-messages.ts</code> holds one <code>SlashEditorMessages</code> per language:
          titles, descriptions and search aliases for every slash item (blocks, media, AI actions,
          pages), the menu group headings and <code>/</code> hint, block placeholders, the selection
          toolbar, the block handle menu, the untitled page name and the upload error.
        </p>
        <p>
          Aliases keep the English shorthands (<code>/h1</code>, <code>/todo</code>), so muscle
          memory still works. The demo&apos;s own chrome, such as the page header and the registry
          components&apos; labels, is plain JSX you translate in your own app.
        </p>
      </section>
    </>
  );
}
