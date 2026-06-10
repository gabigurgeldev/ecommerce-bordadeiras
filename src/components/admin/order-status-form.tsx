"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderStatus } from "@/lib/types/database";
import { nextSuggestedStatus } from "@/lib/order-status-transitions";
import { formatOrderStatus } from "@/lib/format";
import { toast } from "sonner";
import { orderUpdateSchema } from "@/lib/validations/admin";
import { updateOrder } from "@/actions/admin/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order } from "@/lib/types/database";
import type { z } from "zod";

type FormValues = z.infer<typeof orderUpdateSchema>;

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  PROCESSING: "Em preparação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export function OrderStatusForm({ order }: { order: Order }) {
  const router = useRouter();
  const suggested = nextSuggestedStatus(order.status);

  const form = useForm<FormValues>({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: {
      status: order.status,
      trackingCode: order.trackingCode ?? "",
      carrier: order.carrier ?? "Correios",
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const watchedCarrier = form.watch("carrier");
  const watchedTrackingCode = form.watch("trackingCode");

  const onSubmit = form.handleSubmit(async (data) => {
    const res = await updateOrder(order.id, data);
    if (res.success) {
      toast.success("Pedido atualizado");
      router.refresh();
    } else toast.error(res.error);
  });

  async function applyQuickStatus(status: OrderStatus, extra?: Partial<FormValues>) {
    const trackingCode = (
      extra?.trackingCode ??
      form.getValues("trackingCode") ??
      ""
    ).trim();
    const carrier = (
      extra?.carrier ??
      form.getValues("carrier") ??
      "Correios"
    ).trim();

    const payload: FormValues = {
      status,
      trackingCode: trackingCode || null,
      carrier: carrier || null,
    };
    const res = await updateOrder(order.id, payload);
    if (res.success) {
      toast.success("Pedido atualizado");
      form.reset(payload);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm font-medium">Status atual</p>
        <p className="mt-1 text-lg font-semibold">
          {formatOrderStatus(order.status)}
        </p>

        {suggested === OrderStatus.PROCESSING && (
          <Button
            type="button"
            className="mt-4"
            disabled={isSubmitting}
            onClick={() => void applyQuickStatus(OrderStatus.PROCESSING)}
          >
            Marcar em preparação
          </Button>
        )}

        {suggested === OrderStatus.SHIPPED && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Informe os dados de envio para marcar como despachado.
            </p>
            <div className="space-y-2">
              <Label htmlFor="quick-carrier">Transportadora</Label>
              <Input
                id="quick-carrier"
                value={watchedCarrier ?? ""}
                onChange={(e) =>
                  form.setValue("carrier", e.target.value, { shouldDirty: true })
                }
                placeholder="Correios"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-tracking">Código de rastreio</Label>
              <Input
                id="quick-tracking"
                value={watchedTrackingCode ?? ""}
                onChange={(e) =>
                  form.setValue("trackingCode", e.target.value, {
                    shouldDirty: true,
                  })
                }
                placeholder="Ex.: AA123456789BR"
              />
            </div>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void applyQuickStatus(OrderStatus.SHIPPED)}
            >
              Marcar como enviado
            </Button>
          </div>
        )}

        {suggested === OrderStatus.DELIVERED && (
          <Button
            type="button"
            className="mt-4"
            disabled={isSubmitting}
            onClick={() => void applyQuickStatus(OrderStatus.DELIVERED)}
          >
            Marcar como entregue
          </Button>
        )}

        {order.status === OrderStatus.SHIPPED && order.trackingCode && (
          <p className="mt-3 text-sm text-muted-foreground">
            Rastreio atual: <strong>{order.trackingCode}</strong>
            {order.carrier ? ` (${order.carrier})` : ""}
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="max-w-md space-y-4 border-t pt-4">
        <p className="text-sm font-medium text-muted-foreground">
          Atualização manual
        </p>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(v) => form.setValue("status", v as OrderStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(OrderStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="carrier">Transportadora</Label>
          <Input
            id="carrier"
            {...form.register("carrier")}
            placeholder="Correios, Jadlog..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trackingCode">Código de rastreio</Label>
          <Input id="trackingCode" {...form.register("trackingCode")} />
        </div>
        <Button type="submit" variant="outline" disabled={isSubmitting}>
          Salvar alterações
        </Button>
      </form>
    </div>
  );
}
