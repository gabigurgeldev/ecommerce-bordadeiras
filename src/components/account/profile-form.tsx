"use client";

import { updateProfile } from "@/actions/account/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ProfileForm({
  initialName,
  email,
  initialPhone,
}: {
  initialName: string;
  email: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await updateProfile({
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? "") || null,
    });
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Perfil atualizado");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label-caps mb-1.5 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          Nome
        </label>
        <Input name="name" defaultValue={initialName} required />
      </div>
      <div className="sm:col-span-2">
        <label className="label-caps mb-1.5 flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          E-mail
        </label>
        <Input name="email" type="email" defaultValue={email} readOnly />
      </div>
      <div className="sm:col-span-2">
        <label className="label-caps mb-1.5 block">Telefone</label>
        <Input
          name="phone"
          defaultValue={initialPhone}
          placeholder="(00) 00000-0000"
        />
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
