import { isDatabaseAvailable } from "@/lib/data/db-available";
import { getDb, TABLES } from "@/lib/supabase/db";
import type { TrustIconKey } from "@/lib/trust-icons";

export type TrustBarItem = {
  id: string;
  title: string;
  description: string;
  icon: TrustIconKey | string;
  link: string | null;
};

export const DEFAULT_TRUST_ITEMS: TrustBarItem[] = [
  {
    id: "default-payment",
    title: "Pagamento Seguro",
    description: "Ambiente protegido e criptografado",
    icon: "badge-check",
    link: null,
  },
  {
    id: "default-shipping",
    title: "Frete Grátis",
    description: "Em compras acima de R$ 199",
    icon: "truck",
    link: null,
  },
  {
    id: "default-exchange",
    title: "Troca Garantida",
    description: "Até 7 dias após o recebimento",
    icon: "rotate-ccw",
    link: null,
  },
  {
    id: "default-support",
    title: "Atendimento via WhatsApp",
    description: "Suporte rápido e humano",
    icon: "headphones",
    link: null,
  },
];

export async function getActiveTrustItems(): Promise<TrustBarItem[]> {
  if (!(await isDatabaseAvailable())) return DEFAULT_TRUST_ITEMS;

  try {
    const { data, error } = await getDb()
      .from(TABLES.StorefrontTrustItem)
      .select("id, title, description, icon, link")
      .eq("active", true)
      .order("sortOrder", { ascending: true });
    if (!error && data?.length) {
      return data as TrustBarItem[];
    }
  } catch {
    /* fallback below */
  }
  return DEFAULT_TRUST_ITEMS;
}
