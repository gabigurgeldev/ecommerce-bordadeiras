"use client";

import { OrderStatusBadge } from "@/components/account/order-status-badge";
import {
  formatDate,
  formatOrderStatus,
  getOrderStatusDescription,
} from "@/lib/format";
import {
  buildTrackingUrl,
  getTrackingLinkLabel,
} from "@/lib/tracking-url";
import type { OrderStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Copy,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const flow: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const stepTimestampKey: Record<
  string,
  "createdAt" | "paidAt" | "processingAt" | "shippedAt" | "deliveredAt" | null
> = {
  PENDING: "createdAt",
  PAID: "paidAt",
  PROCESSING: "processingAt",
  SHIPPED: "shippedAt",
  DELIVERED: "deliveredAt",
};

const stepIcons = [CheckCircle2, CheckCircle2, Package, Truck, CheckCircle2];

export function OrderTracking({
  status,
  trackingCode,
  carrier,
  shippingServiceName,
  createdAt,
  paidAt,
  processingAt,
  shippedAt,
  deliveredAt,
  cancelledAt,
}: {
  status: OrderStatus;
  trackingCode: string | null;
  carrier?: string | null;
  shippingServiceName?: string | null;
  createdAt?: Date | null;
  paidAt?: Date | null;
  processingAt?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
}) {
  const [copied, setCopied] = useState(false);

  const timestamps: Record<string, Date | null | undefined> = {
    createdAt,
    paidAt,
    processingAt,
    shippedAt,
    deliveredAt,
  };

  const trackingUrl = buildTrackingUrl(carrier, trackingCode);

  async function copyTrackingCode() {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      toast.success("Código copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o código");
    }
  }

  if (status === "CANCELLED") {
    return (
      <div className="account-card border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <XCircle className="h-6 w-6 shrink-0 text-red-600" />
          <div>
            <p className="text-sm text-red-700">Status atual</p>
            <p className="text-lg font-semibold text-red-900">
              Pedido cancelado
            </p>
            {cancelledAt ? (
              <p className="mt-1 text-sm text-red-700/80">
                Cancelado em {formatDate(cancelledAt)}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = flow.indexOf(status);

  return (
    <div className="account-card space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">Status atual</p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-brown)]">
            {getOrderStatusDescription(status)}
          </p>
        </div>
        <OrderStatusBadge status={status} />
      </div>

      {/* Horizontal stepper — desktop */}
      <ol className="hidden sm:flex sm:items-center sm:justify-between sm:gap-2">
        {flow.map((step, i) => {
          const done = i <= currentIndex;
          const active = i === currentIndex;
          const tsKey = stepTimestampKey[step];
          const ts = tsKey ? timestamps[tsKey] : null;

          return (
            <li key={step} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 ? (
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      i <= currentIndex
                        ? "bg-[var(--color-brown)]"
                        : "bg-[var(--color-card-border)]",
                    )}
                  />
                ) : (
                  <span className="flex-1" />
                )}
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done
                      ? "bg-[var(--color-brown)] text-white"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)]",
                    active && "ring-2 ring-[var(--color-price)] ring-offset-2",
                  )}
                >
                  {i + 1}
                </span>
                {i < flow.length - 1 ? (
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      i < currentIndex
                        ? "bg-[var(--color-brown)]"
                        : "bg-[var(--color-card-border)]",
                    )}
                  />
                ) : (
                  <span className="flex-1" />
                )}
              </div>
              <p
                className={cn(
                  "mt-2 text-center text-[11px] font-medium leading-tight",
                  done
                    ? "text-[var(--color-brown)]"
                    : "text-[var(--muted-foreground)]",
                )}
              >
                {formatOrderStatus(step)}
              </p>
              {done && ts ? (
                <p className="mt-0.5 text-center text-[10px] text-[var(--muted-foreground)]">
                  {formatDate(ts)}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Vertical timeline — mobile */}
      <ol className="space-y-4 sm:hidden">
        {flow.map((step, i) => {
          const done = i <= currentIndex;
          const Icon = done ? stepIcons[i] : Circle;
          const tsKey = stepTimestampKey[step];
          const ts = tsKey ? timestamps[tsKey] : null;

          return (
            <li key={step} className="flex items-start gap-3">
              <Icon
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  done
                    ? "text-[var(--color-brown)]"
                    : "text-[var(--color-card-border)]",
                )}
              />
              <div>
                <span
                  className={cn(
                    "font-medium",
                    done
                      ? "text-[var(--color-brown)]"
                      : "text-[var(--muted-foreground)]",
                  )}
                >
                  {formatOrderStatus(step)}
                </span>
                {done && ts ? (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(ts)}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {trackingCode ? (
        <div
          className={cn(
            "rounded-xl border p-4",
            status === "SHIPPED" || status === "DELIVERED"
              ? "border-emerald-200 bg-emerald-50"
              : "border-[var(--color-card-border)] bg-[var(--secondary)]/30",
          )}
        >
          <p className="text-sm font-semibold text-[var(--color-brown)]">
            Rastreamento
          </p>
          {carrier ? (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Transportadora: {carrier}
            </p>
          ) : null}
          {shippingServiceName ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              Serviço: {shippingServiceName}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-white px-3 py-1.5 font-mono text-sm ring-1 ring-[var(--color-card-border)]">
              {trackingCode}
            </code>
            <button
              type="button"
              onClick={() => void copyTrackingCode()}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-card-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-brown)] transition hover:bg-[var(--secondary)]"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copiado" : "Copiar código"}
            </button>
          </div>
          {trackingUrl ? (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-[var(--color-cta)] underline-offset-2 hover:underline"
            >
              {getTrackingLinkLabel(carrier)}
            </a>
          ) : (
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              Código disponível — aguarde atualização do link de rastreio.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
