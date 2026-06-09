"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">Erro no painel admin</h1>
      <p className="text-sm text-muted-foreground">
        {error.message || "Não foi possível carregar esta página. Tente novamente."}
      </p>
      <Button type="button" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
