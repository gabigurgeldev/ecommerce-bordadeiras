const CORREIOS_CARRIERS = [
  "correios",
  "sedex",
  "pac",
  "seDEX",
  "PAC",
];

export function buildTrackingUrl(
  carrier: string | null | undefined,
  trackingCode: string | null | undefined,
): string | null {
  const code = trackingCode?.trim();
  if (!code) return null;

  const carrierNorm = (carrier ?? "correios").toLowerCase();
  const isCorreios = CORREIOS_CARRIERS.some((c) =>
    carrierNorm.includes(c.toLowerCase()),
  );

  if (isCorreios) {
    return `https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(code)}`;
  }

  return null;
}
