/**
 * Valida variáveis Supabase para dev.
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
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];

const placeholders = /^(COLE_AQUI|SENHA|ALTERE|CHANGE|TODO|TBD|<.+>|\[.+\]|\.\.\.|)$/i;

function isPlaceholder(value) {
  return placeholders.test(value) || value.includes("COLE_AQUI");
}

let ok = true;
for (const key of required) {
  const v = process.env[key]?.trim() ?? "";
  if (!v || isPlaceholder(v)) {
    console.error(`[env:check] Falta ou placeholder: ${key}`);
    ok = false;
  }
}

if (process.env.NODE_ENV === "production") {
  const productionRequired = [
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "WHATSAPP_SERVICE_SECRET",
  ];

  for (const key of productionRequired) {
    const v = process.env[key]?.trim() ?? "";
    if (!v || isPlaceholder(v)) {
      console.error(`[env:check] Producao exige valor real: ${key}`);
      ok = false;
    }
  }

  const whatsappSecret = process.env.WHATSAPP_SERVICE_SECRET?.trim() ?? "";
  if (whatsappSecret && whatsappSecret.length < 32) {
    console.error("[env:check] WHATSAPP_SERVICE_SECRET deve ter 32+ caracteres");
    ok = false;
  }
}

if (ok) {
  console.log("[env:check] OK — Supabase configurado (sem Prisma).");
  process.exit(0);
}
console.log("\nPreencha .env.local. Ver docs/DATABASE.md e docs/EASYPANEL_ENV.md");
process.exit(1);
