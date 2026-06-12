import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, createAdminClient } from "@/lib/supabase/admin";
import { Role, type User } from "@/lib/types/database";

/** PostgREST table names (PascalCase, case-sensitive). */
export const TABLES = {
  User: "User",
  Account: "Account",
  VerificationToken: "VerificationToken",
  PasswordResetToken: "PasswordResetToken",
  Address: "Address",
  Category: "Category",
  Product: "Product",
  ProductImage: "ProductImage",
  ProductOption: "ProductOption",
  ProductOptionValue: "ProductOptionValue",
  ProductVariant: "ProductVariant",
  Coupon: "Coupon",
  Order: "Order",
  OrderItem: "OrderItem",
  Payment: "Payment",
  Tracking: "Tracking",
  BlogCategory: "BlogCategory",
  BlogTag: "BlogTag",
  BlogPost: "BlogPost",
  BlogPostTag: "BlogPostTag",
  BlogComment: "BlogComment",
  BlogMedia: "BlogMedia",
  BlogPostVersion: "BlogPostVersion",
  Notification: "Notification",
  EmailTemplate: "EmailTemplate",
  Setting: "Setting",
  StorefrontBanner: "StorefrontBanner",
  StorefrontTrustItem: "StorefrontTrustItem",
  WhatsappRecipient: "WhatsappRecipient",
  WhatsappSession: "WhatsappSession",
  WhatsappTemplate: "WhatsappTemplate",
  AuditLog: "AuditLog",
  CartItem: "CartItem",
  SavedCard: "SavedCard",
  ProductReview: "ProductReview",
  StockMovement: "StockMovement",
  CustomerActivity: "CustomerActivity",
} as const;

/** CUID-like id compatible with existing rows. */
export function newId(): string {
  return `c${randomBytes(12).toString("base64url")}`;
}

export function toIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

export function parseDate(v: unknown): Date | null {
  if (v == null) return null;
  return new Date(String(v));
}

const USER_DATE_KEYS = ["emailVerified", "createdAt", "updatedAt"] as const;

export function mapUserRow(row: Record<string, unknown>): User {
  const out: Record<string, unknown> = { ...row };
  for (const k of USER_DATE_KEYS) {
    if (out[k] != null) out[k] = parseDate(out[k]);
  }
  return out as User;
}

/** Service-role Supabase client for server-side data access. */
export function getDb(): SupabaseClient {
  return getSupabaseAdmin();
}

export { createAdminClient };

export async function isDataApiAvailable(): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  try {
    const { error } = await admin.from(TABLES.User).select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = createAdminClient();
  if (!db) return null;
  const normalized = email.trim().toLowerCase();
  const { data, error } = await db
    .from(TABLES.User)
    .select("*")
    .eq("email", normalized)
    .maybeSingle();
  if (error || !data) return null;
  return mapUserRow(data as Record<string, unknown>);
}

export async function findUserByAuthId(authUserId: string): Promise<User | null> {
  const db = createAdminClient();
  if (!db) return null;
  const { data, error } = await db
    .from(TABLES.User)
    .select("*")
    .eq("authUserId", authUserId)
    .maybeSingle();
  if (error || !data) return null;
  return mapUserRow(data as Record<string, unknown>);
}

export async function upsertUserFromAuth(params: {
  email: string;
  authUserId?: string | null;
  name?: string | null;
  emailVerified?: Date;
  role?: Role;
  passwordHash?: string | null;
}): Promise<User | null> {
  const db = createAdminClient();
  if (!db) return null;
  const normalized = params.email.trim().toLowerCase();

  const existing = params.authUserId
    ? ((await findUserByAuthId(params.authUserId)) ??
      (await findUserByEmail(normalized)))
    : await findUserByEmail(normalized);

  const payload: Record<string, unknown> = {
    email: normalized,
    name: params.name ?? null,
    ...(params.authUserId ? { authUserId: params.authUserId } : {}),
    ...(params.emailVerified ? { emailVerified: toIso(params.emailVerified) } : {}),
    ...(params.passwordHash ? { passwordHash: params.passwordHash } : {}),
    role: params.role ?? Role.USER,
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await db
      .from(TABLES.User)
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) return null;
    return mapUserRow(data as Record<string, unknown>);
  }

  const { data, error } = await db
    .from(TABLES.User)
    .insert({
      id: newId(),
      ...payload,
      createdAt: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return mapUserRow(data as Record<string, unknown>);
}

export async function upsertUserByEmail(
  email: string,
  data: Partial<{
    name: string | null;
    role: Role;
    passwordHash: string | null;
    emailVerified: Date | null;
    authUserId: string | null;
  }>,
): Promise<User | null> {
  const db = createAdminClient();
  if (!db) return null;
  const normalized = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalized);
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = {
    email: normalized,
    updatedAt: now,
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.role !== undefined ? { role: data.role } : {}),
    ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
    ...(data.emailVerified !== undefined
      ? { emailVerified: data.emailVerified ? toIso(data.emailVerified) : null }
      : {}),
    ...(data.authUserId !== undefined ? { authUserId: data.authUserId } : {}),
  };

  if (existing) {
    const { data: row, error } = await db
      .from(TABLES.User)
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !row) return null;
    return mapUserRow(row as Record<string, unknown>);
  }

  const { data: row, error } = await db
    .from(TABLES.User)
    .insert({
      id: newId(),
      ...payload,
      role: data.role ?? Role.USER,
      createdAt: now,
    })
    .select("*")
    .single();
  if (error || !row) return null;
  return mapUserRow(row as Record<string, unknown>);
}
