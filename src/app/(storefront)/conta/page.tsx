import { getSessionUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDb, TABLES } from "@/lib/supabase/db";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Minha conta — Perfil",
  path: "/conta",
  noIndex: true,
});

export default async function ContaPerfilPage() {
  const sessionUser = await getSessionUser();
  let user: { name: string | null; email: string; phone: string | null } | null = null;

  if (sessionUser?.id) {
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
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Perfil</h2>
      <p className="mt-1 text-sm text-zinc-500">
        {user
          ? "Dados da sua conta logada."
          : "Faça login para ver e editar seu perfil."}
      </p>
      <form className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs text-zinc-500">Nome</label>
          <Input name="name" defaultValue={user?.name ?? ""} readOnly={!user} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-zinc-500">E-mail</label>
          <Input
            name="email"
            type="email"
            defaultValue={user?.email ?? sessionUser?.email ?? ""}
            readOnly
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-zinc-500">Telefone</label>
          <Input
            name="phone"
            defaultValue={user?.phone ?? ""}
            readOnly={!user}
          />
        </div>
        <Button type="button" className="sm:col-span-2 w-fit" disabled={!user}>
          Salvar alterações
        </Button>
      </form>
    </div>
  );
}
