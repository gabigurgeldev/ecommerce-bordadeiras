import { AddressesManager } from "@/components/account/addresses-manager";
import { fetchUserAddresses } from "@/actions/account/addresses";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Endereços",
  path: "/conta/enderecos",
  noIndex: true,
});

export default async function ContaEnderecosPage() {
  const addresses = await fetchUserAddresses();

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-[var(--color-brown)]">
        Endereços de entrega
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Gerencie seus endereços para agilizar o checkout.
      </p>
      <div className="mt-6">
        <AddressesManager addresses={addresses} />
      </div>
    </div>
  );
}
