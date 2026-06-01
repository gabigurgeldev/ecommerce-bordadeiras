"use server";

import { getMercadoPagoPublicKeyFromDb } from "@/lib/mercadopago-config";

/** Public key only — safe to use in checkout UI (Mercado Pago public credential). */
export async function getMercadoPagoPublicKey(): Promise<string | null> {
  return getMercadoPagoPublicKeyFromDb();
}
