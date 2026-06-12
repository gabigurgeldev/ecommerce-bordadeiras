import { brandAssets } from "@/lib/brand";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  variant?: "full" | "icon" | "compact";
  className?: string;
  href?: string;
};

const sizes = {
  full: { w: 200, h: 72, className: "h-14 w-auto sm:h-16" },
  icon: { w: 48, h: 48, className: "h-11 w-11" },
  compact: { w: 140, h: 48, className: "h-10 w-auto" },
};

export function Logo({ variant = "full", className, href = "/" }: LogoProps) {
  const size = sizes[variant];
  const src = variant === "icon" ? brandAssets.logoIcon : brandAssets.logo;

  const image = (
    <Image
      src={src}
      alt={brandAssets.alt}
      width={size.w}
      height={size.h}
      className={cn("object-contain object-left", size.className, className)}
      priority={variant === "full"}
    />
  );

  if (variant === "full") {
    return (
      <Link href={href} className="group flex items-center gap-2.5">
        {image}
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="font-display text-base font-semibold text-[var(--color-brown)]">
            {siteConfig.name}
          </span>
          {siteConfig.tagline && (
            <span className="font-body text-[10px] font-medium uppercase tracking-wider text-[var(--color-brown-muted)]">
              {siteConfig.tagline}
            </span>
          )}
        </span>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={href} className={cn("flex min-w-0 items-center gap-2", className)}>
        <Image
          src={brandAssets.logoIcon}
          alt={brandAssets.alt}
          width={sizes.icon.w}
          height={sizes.icon.h}
          className="h-9 w-9 shrink-0 object-contain"
          priority
        />
        <span className="truncate font-display text-sm font-semibold text-[var(--color-brown)] max-w-[120px] min-[375px]:max-w-[9rem]">
          {siteConfig.name}
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} className="inline-flex shrink-0">
      {image}
    </Link>
  );
}
