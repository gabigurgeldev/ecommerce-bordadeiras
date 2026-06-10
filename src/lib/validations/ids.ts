import { z } from "zod";

/** IDs do banco: newId() (c…), seed (prod_…, cat_…) ou texto alfanumérico. */
export const entityIdSchema = z
  .string()
  .trim()
  .min(1, "ID obrigatório")
  .max(64, "ID inválido")
  .regex(/^[A-Za-z0-9_-]+$/, "ID inválido");

export const orderIdSchema = entityIdSchema;

export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11, "CPF deve ter 11 dígitos");
