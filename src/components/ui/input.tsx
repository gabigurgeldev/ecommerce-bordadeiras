import { cn } from "@/lib/utils";
import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-xl border border-zinc-200 bg-white/80 px-4 text-sm shadow-sm backdrop-blur transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
