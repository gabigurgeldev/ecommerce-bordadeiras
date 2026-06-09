import { NextResponse } from "next/server";
import { getDb, TABLES } from "@/lib/supabase/db";
import { parseProductRow } from "@/lib/data/mappers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "5", 10), 20);

    if (!q || q.length < 2) {
      return NextResponse.json({ products: [] });
    }

    const db = getDb();
    const pattern = `%${q}%`;

    let categoryId: string | null = null;
    if (category) {
      const { data: cat } = await db
        .from(TABLES.Category)
        .select("id")
        .eq("slug", category)
        .eq("active", true)
        .maybeSingle();
      categoryId = cat?.id ? String(cat.id) : null;
    }

    let query = db
      .from(TABLES.Product)
      .select(`
        id, name, slug, priceCents, images, status, active, stock, stockUnlimited, compareCents,
        description, brand, tags,
        category:categoryId ( name, slug )
      `)
      .eq("active", true)
      .eq("status", "ACTIVE")
      .or(
        `name.ilike.${pattern},description.ilike.${pattern},brand.ilike.${pattern}`,
      )
      .limit(limit * 3);

    if (categoryId) {
      query = query.eq("categoryId", categoryId);
    }
    if (minPrice) {
      query = query.gte("priceCents", parseInt(minPrice, 10));
    }
    if (maxPrice) {
      query = query.lte("priceCents", parseInt(maxPrice, 10));
    }

    const { data, error } = await query;

    if (error) {
      console.error("[api/products/search] Error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    let rows = data ?? [];

    if (inStock) {
      rows = rows.filter(
        (p) =>
          Boolean(p.stockUnlimited) || Number(p.stock ?? 0) > 0,
      );
    }

    const products = rows.slice(0, limit).map((row: Record<string, unknown>) => {
      const parsed = parseProductRow(row);
      const images = Array.isArray(parsed.images) ? parsed.images : [];
      const imageUrl =
        typeof images[0] === "string"
          ? images[0]
          : typeof images[0] === "object" &&
              images[0] !== null &&
              "url" in (images[0] as object)
            ? String((images[0] as { url: string }).url)
            : "";

      const inStockValue =
        parsed.stockUnlimited || (parsed.stock ?? 0) > 0;

      return {
        id: parsed.id,
        name: parsed.name,
        slug: parsed.slug,
        priceCents: parsed.priceCents,
        imageUrl,
        categoryName: parsed.category?.name || undefined,
        inStock: inStockValue,
        stock: parsed.stock,
      };
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[api/products/search] Unhandled error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
