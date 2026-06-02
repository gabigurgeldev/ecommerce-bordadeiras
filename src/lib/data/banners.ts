import { isDatabaseAvailable } from "@/lib/data/db-available";
import { siteImages } from "@/lib/images";
import { prisma } from "@/lib/prisma";

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
    const banners = await prisma.storefrontBanner.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, imageUrl: true, link: true },
    });
    if (banners.length > 0) {
      return banners.map((b) => ({
        id: b.id,
        imageUrl: b.imageUrl,
        link: b.link,
      }));
    }
  } catch {
    /* fallback below */
  }
  return [defaultSlide];
}
