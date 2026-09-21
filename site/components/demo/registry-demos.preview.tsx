"use client";

import dynamic from "next/dynamic";
import type * as RegistryDemos from "./registry-demos.tsx";

/**
 * Client-only wrappers, one per demo in `registry-demos.tsx`. `ssr: false`
 * is only valid from a Client Component boundary — see that file's header
 * comment for why every demo needs it.
 */
function load<K extends keyof typeof RegistryDemos>(name: K) {
  return dynamic(() => import("./registry-demos.tsx").then((mod) => mod[name]), { ssr: false });
}

export const SlashMenuDemo = load("SlashMenuDemo");
export const BubbleToolbarDemo = load("BubbleToolbarDemo");
export const BlockHandleDemo = load("BlockHandleDemo");
export const MentionMenuDemo = load("MentionMenuDemo");
export const LinkEditorDemo = load("LinkEditorDemo");
export const CommentPanelDemo = load("CommentPanelDemo");
export const PresenceAvatarsDemo = load("PresenceAvatarsDemo");
export const NodeViewsDemo = load("NodeViewsDemo");
