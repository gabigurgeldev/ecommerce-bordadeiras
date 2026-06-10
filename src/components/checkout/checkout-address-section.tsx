"use client";

import { createAddress } from "@/actions/account/addresses";
import { estimateShipping } from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import type { ShippingOption, ShippingMethodId } from "@/lib/shipping/types";
import type { Address } from "@/lib/types/database";
import type { ShippingAddress } from "@/lib/types/catalog";
import { useCartStore } from "@/store/cart";
import { Loader2, MapPin, Pencil, Truck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type AddressForm = ShippingAddress & {
  recipientName: string;
  phone: string;
};

export type AddressReadyData = {
  shippingAddress: ShippingAddress;
  shippingAddressId?: string;
  shippingCents: number;
  estimatedDays: string;
  shippingMethod?: ShippingMethodId;
  shippingServiceName?: string;
};

const emptyForm: AddressForm = {
  recipientName: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

/** Format digits into 00000-000 mask */
function maskCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
}

function addressToShipping(addr: Address): ShippingAddress {
  return {
    cep: addr.zipCode,
    street: addr.street,
    number: addr.number,
    complement: addr.complement ?? undefined,
    neighborhood: addr.neighborhood,
    city: addr.city,
    state: addr.state,
  };
}

async function lookupCep(cep: string) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

type ValidationErrors = Partial<Record<keyof AddressForm, string>>;

function validateForm(form: AddressForm): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!form.recipientName.trim()) errors.recipientName = "Informe o nome";
  const cepDigits = form.cep.replace(/\D/g, "");
  if (cepDigits.length !== 8) errors.cep = "CEP inválido (8 dígitos)";
  if (!form.street.trim()) errors.street = "Informe a rua";
  if (!form.number.trim()) errors.number = "Informe o número";
  if (!form.neighborhood.trim()) errors.neighborhood = "Informe o bairro";
  if (!form.city.trim()) errors.city = "Informe a cidade";
  if (form.state.length !== 2) errors.state = "UF inválida";
  return errors;
}

function formatShippingLabel(cents: number, days: string, free?: boolean) {
  if (free || cents === 0) {
    return (
      <>
        <strong className="text-emerald-600">Frete grátis</strong>
        {days ? <span className="text-zinc-500"> — {days}</span> : null}
      </>
    );
  }
  return (
    <>
      Frete: <strong>{formatCurrency(cents)}</strong>
      {days ? <span> — {days}</span> : null}
    </>
  );
}

export function CheckoutAddressSection({
  addresses,
  defaultName,
  defaultPhone,
  onAddressReady,
  onShippingChange,
  onEdit,
  initialConfirmed = false,
  savedAddressId,
  savedShippingCents,
  savedShippingMethod,
  cardStyle,
  headingStyle,
}: {
  addresses: Address[];
  defaultName: string;
  defaultPhone: string;
  onAddressReady: (data: AddressReadyData) => void;
  onShippingChange?: (data: {
    shippingCents: number;
    estimatedDays: string;
    shippingMethod?: ShippingMethodId;
    calculated: boolean;
  }) => void;
  onEdit?: () => void;
  initialConfirmed?: boolean;
  savedAddressId?: string;
  savedShippingCents?: number;
  savedShippingMethod?: ShippingMethodId;
  cardStyle?: React.CSSProperties;
  headingStyle?: React.CSSProperties;
}) {
  const { lines, hasHydrated } = useCartStore();

  const [selectedId, setSelectedId] = useState<string | "new">(
    savedAddressId ??
      addresses.find((a) => a.isDefault)?.id ??
      addresses[0]?.id ??
      "new",
  );
  const [form, setForm] = useState<AddressForm>({
    ...emptyForm,
    recipientName: defaultName,
    phone: defaultPhone,
  });
  const [shippingCents, setShippingCents] = useState(savedShippingCents ?? 0);
  const [estimatedDays, setEstimatedDays] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId | undefined>(
    savedShippingMethod,
  );
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingCalculated, setShippingCalculated] = useState(
    savedShippingCents != null,
  );
  const [freeShipping, setFreeShipping] = useState(
    savedShippingCents === 0 && savedShippingCents != null,
  );
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [shippingError, setShippingError] = useState<string | null>(null);

  const shippingRequestRef = useRef(0);

  const notifyShipping = useCallback(
    (
      cents: number,
      days: string,
      method: ShippingMethodId | undefined,
      calculated: boolean,
    ) => {
      onShippingChange?.({
        shippingCents: cents,
        estimatedDays: days,
        shippingMethod: method,
        calculated,
      });
    },
    [onShippingChange],
  );

  const updateShipping = useCallback(
    async (cep: string, method?: ShippingMethodId) => {
      if (!hasHydrated) return;

      const cartItems = lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
      }));
      const digits = cep.replace(/\D/g, "");
      if (digits.length !== 8 || cartItems.length === 0) {
        setShippingCalculated(false);
        setShippingOptions([]);
        setShippingError(null);
        notifyShipping(0, "", undefined, false);
        return;
      }

      const requestId = ++shippingRequestRef.current;
      setLoadingShipping(true);
      setShippingCalculated(false);
      setShippingError(null);

      try {
        const result = await estimateShipping(digits, cartItems, method);
        if (requestId !== shippingRequestRef.current) return;

        if (!result.ok) {
          setShippingOptions([]);
          setEstimatedDays("");
          setShippingError(result.error);
          notifyShipping(0, "", undefined, false);
          return;
        }

        const options = result.options ?? [];
        setShippingOptions(options);
        setShippingCents(result.shippingCents);
        setEstimatedDays(result.estimatedDays);
        setShippingMethod(result.method);
        setFreeShipping(Boolean(result.freeShipping) || result.shippingCents === 0);
        setShippingCalculated(true);
        setShippingError(null);
        notifyShipping(
          result.shippingCents,
          result.estimatedDays,
          result.method,
          true,
        );
      } finally {
        if (requestId === shippingRequestRef.current) {
          setLoadingShipping(false);
        }
      }
    },
    [hasHydrated, lines, notifyShipping],
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (selectedId !== "new") {
      const addr = addresses.find((a) => a.id === selectedId);
      if (addr) void updateShipping(addr.zipCode);
    }
  }, [hasHydrated, selectedId, addresses, updateShipping]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (selectedId === "new") {
      const digits = form.cep.replace(/\D/g, "");
      if (digits.length === 8) {
        void updateShipping(digits);
      }
    }
  }, [hasHydrated, lines, selectedId, form.cep, updateShipping]);

  async function handleCepChange(raw: string) {
    const masked = maskCep(raw);
    setForm((f) => ({ ...f, cep: masked }));
    const digits = masked.replace(/\D/g, "");
    if (digits.length === 8) {
      setLoadingCep(true);
      try {
        const data = await lookupCep(digits);
        if (data) {
          setForm((f) => ({
            ...f,
            street: data.logradouro ?? f.street,
            neighborhood: data.bairro ?? f.neighborhood,
            city: data.localidade ?? f.city,
            state: data.uf ?? f.state,
          }));
          await updateShipping(digits);
          setErrors((e) => ({ ...e, cep: undefined }));
        } else {
          setErrors((e) => ({ ...e, cep: "CEP não encontrado" }));
        }
      } finally {
        setLoadingCep(false);
      }
    } else {
      setShippingCalculated(false);
      setShippingOptions([]);
      notifyShipping(0, "", undefined, false);
    }
  }

  function handleSelectShippingOption(option: ShippingOption) {
    setShippingMethod(option.method);
    setShippingCents(option.shippingCents);
    setEstimatedDays(option.estimatedDays);
    setFreeShipping(option.shippingCents === 0);
    notifyShipping(option.shippingCents, option.estimatedDays, option.method, true);
  }

  async function handleConfirm() {
    if (!shippingCalculated) {
      toast.error("Aguarde o cálculo do frete ou informe um CEP válido");
      return;
    }

    if (selectedId !== "new") {
      const addr = addresses.find((a) => a.id === selectedId);
      if (!addr) {
        toast.error("Selecione um endereço");
        return;
      }
      const shipping = addressToShipping(addr);
      setConfirmed(true);
      onAddressReady({
        shippingAddress: shipping,
        shippingAddressId: addr.id,
        shippingCents,
        estimatedDays,
        shippingMethod,
        shippingServiceName:
          shippingOptions.find((o) => o.method === shippingMethod)?.label,
      });
      return;
    }

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setErrors({});

    setSavingAddress(true);
    try {
      const result = await createAddress({
        recipientName: form.recipientName,
        phone: form.phone || null,
        zipCode: form.cep.replace(/\D/g, ""),
        street: form.street,
        number: form.number,
        complement: form.complement || null,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        country: "BR",
        isDefault: addresses.length === 0,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setConfirmed(true);
      onAddressReady({
        shippingAddress: {
          cep: form.cep,
          street: form.street,
          number: form.number,
          complement: form.complement,
          neighborhood: form.neighborhood,
          city: form.city,
          state: form.state,
        },
        shippingAddressId: result.id,
        shippingCents,
        estimatedDays,
        shippingMethod,
        shippingServiceName:
          shippingOptions.find((o) => o.method === shippingMethod)?.label,
      });
      toast.success("Endereço confirmado");
    } finally {
      setSavingAddress(false);
    }
  }

  function handleEdit() {
    setConfirmed(false);
    onEdit?.();
  }

  function fieldError(key: keyof AddressForm) {
    if (!errors[key]) return null;
    return <p className="mt-0.5 text-xs text-red-500">{errors[key]}</p>;
  }

  function inputClass(key: keyof AddressForm) {
    return errors[key] ? "border-red-400 focus-visible:ring-red-400" : "";
  }

  const shippingBusy = loadingCep || loadingShipping;

  return (
    <section
      className="rounded-2xl border bg-white p-6 dark:bg-zinc-900"
      style={cardStyle}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={headingStyle}>
          Endereço de entrega
        </h2>
        {confirmed && (
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
          >
            <Pencil className="h-3 w-3" />
            Alterar
          </button>
        )}
      </div>

      {confirmed && selectedId !== "new" && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div className="text-emerald-800 dark:text-emerald-300">
            {(() => {
              const addr = addresses.find((a) => a.id === selectedId);
              if (!addr) return null;
              return (
                <>
                  <p className="font-medium">{addr.recipientName}</p>
                  <p className="text-xs opacity-80">
                    {addr.street}, {addr.number}
                    {addr.complement ? ` — ${addr.complement}` : ""} ·{" "}
                    {addr.neighborhood}, {addr.city}/{addr.state} · CEP {addr.zipCode}
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {confirmed && selectedId === "new" && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div className="text-emerald-800 dark:text-emerald-300">
            <p className="font-medium">{form.recipientName}</p>
            <p className="text-xs opacity-80">
              {form.street}, {form.number}
              {form.complement ? ` — ${form.complement}` : ""} ·{" "}
              {form.neighborhood}, {form.city}/{form.state} · CEP {form.cep}
            </p>
          </div>
        </div>
      )}

      {!confirmed && (
        <>
          {addresses.length > 0 && (
            <div className="mt-4 space-y-2">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className="flex cursor-pointer gap-3 rounded-xl border p-4 has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50/50 dark:has-[:checked]:bg-rose-950/20"
                  style={
                    cardStyle
                      ? {
                          borderColor:
                            selectedId === addr.id
                              ? "var(--co-primary)"
                              : "var(--co-border)",
                          backgroundColor:
                            selectedId === addr.id
                              ? "color-mix(in srgb, var(--co-primary) 5%, transparent)"
                              : undefined,
                          borderRadius: "var(--co-radius)",
                        }
                      : undefined
                  }
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedId === addr.id}
                    onChange={() => {
                      setSelectedId(addr.id);
                      setConfirmed(false);
                    }}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    <span className="font-medium">{addr.recipientName}</span>
                    <br />
                    {addr.street}, {addr.number}
                    {addr.complement ? ` — ${addr.complement}` : ""}
                    <br />
                    {addr.neighborhood}, {addr.city}/{addr.state} — CEP {addr.zipCode}
                  </span>
                </label>
              ))}
              <label
                className="flex cursor-pointer gap-3 rounded-xl border p-4 has-[:checked]:border-rose-500 dark:has-[:checked]:bg-rose-950/20"
                style={
                  cardStyle
                    ? {
                        borderColor:
                          selectedId === "new"
                            ? "var(--co-primary)"
                            : "var(--co-border)",
                        borderRadius: "var(--co-radius)",
                      }
                    : undefined
                }
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedId === "new"}
                  onChange={() => {
                    setSelectedId("new");
                    setConfirmed(false);
                    setErrors({});
                  }}
                  className="mt-1"
                />
                <span className="text-sm font-medium">Usar novo endereço</span>
              </label>
            </div>
          )}

          {(selectedId === "new" || addresses.length === 0) && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>
                  Nome do destinatário <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.recipientName}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, recipientName: e.target.value }));
                    if (errors.recipientName)
                      setErrors((er) => ({ ...er, recipientName: undefined }));
                  }}
                  className={inputClass("recipientName")}
                />
                {fieldError("recipientName")}
              </div>

              <div>
                <Label>Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label>
                  CEP <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    value={form.cep}
                    placeholder="00000-000"
                    onChange={(e) => void handleCepChange(e.target.value)}
                    className={inputClass("cep")}
                    maxLength={9}
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
                  )}
                </div>
                {loadingCep && (
                  <p className="mt-1 text-xs text-zinc-500">Buscando endereço…</p>
                )}
                {fieldError("cep")}
              </div>

              <div className="sm:col-span-2">
                <Label>
                  Rua <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.street}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, street: e.target.value }));
                    if (errors.street) setErrors((er) => ({ ...er, street: undefined }));
                  }}
                  className={inputClass("street")}
                />
                {fieldError("street")}
              </div>

              <div>
                <Label>
                  Número <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.number}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, number: e.target.value }));
                    if (errors.number) setErrors((er) => ({ ...er, number: undefined }));
                  }}
                  className={inputClass("number")}
                />
                {fieldError("number")}
              </div>

              <div>
                <Label>Complemento</Label>
                <Input
                  value={form.complement}
                  placeholder="Apto, Bloco, etc."
                  onChange={(e) =>
                    setForm((f) => ({ ...f, complement: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>
                  Bairro <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.neighborhood}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, neighborhood: e.target.value }));
                    if (errors.neighborhood)
                      setErrors((er) => ({ ...er, neighborhood: undefined }));
                  }}
                  className={inputClass("neighborhood")}
                />
                {fieldError("neighborhood")}
              </div>

              <div>
                <Label>
                  Cidade <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.city}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, city: e.target.value }));
                    if (errors.city) setErrors((er) => ({ ...er, city: undefined }));
                  }}
                  className={inputClass("city")}
                />
                {fieldError("city")}
              </div>

              <div>
                <Label>
                  UF <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={2}
                  value={form.state}
                  placeholder="SP"
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      state: e.target.value.toUpperCase(),
                    }));
                    if (errors.state) setErrors((er) => ({ ...er, state: undefined }));
                  }}
                  className={inputClass("state")}
                />
                {fieldError("state")}
              </div>
            </div>
          )}

          <div
            className="mt-4 rounded-xl border p-4"
            style={
              cardStyle
                ? { borderColor: "var(--co-border)", borderRadius: "var(--co-radius)" }
                : undefined
            }
          >
            <div className="flex items-center gap-2 text-sm font-medium" style={headingStyle}>
              <Truck className="h-4 w-4" />
              Entrega
            </div>

            {loadingShipping && (
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculando frete…
              </div>
            )}

            {!loadingShipping && !shippingCalculated && !shippingError && (
              <p className="mt-2 text-sm text-zinc-500">
                {hasHydrated
                  ? "Informe o CEP para calcular o frete"
                  : "Carregando carrinho…"}
              </p>
            )}

            {shippingError ? (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {shippingError}
              </p>
            ) : null}

            {!loadingShipping && shippingCalculated && shippingOptions.length > 0 && (
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {shippingOptions.map((option) => (
                  <label
                    key={option.method}
                    className="flex cursor-pointer gap-3 rounded-lg border p-3 has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50/50 dark:has-[:checked]:bg-rose-950/20"
                    style={
                      cardStyle
                        ? {
                            borderColor:
                              shippingMethod === option.method
                                ? "var(--co-primary)"
                                : "var(--co-border)",
                            backgroundColor:
                              shippingMethod === option.method
                                ? "color-mix(in srgb, var(--co-primary) 5%, transparent)"
                                : undefined,
                            borderRadius: "var(--co-radius)",
                          }
                        : undefined
                    }
                  >
                    <input
                      type="radio"
                      name="shipping-method"
                      checked={shippingMethod === option.method}
                      onChange={() => handleSelectShippingOption(option)}
                      className="mt-0.5"
                    />
                    <span className="flex flex-1 items-center justify-between gap-2 text-sm">
                      <span>
                        <span className="font-medium">{option.label}</span>
                        <span className="block text-xs text-zinc-500">
                          {option.estimatedDays}
                        </span>
                      </span>
                      <span className="font-semibold">
                        {option.shippingCents === 0 ? (
                          <span className="text-emerald-600">Grátis</span>
                        ) : (
                          formatCurrency(option.shippingCents)
                        )}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {!loadingShipping && shippingCalculated && shippingOptions.length === 0 && (
              <p className="mt-2 text-sm text-zinc-600">
                {formatShippingLabel(shippingCents, estimatedDays, freeShipping)}
              </p>
            )}
          </div>

          <Button
            className="mt-4 w-full"
            disabled={savingAddress || shippingBusy || !shippingCalculated}
            onClick={() => void handleConfirm()}
          >
            {savingAddress ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando…
              </>
            ) : (
              "Confirmar endereço"
            )}
          </Button>
        </>
      )}

      {confirmed && (
        <p className="mt-3 text-sm text-zinc-500">
          {formatShippingLabel(shippingCents, estimatedDays, freeShipping)}
          {shippingMethod && shippingOptions.length > 1 ? (
            <span className="text-zinc-400">
              {" "}
              · {shippingOptions.find((o) => o.method === shippingMethod)?.label ?? shippingMethod}
            </span>
          ) : null}
        </p>
      )}
    </section>
  );
}
