/** Strips non-digits from a CPF string. */
export function cpfDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

/** Formats digits as 000.000.000-00 */
export function maskCpf(raw: string): string {
  const d = cpfDigits(raw);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function cpfChecksum(digits: number[], factor: number): number {
  const sum = digits.reduce((acc, d, i) => acc + d * (factor - i), 0);
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

/** Validates a Brazilian CPF (11 digits, check digits). */
export function isValidCpf(value: string): boolean {
  const d = cpfDigits(value);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  const nums = d.split("").map(Number);
  const d1 = cpfChecksum(nums.slice(0, 9), 10);
  const d2 = cpfChecksum(nums.slice(0, 10), 11);
  return d1 === nums[9] && d2 === nums[10];
}
