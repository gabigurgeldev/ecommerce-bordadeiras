"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderStatus } from "@prisma/client";
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
import type { Order } from "@prisma/client";
import type { z } from "zod";

type FormValues = z.infer<typeof orderUpdateSchema>;

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  PROCESSING: "Em processamento",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export function OrderStatusForm({ order }: { order: Order }) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: {
      status: order.status,
      trackingCode: order.trackingCode ?? "",
      carrier: order.carrier ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const res = await updateOrder(order.id, data);
    if (res.success) {
      toast.success("Pedido atualizado");
      router.refresh();
    } else toast.error(res.error);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
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
        <Input id="carrier" {...form.register("carrier")} placeholder="Correios, Jadlog..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trackingCode">Código de rastreio</Label>
        <Input id="trackingCode" {...form.register("trackingCode")} />
      </div>
      <Button type="submit">Salvar alterações</Button>
    </form>
  );
}
