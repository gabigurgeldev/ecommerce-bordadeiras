import { AccountNav } from "@/components/account/account-nav";

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-[var(--color-brown)]">
        Minha conta
      </h1>
      <div className="mt-8 rounded-3xl border border-[var(--color-card-border)] bg-white p-6 shadow-sm">
        <AccountNav />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
