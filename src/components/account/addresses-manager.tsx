"use client";

import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/actions/account/addresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Address } from "@/lib/types/database";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AddressesManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await createAddress({
      label: String(form.get("label") ?? "") || null,
      recipientName: String(form.get("recipientName") ?? ""),
      phone: String(form.get("phone") ?? "") || null,
      zipCode: String(form.get("zipCode") ?? ""),
      street: String(form.get("street") ?? ""),
      number: String(form.get("number") ?? ""),
      complement: String(form.get("complement") ?? "") || null,
      neighborhood: String(form.get("neighborhood") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? "").toUpperCase(),
      country: "BR",
      isDefault: form.get("isDefault") === "on",
    });
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Endereço adicionado");
    setShowForm(false);
    router.refresh();
  }

  async function onDelete(id: string) {
    const result = await deleteAddress(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Endereço removido");
    router.refresh();
  }

  async function onSetDefault(id: string) {
    const result = await setDefaultAddress(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Endereço padrão atualizado");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar endereço
          </Button>
        ) : null}
      </div>

      {addresses.length === 0 ? (
        <div className="account-card text-center">
          <MapPin className="mx-auto h-10 w-10 text-[var(--color-brown-muted)]" />
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Nenhum endereço cadastrado.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {addresses.map((addr) => (
            <li key={addr.id} className="account-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] ring-1 ring-[var(--color-card-border)]">
                    <MapPin className="h-5 w-5 text-[var(--color-brown)]" />
                  </span>
                  <div>
                    {addr.isDefault ? (
                      <span className="mb-1 inline-block rounded-full bg-[var(--color-price)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--color-brown)]">
                        Padrão
                      </span>
                    ) : null}
                    <p className="font-medium text-[var(--color-brown)]">
                      {addr.recipientName}
                      {addr.label ? ` · ${addr.label}` : ""}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {addr.street}, {addr.number}
                      {addr.complement ? ` — ${addr.complement}` : ""}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {addr.neighborhood}, {addr.city} — {addr.state} · CEP{" "}
                      {addr.zipCode}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {!addr.isDefault ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void onSetDefault(addr.id)}
                    >
                      Tornar padrão
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => void onDelete(addr.id)}
                    aria-label="Remover endereço"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="account-card grid gap-3 border-dashed sm:grid-cols-2"
        >
          <Input name="label" placeholder="Apelido (ex: Casa)" className="sm:col-span-2" />
          <Input name="recipientName" placeholder="Nome do destinatário" required className="sm:col-span-2" />
          <Input name="phone" placeholder="Telefone" />
          <Input name="zipCode" placeholder="CEP" required />
          <Input name="street" placeholder="Rua" required className="sm:col-span-2" />
          <Input name="number" placeholder="Número" required />
          <Input name="complement" placeholder="Complemento" />
          <Input name="neighborhood" placeholder="Bairro" required />
          <Input name="city" placeholder="Cidade" required />
          <Input name="state" placeholder="UF" required maxLength={2} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="isDefault" />
            Definir como endereço padrão
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando…" : "Salvar endereço"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
