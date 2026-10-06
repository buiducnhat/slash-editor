"use client";

import { ArrowRightIcon, DicesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { DemoHeader } from "@/components/demo-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { EDITOR_CARD } from "@/components/editor-surface.tsx";
import { cn } from "@/lib/utils.ts";

const SUGGESTIONS = ["lobby", "standup", "brainstorm"];
const ADJECTIVES = ["quiet", "bright", "swift", "amber", "mellow", "bold", "lucky", "cosmic"];
const NOUNS = ["otter", "falcon", "maple", "harbor", "comet", "lantern", "meadow", "pixel"];

/** Picks a room and navigates to it. Rooms need no creation step: the first visitor makes it. */
export function CollabLobby() {
  const router = useRouter();
  const [value, setValue] = useState("");
  // Room names become URL segments and `y-webrtc` topics, so keep them tidy.
  const room = value.trim().toLowerCase().replace(/\s+/g, "-");

  function join(name: string) {
    router.push(`/collab/${encodeURIComponent(name)}`);
  }

  function joinRandomRoom() {
    const [adjective, noun] = [ADJECTIVES, NOUNS].map(
      (words) => words[Math.floor(Math.random() * words.length)],
    );
    join(`${adjective}-${noun}-${Math.floor(Math.random() * 100)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (room) join(room);
  }

  return (
    <>
      <DemoHeader
        title="Real-time collaboration"
        description="Yjs with live carets and presence avatars. Pick a room, open it in a second tab, and watch both documents converge."
      />
      <section className={cn(EDITOR_CARD, "flex max-w-xl flex-col gap-5 p-6")}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor="collab-room" className="text-sm font-medium">
            Room name
          </label>
          <div className="flex gap-2">
            <Input
              id="collab-room"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="e.g. lobby"
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="submit" disabled={!room}>
              Join
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((name) => (
              <Button key={name} variant="outline" size="sm" onClick={() => join(name)}>
                {name}
              </Button>
            ))}
            <Button variant="secondary" size="sm" onClick={joinRandomRoom}>
              <DicesIcon data-icon="inline-start" />
              Random room
            </Button>
          </div>
        </div>
      </section>

      <section className="text-muted-foreground mt-8 flex max-w-xl flex-col gap-2 text-sm">
        <h2 className="text-foreground text-sm font-medium">How to try it</h2>
        <ol className="flex list-decimal flex-col gap-1 pl-5">
          <li>Join a room, then open the same URL in a second tab (or use “Copy link”).</li>
          <li>Type in either tab: text, carets and selections sync live.</li>
          <li>
            To collaborate across devices, run a signaling server and set{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              NEXT_PUBLIC_WEBRTC_SIGNALING_URL
            </code>
            . Without one, tabs of the same browser still sync through BroadcastChannel.
          </li>
        </ol>
      </section>
    </>
  );
}
