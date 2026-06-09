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
    <div>
      <h2 className="font-display text-xl font-semibold text-[var(--color-brown)]">
        Preferências de notificação
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Escolha como deseja receber atualizações da sua conta.
      </p>
      <NotificationsForm initialPrefs={prefs} />
    </div>
  );
}
