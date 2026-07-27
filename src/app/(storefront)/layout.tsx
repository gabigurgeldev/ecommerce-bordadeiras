import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { StorefrontTheme } from "@/components/providers/storefront-theme";
import { CustomerActivityGate } from "@/components/tracking/customer-activity-gate";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { getCategories } from "@/lib/data/categories";
import { isDatabaseAvailable } from "@/lib/data/db-available";
import { getCategoryPreviews } from "@/lib/data/products";
import { getStorefrontUtilitySettings } from "@/lib/data/storefront-settings";
import { organizationJsonLd } from "@/lib/seo/json-ld";

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

  const previewsByCategory = await getCategoryPreviews(
    categories.map((c) => c.id),
  );
  const categoryPreviews = categories.map((category) => ({
    category,
    products: previewsByCategory.get(category.id) ?? [],
  }));

  return (
    <StorefrontTheme>
      <div className="light flex min-h-full min-w-0 flex-col bg-[var(--color-bg)] text-[var(--foreground)]">
        <Suspense fallback={null}>
          <CustomerActivityGate />
        </Suspense>
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
