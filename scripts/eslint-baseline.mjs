#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function readLimit(name, fallback) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  const value = Number.parseInt(process.argv[index + 1] ?? "", 10);
  if (!Number.isFinite(value) || value < 0) {
    console.error(`[eslint-baseline] Valor invalido para ${flag}`);
    process.exit(2);
  }
  return value;
}

const maxErrors = readLimit("max-errors", 0);
const maxWarnings = readLimit("max-warnings", 0);
const eslintBin = join(
  process.cwd(),
  "node_modules",
  "eslint",
  "bin",
  "eslint.js",
);

if (!existsSync(eslintBin)) {
  console.error("[eslint-baseline] ESLint nao encontrado. Rode npm ci antes.");
  process.exit(2);
}

const result = spawnSync(process.execPath, [eslintBin, ".", "--format", "json"], {
  encoding: "utf8",
});

let report;
try {
  report = JSON.parse(result.stdout || "[]");
} catch {
  console.error("[eslint-baseline] Nao foi possivel ler a saida JSON do ESLint.");
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status || 1);
}

const totals = report.reduce(
  (sum, file) => {
    sum.errors += file.errorCount ?? 0;
    sum.warnings += file.warningCount ?? 0;
    return sum;
  },
  { errors: 0, warnings: 0 },
);

console.log(
  `[eslint-baseline] errors=${totals.errors}/${maxErrors} warnings=${totals.warnings}/${maxWarnings}`,
);

if (totals.errors > maxErrors || totals.warnings > maxWarnings) {
  console.error(
    "[eslint-baseline] Novo debito de lint detectado. Reduza os problemas ou atualize o baseline com justificativa.",
  );
  process.exit(1);
}

if (result.stderr) process.stderr.write(result.stderr);
process.exit(0);
