import { AboutSnippet } from "@/components/home/about-snippet";
import { Benefits } from "@/components/home/benefits";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel";
import { getCategories } from "@/lib/data/categories";
import { getFeaturedProducts } from "@/lib/data/products";
import { mockTestimonials } from "@/lib/mock/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Máquinas de bordado e insumos premium",
  path: "/",
});

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
  ]);

  return (
    <>
      <Hero />
      <CategoriesSection categories={categories} />
      <FeaturedProducts products={featured} />
      <Benefits />
      <AboutSnippet />
      <TestimonialsCarousel testimonials={mockTestimonials} />
    </>
  );
}
