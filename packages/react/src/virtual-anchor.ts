export interface VirtualAnchor {
  getBoundingClientRect: () => DOMRect;
}

// Created on first use: `DOMRect` does not exist during SSR/prerender, so a module-scope
// instance would make importing @slash-editor/react throw on the server.
let emptyRect: DOMRect | undefined;

function getEmptyRect(): DOMRect {
  return (emptyRect ??= new DOMRect(0, 0, 0, 0));
}

export function toVirtualAnchor(
  getClientRect: (() => DOMRect | null) | null,
): VirtualAnchor | null {
  return getClientRect ? { getBoundingClientRect: () => getClientRect() ?? getEmptyRect() } : null;
}
