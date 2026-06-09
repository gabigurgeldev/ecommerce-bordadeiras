"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cpfDigits, isValidCpf, maskCpf } from "@/lib/cpf";
import { User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type PersonalInfo = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
};

type ValidationErrors = Partial<Record<keyof PersonalInfo, string>>;

function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function validate(info: PersonalInfo): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!info.name.trim() || info.name.trim().length < 2) {
    errors.name = "Informe seu nome completo";
  }
  if (!info.email.trim()) {
    errors.email = "E-mail obrigatório";
  }
  const cpf = cpfDigits(info.cpf);
  if (!isValidCpf(cpf)) {
    errors.cpf = "CPF inválido";
  }
  return errors;
}

export function CheckoutPersonalInfoSection({
  defaultName,
  defaultEmail,
  defaultPhone,
  value,
  onInfoChange,
  cardStyle,
  headingStyle,
}: {
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  value?: PersonalInfo | null;
  onInfoChange: (info: PersonalInfo, valid: boolean) => void;
  cardStyle?: React.CSSProperties;
  headingStyle?: React.CSSProperties;
}) {
  const [form, setForm] = useState<PersonalInfo>(
    value ?? {
      name: defaultName,
      email: defaultEmail,
      phone: defaultPhone,
      cpf: "",
    },
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PersonalInfo, boolean>>>({});

  const emit = useCallback(
    (next: PersonalInfo) => {
      const nextErrors = validate(next);
      setErrors(nextErrors);
      onInfoChange(next, Object.keys(nextErrors).length === 0);
    },
    [onInfoChange],
  );

  function update<K extends keyof PersonalInfo>(key: K, value: PersonalInfo[K]) {
    const next = { ...form, [key]: value };
    setForm(next);
    emit(next);
  }

  function handleBlur(key: keyof PersonalInfo) {
    setTouched((t) => ({ ...t, [key]: true }));
    emit(form);
  }

  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) return;
    didMountRef.current = true;
    emit(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- validate defaults once on mount
  }, []);

  return (
    <section
      className="rounded-2xl border bg-white p-6 dark:bg-zinc-900"
      style={cardStyle}
    >
      <div className="mb-4 flex items-center gap-2">
        <User className="h-5 w-5 text-zinc-500" />
        <h2 className="text-lg font-semibold" style={headingStyle}>
          Informações pessoais
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="checkout-name">Nome completo</Label>
          <Input
            id="checkout-name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            autoComplete="name"
            className={touched.name && errors.name ? "border-red-400" : ""}
          />
          {touched.name && errors.name && (
            <p className="text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="checkout-email">E-mail</Label>
          <Input
            id="checkout-email"
            type="email"
            value={form.email}
            readOnly
            className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="checkout-phone">Telefone</Label>
          <Input
            id="checkout-phone"
            type="tel"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={form.phone}
            onChange={(e) => update("phone", maskPhone(e.target.value))}
            onBlur={() => handleBlur("phone")}
            autoComplete="tel"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="checkout-cpf">CPF</Label>
          <Input
            id="checkout-cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={(e) => update("cpf", maskCpf(e.target.value))}
            onBlur={() => handleBlur("cpf")}
            autoComplete="off"
            className={touched.cpf && errors.cpf ? "border-red-400" : ""}
          />
          {touched.cpf && errors.cpf && (
            <p className="text-xs text-red-600">{errors.cpf}</p>
          )}
          <p className="text-xs text-zinc-500">
            Obrigatório para pagamentos com PIX e cartão.
          </p>
        </div>
      </div>
    </section>
  );
}

/** Validates personal info for order creation (marks all fields touched). */
export function validatePersonalInfo(info: PersonalInfo): ValidationErrors {
  return validate(info);
}

export { cpfDigits };
