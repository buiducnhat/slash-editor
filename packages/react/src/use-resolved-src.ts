import type { ResolveSrc } from "@slash-editor/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { useEffect, useState } from "react";

interface Resolution {
  src: string | null | undefined;
  resolveSrc: ResolveSrc | undefined;
  /** What to display: `null` while an async resolution is in flight. */
  value: string | null;
  pending?: Promise<string>;
}

function resolve(
  src: string | null | undefined,
  node: ProseMirrorNode,
  resolveSrc: ResolveSrc | undefined,
): Resolution {
  if (!src || !resolveSrc) {
    return { src, resolveSrc, value: src ?? null };
  }
  try {
    const result = resolveSrc(src, node);
    return typeof result === "string"
      ? { src, resolveSrc, value: result }
      : { src, resolveSrc, value: null, pending: result };
  } catch {
    return { src, resolveSrc, value: src };
  }
}

/**
 * The URL a media node view should display for its stored `src` (`url` for
 * `embed`), passed through the node's display-only `resolveSrc` option
 * (`extension.options.resolveSrc`) — signed URLs, files behind auth. The
 * stored attr stays canonical; only the rendered element sees the result.
 *
 * - No `src` → `null`; no `resolveSrc` → `src` unchanged.
 * - A synchronous result is returned on the same render.
 * - An async result yields `null` until it settles, so the view never
 *   requests the raw (possibly unauthorized) URL in the meantime.
 * - A thrown error or rejected promise falls back to the raw `src`.
 * - Re-resolves only when `src` or `resolveSrc` change, not on other attr
 *   edits (typing an `alt` must not re-sign the URL); a result for a
 *   superseded `src` is discarded. `node` is context for the resolver, not a
 *   key: derive the URL from `src`, not from other attrs.
 * - Keep `resolveSrc` referentially stable (e.g. the extension option, not an
 *   inline closure): each new function restarts resolution, and an async one
 *   shows nothing until it settles.
 */
export function useResolvedSrc(
  src: string | null | undefined,
  node: ProseMirrorNode,
  resolveSrc: ResolveSrc | undefined,
): string | null {
  const [resolution, setResolution] = useState(() => resolve(src, node, resolveSrc));

  // Re-derive during render when the inputs change (React's "adjusting
  // state when a prop changes" pattern), so a sync resolver never shows a
  // frame of the previous URL.
  let current = resolution;
  if (current.src !== src || current.resolveSrc !== resolveSrc) {
    current = resolve(src, node, resolveSrc);
    setResolution(current);
  }

  useEffect(() => {
    const { pending, src: raw } = resolution;
    if (!pending) {
      return;
    }
    let active = true;
    const settle = (value: string | null) => {
      if (active) {
        setResolution((prev) =>
          prev === resolution ? { ...prev, value, pending: undefined } : prev,
        );
      }
    };
    pending.then(settle, () => settle(raw ?? null));
    return () => {
      active = false;
    };
  }, [resolution]);

  return current.value;
}
