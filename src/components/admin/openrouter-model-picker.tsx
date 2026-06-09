"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Info, Loader2, Search, Sparkles } from "lucide-react";
import { getOpenRouterModelsForPicker } from "@/actions/admin/ai";
import { OpenRouterModelInfoDialog } from "@/components/admin/openrouter-model-info-dialog";
import { ProviderLogo } from "@/components/admin/provider-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  findCatalogModel,
  formatUsdPerMillion,
  inferProviderFromModelId,
  type EnrichedCatalogModel,
  type ModelBadge,
} from "@/lib/openrouter/models-catalog";
import { AI_PROVIDERS, PROVIDER_ORDER, type AiProvider } from "@/lib/openrouter/providers";
import { DEFAULT_OPENROUTER_MODEL } from "@/lib/validations/admin";
import { cn } from "@/lib/utils";

type OpenRouterModelPickerProps = {
  value: string;
  onChange: (modelId: string) => void;
};

function badgeVariant(badge?: ModelBadge): "default" | "secondary" | "outline" | "destructive" {
  if (badge === "Recomendado") return "default";
  if (badge === "Avançado") return "secondary";
  if (badge === "Indisponível") return "destructive";
  return "outline";
}

function ModelCard({
  model,
  selected,
  onSelect,
  onInfo,
}: {
  model: EnrichedCatalogModel;
  selected: boolean;
  onSelect: () => void;
  onInfo: (e: React.MouseEvent) => void;
}) {
  const unavailable = model.available === false;
  const displayBadge = unavailable ? "Indisponível" : model.badge;

  return (
    <div
      role="button"
      tabIndex={unavailable ? -1 : 0}
      aria-disabled={unavailable}
      onClick={() => {
        if (!unavailable) onSelect();
      }}
      onKeyDown={(e) => {
        if (unavailable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors sm:items-center",
        unavailable
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-muted/40",
        selected && !unavailable && "border-primary bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      <ProviderLogo provider={model.provider} size="md" className="mt-0.5 sm:mt-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium leading-snug">{model.displayName}</span>
          {displayBadge ? (
            <Badge variant={badgeVariant(displayBadge)} className="text-[10px]">
              {displayBadge}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{model.providerLabel}</p>
        {model.pricing ? (
          <p className="mt-0.5 text-xs text-muted-foreground sm:truncate">
            Entrada {formatUsdPerMillion(model.pricing.promptPer1M).replace(" / 1M tokens", "")} ·
            Saída {formatUsdPerMillion(model.pricing.completionPer1M).replace(" / 1M tokens", "")}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1 self-center">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
          aria-label={`Informações sobre ${model.displayName}`}
          onClick={onInfo}
        >
          <Info className="h-4 w-4" />
        </button>
        {selected && !unavailable ? (
          <Check className="h-4 w-4 text-primary" aria-hidden />
        ) : null}
      </div>
    </div>
  );
}

export function OpenRouterModelPicker({ value, onChange }: OpenRouterModelPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<AiProvider | "all">("all");
  const [models, setModels] = useState<EnrichedCatalogModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [infoModel, setInfoModel] = useState<EnrichedCatalogModel | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const catalogMatch = findCatalogModel(value);
  const isCustom = Boolean(value && !catalogMatch);

  useEffect(() => {
    void getOpenRouterModelsForPicker().then(setModels);
  }, []);

  useEffect(() => {
    if (!pickerOpen || models.length > 0) return;
    setLoading(true);
    void getOpenRouterModelsForPicker()
      .then(setModels)
      .finally(() => setLoading(false));
  }, [pickerOpen, models.length]);

  const providersInCatalog = useMemo(() => {
    const set = new Set(models.map((m) => m.provider));
    return PROVIDER_ORDER.filter((p) => set.has(p));
  }, [models]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return models.filter((m) => {
      if (providerFilter !== "all" && m.provider !== providerFilter) return false;
      if (!q) return true;
      return (
        m.displayName.toLowerCase().includes(q) ||
        m.providerLabel.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    });
  }, [models, search, providerFilter]);

  const grouped = useMemo(() => {
    const groups: Array<{ provider: AiProvider; label: string; models: EnrichedCatalogModel[] }> =
      [];
    for (const provider of PROVIDER_ORDER) {
      const items = filtered.filter((m) => m.provider === provider);
      if (items.length > 0) {
        groups.push({
          provider,
          label: AI_PROVIDERS[provider].label,
          models: items,
        });
      }
    }
    return groups;
  }, [filtered]);

  function handleSelect(modelId: string) {
    onChange(modelId);
    setManualMode(false);
    setPickerOpen(false);
    setSearch("");
    setProviderFilter("all");
  }

  function openInfo(model: EnrichedCatalogModel, e: React.MouseEvent) {
    e.stopPropagation();
    setInfoModel(model);
    setInfoOpen(true);
  }

  const displayValue = value || DEFAULT_OPENROUTER_MODEL;
  const enrichedSelected = models.find((m) => m.id === displayValue);
  const selectedInCatalog = enrichedSelected ?? findCatalogModel(displayValue);
  const customProvider = isCustom ? inferProviderFromModelId(displayValue) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
        {selectedInCatalog ? (
          <>
            <ProviderLogo provider={selectedInCatalog.provider} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{selectedInCatalog.displayName}</p>
              <p className="text-xs text-muted-foreground">{selectedInCatalog.providerLabel}</p>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{displayValue}</p>
            </div>
          </>
        ) : isCustom ? (
          <>
            {customProvider ? (
              <ProviderLogo provider={customProvider} />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">Modelo personalizado</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{displayValue}</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-muted-foreground">Nenhum modelo selecionado</p>
              <p className="text-xs text-muted-foreground">
                Escolha um modelo para o botão &quot;Melhorar com IA&quot;
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
          {value ? "Alterar modelo" : "Escolher modelo"}
        </Button>
        <button
          type="button"
          className="text-xs text-primary underline-offset-2 hover:underline"
          onClick={() => setManualMode((v) => !v)}
        >
          {manualMode ? "Usar catálogo" : "Inserir ID manualmente"}
        </button>
      </div>

      {manualMode && (
        <div className="space-y-1.5">
          <Label htmlFor="openrouter-model-manual">ID do modelo (OpenRouter)</Label>
          <Input
            id="openrouter-model-manual"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={DEFAULT_OPENROUTER_MODEL}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Formato: <code className="text-xs">provedor/nome-do-modelo</code>
          </p>
        </div>
      )}

      <Dialog
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (!open) {
            setSearch("");
            setProviderFilter("all");
          }
        }}
      >
        <DialogContent className="flex max-h-[min(85dvh,900px)] w-[calc(100vw-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <DialogHeader className="shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogTitle>Escolher modelo de IA</DialogTitle>
            <DialogDescription>
              {models.length} modelos curados para melhorar textos no admin. Clique para selecionar.
            </DialogDescription>
          </DialogHeader>

          <div className="shrink-0 space-y-3 border-b px-4 py-4 sm:px-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou provedor…"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setProviderFilter("all")}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  providerFilter === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted/60",
                )}
              >
                Todos
              </button>
              {providersInCatalog.map((provider) => {
                const active = providerFilter === provider;
                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setProviderFilter(provider)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted/60",
                    )}
                  >
                    <ProviderLogo provider={provider} size="xs" onPrimary={active} />
                    <span>{AI_PROVIDERS[provider].label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:pb-6">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Carregando modelos e preços…
              </div>
            ) : grouped.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhum modelo encontrado.
              </p>
            ) : (
              <div className="space-y-5 pb-2">
                {grouped.map((group) => (
                  <section key={group.provider} className="scroll-mt-3">
                    <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-center gap-2 bg-background/95 px-1 py-2 backdrop-blur-sm">
                      <ProviderLogo provider={group.provider} size="sm" />
                      <h3 className="text-sm font-semibold">{group.label}</h3>
                      <span className="text-xs text-muted-foreground">({group.models.length})</span>
                    </div>
                    <ul className="space-y-2">
                      {group.models.map((model) => (
                        <li key={model.id}>
                          <ModelCard
                            model={model}
                            selected={model.id === value}
                            onSelect={() => handleSelect(model.id)}
                            onInfo={(e) => openInfo(model, e)}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <OpenRouterModelInfoDialog model={infoModel} open={infoOpen} onOpenChange={setInfoOpen} />
    </div>
  );
}
