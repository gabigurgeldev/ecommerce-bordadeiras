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
        "rounded-2xl border border-white/20 bg-white/60 p-6 shadow-xl shadow-zinc-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/40",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
