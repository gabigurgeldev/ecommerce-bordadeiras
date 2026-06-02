import { Logo } from "@/components/brand/logo";
import { siteImages } from "@/lib/images";
import { siteConfig } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src={siteImages.authSide}
          alt="Bordado artesanal"
          fill
          className="object-cover"
          sizes="50vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brown)]/80 via-[var(--color-brown)]/30 to-transparent" />
        <div className="absolute bottom-0 p-12">
          <p className="font-serif text-2xl italic text-white/90">
            Bordados que contam histórias
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            {siteConfig.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[var(--color-bg)] p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-[var(--color-card-border)] bg-white p-7 shadow-xl shadow-[var(--color-brown)]/10 sm:p-9">
            <div className="flex flex-col items-center text-center">
              <Logo variant="icon" href="/" className="h-16 w-16" />
              <h1 className="mt-5 font-display text-2xl font-semibold text-[var(--color-brown)]">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                {subtitle}
              </p>
            </div>
            <div className="mt-7">{children}</div>
          </div>
          <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
            <Link href="/" className="transition hover:text-[var(--color-cta)]">
              ← Voltar para a loja
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
