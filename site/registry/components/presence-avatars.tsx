import type { PresenceProvider } from "@slash-editor/react";
import { usePresence } from "@slash-editor/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";

/** Renders connected peers (excluding the local user) as a row of colored initials. */
export function PresenceAvatars({ provider }: { provider: PresenceProvider }) {
  const peers = usePresence(provider);

  if (peers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center -space-x-1.5" data-testid="presence-avatars">
      {peers.map((peer) => {
        const name = typeof peer.name === "string" && peer.name.length > 0 ? peer.name : "Guest";
        const color = typeof peer.color === "string" ? peer.color : "var(--muted-foreground)";

        return (
          <Tooltip key={peer.clientId}>
            <TooltipTrigger
              render={
                <span
                  data-testid="presence-avatar"
                  data-name={name}
                  className="border-background flex size-6 items-center justify-center rounded-full border-2 text-[10px] font-medium text-white"
                  style={{ backgroundColor: color }}
                >
                  {name.slice(0, 1).toUpperCase()}
                </span>
              }
            />
            <TooltipContent>{name}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
