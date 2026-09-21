import { useCallback, useSyncExternalStore, type ComponentProps } from "react";

/**
 * Minimal pushState router: no new dependency, just enough to split the
 * playground (`/`) from the docs site (`/docs`, `/docs/:item`) inside the
 * same Vite/Tailwind/shadcn app the design brief calls for.
 */
function subscribe(listener: () => void): () => void {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

function getSnapshot(): string {
  return window.location.pathname;
}

function getServerSnapshot(): string {
  return "/";
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function navigate(to: string): void {
  if (window.location.pathname === to) {
    return;
  }
  window.history.pushState(null, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/** A same-origin navigation link. Modified clicks (new tab, etc.) fall through to the browser. */
export function Link({ to, onClick, ...props }: { to: string } & ComponentProps<"a">) {
  const handleClick = useCallback<NonNullable<ComponentProps<"a">["onClick"]>>(
    (event) => {
      onClick?.(event);
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      event.preventDefault();
      navigate(to);
    },
    [to, onClick],
  );

  return <a href={to} onClick={handleClick} {...props} />;
}
