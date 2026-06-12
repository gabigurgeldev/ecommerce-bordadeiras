"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type StorefrontSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: "left" | "right";
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function StorefrontSheet({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  className,
  headerClassName,
  children,
  footer,
}: StorefrontSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        overlayClassName="bg-[var(--color-brown)]/40 backdrop-blur-sm"
        className={cn(
          "flex w-full max-w-md flex-col gap-0 border-[var(--color-card-border)] bg-white p-0 pb-[env(safe-area-inset-bottom)] sm:max-w-md",
          side === "right" && "sm:rounded-l-2xl",
          side === "left" && "sm:rounded-r-2xl",
          className,
        )}
        aria-describedby={description ? "storefront-sheet-desc" : undefined}
      >
        <SheetHeader
          className={cn(
            "border-b border-[var(--color-card-border)] px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] text-left",
            headerClassName,
          )}
        >
          <SheetTitle className="font-display text-xl font-semibold text-[var(--color-brown)]">
            {title}
          </SheetTitle>
          {description && (
            <p
              id="storefront-sheet-desc"
              className="text-sm font-normal text-[var(--muted-foreground)]"
            >
              {description}
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="border-t border-[var(--color-card-border)] bg-[var(--secondary)]/40">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
