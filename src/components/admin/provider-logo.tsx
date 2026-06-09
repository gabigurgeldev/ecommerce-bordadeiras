"use client";

import { getProviderLogo } from "@/lib/openrouter/models-catalog";
import type { AiProvider } from "@/lib/openrouter/providers";
import { cn } from "@/lib/utils";

type ProviderLogoProps = {
  provider: AiProvider;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** When true, uses a light backdrop suitable for primary-colored chips */
  onPrimary?: boolean;
};

const SIZE = {
  xs: { wrap: "h-5 w-5 p-0.5", img: "h-4 w-4" },
  sm: { wrap: "h-6 w-6 p-1", img: "h-4 w-4" },
  md: { wrap: "h-9 w-9 p-1.5", img: "h-6 w-6" },
  lg: { wrap: "h-10 w-10 p-2", img: "h-6 w-6" },
} as const;

export function ProviderLogo({
  provider,
  size = "md",
  className,
  onPrimary = false,
}: ProviderLogoProps) {
  const s = SIZE[size];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        onPrimary ? "bg-white/90" : "bg-muted",
        s.wrap,
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getProviderLogo(provider)}
        alt=""
        width={size === "md" || size === "lg" ? 24 : 16}
        height={size === "md" || size === "lg" ? 24 : 16}
        className={cn("object-contain", s.img)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
