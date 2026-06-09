"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/conta", label: "Perfil" },
  { href: "/conta/enderecos", label: "Endereços" },
  { href: "/conta/pagamentos", label: "Pagamentos" },
  { href: "/conta/notificacoes", label: "Notificações" },
  { href: "/conta/senha", label: "Senha" },
  { href: "/conta/pedidos", label: "Pedidos" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-[var(--color-card-border)] pb-4"
      aria-label="Navegação da conta"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            pathname === link.href
              ? "bg-[var(--color-brown)] text-white shadow-sm"
              : "text-[var(--color-brown-muted)] hover:bg-[var(--secondary)] hover:text-[var(--color-brown)]",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
