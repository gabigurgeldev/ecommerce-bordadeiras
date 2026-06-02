import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SectionHeaderProps = {
  subtitle?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "center" | "left";
  titleId?: string;
  /** Optional right-aligned element (e.g. a "Ver todos" button). Forces left align. */
  action?: ReactNode;
};

export function SectionHeader({
  subtitle,
  title,
  description,
  className,
  align = "center",
  titleId,
  action,
}: SectionHeaderProps) {
  const effectiveAlign = action ? "left" : align;

  const heading = (
    <div className={cn("min-w-0", effectiveAlign === "center" && "text-center")}>
      {subtitle ? (
        <p className="text-section-subtitle">{subtitle}</p>
      ) : null}
      <h2
        id={titleId}
        className="mt-1 font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-tight text-[var(--color-brown)]"
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-2 text-sm text-[var(--muted-foreground)] sm:text-base",
            effectiveAlign === "center" && "mx-auto max-w-xl",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );

  if (action) {
    return (
      <div
        className={cn(
          "section-header flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between",
          className,
        )}
      >
        {heading}
        <div className="w-full shrink-0 sm:w-auto">{action}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "section-header",
        effectiveAlign === "center" && "text-center",
        className,
      )}
    >
      {heading}
    </div>
  );
}
