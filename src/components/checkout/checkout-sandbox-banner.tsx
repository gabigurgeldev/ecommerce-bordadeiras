"use client";

import { ChevronDown, ChevronUp, FlaskConical } from "lucide-react";
import { useState } from "react";

const TEST_CARDS = [
  {
    brand: "Mastercard (aprovado)",
    number: "5031 4332 1540 6351",
    cvv: "123",
    expiry: "11/30",
  },
  {
    brand: "Visa (aprovado)",
    number: "4235 6477 2802 5682",
    cvv: "123",
    expiry: "11/30",
  },
  {
    brand: "Mastercard (recusado)",
    number: "5031 4332 1540 6351",
    cvv: "123",
    expiry: "11/30",
    note: "Use nome do titular: OTHE",
  },
] as const;

export function CheckoutSandboxBanner() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40">
      <div className="flex items-start gap-3 px-4 py-3">
        <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Ambiente de testes
          </p>
          <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/90">
            Pagamentos processados pelo Mercado Pago com credenciais sandbox. O
            status (aprovado, pendente ou recusado) vem da API real — não há
            simulação local.
          </p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
          >
            Cartões de teste do Mercado Pago
            {open ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-amber-200 px-4 py-3 dark:border-amber-800">
          <p className="mb-2 text-xs text-amber-800 dark:text-amber-300">
            Preencha os dados abaixo no formulário de pagamento e conclua
            normalmente. O Mercado Pago retornará o resultado real do ambiente
            de testes.
          </p>
          <ul className="space-y-2">
            {TEST_CARDS.map((card) => (
              <li
                key={card.brand}
                className="rounded-lg border border-amber-200/80 bg-white/70 px-3 py-2 text-xs dark:border-amber-800 dark:bg-zinc-900/50"
              >
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {card.brand}
                </p>
                <p className="mt-1 font-mono text-zinc-600 dark:text-zinc-400">
                  {card.number} · CVV {card.cvv} · {card.expiry}
                </p>
                {"note" in card && card.note && (
                  <p className="mt-1 text-amber-700 dark:text-amber-400">
                    {card.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-amber-700/80 dark:text-amber-400/80">
            PIX em sandbox: use as credenciais da seção Testes do painel Mercado
            Pago configuradas no admin.
          </p>
        </div>
      )}
    </div>
  );
}
