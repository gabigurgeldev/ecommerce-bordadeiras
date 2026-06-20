import { AccountSectionHeader } from "@/components/account/account-section-header";
import { NotificationsForm } from "@/components/account/notifications-form";
import { fetchNotificationPrefs } from "@/actions/account/notifications";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Notificações",
  path: "/conta/notificacoes",
  noIndex: true,
});

export default async function ContaNotificacoesPage() {
  const prefs = await fetchNotificationPrefs();

  return (
    <div className="space-y-6">
      <AccountSectionHeader
        title="Preferências e consentimentos"
        description="Escolha canais de contato e finalidades de personalização da sua conta."
      />
      <NotificationsForm initialPrefs={prefs} />
    </div>
  );
}
