import { z } from "zod";

/** IDs gerados por newId() — prefixo c + base64url, não são CUID padrão do Zod. */
export const entityIdSchema = z
  .string()
  .regex(/^c[A-Za-z0-9_-]{8,}$/, "ID inválido");

export const orderIdSchema = entityIdSchema;

export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11, "CPF deve ter 11 dígitos");
