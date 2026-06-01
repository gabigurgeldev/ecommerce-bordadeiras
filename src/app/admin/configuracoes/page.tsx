import {
  getMercadoPagoSettings,
  getSmtpSettings,
  getWhatsappStatus,
} from "@/actions/admin/settings";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsTabs } from "@/components/admin/settings-forms";

export default async function AdminSettingsPage() {
  const [mercadoPago, smtp, whatsapp] = await Promise.all([
    getMercadoPagoSettings(),
    getSmtpSettings(),
    getWhatsappStatus(),
  ]);

  return (
    <div>
      <PageHeader title="Configurações" description="Integrações e e-mail" />
      <SettingsTabs mercadoPago={mercadoPago} smtp={smtp} whatsapp={whatsapp} />
    </div>
  );
}
