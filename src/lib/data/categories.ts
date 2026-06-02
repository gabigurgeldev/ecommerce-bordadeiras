import { isDatabaseAvailable } from "@/lib/data/db-available";
import { mockCategories } from "@/lib/mock/catalog";
import { mapCategory } from "@/lib/data/mappers";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/lib/types/catalog";

export async function getCategories(): Promise<Category[]> {
  if (!(await isDatabaseAvailable())) return mockCategories;

  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
    });
    if (categories.length > 0) return categories.map(mapCategory);
  } catch {
    /* mock fallback */
  }
  return mockCategories;
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  try {
    const category = await prisma.category.findFirst({
      where: { slug, active: true },
      include: { _count: { select: { products: true } } },
    });
    if (category) return mapCategory(category);
  } catch {
    /* mock fallback */
  }
  return mockCategories.find((c) => c.slug === slug) ?? null;
}
