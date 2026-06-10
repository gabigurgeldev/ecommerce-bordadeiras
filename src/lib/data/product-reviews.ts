import { getDb, newId, parseDate, TABLES } from "@/lib/supabase/db";
import { PAID_ORDER_STATUSES } from "@/lib/order-status";
import { ReviewSource, type ProductReview } from "@/lib/types/database";

export type ProductReviewPublic = {
  id: string;
  authorName: string;
  text: string;
  rating: number;
  imageUrl: string | null;
  source: ReviewSource;
  createdAt: Date | string;
};

export type ProductReviewStats = {
  count: number;
  averageRating: number;
};

function mapReviewRow(row: Record<string, unknown>): ProductReview {
  return {
    id: String(row.id),
    productId: String(row.productId),
    userId: row.userId != null ? String(row.userId) : null,
    authorName: String(row.authorName),
    text: String(row.text),
    rating: Number(row.rating),
    imageUrl: row.imageUrl != null ? String(row.imageUrl) : null,
    source: row.source as ReviewSource,
    createdAt: parseDate(row.createdAt) ?? new Date(),
    updatedAt: parseDate(row.updatedAt) ?? new Date(),
  };
}

function toPublic(review: ProductReview): ProductReviewPublic {
  return {
    id: review.id,
    authorName: review.authorName,
    text: review.text,
    rating: review.rating,
    imageUrl: review.imageUrl,
    source: review.source,
    createdAt: review.createdAt,
  };
}

export async function getReviewsByProductId(
  productId: string,
): Promise<ProductReviewPublic[]> {
  try {
    const db = getDb();
    const { data, error } = await db
      .from(TABLES.ProductReview)
      .select("*")
      .eq("productId", productId)
      .order("createdAt", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => toPublic(mapReviewRow(row as Record<string, unknown>)));
  } catch {
    return [];
  }
}

export async function getReviewStats(productId: string): Promise<ProductReviewStats> {
  const reviews = await getReviewsByProductId(productId);
  if (reviews.length === 0) {
    return { count: 0, averageRating: 0 };
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    count: reviews.length,
    averageRating: Math.round((sum / reviews.length) * 10) / 10,
  };
}

export async function hasUserPurchasedProduct(
  userId: string,
  productId: string,
): Promise<boolean> {
  try {
    const db = getDb();
    const { data: orders, error: ordersError } = await db
      .from(TABLES.Order)
      .select("id")
      .eq("userId", userId)
      .in("status", [...PAID_ORDER_STATUSES]);

    if (ordersError || !orders?.length) return false;

    const orderIds = orders.map((o) => String(o.id));
    const { count, error: itemsError } = await db
      .from(TABLES.OrderItem)
      .select("*", { count: "exact", head: true })
      .eq("productId", productId)
      .in("orderId", orderIds);

    if (itemsError) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function getUserReviewForProduct(
  userId: string,
  productId: string,
): Promise<ProductReviewPublic | null> {
  try {
    const db = getDb();
    const { data, error } = await db
      .from(TABLES.ProductReview)
      .select("*")
      .eq("productId", productId)
      .eq("userId", userId)
      .maybeSingle();

    if (error || !data) return null;
    return toPublic(mapReviewRow(data as Record<string, unknown>));
  } catch {
    return null;
  }
}

export async function hasUserReviewedProduct(
  userId: string,
  productId: string,
): Promise<boolean> {
  const review = await getUserReviewForProduct(userId, productId);
  return review != null;
}

export async function createProductReview(params: {
  productId: string;
  userId: string | null;
  authorName: string;
  text: string;
  rating: number;
  imageUrl?: string | null;
  source?: ReviewSource;
}): Promise<ProductReview | null> {
  const db = getDb();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from(TABLES.ProductReview)
    .insert({
      id: newId(),
      productId: params.productId,
      userId: params.userId,
      authorName: params.authorName,
      text: params.text,
      rating: params.rating,
      imageUrl: params.imageUrl ?? null,
      source: params.source ?? ReviewSource.USER,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapReviewRow(data as Record<string, unknown>);
}

export async function createProductReviewsBatch(
  reviews: {
    productId: string;
    authorName: string;
    text: string;
    rating: number;
    source: ReviewSource;
  }[],
): Promise<number> {
  if (reviews.length === 0) return 0;
  const db = getDb();
  const now = new Date().toISOString();
  const rows = reviews.map((r) => ({
    id: newId(),
    productId: r.productId,
    userId: null,
    authorName: r.authorName,
    text: r.text,
    rating: r.rating,
    imageUrl: null,
    source: r.source,
    createdAt: now,
    updatedAt: now,
  }));

  const { error } = await db.from(TABLES.ProductReview).insert(rows);
  return error ? 0 : rows.length;
}

export async function listProductReviewsAdmin(
  productId: string,
): Promise<ProductReview[]> {
  try {
    const db = getDb();
    const { data, error } = await db
      .from(TABLES.ProductReview)
      .select("*")
      .eq("productId", productId)
      .order("createdAt", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => mapReviewRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function deleteProductReviewById(reviewId: string): Promise<boolean> {
  try {
    const db = getDb();
    const { error } = await db.from(TABLES.ProductReview).delete().eq("id", reviewId);
    return !error;
  } catch {
    return false;
  }
}

export async function getProductSlugById(productId: string): Promise<string | null> {
  try {
    const db = getDb();
    const { data, error } = await db
      .from(TABLES.Product)
      .select("slug")
      .eq("id", productId)
      .maybeSingle();
    if (error || !data?.slug) return null;
    return String(data.slug);
  } catch {
    return null;
  }
}
