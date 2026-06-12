import { getOpenRouterConfig } from "@/lib/openrouter-config";
import { callOpenRouterJson, callOpenRouterPrompt, OpenRouterError } from "@/lib/openrouter/client";
import {
  blogContentOutputSchema,
  blogSeoOutputSchema,
  type AiImproveScope,
} from "@/lib/validations/ai";
import type { BlogAiEnhanceInput } from "@/lib/validations/blog";
import { z } from "zod";

const NOT_CONFIGURED =
  "Configure a API de IA (OpenRouter, OpenAI ou Gemini) nas variáveis de ambiente ou em Configurações";

const titleOutputSchema = z.object({
  title: z.string().min(3).max(120),
});

const excerptOutputSchema = z.object({
  excerpt: z.string().min(1).max(500),
});

const generateContentOutputSchema = z.object({
  content: z.string().min(10).max(20000),
});

const coverAltOutputSchema = z.object({
  coverAlt: z.string().min(1).max(200),
});

const tagsOutputSchema = z.object({
  tags: z.string().min(1).max(300),
});

type EnhanceResult = Record<string, string>;

async function callOpenAiJson(params: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new OpenRouterError(err.error?.message ?? res.statusText);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new OpenRouterError("Resposta vazia da IA");
  return content;
}

async function callGeminiJson(params: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: params.system }] },
      contents: [{ role: "user", parts: [{ text: params.user }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new OpenRouterError(err.error?.message ?? res.statusText);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!content) throw new OpenRouterError("Resposta vazia da IA");
  return content;
}

function buildPrompt(scope: BlogAiEnhanceInput["scope"], input: BlogAiEnhanceInput) {
  const base = {
    title: input.title ?? "",
    excerpt: input.excerpt ?? "",
    content: input.content ?? "",
    seoTitle: input.seoTitle ?? "",
    seoDescription: input.seoDescription ?? "",
  };

  switch (scope) {
    case "content":
      return {
        system:
          "Você é redator de blog para uma loja de máquinas de bordado. Responda em português do Brasil. Retorne JSON.",
        user: `Melhore o resumo e o conteúdo do post.\nTítulo: ${base.title}\nResumo: ${base.excerpt}\nConteúdo: ${base.content}\nRetorne JSON: { "excerpt": "...", "content": "..." }`,
        schema: blogContentOutputSchema,
        openRouterScope: "content" as AiImproveScope,
      };
    case "seo":
      return {
        system:
          "Você é especialista em SEO para e-commerce de bordado. Responda em português do Brasil. Retorne JSON. Meta título até 60 caracteres, meta descrição até 160 caracteres.",
        user: `Gere meta title e meta description otimizados para buscadores.\nTítulo do post: ${base.title}\nResumo: ${base.excerpt}\nTrecho do conteúdo: ${base.content.slice(0, 800)}\nRetorne JSON: { "seoTitle": "...", "seoDescription": "..." }`,
        schema: blogSeoOutputSchema,
        openRouterScope: "seo" as AiImproveScope,
      };
    case "title":
      return {
        system: "Você cria títulos atraentes para blog de bordado. Responda em português do Brasil. Retorne JSON.",
        user: `Crie ou melhore o título do post (máximo 120 caracteres).\nTítulo atual: ${base.title || "(vazio)"}\nResumo: ${base.excerpt}\nTrecho do conteúdo: ${base.content.slice(0, 500)}\nRetorne JSON: { "title": "..." }`,
        schema: titleOutputSchema,
        openRouterScope: "content" as AiImproveScope,
      };
    case "excerpt":
      return {
        system: "Você escreve resumos concisos para blog. Retorne JSON.",
        user: `Crie um resumo para o post.\nTítulo: ${base.title}\nConteúdo: ${base.content}\nRetorne JSON: { "excerpt": "..." }`,
        schema: excerptOutputSchema,
        openRouterScope: "content" as AiImproveScope,
      };
    case "generate":
      return {
        system:
          "Você é redator de blog para uma loja de máquinas de bordado. Escreva em português do Brasil. Use HTML simples (p, h2, h3, ul, ol, li, strong, em, blockquote). Retorne JSON.",
        user: `Gere o conteúdo do post conforme o pedido do usuário.\nTítulo do post: ${base.title || "(sem título)"}\nPedido: ${input.prompt}\n${
          base.content ? `Conteúdo atual (referência): ${base.content.slice(0, 1500)}` : ""
        }\nRetorne JSON: { "content": "<p>...</p>" }`,
        schema: generateContentOutputSchema,
        openRouterScope: "content" as AiImproveScope,
      };
    case "coverAlt":
      return {
        system:
          "Você descreve imagens para acessibilidade e SEO em um blog de bordado. Responda em português do Brasil. Retorne JSON.",
        user: `Crie um texto alternativo (alt) conciso e descritivo para a imagem de capa do post.\nTítulo: ${base.title}\nResumo: ${base.excerpt}\nAlt atual: ${input.coverAlt ?? ""}\nRetorne JSON: { "coverAlt": "..." }`,
        schema: coverAltOutputSchema,
        openRouterScope: "content" as AiImproveScope,
      };
    case "tags":
      return {
        system:
          "Você sugere tags relevantes para posts de blog sobre bordado e máquinas de bordar. Responda em português do Brasil. Retorne JSON.",
        user: `Sugira de 3 a 8 tags curtas e relevantes para este post, separadas por vírgula.\nTítulo: ${base.title}\nResumo: ${base.excerpt}\nTrecho: ${base.content.slice(0, 600)}\nRetorne JSON: { "tags": "tag1, tag2, tag3" }`,
        schema: tagsOutputSchema,
        openRouterScope: "content" as AiImproveScope,
      };
    default:
      throw new OpenRouterError("Escopo de IA inválido");
  }
}

async function callAiProvider(params: {
  system: string;
  user: string;
  openRouterScope: AiImproveScope;
  openRouterInput: Record<string, string>;
}): Promise<string> {
  const openRouter = await getOpenRouterConfig();
  if (openRouter) {
    return callOpenRouterPrompt({
      apiKey: openRouter.apiKey,
      model: openRouter.model,
      system: params.system,
      user: params.user,
    });
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const openAiModel = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  if (openAiKey) {
    return callOpenAiJson({
      apiKey: openAiKey,
      model: openAiModel,
      system: params.system,
      user: params.user,
    });
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  if (geminiKey) {
    return callGeminiJson({
      apiKey: geminiKey,
      model: geminiModel,
      system: params.system,
      user: params.user,
    });
  }

  // Legacy OpenRouter via blog improve path if only env key without settings
  const envOpenRouter = process.env.OPENROUTER_API_KEY?.trim();
  if (envOpenRouter) {
    return callOpenRouterJson({
      apiKey: envOpenRouter,
      model: process.env.OPENROUTER_DEFAULT_MODEL?.trim() || "google/gemini-2.0-flash-001",
      context: "blog",
      scope: params.openRouterScope,
      input: params.openRouterInput,
    });
  }

  throw new OpenRouterError(NOT_CONFIGURED);
}

export async function enhanceBlogText(input: BlogAiEnhanceInput): Promise<EnhanceResult> {
  const { system, user, schema, openRouterScope } = buildPrompt(input.scope, input);

  const openRouterInput: Record<string, string> = {
    title: input.title ?? "",
    excerpt: input.excerpt ?? "",
    content: input.content ?? "",
    seoTitle: input.seoTitle ?? "",
    seoDescription: input.seoDescription ?? "",
  };

  try {
    const raw = await callAiProvider({
      system,
      user,
      openRouterScope,
      openRouterInput,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new OpenRouterError("Resposta inválida da IA, tente novamente");
    }

    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      throw new OpenRouterError("Resposta inválida da IA, tente novamente");
    }

    return Object.fromEntries(
      Object.entries(validated.data as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
    );
  } catch (err) {
    if (err instanceof OpenRouterError) throw err;
    throw new OpenRouterError("Falha ao comunicar com a IA");
  }
}

export function isAiConfigured(): boolean {
  return Boolean(
    process.env.OPENROUTER_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim() ||
      process.env.GEMINI_API_KEY?.trim(),
  );
}
