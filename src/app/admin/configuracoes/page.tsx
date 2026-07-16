import {
  getMelhorEnvioSettingsForAdmin,
  getMercadoPagoSettings,
  getOpenRouterSettings,
  getShippingSettings,
  getSmtpSettings,
  getStorefrontUtilitySettingsForAdmin,
  getWhatsappStatus,
  getHomeSettingsForAdmin,
} from "@/actions/admin/settings";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsTabs } from "@/components/admin/settings-forms";

export default async function AdminSettingsPage() {
  const [mercadoPago, smtp, whatsapp, storefrontUtility, openRouter, shipping, melhorEnvio, home] =
    await Promise.all([
    getMercadoPagoSettings(),
    getSmtpSettings(),
    getWhatsappStatus(),
    getStorefrontUtilitySettingsForAdmin(),
    getOpenRouterSettings(),
    getShippingSettings(),
    getMelhorEnvioSettingsForAdmin(),
    getHomeSettingsForAdmin(),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/webhooks/mercadopago`;

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
        openRouter={openRouter}
        shipping={shipping}
        melhorEnvio={melhorEnvio}
        home={home}
        webhookUrl={webhookUrl}
      />
    </div>
  );
}
