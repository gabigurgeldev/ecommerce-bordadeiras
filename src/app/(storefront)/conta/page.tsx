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
    <div>
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--secondary)]/30 p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-semibold text-[var(--color-brown)] shadow-sm">
            {displayName[0]?.toUpperCase() ?? "U"}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold text-[var(--color-brown)]">
              {displayName}
            </p>
            <p className="truncate text-sm text-[var(--muted-foreground)]">
              {displayEmail}
            </p>
          </div>
        </div>
      </div>

      <h2 className="mt-8 font-display text-xl font-semibold text-[var(--color-brown)]">
        Dados do perfil
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {sessionUser
          ? "Atualize seu nome e telefone."
          : "Faça login para ver e gerenciar seu perfil."}
      </p>

      {!sessionUser ? (
        <Button className="mt-6" asChild>
          <Link href="/login?callbackUrl=/conta">Entrar na conta</Link>
        </Button>
      ) : (
        <ProfileForm
          initialName={user?.name ?? sessionUser.name ?? ""}
          email={displayEmail}
          initialPhone={user?.phone ?? ""}
        />
      )}
    </div>
  );
}
