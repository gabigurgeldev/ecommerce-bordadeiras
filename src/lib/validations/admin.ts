import { z } from "zod";
import { CouponType, OrderStatus, ProductStatus } from "@prisma/client";
import { TRUST_ICON_KEYS } from "@/lib/trust-icons";

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  sku: z.string().optional(),
  priceCents: z.coerce.number().int().min(0),
  compareCents: z.coerce.number().int().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  categoryId: z.string().optional().nullable(),
});

export const productImageInputSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0),
  isPrimary: z.boolean(),
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

const optionalBannerLink = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) => !val || val.startsWith("/") || /^https?:\/\//i.test(val),
    "Link: use URL (https://) ou caminho (/loja)",
  );

export const bannerSchema = z.object({
  title: z.string().min(2, "Título interno obrigatório"),
  imageUrl: z.string().url("URL da imagem inválida"),
  link: optionalBannerLink,
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const trustBarItemSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().min(2, "Descrição obrigatória").max(200),
  icon: z.enum(TRUST_ICON_KEYS, { message: "Ícone inválido" }),
  link: optionalBannerLink,
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
  from: z.string().min(1, "Remetente obrigatório"),
});

const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Cor inválida (use #RRGGBB)");

export const storefrontUtilitySettingsSchema = z.object({
  message: z.string().min(1, "Mensagem obrigatória").max(500),
  backgroundColor: hexColor,
  textColor: hexColor,
  link: z.string().url().optional().or(z.literal("")),
});
