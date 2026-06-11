import { getCustomerInsights } from "@/actions/admin/customers";
import { listWhatsappTemplates } from "@/actions/admin/whatsapp-templates";
import { CustomerDetailView } from "@/components/admin/customer-detail-view";
import { PageHeader } from "@/components/admin/page-header";
import { WhatsappTemplateEvent } from "@/lib/types/database";
import { notFound } from "next/navigation";

const OUTREACH_EVENTS = new Set<string>([
  WhatsappTemplateEvent.PENDING_PAYMENT,
  WhatsappTemplateEvent.ABANDONED_CART,
  WhatsappTemplateEvent.CUSTOM_OUTREACH,
]);

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [insights, allTemplates] = await Promise.all([
    getCustomerInsights(id),
    listWhatsappTemplates(),
  ]);
  if (!insights) notFound();

  const templates = allTemplates.filter((t) =>
    OUTREACH_EVENTS.has(String(t.event)),
  );

  return (
    <div>
      <PageHeader
        title={insights.profile.name ?? insights.profile.email}
        description="Perfil, interações e contato"
      />
      <CustomerDetailView
        insights={insights}
        templates={templates}
        whatsappConnected={insights.whatsappConnected}
      />
    </div>
  );
}
