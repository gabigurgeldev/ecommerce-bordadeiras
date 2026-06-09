import { z } from "zod";

const optionalText = z.string().max(10000).optional().or(z.literal(""));

export const aiImproveContextSchema = z.enum([
  "category",
  "product",
  "blog",
  "trust-bar",
  "banner",
  "storefront-utility",
]);

export const aiImproveScopeSchema = z.enum([
  "description",
  "seo",
  "content",
  "text",
  "title",
  "message",
  "dimensions",
]);

export const aiImproveRequestSchema = z.object({
  context: aiImproveContextSchema,
  scope: aiImproveScopeSchema,
  input: z.record(z.string(), z.string()),
});

export type AiImproveContext = z.infer<typeof aiImproveContextSchema>;
export type AiImproveScope = z.infer<typeof aiImproveScopeSchema>;

export const categoryDescriptionOutputSchema = z.object({
  description: z.string().min(1).max(2000),
});

export const categorySeoOutputSchema = z.object({
  seoTitle: z.string().min(1).max(70),
  seoDescription: z.string().min(1).max(160),
});

export const productDescriptionOutputSchema = z.object({
  description: z.string().min(1).max(8000),
});

export const productSeoOutputSchema = z.object({
  tags: z.string().min(1).max(500),
  brand: z.string().min(1).max(120),
  seoTitle: z.string().min(1).max(70),
  seoDescription: z.string().min(1).max(160),
});

export const productDimensionsOutputSchema = z.object({
  weightGrams: z.coerce.number().int().min(1).max(500000),
  lengthCm: z.coerce.number().int().min(1).max(500),
  widthCm: z.coerce.number().int().min(1).max(500),
  heightCm: z.coerce.number().int().min(1).max(500),
});

export const blogContentOutputSchema = z.object({
  excerpt: z.string().min(1).max(500),
  content: z.string().min(10).max(20000),
});

export const blogSeoOutputSchema = z.object({
  seoTitle: z.string().min(1).max(70),
  seoDescription: z.string().min(1).max(160),
});

export const trustBarTextOutputSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(2).max(200),
});

export const bannerTitleOutputSchema = z.object({
  title: z.string().min(2).max(120),
});

export const storefrontUtilityMessageOutputSchema = z.object({
  message: z.string().min(1).max(500),
});

export type AiImproveOutput =
  | z.infer<typeof categoryDescriptionOutputSchema>
  | z.infer<typeof categorySeoOutputSchema>
  | z.infer<typeof productDescriptionOutputSchema>
  | z.infer<typeof productSeoOutputSchema>
  | z.infer<typeof productDimensionsOutputSchema>
  | z.infer<typeof blogContentOutputSchema>
  | z.infer<typeof blogSeoOutputSchema>
  | z.infer<typeof trustBarTextOutputSchema>
  | z.infer<typeof bannerTitleOutputSchema>
  | z.infer<typeof storefrontUtilityMessageOutputSchema>;

export function outputSchemaFor(context: AiImproveContext, scope: AiImproveScope) {
  if (context === "category" && scope === "description") return categoryDescriptionOutputSchema;
  if (context === "category" && scope === "seo") return categorySeoOutputSchema;
  if (context === "product" && scope === "description") return productDescriptionOutputSchema;
  if (context === "product" && scope === "seo") return productSeoOutputSchema;
  if (context === "product" && scope === "dimensions") return productDimensionsOutputSchema;
  if (context === "blog" && scope === "content") return blogContentOutputSchema;
  if (context === "blog" && scope === "seo") return blogSeoOutputSchema;
  if (context === "trust-bar" && scope === "text") return trustBarTextOutputSchema;
  if (context === "banner" && scope === "title") return bannerTitleOutputSchema;
  if (context === "storefront-utility" && scope === "message") {
    return storefrontUtilityMessageOutputSchema;
  }
  return null;
}

export const aiImproveInputSchemas = {
  category: {
    description: z.object({ name: z.string().min(1), description: optionalText }),
    seo: z.object({
      name: z.string().min(1),
      description: optionalText,
      seoTitle: optionalText,
      seoDescription: optionalText,
    }),
  },
  product: {
    description: z.object({ name: z.string().min(1), description: optionalText }),
    seo: z.object({
      name: z.string().min(1),
      description: optionalText,
      brand: optionalText,
      tags: optionalText,
      seoTitle: optionalText,
      seoDescription: optionalText,
    }),
    dimensions: z.object({
      name: z.string().min(1),
      description: optionalText,
      category: optionalText,
    }),
  },
  blog: {
    content: z.object({
      title: z.string().min(1),
      excerpt: optionalText,
      content: optionalText,
    }),
    seo: z.object({
      title: z.string().min(1),
      excerpt: optionalText,
      seoTitle: optionalText,
      seoDescription: optionalText,
    }),
  },
  "trust-bar": {
    text: z.object({ title: optionalText, description: optionalText }),
  },
  banner: {
    title: z.object({ title: optionalText }),
  },
  "storefront-utility": {
    message: z.object({ message: optionalText }),
  },
} as const;

export function validateAiImproveInput(
  context: AiImproveContext,
  scope: AiImproveScope,
  input: Record<string, string>,
) {
  const contextSchemas = aiImproveInputSchemas[context] as Record<string, z.ZodTypeAny>;
  const schema = contextSchemas[scope];
  if (!schema) return { success: false as const, error: "Escopo inválido para este contexto" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Dados insuficientes para melhorar com IA" };
  return { success: true as const, data: parsed.data as Record<string, string> };
}
