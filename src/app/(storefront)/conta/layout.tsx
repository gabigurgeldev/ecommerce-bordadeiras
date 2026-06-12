import { AccountNav } from "@/components/account/account-nav";

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-brown)] sm:text-4xl">
        Minha conta
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)] sm:text-base">
        Gerencie perfil, senha e pedidos em um só lugar.
      </p>
      <div className="mt-8 overflow-hidden rounded-3xl border border-[var(--color-card-border)] bg-gradient-to-b from-[var(--secondary)]/40 to-white shadow-sm">
        <div className="p-5 sm:p-8">
          <AccountNav />
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
