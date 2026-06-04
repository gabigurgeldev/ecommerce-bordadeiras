import { isDatabaseAvailable } from "@/lib/data/db-available";
import { siteImages } from "@/lib/images";
import { getDb, TABLES } from "@/lib/supabase/db";

export type StorefrontBannerSlide = {
  id: string;
  imageUrl: string;
  link: string | null;
};

const defaultSlide: StorefrontBannerSlide = {
  id: "default-hero",
  imageUrl: siteImages.hero,
  link: null,
};

export async function getActiveBanners(): Promise<StorefrontBannerSlide[]> {
  if (!(await isDatabaseAvailable())) return [defaultSlide];

  try {
    const { data, error } = await getDb()
      .from(TABLES.StorefrontBanner)
      .select("id, imageUrl, link")
      .eq("active", true)
      .order("sortOrder", { ascending: true });
    if (!error && data?.length) {
      return data.map((b) => ({
        id: String(b.id),
        imageUrl: String(b.imageUrl),
        link: b.link != null ? String(b.link) : null,
      }));
    }
  } catch {
    /* fallback below */
  }
  return [defaultSlide];
}
