import { AboutSnippet } from "@/components/home/about-snippet";
import { Benefits } from "@/components/home/benefits";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { getActiveBanners } from "@/lib/data/banners";
import { getActiveTrustItems } from "@/lib/data/trust-bar";
import { getCategories } from "@/lib/data/categories";
import { getFeaturedProducts } from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Máquinas de bordado e insumos premium",
  path: "/",
});

export default async function HomePage() {
  const [categories, featured, banners, trustItems] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getActiveBanners(),
    getActiveTrustItems(),
  ]);

  return (
    <>
      <Hero banners={banners} />
      <TrustBar items={trustItems} />
      <CategoriesSection categories={categories} />
      <FeaturedProducts products={featured} />
      <Benefits />
      <AboutSnippet />
    </>
  );
}
