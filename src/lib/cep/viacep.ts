import { normalizeCep } from "@/lib/shipping/cep";

export type ViaCepAddress = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
};

export type ViaCepResult =
  | { ok: true; data: ViaCepAddress }
  | { ok: false; reason: "invalid" | "not_found" | "unavailable" };

const VIACEP_TIMEOUT_MS = 8_000;

export async function fetchViaCep(cep: string): Promise<ViaCepResult> {
  const digits = normalizeCep(cep);
  if (!digits) {
    return { ok: false, reason: "invalid" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VIACEP_TIMEOUT_MS);

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return { ok: false, reason: "unavailable" };
    }

    const data = (await res.json()) as ViaCepAddress & { erro?: boolean };
    if (data.erro) {
      return { ok: false, reason: "not_found" };
    }

    return {
      ok: true,
      data: {
        cep: data.cep ?? digits,
        logradouro: data.logradouro ?? "",
        complemento: data.complemento ?? "",
        bairro: data.bairro ?? "",
        localidade: data.localidade ?? "",
        uf: data.uf ?? "",
        ibge: data.ibge,
        gia: data.gia,
        ddd: data.ddd,
        siafi: data.siafi,
      },
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timeoutId);
  }
}
