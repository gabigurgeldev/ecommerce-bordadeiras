/** Normalize Brazilian CEP to 8 digits or return null if invalid. */
export function normalizeCep(cep: string): string | null {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  return digits;
}

export function formatCep(cep: string): string {
  const digits = normalizeCep(cep);
  if (!digits) return cep;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCep(cep: string): boolean {
  return normalizeCep(cep) !== null;
}
