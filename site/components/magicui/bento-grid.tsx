import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { ArrowRightIcon } from "lucide-react";

import { cn } from "@/lib/utils.ts";
import { buttonVariants } from "@/components/ui/button.tsx";

/**
 * Vendored from MagicUI (`bento-grid`): an asymmetric grid of feature cards.
 * Upstream pulls in `@radix-ui/react-icons` and a `Button` with `asChild`; this version uses the
 * lucide icon set and a `buttonVariants`-styled link already in the registry.
 */
interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  className: string;
  /** Decoration rendered behind the card content. */
  background: ReactNode;
  Icon: React.ElementType;
  description: string;
  href: string;
  cta: string;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div className={cn("grid w-full auto-rows-[22rem] grid-cols-3 gap-4", className)} {...props}>
      {children}
    </div>
  );
};

const CtaLink = ({ href, cta }: { href: string; cta: string }) => (
  <a
    href={href}
    className={cn(
      buttonVariants({ variant: "link", size: "sm" }),
      "pointer-events-auto h-auto p-0",
    )}
  >
    {cta}
    <ArrowRightIcon className="ms-2 size-4 rtl:rotate-180" aria-hidden />
  </a>
);

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
      // light styles
      "bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
      // dark styles
      "transform-gpu dark:bg-background dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]",
      className,
    )}
    {...props}
  >
    <div>{background}</div>
    <div className="p-4">
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-10">
        <Icon
          className="text-fd-primary size-12 origin-left transform-gpu transition-all duration-300 ease-in-out group-hover:scale-75"
          aria-hidden
        />
        <h3 className="text-xl font-semibold">{name}</h3>
        <p className="text-fd-muted-foreground max-w-lg">{description}</p>
      </div>

      <div className="pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:hidden">
        <CtaLink href={href} cta={cta} />
      </div>
    </div>

    <div className="pointer-events-none absolute bottom-0 hidden w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
      <CtaLink href={href} cta={cta} />
    </div>

    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/3 group-hover:dark:bg-neutral-800/10" />
  </div>
);

export { BentoCard, BentoGrid };
