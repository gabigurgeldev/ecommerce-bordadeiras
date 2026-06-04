"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CouponType } from "@/lib/types/database";
import { toast } from "sonner";
import { couponSchema } from "@/lib/validations/admin";
import { upsertCoupon } from "@/actions/admin/coupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Coupon } from "@/lib/types/database";
import type { z } from "zod";

type FormValues = z.infer<typeof couponSchema>;

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: coupon?.code ?? "",
      type: coupon?.type ?? CouponType.PERCENT,
      value: coupon?.value ?? 10,
      minCents: coupon?.minCents ?? undefined,
      validFrom: coupon?.validFrom?.toISOString().slice(0, 10) ?? "",
      validUntil: coupon?.validUntil?.toISOString().slice(0, 10) ?? "",
      maxUses: coupon?.maxUses ?? undefined,
      active: coupon?.active ?? true,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const res = await upsertCoupon(data, coupon?.id);
    if (res.success) {
      toast.success("Cupom salvo");
      router.push("/admin/cupons");
      router.refresh();
    } else toast.error(res.error);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label>Código</Label>
        <Input {...form.register("code")} className="uppercase" />
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <select className="flex h-9 w-full rounded-md border px-3 text-sm" {...form.register("type")}>
          <option value={CouponType.PERCENT}>Percentual</option>
          <option value={CouponType.FIXED}>Valor fixo (centavos)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Valor</Label>
        <Input type="number" {...form.register("value", { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label>Mínimo (centavos)</Label>
        <Input type="number" {...form.register("minCents", { valueAsNumber: true })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Válido de</Label>
          <Input type="date" {...form.register("validFrom")} />
        </div>
        <div className="space-y-2">
          <Label>Válido até</Label>
          <Input type="date" {...form.register("validUntil")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Máx. usos</Label>
        <Input type="number" {...form.register("maxUses", { valueAsNumber: true })} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("active")} />
        Ativo
      </label>
      <Button type="submit">Salvar</Button>
    </form>
  );
}
