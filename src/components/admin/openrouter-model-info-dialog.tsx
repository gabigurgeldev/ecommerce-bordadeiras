"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ProviderLogo } from "@/components/admin/provider-logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatTokenCount,
  formatUsdPerMillion,
  openRouterModelPageUrl,
  type EnrichedCatalogModel,
} from "@/lib/openrouter/models-catalog";
import { Badge } from "@/components/ui/badge";

type OpenRouterModelInfoDialogProps = {
  model: EnrichedCatalogModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OpenRouterModelInfoDialog({
  model,
  open,
  onOpenChange,
}: OpenRouterModelInfoDialogProps) {
  if (!model) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <ProviderLogo provider={model.provider} size="lg" />
            <div className="min-w-0 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle>{model.displayName}</DialogTitle>
                {model.available === false ? (
                  <Badge variant="destructive" className="text-[10px]">
                    Indisponível
                  </Badge>
                ) : null}
              </div>
              <DialogDescription>{model.providerLabel}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="leading-relaxed text-muted-foreground">{model.descriptionPt}</p>
          {model.apiDescription && model.apiDescription !== model.descriptionPt && (
            <p className="leading-relaxed text-muted-foreground/80">{model.apiDescription}</p>
          )}

          {model.available === false ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Este modelo não está disponível na API OpenRouter no momento e não pode ser
              selecionado.
            </p>
          ) : null}

          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Custos estimados
            </p>
            {model.pricing ? (
              <dl className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Entrada</dt>
                  <dd className="font-medium">{formatUsdPerMillion(model.pricing.promptPer1M)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Saída</dt>
                  <dd className="font-medium">
                    {formatUsdPerMillion(model.pricing.completionPer1M)}
                  </dd>
                </div>
                {model.contextLength ? (
                  <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-2">
                    <dt className="text-muted-foreground">Contexto máximo</dt>
                    <dd className="font-medium">{formatTokenCount(model.contextLength)}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="text-muted-foreground">Preço indisponível no momento.</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Preços via OpenRouter, podem variar.
            </p>
          </div>

          <p className="font-mono text-xs text-muted-foreground">{model.id}</p>

          <Link
            href={openRouterModelPageUrl(model.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Ver detalhes no OpenRouter
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
