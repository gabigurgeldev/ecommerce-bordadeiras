"use client";

import { cn } from "@/lib/utils";
import {
  Bell,
  CreditCard,
  Lock,
  MapPin,
  Package,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/conta", label: "Perfil", icon: User },
  { href: "/conta/enderecos", label: "Endereços", icon: MapPin },
  { href: "/conta/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/conta/notificacoes", label: "Notificações", icon: Bell },
  { href: "/conta/senha", label: "Senha", icon: Lock },
  { href: "/conta/pedidos", label: "Pedidos", icon: Package },
];

function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/conta") return pathname === "/conta";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      className="-mx-1 flex gap-2 overflow-x-auto border-b border-[var(--color-card-border)] pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Navegação da conta"
    >
      {links.map((link) => {
        const active = isLinkActive(pathname, link.href);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
              active
                ? "border-[var(--color-brown)] bg-[var(--color-brown)] text-white shadow-sm"
                : "border-transparent text-[var(--color-brown-muted)] hover:border-[var(--color-card-border)] hover:bg-[var(--secondary)] hover:text-[var(--color-brown)]",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
