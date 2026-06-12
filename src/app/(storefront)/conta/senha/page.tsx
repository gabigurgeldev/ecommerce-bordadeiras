import { AccountSectionHeader } from "@/components/account/account-section-header";
import { PasswordForm } from "@/components/account/password-form";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Alterar senha",
  path: "/conta/senha",
  noIndex: true,
});

export default function ContaSenhaPage() {
  return (
    <div className="space-y-6">
      <AccountSectionHeader
        title="Senha"
        description="Defina uma nova senha para sua conta."
      />
      <PasswordForm />
    </div>
  );
}
