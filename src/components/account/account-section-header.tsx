import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AccountSectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function AccountSectionHeader({
  title,
  description,
  action,
  className,
}: AccountSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold text-[var(--color-brown)] sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
