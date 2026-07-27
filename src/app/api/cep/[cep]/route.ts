import { NextResponse } from "next/server";
import { getClientIp, jsonError } from "@/lib/api-utils";
import { fetchViaCep } from "@/lib/cep/viacep";
import { rateLimitPublicApi } from "@/lib/rate-limit";

export const maxDuration = 15;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cep: string }> },
) {
  const limited = await rateLimitPublicApi(`cep:${getClientIp(request)}`);
  if (!limited.success) return jsonError("Too many requests", 429);

  const { cep } = await params;
  const result = await fetchViaCep(cep);

  if (result.ok) {
    return NextResponse.json(result.data);
  }

  if (result.reason === "invalid") {
    return NextResponse.json({ error: "CEP inválido (8 dígitos)" }, { status: 422 });
  }

  if (result.reason === "not_found") {
    return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
  }

  return NextResponse.json(
    { error: "Serviço de CEP temporariamente indisponível" },
    { status: 502 },
  );
}
