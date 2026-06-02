import { isDatabaseAvailable } from "@/lib/data/db-available";
import { prisma } from "@/lib/prisma";
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
    const items = await prisma.storefrontTrustItem.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        link: true,
      },
    });
    if (items.length > 0) return items;
  } catch {
    /* fallback below */
  }
  return DEFAULT_TRUST_ITEMS;
}
