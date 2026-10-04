import type { PageStore } from "@slash-editor/core";
import { usePage } from "@slash-editor/react";
import type { Editor } from "@tiptap/core";
import { ImageIcon, SmilePlusIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { cn } from "cn";

const PRESET_EMOJIS = [
  "📄",
  "📝",
  "📚",
  "📌",
  "💡",
  "🎯",
  "🚀",
  "✅",
  "🔥",
  "⭐",
  "🧠",
  "🛠️",
  "📅",
  "💬",
  "🎨",
  "🌱",
];

const TITLE_SELECTOR = "[data-page-title]";

/** Focuses the page title input with the caret at the end. `false` when no header is mounted. */
export function focusPageTitle(): boolean {
  const input = document.querySelector<HTMLInputElement>(TITLE_SELECTOR);

  if (!input) return false;

  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  return true;
}

export interface PageHeaderProps {
  store: PageStore;
  pageId: string;
  /** Receives focus when Enter or ArrowDown is pressed in the title. */
  editor: Editor | null | undefined;
  className?: string;
}

/** Icon, cover and title of a page, editing the host-owned metadata through `store.update`. */
export function PageHeader({ store, pageId, editor, className }: PageHeaderProps): ReactNode {
  const { page } = usePage(store, pageId);
  const [title, setTitle] = useState(page?.title ?? "");
  const [iconOpen, setIconOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [coverDraft, setCoverDraft] = useState("");
  const focused = useRef(false);
  const storeTitle = page?.title;
  const [titleFor, setTitleFor] = useState(pageId);

  // A different page without a remount: drop the old draft instead of writing it to the new page.
  if (titleFor !== pageId) {
    setTitleFor(pageId);
    setTitle(storeTitle ?? "");
  }

  useEffect(() => {
    if (!focused.current && storeTitle !== undefined) setTitle(storeTitle);
  }, [storeTitle]);

  const icon = page?.icon;
  const cover = page?.cover;

  const applyCover = () => {
    const value = coverDraft.trim();
    if (value) {
      void store.update(pageId, { cover: value });
      setCoverOpen(false);
    }
  };

  const coverPopover = (label: string) => (
    <Popover
      open={coverOpen}
      onOpenChange={(open) => {
        setCoverOpen(open);
        if (open) setCoverDraft(cover ?? "");
      }}
    >
      <PopoverTrigger
        render={
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" />
        }
      >
        <ImageIcon />
        {label}
      </PopoverTrigger>
      <PopoverContent align="start">
        <Input
          value={coverDraft}
          placeholder="Paste an image URL…"
          aria-label="Cover image URL"
          onChange={(event) => setCoverDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyCover();
            }
          }}
        />
        <div className="flex justify-end gap-1.5">
          {cover ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                void store.update(pageId, { cover: "" });
                setCoverOpen(false);
              }}
            >
              Remove
            </Button>
          ) : null}
          <Button type="button" size="sm" disabled={!coverDraft.trim()} onClick={applyCover}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <header data-testid="page-header" className={cn("group/page-header flex flex-col", className)}>
      {cover ? (
        <div className="bg-muted relative h-44 w-full overflow-hidden rounded-lg">
          <img src={cover} alt="" className="size-full object-cover" />
          <div className="absolute right-2 bottom-2 opacity-0 transition-opacity group-focus-within/page-header:opacity-100 group-hover/page-header:opacity-100">
            {coverPopover("Change cover")}
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-1 pt-4">
        <div className="flex items-center gap-1">
          <Popover open={iconOpen} onOpenChange={setIconOpen}>
            {icon ? (
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label="Change icon"
                    className="size-14 text-4xl"
                  />
                }
              >
                {icon}
              </PopoverTrigger>
            ) : (
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground opacity-0 transition-opacity group-focus-within/page-header:opacity-100 group-hover/page-header:opacity-100"
                  />
                }
              >
                <SmilePlusIcon />
                Add icon
              </PopoverTrigger>
            )}
            <PopoverContent align="start">
              <div className="grid grid-cols-8 gap-1">
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={emoji}
                    className="hover:bg-muted flex size-7 items-center justify-center rounded-sm text-lg"
                    onClick={() => {
                      void store.update(pageId, { icon: emoji });
                      setIconOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {icon ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void store.update(pageId, { icon: "" });
                    setIconOpen(false);
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </PopoverContent>
          </Popover>
          {cover ? null : (
            <div className="opacity-0 transition-opacity group-focus-within/page-header:opacity-100 group-hover/page-header:opacity-100">
              {coverPopover("Add cover")}
            </div>
          )}
        </div>
        <input
          data-page-title
          aria-label="Page title"
          placeholder="Untitled"
          value={title}
          className="placeholder:text-muted-foreground w-full border-none bg-transparent text-4xl font-bold outline-none"
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            if (storeTitle !== undefined) setTitle(storeTitle);
          }}
          onChange={(event) => {
            setTitle(event.target.value);
            void store.update(pageId, { title: event.target.value });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "ArrowDown") {
              event.preventDefault();
              editor?.commands.focus("start");
            }
          }}
        />
      </div>
    </header>
  );
}
