"use client";

import { useAppSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function MobileAccountSection({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { user, loading } = useAppSession();

  async function handleSignOut() {
    onNavigate?.();
    const supabase = await getBrowserSupabase();
    if (supabase) await supabase.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div
        className="mt-4 h-28 animate-pulse rounded-xl bg-[var(--secondary)]/40"
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <div className="mt-4 rounded-xl border border-[var(--color-card-border)] bg-[var(--secondary)]/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)]">
            <User className="h-5 w-5 text-[var(--color-brown-muted)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--color-brown)]">Entrar</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Acesse pedidos e favoritos
            </p>
          </div>
        </div>
        <Button asChild className="mt-4 min-h-12 w-full" size="lg">
          <Link href="/login" onClick={onNavigate}>
            Entrar
          </Link>
        </Button>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] ?? user.email.split("@")[0];
  const initial = firstName[0]?.toUpperCase() ?? "U";

  const links = [
    ...(user.role === "ADMIN"
      ? [
          {
            href: "/admin",
            label: "Painel Admin",
            icon: LayoutDashboard,
          },
        ]
      : []),
    { href: "/conta/pedidos", label: "Meus pedidos", icon: Package },
    { href: "/sacola", label: "Minha sacola", icon: ShoppingBag },
    { href: "/conta", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-card-border)] bg-[var(--secondary)]/40 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-card-border)] bg-[var(--secondary)] text-sm font-semibold text-[var(--color-brown)]">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--color-brown)]">
            {user.name ?? firstName}
          </p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">
            {user.email}
          </p>
        </div>
      </div>
      <nav className="mt-4 flex flex-col gap-0.5" aria-label="Conta">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="flex min-h-[44px] items-center gap-3 rounded-lg px-2 text-sm font-medium text-[var(--color-brown)] transition hover:bg-[var(--secondary)] active:bg-[var(--secondary)]"
          >
            <Icon className="h-4 w-4 shrink-0 text-[var(--color-brown-muted)]" />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex min-h-[44px] items-center gap-3 rounded-lg px-2 text-sm font-medium text-[var(--color-brown)] transition hover:bg-[var(--secondary)] active:bg-[var(--secondary)]"
        >
          <LogOut className="h-4 w-4 shrink-0 text-[var(--color-brown-muted)]" />
          Sair
        </button>
      </nav>
    </div>
  );
}
