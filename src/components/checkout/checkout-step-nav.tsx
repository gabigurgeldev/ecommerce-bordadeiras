"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export function CheckoutStepNav({
  onBack,
  onContinue,
  continueLabel,
  continueDisabled = false,
  continueLoading = false,
  showBack = true,
  showContinue = true,
  btnStyle,
}: {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  showBack?: boolean;
  showContinue?: boolean;
  btnStyle?: React.CSSProperties;
}) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      {showBack && onBack ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="gap-2 text-zinc-600"
          disabled={continueLoading}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      ) : (
        <span className="hidden sm:block" />
      )}

      {showContinue && onContinue && continueLabel && (
        <Button
          type="button"
          size="lg"
          className="w-full sm:ml-auto sm:w-auto sm:min-w-[200px]"
          onClick={onContinue}
          disabled={continueDisabled || continueLoading}
          style={btnStyle}
        >
          {continueLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Aguarde…
            </>
          ) : (
            continueLabel
          )}
        </Button>
      )}
    </div>
  );
}
