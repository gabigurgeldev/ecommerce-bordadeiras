import { cn } from "@/lib/utils";
import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-xl border border-[var(--color-card-border)] bg-white px-4 font-body text-sm text-[var(--foreground)] shadow-sm transition-colors placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--color-brown)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brown)]/25 dark:bg-[var(--card)]",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
