/**
 * Valida variáveis mínimas para dev (lê .env.local, depois .env).
 * Uso: npm run env:check
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");

function loadEnvFile(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const required = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];

const placeholders = /^(COLE_AQUI|SENHA_DO_POSTGRES|SENHA@|ALTERE|)$/i;

let ok = true;
for (const key of required) {
  const v = process.env[key]?.trim() ?? "";
  if (!v || placeholders.test(v) || v.includes("COLE_AQUI") || v.includes("SENHA_DO_POSTGRES")) {
    console.error(`[env:check] Falta ou placeholder: ${key}`);
    ok = false;
  }
}

if (!process.env.DATABASE_URL?.startsWith("postgresql://")) {
  console.error("[env:check] DATABASE_URL deve começar com postgresql://");
  ok = false;
}

if (ok) {
  console.log("[env:check] OK — Supabase + Postgres configurados para desenvolvimento.");
  process.exit(0);
}
console.log("\nPreencha .env.local (e espelhe DATABASE_URL em .env). Ver docs/EASYPANEL_ENV.md");
process.exit(1);
