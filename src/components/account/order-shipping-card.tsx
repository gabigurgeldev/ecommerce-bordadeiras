import { MapPin } from "lucide-react";

export function OrderShippingCard({
  address,
}: {
  address: Record<string, unknown>;
}) {
  return (
    <div className="account-card">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--secondary)]">
          <MapPin className="h-4 w-4 text-[var(--color-brown)]" />
        </span>
        <h3 className="font-display text-base font-semibold text-[var(--color-brown)]">
          Endereço de entrega
        </h3>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
        {String(address.street ?? "")}, {String(address.number ?? "")}
        {address.complement ? ` — ${String(address.complement)}` : ""}
        <br />
        {String(address.neighborhood ?? "")}, {String(address.city ?? "")} —{" "}
        {String(address.state ?? "")}
        <br />
        CEP {String(address.cep ?? address.zipCode ?? "")}
      </p>
    </div>
  );
}
