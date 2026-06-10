"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { adminFilterSelectClass } from "@/components/admin/admin-list-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentMethod } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export type PeriodPreset = "all" | "today" | "7d" | "30d" | "custom";

export type TrackingFilter = "all" | "with" | "without";

export type OrderSort = "newest" | "oldest" | "value_desc" | "value_asc";

export type QuickPreset = "none" | "awaiting_ship" | "in_transit";

export type OrderAdvancedFilterState = {
  periodPreset: PeriodPreset;
  dateFrom: string;
  dateTo: string;
  minValue: string;
  maxValue: string;
  paymentMethod: string;
  tracking: TrackingFilter;
  quickPreset: QuickPreset;
  sort: OrderSort;
};

export const DEFAULT_ORDER_FILTERS: OrderAdvancedFilterState = {
  periodPreset: "all",
  dateFrom: "",
  dateTo: "",
  minValue: "",
  maxValue: "",
  paymentMethod: "all",
  tracking: "all",
  quickPreset: "none",
  sort: "newest",
};

function hasActiveFilters(filters: OrderAdvancedFilterState): boolean {
  return (
    filters.periodPreset !== "all" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.minValue !== "" ||
    filters.maxValue !== "" ||
    filters.paymentMethod !== "all" ||
    filters.tracking !== "all" ||
    filters.quickPreset !== "none" ||
    filters.sort !== "newest"
  );
}

export function OrderAdvancedFilters({
  filters,
  onChange,
  onReset,
  open,
  onOpenChange,
}: {
  filters: OrderAdvancedFilterState;
  onChange: (next: OrderAdvancedFilterState) => void;
  onReset: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const active = hasActiveFilters(filters);

  const set = (patch: Partial<OrderAdvancedFilterState>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onOpenChange(!open)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros avançados
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </Button>

        {active && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={onReset}
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 rounded-lg border bg-card p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs">Período</Label>
              <select
                className={cn(adminFilterSelectClass, "w-full")}
                value={filters.periodPreset}
                onChange={(e) =>
                  set({
                    periodPreset: e.target.value as PeriodPreset,
                    ...(e.target.value !== "custom"
                      ? { dateFrom: "", dateTo: "" }
                      : {}),
                  })
                }
              >
                <option value="all">Todos</option>
                <option value="today">Hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {filters.periodPreset === "custom" && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">De</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => set({ dateFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Até</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => set({ dateTo: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-xs">Valor mínimo (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0,00"
                value={filters.minValue}
                onChange={(e) => set({ minValue: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Valor máximo (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0,00"
                value={filters.maxValue}
                onChange={(e) => set({ maxValue: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Pagamento</Label>
              <select
                className={cn(adminFilterSelectClass, "w-full")}
                value={filters.paymentMethod}
                onChange={(e) => set({ paymentMethod: e.target.value })}
              >
                <option value="all">Todos</option>
                <option value={PaymentMethod.PIX}>PIX</option>
                <option value={PaymentMethod.CREDIT_CARD}>Cartão</option>
                <option value={PaymentMethod.BOLETO}>Boleto</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Rastreio</Label>
              <select
                className={cn(adminFilterSelectClass, "w-full")}
                value={filters.tracking}
                onChange={(e) =>
                  set({ tracking: e.target.value as TrackingFilter })
                }
              >
                <option value="all">Todos</option>
                <option value="with">Com código</option>
                <option value="without">Sem código</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Atalho</Label>
              <select
                className={cn(adminFilterSelectClass, "w-full")}
                value={filters.quickPreset}
                onChange={(e) =>
                  set({ quickPreset: e.target.value as QuickPreset })
                }
              >
                <option value="none">Nenhum</option>
                <option value="awaiting_ship">Aguardando envio</option>
                <option value="in_transit">Em trânsito</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Ordenar por</Label>
              <select
                className={cn(adminFilterSelectClass, "w-full")}
                value={filters.sort}
                onChange={(e) => set({ sort: e.target.value as OrderSort })}
              >
                <option value="newest">Mais recente</option>
                <option value="oldest">Mais antigo</option>
                <option value="value_desc">Maior valor</option>
                <option value="value_asc">Menor valor</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
