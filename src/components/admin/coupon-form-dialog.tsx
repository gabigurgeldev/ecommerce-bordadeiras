"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { couponSchema } from "@/lib/validations/admin";
import { upsertCoupon, deleteCoupon } from "@/actions/admin/coupons";
import { AdminWizardDialog } from "@/components/admin/admin-wizard-dialog";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CouponType, type Coupon } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import type { z } from "zod";

type FormValues = z.infer<typeof couponSchema>;

const WIZARD_STEPS = [
  { id: "code", title: "Código e tipo", description: "Identifique o cupom e o tipo de desconto" },
  { id: "value", title: "Valor e regras", description: "Defina o desconto e pedido mínimo" },
  { id: "limits", title: "Validade e limites", description: "Datas, usos máximos e status" },
  { id: "review", title: "Revisão", description: "Confira os dados antes de salvar" },
];

const STEP_FIELDS: (keyof FormValues)[][] = [
  ["code", "type"],
  ["value", "minCents"],
  ["validFrom", "validUntil", "maxUses", "active"],
  [],
];

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function couponToFormValues(coupon?: Coupon): FormValues {
  return {
    code: coupon?.code ?? "",
    type: coupon?.type ?? CouponType.PERCENT,
    value: coupon?.value ?? 10,
    minCents: coupon?.minCents != null ? coupon.minCents : undefined,
    validFrom: toDateInput(coupon?.validFrom),
    validUntil: toDateInput(coupon?.validUntil),
    maxUses: coupon?.maxUses != null ? coupon.maxUses : undefined,
    active: coupon?.active ?? true,
  };
}

const optionalIntField = {
  setValueAs: (value: string) => {
    if (value === "" || value == null) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  },
};

function formatCouponValue(type: CouponType, value: number) {
  return type === CouponType.PERCENT ? `${value}%` : formatCurrency(value);
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function CouponFormDialog({
  coupon,
  trigger,
  defaultOpen = false,
  onClose,
}: {
  coupon?: Coupon;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [step, setStep] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(coupon);

  const form = useForm<FormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: couponToFormValues(coupon),
  });

  const resetForm = () => {
    form.reset(couponToFormValues(coupon));
    setStep(0);
  };

  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, coupon]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setStep(0);
      onClose?.();
    }
  };

  const values = form.watch();

  const validateStep = async () => {
    const fields = STEP_FIELDS[step];
    if (fields.length === 0) return true;
    const ok = await form.trigger(fields);
    if (!ok) toast.error("Preencha os campos obrigatórios antes de continuar.");
    return ok;
  };

  const handleNext = async () => {
    const ok = await validateStep();
    if (ok) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleComplete = form.handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const res = await upsertCoupon(data, coupon?.id);
      if (res.success) {
        toast.success(isEdit ? "Cupom atualizado" : "Cupom criado");
        handleOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  });

  const typeLabel = values.type === CouponType.PERCENT ? "Percentual" : "Valor fixo";

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex">
          {trigger}
        </span>
      ) : !defaultOpen ? (
        isEdit ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Editar
          </Button>
        ) : (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Novo cupom
          </Button>
        )
      ) : null}

      <AdminWizardDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={isEdit ? "Editar cupom" : "Novo cupom"}
        description="Configure desconto, regras e validade em etapas"
        steps={WIZARD_STEPS}
        currentStep={step}
        onBack={handleBack}
        onNext={handleNext}
        onComplete={() => void handleComplete()}
        completeLabel={isEdit ? "Salvar alterações" : "Criar cupom"}
        isSubmitting={submitting}
        footerStart={
          isEdit ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              Excluir
            </Button>
          ) : undefined
        }
      >
        <form id="coupon-wizard-form" onSubmit={(e) => e.preventDefault()}>
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Código</Label>
                <Input
                  id="coupon-code"
                  {...form.register("code")}
                  className="font-mono uppercase"
                  placeholder="EX: VERAO2026"
                  autoFocus
                />
                {form.formState.errors.code && (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Mínimo 3 caracteres. Será convertido para maiúsculas.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-type">Tipo de desconto</Label>
                <select
                  id="coupon-type"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...form.register("type")}
                >
                  <option value={CouponType.PERCENT}>Percentual (%)</option>
                  <option value={CouponType.FIXED}>Valor fixo (R$)</option>
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-value">
                  {values.type === CouponType.PERCENT
                    ? "Percentual de desconto"
                    : "Valor do desconto (centavos)"}
                </Label>
                <Input
                  id="coupon-value"
                  type="number"
                  min={1}
                  {...form.register("value", { valueAsNumber: true })}
                />
                {form.formState.errors.value && (
                  <p className="text-xs text-destructive">{form.formState.errors.value.message}</p>
                )}
                {values.type === CouponType.FIXED && values.value > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Equivale a {formatCurrency(values.value)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-min">Pedido mínimo (centavos)</Label>
                <Input
                  id="coupon-min"
                  type="number"
                  min={0}
                  placeholder="Opcional"
                  {...form.register("minCents", optionalIntField)}
                />
                {typeof values.minCents === "number" && values.minCents > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Mínimo de {formatCurrency(values.minCents)} no carrinho
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="coupon-from">Válido de</Label>
                  <Input id="coupon-from" type="date" {...form.register("validFrom")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-until">Válido até</Label>
                  <Input id="coupon-until" type="date" {...form.register("validUntil")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-max">Máximo de usos</Label>
                <Input
                  id="coupon-max"
                  type="number"
                  min={1}
                  placeholder="Ilimitado"
                  {...form.register("maxUses", optionalIntField)}
                />
              </div>
              <label className="flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm">
                <input type="checkbox" {...form.register("active")} />
                {isEdit ? "Cupom ativo" : "Cupom ativo após criação"}
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-lg border bg-muted/20 px-4 py-1">
              <ReviewRow
                label="Código"
                value={<span className="font-mono">{values.code || "—"}</span>}
              />
              <ReviewRow label="Tipo" value={typeLabel} />
              <ReviewRow
                label="Desconto"
                value={values.value ? formatCouponValue(values.type, values.value) : "—"}
              />
              <ReviewRow
                label="Pedido mínimo"
                value={
                  typeof values.minCents === "number" && values.minCents > 0
                    ? formatCurrency(values.minCents)
                    : "Sem mínimo"
                }
              />
              <ReviewRow
                label="Validade"
                value={
                  values.validFrom || values.validUntil
                    ? `${values.validFrom || "…"} → ${values.validUntil || "…"}`
                    : "Sem limite de data"
                }
              />
              <ReviewRow
                label="Limite de usos"
                value={values.maxUses ? `Até ${values.maxUses} vezes` : "Ilimitado"}
              />
              {isEdit && coupon ? (
                <ReviewRow
                  label="Usos realizados"
                  value={
                    coupon.maxUses != null
                      ? `${coupon.usedCount} / ${coupon.maxUses}`
                      : `${coupon.usedCount} (sem limite)`
                  }
                />
              ) : null}
              <ReviewRow label="Status" value={values.active ? "Ativo" : "Inativo"} />
            </div>
          )}
        </form>
      </AdminWizardDialog>

      {coupon && (
        <AdminConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Excluir cupom?"
          description={`O cupom ${coupon.code} será removido permanentemente.`}
          confirmLabel="Excluir"
          destructive
          onConfirm={async () => {
            const res = await deleteCoupon(coupon.id);
            if (res.success) {
              toast.success("Cupom excluído");
              setConfirmDelete(false);
              handleOpenChange(false);
              router.refresh();
              onClose?.();
            } else {
              toast.error(res.error);
            }
          }}
        />
      )}
    </>
  );
}
