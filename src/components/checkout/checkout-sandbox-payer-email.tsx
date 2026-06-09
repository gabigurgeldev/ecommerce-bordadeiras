"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isMpTestUserEmail } from "@/lib/mercadopago-errors";
import { FlaskConical } from "lucide-react";
import { useState } from "react";

export function CheckoutSandboxPayerEmail({
  value,
  onChange,
  onConfirm,
}: {
  value: string;
  onChange: (email: string) => void;
  onConfirm: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("Informe um e-mail válido");
      return;
    }
    if (!isMpTestUserEmail(trimmed)) {
      setError(
        "Use o e-mail exato de Contas de teste no MP (ex: test_user_123456789@testuser.com)",
      );
      return;
    }
    setError(null);
    onConfirm();
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800 dark:bg-amber-950/20">
      <div className="mb-3 flex items-start gap-2">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            E-mail de teste do pagamento
          </p>
          <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/90">
            Copie o e-mail do comprador em Mercado Pago → Suas integrações →
            Contas de teste (formato <strong>test_user_…@testuser.com</strong>).
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sandbox-payer-email" className="text-xs">
          E-mail do pagador (sandbox)
        </Label>
        <Input
          id="sandbox-payer-email"
          type="email"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (error) setError(null);
          }}
          placeholder="test_user_123456789@testuser.com"
          className="font-mono text-sm"
          autoComplete="email"
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>

      <Button
        type="button"
        className="mt-4 w-full sm:w-auto"
        onClick={handleConfirm}
      >
        Continuar para gerar pagamento
      </Button>
    </div>
  );
}
