import { getWhatsappStatus } from "@/actions/admin/settings";
import { listWhatsappRecipients } from "@/actions/admin/whatsapp-recipients";
import { PageHeader } from "@/components/admin/page-header";
import { WhatsappConnectPanel } from "@/components/admin/whatsapp-connect-panel";
import { WhatsappRecipientsPanel } from "@/components/admin/whatsapp-recipients-panel";

export default async function AdminWhatsappPage() {
  const [session, recipients] = await Promise.all([
    getWhatsappStatus(),
    listWhatsappRecipients(),
  ]);

  return (
    <div>
      <PageHeader
        title="WhatsApp"
        description="Conecte o número emissor via QR e cadastre quem recebe os alertas de pedido."
      />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <WhatsappConnectPanel initialStatus={session.status} />
        <WhatsappRecipientsPanel recipients={recipients} />
      </div>
    </div>
  );
}
