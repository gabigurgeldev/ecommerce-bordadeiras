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
  children,
  footer,
}: StorefrontSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "flex w-full max-w-md flex-col gap-0 border-[var(--color-card-border)] bg-white p-0 sm:max-w-md",
          side === "right" && "sm:rounded-l-2xl",
          side === "left" && "sm:rounded-r-2xl",
          className,
        )}
        aria-describedby={description ? "storefront-sheet-desc" : undefined}
      >
        <SheetHeader className="border-b border-[var(--color-card-border)] px-6 py-4 text-left">
          <SheetTitle className="text-lg font-semibold text-[var(--color-brown)]">
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
          <div className="border-t border-[var(--color-card-border)] bg-zinc-50/50">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
