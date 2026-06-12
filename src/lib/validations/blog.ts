import { z } from "zod";
import { BlogMediaType, BlogPostStatus } from "@/lib/types/database";

const optionalUrl = z
  .string()
  .url("URL inválida")
  .optional()
  .nullable()
  .or(z.literal(""));

export const blogPostStatusSchema = z.enum([
  BlogPostStatus.DRAFT,
  BlogPostStatus.PUBLISHED,
  BlogPostStatus.ARCHIVED,
  BlogPostStatus.SCHEDULED,
]);

const blogPaginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
} as const;

export const blogListQuerySchema = z
  .object({
    ...blogPaginationFields,
    sortBy: z
      .enum(["createdAt", "updatedAt", "publishedAt", "title", "views"])
      .default("updatedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    status: blogPostStatusSchema.optional(),
    categoryId: z.string().optional(),
    categorySlug: z.string().optional(),
    tagId: z.string().optional(),
    search: z.string().max(200).optional(),
    includeDeleted: z.preprocess(
      (v) => v === "true" || v === true,
      z.boolean().default(false),
    ),
  })
  .default({});

export const blogPostInputSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres").optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(10, "Conteúdo deve ter pelo menos 10 caracteres"),
  coverImage: optionalUrl,
  youtubeUrl: optionalUrl,
  status: blogPostStatusSchema.optional(),
  published: z.boolean().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  authorId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  versionNotes: z.string().max(500).optional().nullable(),
});

export const blogCategoryInputSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  slug: z.string().min(2, "Slug deve ter pelo menos 2 caracteres").optional(),
  description: z.string().max(2000).optional().nullable(),
  icon: z.string().max(120).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const blogCategoryReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.coerce.number().int().min(0),
      }),
    )
    .min(1, "Informe ao menos uma categoria"),
});

const blogApprovalFilterSchema = z.preprocess(
  (v) => {
    if (v === true || v === "true") return "true";
    if (v === false || v === "false") return "false";
    if (v === "all" || v === undefined || v === null || v === "") return "all";
    return v;
  },
  z.enum(["true", "false", "all"]).default("all"),
);

export const blogCommentListQuerySchema = z
  .object({
    ...blogPaginationFields,
    postId: z.string().optional(),
    isApproved: blogApprovalFilterSchema,
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .default({});

export const blogCommentInputSchema = z.object({
  postId: z.string().min(1, "Post é obrigatório"),
  authorName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(80),
  authorEmail: z.string().email("E-mail inválido").max(120),
  content: z.string().min(10, "Comentário deve ter pelo menos 10 caracteres").max(2000),
  parentId: z.string().optional().nullable(),
});

export const blogMediaInputSchema = z.object({
  postId: z.string().min(1),
  type: z.enum([BlogMediaType.IMAGE, BlogMediaType.YOUTUBE]),
  url: z.string().url("URL inválida"),
  altText: z.string().max(200).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const blogYoutubeUrlSchema = z.object({
  url: z.string().url("URL inválida"),
});

export const blogSearchQuerySchema = z.object({
  q: z.string().min(2, "Digite ao menos 2 caracteres").max(200),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  type: z.enum(["posts", "categories", "all"]).default("all"),
});

export const blogAiEnhanceSchema = z
  .object({
    scope: z.enum(["content", "seo", "excerpt", "title", "generate", "coverAlt", "tags"]),
    title: z.string().min(1).optional(),
    excerpt: z.string().optional(),
    content: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    coverAlt: z.string().optional(),
    prompt: z.string().min(10).max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "generate" && !data.prompt?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o que deseja gerar",
        path: ["prompt"],
      });
    }
  });

export type BlogListQuery = z.infer<typeof blogListQuerySchema>;
export type BlogPostInput = z.infer<typeof blogPostInputSchema>;
export type BlogCategoryInput = z.infer<typeof blogCategoryInputSchema>;
export type BlogCommentInput = z.infer<typeof blogCommentInputSchema>;
export type BlogMediaInput = z.infer<typeof blogMediaInputSchema>;
export type BlogSearchQuery = z.infer<typeof blogSearchQuerySchema>;
export type BlogAiEnhanceInput = z.infer<typeof blogAiEnhanceSchema>;
