import { isDatabaseAvailable } from "@/lib/data/db-available";
import { getDb, TABLES } from "@/lib/supabase/db";

export type StorefrontVideoItem = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  sortOrder: number;
};

export async function getActiveVideos(): Promise<StorefrontVideoItem[]> {
  if (!(await isDatabaseAvailable())) return [];

  try {
    const { data, error } = await getDb()
      .from(TABLES.StorefrontVideo)
      .select("id, title, description, url, sortOrder")
      .eq("active", true)
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: true });

    if (error || !data?.length) return [];

    return data.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: row.description != null ? String(row.description) : null,
      url: String(row.url),
      sortOrder: Number(row.sortOrder) || 0,
    }));
  } catch {
    return [];
  }
}
