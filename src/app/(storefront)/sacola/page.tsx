import { CartView } from "@/components/cart/cart-view";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Sacola",
  path: "/sacola",
  noIndex: true,
});

export default function SacolaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold text-[var(--color-brown)]">
        Sacola
      </h1>
      <div className="mt-10 rounded-3xl border border-[var(--color-card-border)] bg-white p-6 shadow-sm">
        <CartView />
      </div>
    </div>
  );
}
