"use server";

import { getOpenRouterConfig } from "@/lib/openrouter-config";
import { callOpenRouterJson, OpenRouterError } from "@/lib/openrouter/client";
import {
  aiImproveRequestSchema,
  outputSchemaFor,
  validateAiImproveInput,
  type AiImproveContext,
  type AiImproveScope,
} from "@/lib/validations/ai";
import { auditMutation, withAdmin, withAdminRead, type ActionResult } from "./_utils";
import { buildEnrichedModelsCatalog } from "@/lib/openrouter/models-api";
import type { EnrichedCatalogModel } from "@/lib/openrouter/models-catalog";

const NOT_CONFIGURED =
  "Configure a API do OpenRouter em Configurações → Inteligência Artificial";

export async function getOpenRouterModelsForPicker(): Promise<EnrichedCatalogModel[]> {
  return withAdminRead(() => buildEnrichedModelsCatalog());
}

export async function improveWithAi(
  context: AiImproveContext,
  scope: AiImproveScope,
  input: Record<string, string>,
): Promise<ActionResult<Record<string, string>>> {
  return withAdmin(async (actor) => {
    const requestParsed = aiImproveRequestSchema.safeParse({ context, scope, input });
    if (!requestParsed.success) {
      return { success: false, error: "Requisição inválida" };
    }

    const inputValidated = validateAiImproveInput(context, scope, input);
    if (!inputValidated.success) {
      return { success: false, error: inputValidated.error };
    }

    const outputSchema = outputSchemaFor(context, scope);
    if (!outputSchema) {
      return { success: false, error: "Escopo inválido para este contexto" };
    }

    const config = await getOpenRouterConfig();
    if (!config) {
      return { success: false, error: NOT_CONFIGURED };
    }

    try {
      const raw = await callOpenRouterJson({
        apiKey: config.apiKey,
        model: config.model,
        context,
        scope,
        input: inputValidated.data,
      });

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(raw);
      } catch {
        return { success: false, error: "Resposta inválida da IA, tente novamente" };
      }

      const outputParsed = outputSchema.safeParse(parsedJson);
      if (!outputParsed.success) {
        return { success: false, error: "Resposta inválida da IA, tente novamente" };
      }

      await auditMutation(actor, {
        action: "UPDATE",
        entity: "AiImprove",
        metadata: { context, scope },
      });

      return {
        success: true,
        data: Object.fromEntries(
          Object.entries(outputParsed.data as Record<string, unknown>).map(([k, v]) => [
            k,
            String(v),
          ]),
        ),
      };
    } catch (err) {
      if (err instanceof OpenRouterError) {
        return { success: false, error: err.message };
      }
      console.error("[improveWithAi]", err);
      return { success: false, error: "Falha ao comunicar com a IA" };
    }
  });
}
