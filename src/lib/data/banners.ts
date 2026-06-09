import { isDatabaseAvailable } from "@/lib/data/db-available";
import { siteImages } from "@/lib/images";
import { getDb, TABLES } from "@/lib/supabase/db";

export type StorefrontBannerSlide = {
  id: string;
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  imageUrl: string; // Legacy field for compatibility
  altText: string | null;
  link: string | null;
};

const defaultSlide: StorefrontBannerSlide = {
  id: "default-hero",
  desktopImageUrl: siteImages.hero,
  mobileImageUrl: null,
  imageUrl: siteImages.hero,
  altText: null,
  link: null,
};

export async function getActiveBanners(): Promise<StorefrontBannerSlide[]> {
  if (!(await isDatabaseAvailable())) return [defaultSlide];

  try {
    const now = new Date().toISOString();
    const { data, error } = await getDb()
      .from(TABLES.StorefrontBanner)
      .select("id, desktopImageUrl, mobileImageUrl, imageUrl, altText, link")
      .eq("active", true)
      .or(`startDate.is.null,startDate.lte.${now}`)
      .or(`endDate.is.null,endDate.gte.${now}`)
      .order("sortOrder", { ascending: true });
    if (!error && data?.length) {
      return data.map((b) => ({
        id: String(b.id),
        desktopImageUrl: String(b.desktopImageUrl || b.imageUrl),
        mobileImageUrl: b.mobileImageUrl ? String(b.mobileImageUrl) : null,
        imageUrl: String(b.desktopImageUrl || b.imageUrl),
        altText: b.altText ? String(b.altText) : null,
        link: b.link != null ? String(b.link) : null,
      }));
    }
  } catch {
    /* fallback below */
  }
  return [defaultSlide];
}
