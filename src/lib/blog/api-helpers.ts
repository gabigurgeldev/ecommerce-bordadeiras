import { NextResponse } from "next/server";

export function searchParamsToObject(searchParams: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonServerError(message = "Erro interno do servidor") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function serializeBlogData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
