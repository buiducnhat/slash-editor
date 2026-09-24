export interface VirtualAnchor {
  getBoundingClientRect: () => DOMRect;
}

export const EMPTY_RECT = new DOMRect(0, 0, 0, 0);

export function toVirtualAnchor(
  getClientRect: (() => DOMRect | null) | null,
): VirtualAnchor | null {
  return getClientRect ? { getBoundingClientRect: () => getClientRect() ?? EMPTY_RECT } : null;
}
