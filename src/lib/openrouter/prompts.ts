import type { AiImproveContext, AiImproveScope } from "@/lib/validations/ai";

const SYSTEM_PROMPT = `Você é um redator especializado em e-commerce de materiais para bordado e artesanato (loja "Bordadeiras").
Escreva em português do Brasil, tom profissional, acolhedor e claro.
Responda SOMENTE com um objeto JSON válido, sem markdown, sem explicações.
Respeite rigorosamente os limites de caracteres indicados.
Não invente preços, estoque ou informações factuais não fornecidas.`;

const SCOPE_INSTRUCTIONS: Record<string, string> = {
  "category:description":
    "Melhore a descrição da categoria para a vitrine da loja. Retorne JSON: { \"description\": \"...\" }. Máximo 500 caracteres.",
  "category:seo":
    "Melhore o SEO da categoria. Retorne JSON: { \"seoTitle\": \"...\" (máx 70 chars), \"seoDescription\": \"...\" (máx 160 chars) }.",
  "product:description":
    "Melhore a descrição do produto para a página de venda. Retorne JSON: { \"description\": \"...\" } com HTML leve (p, strong, em, ul, li, br). Destaque benefícios e uso.",
  "product:seo":
    "Melhore SEO do produto para e-commerce. Retorne JSON: { \"tags\": \"palavra1, palavra2\" (até 8 tags separadas por vírgula), \"brand\": \"...\", \"seoTitle\": \"...\" (máx 70 chars), \"seoDescription\": \"...\" (máx 160 chars) }.",
  "product:dimensions":
    "Estime peso e dimensões de embalagem para frete. Retorne JSON: { \"weightGrams\": número inteiro, \"lengthCm\": número, \"widthCm\": número, \"heightCm\": número } com valores realistas para o produto descrito.",
  "product:reviews":
    "Gere avaliações autênticas de clientes brasileiros de uma loja de bordado e artesanato. Retorne JSON: { \"reviews\": [ { \"authorName\": \"Nome brasileiro plausível\", \"rating\": número 1-5 (majoritariamente 4 ou 5), \"text\": \"comentário em português do Brasil, 2-4 frases, tom natural e específico ao produto\" } ] }. Gere exatamente a quantidade pedida em count. Varie nomes e textos. Não mencione IA ou que é fictício.",
  "blog:content":
    "Melhore o resumo e o conteúdo do post do blog. Retorne JSON: { \"excerpt\": \"...\" (máx 300 chars), \"content\": \"...\" }.",
  "blog:seo":
    "Melhore o SEO do post. Retorne JSON: { \"seoTitle\": \"...\" (máx 70), \"seoDescription\": \"...\" (máx 160) }.",
  "trust-bar:text":
    "Melhore título e descrição curta da barra de confiança. Retorne JSON: { \"title\": \"...\", \"description\": \"...\" (máx 200 chars) }.",
  "banner:title":
    "Melhore o título interno do banner (referência admin). Retorne JSON: { \"title\": \"...\" }.",
  "storefront-utility:message":
    "Melhore a mensagem da barra superior da loja. Pode usar HTML leve (<a>). Retorne JSON: { \"message\": \"...\" } (máx 500 chars).",
};

export function buildImprovePrompt(
  context: AiImproveContext,
  scope: AiImproveScope,
  input: Record<string, string>,
): { system: string; user: string } {
  const key = `${context}:${scope}`;
  const instruction = SCOPE_INSTRUCTIONS[key] ?? "Melhore os textos fornecidos.";
  const inputBlock = Object.entries(input)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k}: ${v.trim()}`)
    .join("\n");

  return {
    system: SYSTEM_PROMPT,
    user: `${instruction}\n\nTextos atuais:\n${inputBlock || "(vazio — crie com base no contexto disponível)"}`,
  };
}

export function maxTokensFor(context: AiImproveContext, scope: AiImproveScope): number {
  if (context === "blog" && scope === "content") return 4096;
  if (context === "product" && scope === "reviews") return 4096;
  return 2048;
}
