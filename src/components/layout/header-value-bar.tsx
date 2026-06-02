import { MessageCircle, RefreshCw, ShieldCheck, Truck } from "lucide-react";

export const headerTrustItems = [
  {
    icon: ShieldCheck,
    title: "Pagamento Seguro",
    description: "Ambiente protegido",
  },
  {
    icon: Truck,
    title: "Frete Grátis",
    description: "Acima de R$ 199",
  },
  {
    icon: RefreshCw,
    title: "Troca Garantida",
    description: "Até 7 dias",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Atendimento humano",
  },
] as const;

export function HeaderValueBar() {
  return (
    <div
      className="border-b border-[var(--color-card-border)] bg-[var(--secondary)]"
      aria-label="Garantias da loja"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="flex snap-x snap-mandatory gap-5 overflow-x-auto py-3 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {headerTrustItems.map((item) => (
            <li
              key={item.title}
              className="flex min-w-[75%] snap-start items-center gap-3 sm:min-w-0"
            >
              <item.icon
                className="h-5 w-5 shrink-0 text-[var(--color-brown)]"
                strokeWidth={2}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--color-brown)]">
                  {item.title}
                </p>
                <p className="text-[11px] text-[var(--color-brown-muted)]">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
