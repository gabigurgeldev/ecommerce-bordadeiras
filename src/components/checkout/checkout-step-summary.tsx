"use client";

import type { PersonalInfo } from "@/components/checkout/checkout-personal-info-section";
import { maskCpf } from "@/lib/cpf";
import type { ShippingAddress } from "@/lib/types/catalog";
import { MapPin, Pencil, User } from "lucide-react";

function formatAddress(addr: ShippingAddress): string {
  const cep = addr.cep.includes("-")
    ? addr.cep
    : `${addr.cep.slice(0, 5)}-${addr.cep.slice(5)}`;
  return `${addr.street}, ${addr.number}${
    addr.complement ? ` — ${addr.complement}` : ""
  } · ${addr.neighborhood}, ${addr.city}/${addr.state} · CEP ${cep}`;
}

export function CheckoutStepSummary({
  address,
  personalInfo,
  onEditAddress,
  onEditPersonal,
  cardStyle,
}: {
  address?: ShippingAddress | null;
  personalInfo?: PersonalInfo | null;
  onEditAddress?: () => void;
  onEditPersonal?: () => void;
  cardStyle?: React.CSSProperties;
}) {
  if (!address && !personalInfo) return null;

  return (
    <div className="space-y-3">
      {address && (
        <div
          className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
          style={cardStyle}
        >
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Endereço de entrega
            </p>
            <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              {formatAddress(address)}
            </p>
          </div>
          {onEditAddress && (
            <button
              type="button"
              onClick={onEditAddress}
              className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-700"
            >
              <Pencil className="h-3 w-3" />
              Alterar
            </button>
          )}
        </div>
      )}

      {personalInfo && (
        <div
          className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
          style={cardStyle}
        >
          <User className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Dados pessoais
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {personalInfo.name}
            </p>
            <p className="text-xs text-zinc-500">
              {personalInfo.email}
              {personalInfo.cpf ? ` · CPF ${maskCpf(personalInfo.cpf)}` : ""}
            </p>
          </div>
          {onEditPersonal && (
            <button
              type="button"
              onClick={onEditPersonal}
              className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-700"
            >
              <Pencil className="h-3 w-3" />
              Alterar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
