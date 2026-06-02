import {
  getMercadoPagoSettings,
  getSmtpSettings,
  getStorefrontUtilitySettingsForAdmin,
  getWhatsappStatus,
} from "@/actions/admin/settings";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsTabs } from "@/components/admin/settings-forms";

export default async function AdminSettingsPage() {
  const [mercadoPago, smtp, whatsapp, storefrontUtility] = await Promise.all([
    getMercadoPagoSettings(),
    getSmtpSettings(),
    getWhatsappStatus(),
    getStorefrontUtilitySettingsForAdmin(),
  ]);

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Integrações, e-mail e vitrine"
      />
      <SettingsTabs
        mercadoPago={mercadoPago}
        smtp={smtp}
        whatsapp={whatsapp}
        storefrontUtility={storefrontUtility}
      />
    </div>
  );
}
