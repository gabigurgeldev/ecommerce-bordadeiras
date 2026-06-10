import { z } from "zod";
import { entityIdSchema } from "@/lib/validations/ids";

export const submitReviewSchema = z.object({
  productId: entityIdSchema,
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(10, "Escreva pelo menos 10 caracteres").max(2000),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

export const generateReviewsCountSchema = z.number().int().min(1).max(20);
