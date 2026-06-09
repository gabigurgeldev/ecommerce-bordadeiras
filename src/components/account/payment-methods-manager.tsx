"use client";

import {
  fetchSavedCards,
  removeSavedCard,
  saveCardWithToken,
  setDefaultSavedCard,
  type SavedCardView,
} from "@/actions/account/payment-methods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale: string },
    ) => {
      createCardToken: (cardData: {
        cardNumber: string;
        cardholderName: string;
        cardExpirationMonth: string;
        cardExpirationYear: string;
        securityCode: string;
        identificationType: string;
        identificationNumber: string;
      }) => Promise<{ id: string }>;
    };
  }
}

function loadMpScript(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar Mercado Pago"));
    document.body.appendChild(script);
  });
}

export function PaymentMethodsManager({
  initialCards,
  publicKey,
}: {
  initialCards: SavedCardView[];
  publicKey: string | null;
}) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mpReady, setMpReady] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    void loadMpScript()
      .then(() => setMpReady(true))
      .catch(() => toast.error("Não foi possível carregar o Mercado Pago"));
  }, [publicKey]);

  const refreshCards = useCallback(async () => {
    const updated = await fetchSavedCards();
    setCards(updated);
  }, []);

  async function onAddCard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!publicKey || !mpReady || !window.MercadoPago) {
      toast.error("Mercado Pago não disponível");
      return;
    }

    setLoading(true);
    const form = new FormData(e.currentTarget);

    try {
      const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      const tokenResult = await mp.createCardToken({
        cardNumber: String(form.get("cardNumber") ?? "").replace(/\s/g, ""),
        cardholderName: String(form.get("cardholderName") ?? ""),
        cardExpirationMonth: String(form.get("expMonth") ?? ""),
        cardExpirationYear: String(form.get("expYear") ?? ""),
        securityCode: String(form.get("cvv") ?? ""),
        identificationType: "CPF",
        identificationNumber: String(form.get("docNumber") ?? "").replace(/\D/g, ""),
      });

      const result = await saveCardWithToken(tokenResult.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Cartão salvo com sucesso");
      setShowForm(false);
      await refreshCards();
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao tokenizar cartão",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onRemove(id: string) {
    const result = await removeSavedCard(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Cartão removido");
    await refreshCards();
    router.refresh();
  }

  async function onSetDefault(id: string) {
    const result = await setDefaultSavedCard(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Cartão padrão atualizado");
    await refreshCards();
    router.refresh();
  }

  if (!publicKey) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Configure o Mercado Pago em Admin → Configurações para salvar cartões.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {cards.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Nenhum cartão salvo.
        </p>
      ) : (
        <ul className="space-y-3">
          {cards.map((card) => (
            <li
              key={card.id}
              className="flex items-center justify-between rounded-2xl border border-[var(--color-card-border)] p-4"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-[var(--color-brown)]" />
                <div>
                  <p className="font-medium text-[var(--color-brown)]">
                    {card.brand ?? "Cartão"} ·••• {card.lastFourDigits ?? "****"}
                    {card.isDefault && (
                      <span className="ml-2 rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs">
                        Padrão
                      </span>
                    )}
                  </p>
                  {card.expirationMonth && card.expirationYear && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Validade {String(card.expirationMonth).padStart(2, "0")}/
                      {card.expirationYear}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!card.isDefault && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void onSetDefault(card.id)}
                  >
                    Padrão
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => void onRemove(card.id)}
                  aria-label="Remover cartão"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form
          onSubmit={onAddCard}
          className="grid gap-3 rounded-2xl border border-dashed border-[var(--color-card-border)] p-4 sm:grid-cols-2"
        >
          <Input
            name="cardholderName"
            placeholder="Nome no cartão"
            required
            className="sm:col-span-2"
            autoComplete="cc-name"
          />
          <Input
            name="cardNumber"
            placeholder="Número do cartão"
            required
            className="sm:col-span-2"
            autoComplete="cc-number"
            inputMode="numeric"
          />
          <Input name="expMonth" placeholder="Mês (MM)" required maxLength={2} />
          <Input name="expYear" placeholder="Ano (AAAA)" required maxLength={4} />
          <Input name="cvv" placeholder="CVV" required maxLength={4} autoComplete="cc-csc" />
          <Input name="docNumber" placeholder="CPF do titular" required />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading || !mpReady}>
              {loading ? "Salvando…" : "Salvar cartão"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => setShowForm(true)} disabled={!mpReady}>
          Adicionar cartão
        </Button>
      )}
    </div>
  );
}
