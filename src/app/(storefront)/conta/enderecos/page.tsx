import { AccountSectionHeader } from "@/components/account/account-section-header";
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
    <div className="space-y-6">
      <AccountSectionHeader
        title="Endereços de entrega"
        description="Gerencie seus endereços para agilizar o checkout."
      />
      <AddressesManager addresses={addresses} />
    </div>
  );
}
