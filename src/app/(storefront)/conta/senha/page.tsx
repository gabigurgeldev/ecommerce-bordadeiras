import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Alterar senha",
  path: "/conta/senha",
  noIndex: true,
});

export default function ContaSenhaPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Senha</h2>
      <form className="mt-6 max-w-md space-y-4">
        <div>
          <label className="text-xs text-zinc-500">Senha atual</label>
          <Input type="password" name="current" />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Nova senha</label>
          <Input type="password" name="new" />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Confirmar nova senha</label>
          <Input type="password" name="confirm" />
        </div>
        <Button type="button">Atualizar senha</Button>
      </form>
    </div>
  );
}
