import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
};

export function GlassCard({
  children,
  className,
  as: Tag = "div",
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-[var(--color-card-border)] bg-white p-6 shadow-lg shadow-[var(--color-brown)]/5 dark:bg-[var(--card)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
