"use client";

import { useAppSession } from "@/components/providers/session-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Package,
  User,
  ShoppingBag,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AccountMenu({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { user, loading } = useAppSession();

  if (loading) {
    return (
      <span
        className={cn(
          "inline-flex h-9 w-9 animate-pulse rounded-full bg-[var(--secondary)]",
          className,
        )}
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-[var(--color-card-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brown)] shadow-sm transition hover:bg-[var(--secondary)]",
          className,
        )}
      >
        <User className="h-4 w-4" />
        <span>Entrar</span>
      </Link>
    );
  }

  const firstName = user.name?.split(" ")[0] ?? user.email.split("@")[0];
  const initial = firstName[0]?.toUpperCase() ?? "U";

  async function handleSignOut() {
    onNavigate?.();
    const supabase = await getBrowserSupabase();
    if (supabase) await supabase.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-[var(--color-brown)] transition hover:bg-[var(--color-brown)]/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brown)]",
          className,
        )}
        aria-label={`Menu da conta de ${firstName}`}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-card-border)] bg-[var(--secondary)] text-xs font-semibold">
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:inline">{firstName}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 rounded-2xl border-[var(--color-card-border)] bg-white p-0 shadow-lg"
      >
        <DropdownMenuLabel className="border-b border-[var(--color-card-border)] px-4 py-3 font-normal">
          <p className="truncate text-sm font-semibold text-[var(--color-brown)]">
            {user.name ?? firstName}
          </p>
          <p className="truncate text-xs font-normal text-[var(--muted-foreground)]">
            {user.email}
          </p>
        </DropdownMenuLabel>

        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild className="min-h-[40px] px-4 cursor-pointer">
            <Link
              href="/admin"
              onClick={onNavigate}
              className="flex items-center gap-2 text-[var(--color-brown)]"
            >
              <LayoutDashboard className="h-4 w-4" />
              Painel Admin
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild className="min-h-[40px] px-4 cursor-pointer">
          <Link
            href="/conta/pedidos"
            onClick={onNavigate}
            className="flex items-center gap-2 text-[var(--color-brown)]"
          >
            <Package className="h-4 w-4" />
            Meus pedidos
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="min-h-[40px] px-4 cursor-pointer">
          <Link
            href="/sacola"
            onClick={onNavigate}
            className="flex items-center gap-2 text-[var(--color-brown)]"
          >
            <ShoppingBag className="h-4 w-4" />
            Minha sacola
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="min-h-[40px] px-4 cursor-pointer">
          <Link
            href="/conta"
            onClick={onNavigate}
            className="flex items-center gap-2 text-[var(--color-brown)]"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[var(--color-card-border)]" />

        <DropdownMenuItem
          className="min-h-[40px] px-4 cursor-pointer text-[var(--color-brown)]"
          onSelect={() => void handleSignOut()}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
