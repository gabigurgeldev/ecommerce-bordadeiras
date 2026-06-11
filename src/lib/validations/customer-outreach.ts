import { z } from "zod";

export const customerOutreachAiInputSchema = z
  .object({
    userId: z.string().min(1),
    mode: z.enum(["auto", "guided"]),
    guidance: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      data.mode !== "guided" || (data.guidance?.trim().length ?? 0) >= 3,
    { message: "Descreva como quer a mensagem (mínimo 3 caracteres)" },
  );

export const customerOutreachAiOutputSchema = z.object({
  message: z.string().min(10).max(1200),
});

export type CustomerOutreachAiMode = z.infer<
  typeof customerOutreachAiInputSchema
>["mode"];
