import { useSyncExternalStore } from "react";

type ThemeVariables = Record<string, string | boolean>;

/** Mermaid theme variable → shadcn token it takes its colour from. */
const TOKEN_VARIABLES: Record<string, string> = {
  background: "--card",
  textColor: "--foreground",
  primaryColor: "--secondary",
  primaryTextColor: "--secondary-foreground",
  primaryBorderColor: "--ring",
  secondaryColor: "--accent",
  secondaryTextColor: "--accent-foreground",
  secondaryBorderColor: "--ring",
  tertiaryColor: "--muted",
  tertiaryTextColor: "--foreground",
  tertiaryBorderColor: "--border",
  mainBkg: "--secondary",
  nodeBorder: "--ring",
  nodeTextColor: "--secondary-foreground",
  lineColor: "--muted-foreground",
  clusterBkg: "--muted",
  clusterBorder: "--border",
  titleColor: "--foreground",
  edgeLabelBackground: "--card",
  noteBkgColor: "--accent",
  noteTextColor: "--accent-foreground",
  noteBorderColor: "--border",
  actorBkg: "--secondary",
  actorBorder: "--ring",
  actorTextColor: "--secondary-foreground",
  signalColor: "--foreground",
  signalTextColor: "--foreground",
  labelBoxBkgColor: "--secondary",
  labelBoxBorderColor: "--ring",
  labelTextColor: "--secondary-foreground",
  pie1: "--chart-1",
  pie2: "--chart-2",
  pie3: "--chart-3",
  pie4: "--chart-4",
  pie5: "--chart-5",
  pieStrokeColor: "--card",
  pieOuterStrokeColor: "--border",
  pieTitleTextColor: "--foreground",
  pieLegendTextColor: "--foreground",
  errorBkgColor: "--destructive",
  errorTextColor: "--foreground",
};

let canvas: CanvasRenderingContext2D | null = null;

/**
 * Tokens are `oklch()`, some with alpha, which Mermaid's colour maths cannot
 * parse. Painting the colour over the page background and reading the pixel
 * back yields the opaque sRGB colour the browser would actually show.
 */
function toHex(color: string, backdrop: string): string {
  canvas ??= Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext(
    "2d",
    { willReadFrequently: true },
  );
  if (!canvas) return "#000000";

  canvas.clearRect(0, 0, 1, 1);
  canvas.fillStyle = backdrop;
  canvas.fillRect(0, 0, 1, 1);
  canvas.fillStyle = color;
  canvas.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = canvas.getImageData(0, 0, 1, 1).data;

  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function readThemeVariables(element: HTMLElement): ThemeVariables {
  const style = getComputedStyle(element);
  // The node view sits on `bg-card`; translucent tokens are composited over it.
  const background = toHex(style.getPropertyValue("--card").trim(), "#ffffff");
  const variables: ThemeVariables = {
    fontFamily: style.fontFamily,
    darkMode: Number.parseInt(background.slice(1, 3), 16) < 128,
    // Mermaid's default is a light-grey glow, which reads as a halo in dark mode.
    dropShadow: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
  };

  for (const [name, token] of Object.entries(TOKEN_VARIABLES)) {
    variables[name] = toHex(style.getPropertyValue(token).trim(), background);
  }

  return variables;
}

let queue: Promise<unknown> = Promise.resolve();
let appliedTheme = "";
let renderCount = 0;

/**
 * Renders Mermaid `source` to an SVG string themed from the shadcn tokens in
 * effect at `element`. `mermaid` is imported on first use, never at module
 * scope, so SSR and pages that never show a diagram stay clear of it.
 *
 * Renders run one at a time: `initialize` config is global to the module and
 * concurrent `render` calls interfere with each other.
 * `securityLevel: "strict"` sanitises the SVG — diagram source is document
 * content, so it may come from any collaborator or paste — and a
 * `%%{init}%%` directive in the source cannot lower it.
 */
export function renderMermaid(source: string, element: HTMLElement): Promise<string> {
  const task = queue.then(async () => {
    // Dynamic on purpose: `mermaid` is ~1 MB and touches the DOM at import,
    // so it is split out and only fetched in the browser once a diagram renders.
    const { default: mermaid } = await import("mermaid");
    const themeVariables = readThemeVariables(element);
    const theme = JSON.stringify(themeVariables);

    if (theme !== appliedTheme) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables,
        fontFamily: themeVariables.fontFamily as string,
      });
      appliedTheme = theme;
    }

    const id = `slash-mermaid-${++renderCount}`;

    try {
      return (await mermaid.render(id, source)).svg;
    } finally {
      // A failed render leaves its scratch container behind in <body>.
      document.getElementById(`d${id}`)?.remove();
    }
  });

  queue = task.catch(() => undefined);
  return task;
}

function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-theme"],
  });
  return () => observer.disconnect();
}

/**
 * Changes whenever the root element's theme switches (next-themes toggles a
 * `.dark` class), so a diagram can re-render in the new palette.
 */
export function useThemeSnapshot(): string {
  return useSyncExternalStore(
    subscribeTheme,
    () => `${document.documentElement.className}|${document.documentElement.style.cssText}`,
    () => "",
  );
}
