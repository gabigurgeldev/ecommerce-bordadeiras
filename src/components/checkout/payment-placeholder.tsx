import { GlassCard } from "@/components/ui/glass-card";
import { CreditCard, QrCode, Receipt } from "lucide-react";

/** Mercado Pago UI — publicKey from server (DB), never from NEXT_PUBLIC env */
export function PaymentPlaceholder({ publicKey }: { publicKey: string | null }) {
  return (
    <div className="space-y-4">
      {publicKey ? (
        <p className="text-xs text-zinc-500" data-mp-configured="true">
          Gateway ativo (chave pública carregada no servidor).
        </p>
      ) : null}
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { icon: QrCode, label: "PIX", desc: "Aprovação instantânea" },
        { icon: CreditCard, label: "Cartão", desc: "Até 12x sem juros" },
        { icon: Receipt, label: "Boleto", desc: "Vencimento em 3 dias" },
      ].map((m) => (
        <GlassCard
          key={m.label}
          className="cursor-pointer border-2 border-transparent hover:border-rose-400/50"
        >
          <m.icon className="h-8 w-8 text-rose-500" />
          <p className="mt-3 font-medium">{m.label}</p>
          <p className="text-xs text-zinc-500">{m.desc}</p>
        </GlassCard>
      ))}
    </div>
    </div>
  );
}
