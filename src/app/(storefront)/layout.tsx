import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { StorefrontTheme } from "@/components/providers/storefront-theme";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { getCategories } from "@/lib/data/categories";
import { isDatabaseAvailable } from "@/lib/data/db-available";
import { getProducts } from "@/lib/data/products";
import { getStorefrontUtilitySettings } from "@/lib/data/storefront-settings";
import { organizationJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await isDatabaseAvailable();

  const [categories, utilitySettings] = await Promise.all([
    getCategories(),
    getStorefrontUtilitySettings(),
  ]);

  const categoryPreviews = await Promise.all(
    categories.map(async (category) => ({
      category,
      products: (
        await getProducts({ categorySlug: category.slug, sort: "newest" })
      ).slice(0, 5),
    })),
  );

  return (
    <StorefrontTheme>
      <div className="light flex min-h-full min-w-0 flex-col bg-[var(--color-bg)] text-[var(--foreground)]">
        <JsonLdScript data={organizationJsonLd()} />
        <Header
          categories={categories}
          utilitySettings={utilitySettings}
          categoryPreviews={categoryPreviews}
        />
        <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
        <Footer
          categories={categories.map((c) => ({
            href: `/loja/categoria/${c.slug}`,
            label: c.name,
          }))}
        />
      </div>
    </StorefrontTheme>
  );
}
