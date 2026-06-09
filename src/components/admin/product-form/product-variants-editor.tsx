"use client";

import { useCallback, useState } from "react";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type VariantOptionDraft = {
  key: string;
  name: string;
  values: string[];
};

export type VariantDraft = {
  key: string;
  attributes: Record<string, string>;
  sku: string;
  priceReais: string;
  compareReais: string;
  stock: number;
  stockUnlimited: boolean;
  imageUrl: string;
  active: boolean;
};

function newKey() {
  return `k-${Math.random().toString(36).slice(2, 9)}`;
}

function cartesian(options: VariantOptionDraft[]): Record<string, string>[] {
  if (!options.length) return [];
  let combos: Record<string, string>[] = [{}];
  for (const opt of options) {
    const next: Record<string, string>[] = [];
    for (const combo of combos) {
      for (const val of opt.values) {
        next.push({ ...combo, [opt.name]: val });
      }
    }
    combos = next;
  }
  return combos;
}

function comboKey(attrs: Record<string, string>) {
  return Object.entries(attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

export function buildVariantsFromOptions(
  options: VariantOptionDraft[],
  existing: VariantDraft[],
): VariantDraft[] {
  const combos = cartesian(
    options.filter((o) => o.name.trim() && o.values.some((v) => v.trim())),
  );
  const byKey = new Map(existing.map((v) => [comboKey(v.attributes), v]));
  return combos.map((attributes) => {
    const key = comboKey(attributes);
    const prev = byKey.get(key);
    return (
      prev ?? {
        key: newKey(),
        attributes,
        sku: "",
        priceReais: "",
        compareReais: "",
        stock: 0,
        stockUnlimited: false,
        imageUrl: "",
        active: true,
      }
    );
  });
}

type ProductVariantsEditorProps = {
  options: VariantOptionDraft[];
  variants: VariantDraft[];
  onOptionsChange: (options: VariantOptionDraft[]) => void;
  onVariantsChange: (variants: VariantDraft[]) => void;
};

export function ProductVariantsEditor({
  options,
  variants,
  onOptionsChange,
  onVariantsChange,
}: ProductVariantsEditorProps) {
  const [newValueByOption, setNewValueByOption] = useState<Record<string, string>>({});

  const regenerate = useCallback(
    (nextOptions: VariantOptionDraft[]) => {
      onVariantsChange(buildVariantsFromOptions(nextOptions, variants));
    },
    [onVariantsChange, variants],
  );

  function addOption() {
    onOptionsChange([...options, { key: newKey(), name: "", values: [] }]);
  }

  function updateOptionName(index: number, name: string) {
    const next = options.map((o, i) => (i === index ? { ...o, name } : o));
    onOptionsChange(next);
    regenerate(next);
  }

  function removeOption(index: number) {
    const next = options.filter((_, i) => i !== index);
    onOptionsChange(next);
    regenerate(next);
  }

  function addValue(optionKey: string) {
    const val = (newValueByOption[optionKey] ?? "").trim();
    if (!val) return;
    const next = options.map((o) =>
      o.key === optionKey && !o.values.includes(val) ? { ...o, values: [...o.values, val] } : o,
    );
    onOptionsChange(next);
    setNewValueByOption((s) => ({ ...s, [optionKey]: "" }));
    regenerate(next);
  }

  function removeValue(optionKey: string, value: string) {
    const next = options.map((o) =>
      o.key === optionKey ? { ...o, values: o.values.filter((v) => v !== value) } : o,
    );
    onOptionsChange(next);
    regenerate(next);
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    onVariantsChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  const hasOptions = options.some((o) => o.name.trim() && o.values.length > 0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Combine diferentes propriedades do seu produto. Exemplo: cor + tamanho.
      </p>

      {options.map((opt, optIndex) => (
        <div key={opt.key} className="rounded-lg border p-4">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
              <Label>Nome da propriedade</Label>
              <Input
                value={opt.name}
                onChange={(e) => updateOptionName(optIndex, e.target.value)}
                placeholder="Ex.: Cor, Tamanho"
              />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optIndex)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 text-xs"
              >
                {val}
                <button type="button" onClick={() => removeValue(opt.key, val)} aria-label={`Remover ${val}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={newValueByOption[opt.key] ?? ""}
              onChange={(e) => setNewValueByOption((s) => ({ ...s, [opt.key]: e.target.value }))}
              placeholder="Novo valor"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addValue(opt.key);
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => addValue(opt.key)}>
              Adicionar
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addOption}>
        <Plus className="mr-1.5 h-4 w-4" />
        Adicionar propriedade
      </Button>

      {hasOptions && variants.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Variação</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Imagem (URL)</th>
                <th className="px-3 py-2">Preço (R$)</th>
                <th className="px-3 py-2">Promo (R$)</th>
                <th className="px-3 py-2">Estoque</th>
                <th className="px-3 py-2">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, index) => (
                <tr key={variant.key} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 font-medium">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      {Object.entries(variant.attributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, { sku: e.target.value })}
                      className="h-8 min-w-[100px]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={variant.imageUrl}
                      onChange={(e) => updateVariant(index, { imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="h-8 min-w-[120px]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={variant.priceReais}
                      onChange={(e) => updateVariant(index, { priceReais: e.target.value })}
                      placeholder="Base"
                      className="h-8 w-24"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={variant.compareReais}
                      onChange={(e) => updateVariant(index, { compareReais: e.target.value })}
                      className="h-8 w-24"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        disabled={variant.stockUnlimited}
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(index, { stock: Number(e.target.value) || 0 })
                        }
                        className="h-8 w-20"
                      />
                      <label className="flex items-center gap-1 whitespace-nowrap text-xs">
                        <input
                          type="checkbox"
                          checked={variant.stockUnlimited}
                          onChange={(e) =>
                            updateVariant(index, { stockUnlimited: e.target.checked })
                          }
                        />
                        ∞
                      </label>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={variant.active}
                      onChange={(e) => updateVariant(index, { active: e.target.checked })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function optionsFromProduct(
  productOptions?: Array<{ name: string; sortOrder: number; values: Array<{ value: string; sortOrder: number }> }>,
): VariantOptionDraft[] {
  if (!productOptions?.length) return [];
  return [...productOptions]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((o) => ({
      key: newKey(),
      name: o.name,
      values: [...o.values].sort((a, b) => a.sortOrder - b.sortOrder).map((v) => v.value),
    }));
}

export function variantsFromProduct(
  productVariants: Array<{
    sku: string | null;
    priceCents: number | null;
    compareCents: number | null;
    stock: number;
    stockUnlimited: boolean;
    attributes: Record<string, unknown>;
    imageUrl: string | null;
    active: boolean;
    sortOrder: number;
  }> | undefined,
  centsToReais: (c: number | null | undefined) => string,
): VariantDraft[] {
  if (!productVariants?.length) return [];
  return [...productVariants]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => ({
      key: newKey(),
      attributes: Object.fromEntries(
        Object.entries(v.attributes as Record<string, string>).map(([k, val]) => [k, String(val)]),
      ),
      sku: v.sku ?? "",
      priceReais: v.priceCents != null ? centsToReais(v.priceCents) : "",
      compareReais: v.compareCents != null ? centsToReais(v.compareCents) : "",
      stock: v.stock,
      stockUnlimited: v.stockUnlimited,
      imageUrl: v.imageUrl ?? "",
      active: v.active,
    }));
}

export function reaisToCentsOptional(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed.replace(",", "."));
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}
