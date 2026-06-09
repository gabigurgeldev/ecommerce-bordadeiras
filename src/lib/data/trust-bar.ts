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

export const DEFAULT_TRUST_ITEMS: TrustBarItem[] = [];

export async function getActiveTrustItems(): Promise<TrustBarItem[]> {
  if (!(await isDatabaseAvailable())) return [];

  try {
    const { data, error } = await getDb()
      .from(TABLES.StorefrontTrustItem)
      .select("id, title, description, icon, link")
      .eq("active", true)
      .order("sortOrder", { ascending: true });
    if (!error && data) {
      return data as TrustBarItem[];
    }
  } catch {
    /* error handled by returning empty array below */
  }
  return [];
}
