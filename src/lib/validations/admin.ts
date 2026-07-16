import { z } from "zod";
import { CouponType, OrderStatus, ProductStatus, ShippingMode } from "@/lib/types/database";
import { TRUST_ICON_KEYS } from "@/lib/trust-icons";

export const productSchemaFields = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  sku: z.string().optional().nullable(),
  priceCents: z.coerce.number().int().min(0),
  compareCents: z.coerce.number().int().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  categoryId: z.string().optional().nullable(),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
  tags: z.array(z.string()).default([]),
  brand: z.string().optional().nullable(),
  costCents: z.coerce.number().int().min(0).optional().nullable(),
  showPrice: z.boolean().default(true),
  stockUnlimited: z.boolean().default(false),
  weightGrams: z.coerce.number().int().min(0).optional().nullable(),
  lengthCm: z.coerce.number().int().min(0).optional().nullable(),
  widthCm: z.coerce.number().int().min(0).optional().nullable(),
  heightCm: z.coerce.number().int().min(0).optional().nullable(),
  videoUrls: z.array(z.string().url("URL inválida").refine(
    (v) => /youtube\.com|youtu\.be|vimeo\.com/i.test(v),
    "Use um link do YouTube ou Vimeo",
  )).default([]),
  shippingMode: z.nativeEnum(ShippingMode).default(ShippingMode.CORREIOS),
  fixedShippingCents: z.coerce.number().int().min(0).optional().nullable(),
});

export const productSchema = productSchemaFields.superRefine((data, ctx) => {
  if (data.shippingMode === ShippingMode.FIXED && (data.fixedShippingCents == null || data.fixedShippingCents <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe o valor fixo de frete",
      path: ["fixedShippingCents"],
    });
  }
});

export const productOptionInputSchema = z.object({
  name: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0),
  values: z.array(
    z.object({
      value: z.string().min(1),
      sortOrder: z.coerce.number().int().min(0),
    }),
  ),
});

export const productVariantInputSchema = z.object({
  sku: z.string().optional().nullable(),
  priceCents: z.coerce.number().int().min(0).optional().nullable(),
  compareCents: z.coerce.number().int().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  stockUnlimited: z.boolean().default(false),
  attributes: z.record(z.string(), z.string()),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean().default(true),
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
  seoTitle: z.string().max(70).optional().or(z.literal("")),
  seoDescription: z.string().max(160).optional().or(z.literal("")),
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
  desktopImageUrl: z.string().url("Imagem para desktop é obrigatória"),
  mobileImageUrl: z.string().url().optional().or(z.literal("")),
  altText: z.string().max(200, "Texto alternativo deve ter no máximo 200 caracteres").optional().or(z.literal("")),
  link: optionalBannerLink,
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const trustBarItemSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  description: z.string().min(2, "Descrição obrigatória").max(200),
  icon: z.enum(TRUST_ICON_KEYS, { message: "Ícone inválido" }),
  link: optionalBannerLink,
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const videoSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  description: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  url: z
    .string()
    .min(1, "URL do vídeo é obrigatória")
    .url("Informe uma URL válida")
    .refine(
      (val) => /^https:\/\//i.test(val),
      "Use uma URL https:// (YouTube, Vimeo ou embed)",
    ),
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

export const mercadoPagoEnabledMethodsSchema = z.object({
  pix: z.boolean(),
  credit_card: z.boolean(),
  debit_card: z.boolean(),
  boleto: z.boolean(),
});

export const mercadoPagoSettingsSchema = z.object({
  publicKey: z.string(),
  accessToken: z.string().optional(),
  webhookSecret: z.string().optional(),
  sandbox: z.coerce.boolean().default(false),
  enabledMethods: mercadoPagoEnabledMethodsSchema,
  maxInstallments: z.coerce.number().int().min(1).max(12).default(12),
  installmentFees: z.enum(["merchant", "buyer"]).default("buyer"),
  checkoutTitle: z.string().max(120).optional(),
  checkoutSubtitle: z.string().max(240).optional(),
  showTrustBadges: z.boolean().default(true),
});

export type MercadoPagoSettingsSchema = z.infer<typeof mercadoPagoSettingsSchema>;

export const whatsappRecipientSchema = z.object({
  label: z.string().max(120).optional(),
  phone: z
    .string()
    .min(8, "Informe o telefone com DDD")
    .max(20, "Telefone muito longo"),
  active: z.boolean().optional(),
});

export const whatsappTemplateSchema = z.object({
  key: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Chave: use apenas letras minúsculas, números e underscore"),
  name: z.string().min(2).max(120),
  template: z.string().min(10).max(2000),
  recipientType: z.enum(["CUSTOMER", "ADMIN"]),
  event: z.enum([
    "NEW_ORDER",
    "PAYMENT_APPROVED",
    "ORDER_PROCESSING",
    "ORDER_SHIPPED",
    "ORDER_DELIVERED",
    "ORDER_CANCELLED",
    "PENDING_PAYMENT",
    "ABANDONED_CART",
    "CUSTOM_OUTREACH",
  ]),
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

export const homeSettingsSchema = z.object({
  showCategoriesSection: z.boolean(),
});

export const openRouterSettingsSchema = z.object({
  apiKey: z.string().optional(),
  defaultModel: z.string().min(1).optional(),
});

export const shippingSettingsFormSchema = z.object({
  originCep: z.string().min(1, "CEP obrigatório"),
  originStreet: z.string().min(1, "Rua obrigatória"),
  originNumber: z.string().min(1, "Número obrigatório"),
  originComplement: z.string().optional().or(z.literal("")),
  originNeighborhood: z.string().min(1, "Bairro obrigatório"),
  originCity: z.string().min(1, "Cidade obrigatória"),
  originState: z
    .string()
    .length(2, "UF inválida")
    .transform((v) => v.toUpperCase()),
  freeThresholdReais: z.string().optional().or(z.literal("")),
});

export const melhorEnvioSettingsFormSchema = z.object({
  useSandbox: z.coerce.boolean().default(true),
  sandboxAccessToken: z.string().optional().or(z.literal("")),
  productionAccessToken: z.string().optional().or(z.literal("")),
});

export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";
