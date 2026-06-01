import { AccountNav } from "@/components/account/account-nav";

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-white">Minha conta</h1>
      <div className="mt-8 rounded-3xl bg-white p-6 dark:bg-zinc-900">
        <AccountNav />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
