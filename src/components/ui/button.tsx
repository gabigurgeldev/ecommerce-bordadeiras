import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-body text-sm font-medium transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brown)]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-cta)] text-white shadow-lg shadow-[var(--color-cta)]/25 hover:bg-[var(--color-cta-hover)] hover:shadow-xl hover:shadow-[var(--color-cta)]/30 focus-visible:ring-[var(--color-cta)]/40",
        secondary:
          "border border-[var(--color-card-border)] bg-[var(--secondary)] text-[var(--color-brown)] hover:bg-[var(--color-bg)] dark:text-[var(--secondary-foreground)]",
        outline:
          "border border-[var(--color-card-border)] bg-white text-[var(--color-brown)] hover:border-[var(--color-brown)]/30 hover:bg-[var(--secondary)] dark:bg-transparent dark:text-[var(--foreground)]",
        gold: "bg-[var(--color-price)] text-white shadow-lg shadow-[var(--color-price)]/25 hover:brightness-105 focus-visible:ring-[var(--color-price)]/40",
        ghost:
          "text-[var(--color-brown)] hover:bg-[var(--color-brown)]/10 dark:text-[var(--foreground)] dark:hover:bg-white/10",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
