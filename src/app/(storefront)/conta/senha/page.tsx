import { PasswordForm } from "@/components/account/password-form";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Alterar senha",
  path: "/conta/senha",
  noIndex: true,
});

export default function ContaSenhaPage() {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-[var(--color-brown)]">
        Senha
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Defina uma nova senha para sua conta.
      </p>
      <PasswordForm />
    </div>
  );
}
