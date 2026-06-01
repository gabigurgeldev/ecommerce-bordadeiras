import { z } from "zod";
import { CouponType, OrderStatus } from "@prisma/client";

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  sku: z.string().optional(),
  priceCents: z.coerce.number().int().min(0),
  compareCents: z.coerce.number().int().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
  categoryId: z.string().optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  parentId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const orderUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingCode: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
});

export const couponSchema = z.object({
  code: z.string().min(3).transform((v) => v.toUpperCase()),
  type: z.nativeEnum(CouponType),
  value: z.coerce.number().int().min(1),
  minCents: z.coerce.number().int().min(0).optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  maxUses: z.coerce.number().int().min(1).optional().nullable(),
  active: z.boolean().default(true),
});

export const blogPostSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  coverImage: z.string().url().optional().or(z.literal("")),
  published: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export const blogCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

export const blogTagSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

export const mercadoPagoSettingsSchema = z.object({
  publicKey: z.string().min(1),
  accessToken: z.string().optional(),
  webhookSecret: z.string().optional(),
});

export const whatsappRecipientSchema = z.object({
  label: z.string().max(120).optional(),
  phone: z
    .string()
    .regex(/^\d{10,13}$/, "Telefone: somente dígitos (DDI+DDD+número)"),
  active: z.boolean().optional(),
});

export const smtpSettingsSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  user: z.string().min(1),
  password: z.string().min(1),
  from: z.string().email(),
});
