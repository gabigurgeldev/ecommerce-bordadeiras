import { OrderConfirmDeliveryButton } from "@/components/account/order-confirm-delivery-button";
import { OrderDetailHeader } from "@/components/account/order-detail-header";
import { OrderItemsCard } from "@/components/account/order-items-card";
import { OrderPaymentCard } from "@/components/account/order-payment-card";
import { OrderPendingPoller } from "@/components/account/order-pending-poller";
import { OrderShippingCard } from "@/components/account/order-shipping-card";
import { OrderSummaryCard } from "@/components/account/order-summary-card";
import { OrderTracking } from "@/components/account/order-tracking";
import { fetchUserOrder } from "@/actions/orders";
import { PendingCheckoutBanner } from "@/components/checkout/pending-checkout-banner";
import { getPendingCheckoutOrderForUser } from "@/lib/data/pending-order";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSessionUser } from "@/lib/auth/session";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const order = await fetchUserOrder(id);
  return buildMetadata({
    title: order ? `Pedido ${order.orderNumber}` : `Pedido ${id.slice(-8)}`,
    path: `/conta/pedidos/${id}`,
    noIndex: true,
  });
}

export default async function ContaPedidoDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await fetchUserOrder(id);
  if (!order) notFound();

  const sessionUser = await getSessionUser();
  const pendingResume =
    order.status === "PENDING" && sessionUser?.id
      ? await getPendingCheckoutOrderForUser(sessionUser.id, order.id)
      : null;

  return (
    <div className="space-y-6">
      <OrderDetailHeader
        orderNumber={order.orderNumber}
        createdAt={order.createdAt}
        status={order.status}
      />

      {pendingResume ? <PendingCheckoutBanner order={pendingResume} /> : null}

      {order.status === "PENDING" ? (
        <OrderPendingPoller orderId={order.id} />
      ) : null}

      <OrderTracking
        status={order.status}
        trackingCode={order.trackingCode}
        carrier={order.carrier}
        shippingServiceName={order.shippingServiceName}
        createdAt={order.createdAt}
        paidAt={order.paidAt}
        processingAt={order.processingAt}
        shippedAt={order.shippedAt}
        deliveredAt={order.deliveredAt}
        cancelledAt={order.cancelledAt}
      />

      <OrderConfirmDeliveryButton
        orderId={order.id}
        status={order.status}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <OrderPaymentCard payments={order.payments} />
        <OrderSummaryCard
          subtotalCents={order.subtotalCents}
          discountCents={order.discountCents}
          couponCode={order.couponCode}
          shippingCents={order.shippingCents}
          shippingServiceName={order.shippingServiceName}
          totalCents={order.totalCents}
        />
      </div>

      <OrderItemsCard items={order.items} />

      {order.shippingAddress ? (
        <OrderShippingCard address={order.shippingAddress} />
      ) : null}
    </div>
  );
}
