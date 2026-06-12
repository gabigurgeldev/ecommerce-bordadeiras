import { AccountSectionHeader } from "@/components/account/account-section-header";
import { ProfileForm } from "@/components/account/profile-form";
import { getSessionUser } from "@/lib/auth/session";
import { getDb, TABLES } from "@/lib/supabase/db";
import { buildMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Minha conta — Perfil",
  path: "/conta",
  noIndex: true,
});

export default async function ContaPerfilPage() {
  const sessionUser = await getSessionUser();
  let user: { name: string | null; email: string; phone: string | null } | null =
    null;

  if (sessionUser?.id) {
    try {
      const { data } = await getDb()
        .from(TABLES.User)
        .select("name, email, phone")
        .eq("id", sessionUser.id)
        .maybeSingle();
      if (data) {
        user = {
          name: data.name != null ? String(data.name) : null,
          email: String(data.email),
          phone: data.phone != null ? String(data.phone) : null,
        };
      }
    } catch {
      /* profile row optional */
    }
  }

  const displayName = user?.name ?? sessionUser?.name ?? "Cliente";
  const displayEmail = user?.email ?? sessionUser?.email ?? "";

  return (
    <div className="space-y-6">
      <div className="account-card bg-gradient-to-br from-[var(--secondary)]/50 to-white">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-semibold text-[var(--color-brown)] shadow-sm ring-2 ring-[var(--color-price)]/30">
            {displayName[0]?.toUpperCase() ?? "U"}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold text-[var(--color-brown)]">
              {displayName}
            </p>
            <p className="truncate text-sm text-[var(--muted-foreground)]">
              {displayEmail}
            </p>
            <span className="mt-2 inline-block rounded-full bg-[var(--color-brown)]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-brown)]">
              Membro
            </span>
          </div>
        </div>
      </div>

      <AccountSectionHeader
        title="Dados do perfil"
        description={
          sessionUser
            ? "Atualize seu nome e telefone."
            : "Faça login para ver e gerenciar seu perfil."
        }
      />

      {!sessionUser ? (
        <Button asChild>
          <Link href="/login?callbackUrl=/conta">Entrar na conta</Link>
        </Button>
      ) : (
        <div className="account-card">
          <ProfileForm
            initialName={user?.name ?? sessionUser.name ?? ""}
            email={displayEmail}
            initialPhone={user?.phone ?? ""}
          />
        </div>
      )}
    </div>
  );
}
