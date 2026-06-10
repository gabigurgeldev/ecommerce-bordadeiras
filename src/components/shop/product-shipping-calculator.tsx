"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Loader2, MapPin, Package } from "lucide-react";
import { useState } from "react";

type ShippingQuoteOption = {
  id: string;
  name: string;
  priceCents: number;
  estimatedDays?: string;
  free?: boolean;
  company?: string;
  companyLogoUrl?: string;
};

type ShippingQuoteResponse = {
  ok: boolean;
  options?: ShippingQuoteOption[];
  error?: string;
  message?: string;
};

const QUOTE_TIMEOUT_MS = 20_000;

function maskCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function ProductShippingCalculator({
  productId,
  quantity,
  variantId,
  embedded = false,
  className,
}: {
  productId: string;
  quantity: number;
  variantId?: string;
  embedded?: boolean;
  className?: string;
}) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ShippingQuoteOption[]>([]);

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("Informe um CEP válido com 8 dígitos.");
      setOptions([]);
      return;
    }

    setLoading(true);
    setError(null);
    setOptions([]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), QUOTE_TIMEOUT_MS);

    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          cep: digits,
          ...(variantId ? { variantId } : {}),
        }),
        signal: controller.signal,
      });

      const data = (await res.json()) as ShippingQuoteResponse;

      if (res.status === 404) {
        setError("Cálculo de frete indisponível no momento. Tente novamente mais tarde.");
        return;
      }

      if (!res.ok || !data.ok) {
        setError(
          data.message ?? data.error ?? "Não foi possível calcular o frete. Tente novamente.",
        );
        return;
      }

      const normalized = (data.options ?? []).map((opt, index) => ({
        id: opt.id ?? `option-${index}`,
        name: opt.name ?? "Frete",
        priceCents: opt.priceCents ?? 0,
        estimatedDays: opt.estimatedDays,
        free: opt.free ?? opt.priceCents === 0,
        company: opt.company,
        companyLogoUrl: opt.companyLogoUrl,
      }));

      if (!normalized.length) {
        setError("Nenhuma opção de frete encontrada para este CEP.");
        return;
      }

      setOptions(normalized);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("O cálculo demorou demais. Tente novamente em instantes.");
        return;
      }
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "space-y-4",
        embedded &&
          "rounded-xl border border-[var(--color-card-border)] bg-[var(--secondary)]/30 p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <MapPin
          className={cn(
            "text-[var(--color-brown)]",
            embedded ? "h-4 w-4" : "h-5 w-5",
          )}
        />
        {embedded ? (
          <p className="text-sm font-semibold text-[var(--color-brown)]">
            Calcular frete e prazo
          </p>
        ) : (
          <h2 className="font-display text-lg font-semibold text-[var(--color-brown)]">
            Calcular frete e prazo
          </h2>
        )}
      </div>

      <form
        onSubmit={handleCalculate}
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-end",
          embedded && "gap-2",
        )}
      >
        <div className="flex-1 space-y-1.5">
          <label htmlFor="product-shipping-cep" className="text-sm font-medium text-[var(--color-brown)]">
            CEP
          </label>
          <Input
            id="product-shipping-cep"
            inputMode="numeric"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(maskCep(e.target.value))}
            maxLength={9}
            disabled={loading}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={loading} className="sm:min-w-[140px]">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculando…
            </>
          ) : (
            "Calcular frete"
          )}
        </Button>
      </form>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {options.length > 0 ? (
        <ul className="divide-y divide-[var(--color-card-border)] rounded-xl border border-[var(--color-card-border)] bg-[var(--secondary)]/40">
          {options.map((opt) => (
            <li key={opt.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3">
                {opt.companyLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={opt.companyLogoUrl}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded object-contain"
                  />
                ) : (
                  <Package className="h-4 w-4 shrink-0 text-[var(--color-brown-muted)]" />
                )}
                <div>
                  <p className="text-sm font-medium text-[var(--color-brown)]">{opt.name}</p>
                  {opt.estimatedDays ? (
                    <p className="text-xs text-[var(--muted-foreground)]">{opt.estimatedDays}</p>
                  ) : null}
                </div>
              </div>
              <p className="text-sm font-semibold text-[var(--color-price)]">
                {opt.free || opt.priceCents === 0
                  ? "Frete grátis"
                  : formatCurrency(opt.priceCents)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
