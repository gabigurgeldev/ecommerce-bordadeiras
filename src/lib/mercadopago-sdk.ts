const MP_SDK_URL = "https://sdk.mercadopago.com/js/v2";
const MP_SDK_ID = "mercadopago-sdk-v2";

let loadPromise: Promise<void> | null = null;

/** Loads Mercado Pago JS SDK once (deduplicated across the app). */
export function loadMercadoPagoSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Mercado Pago SDK só pode ser carregado no navegador"));
  }

  if (window.MercadoPago) return Promise.resolve();

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(MP_SDK_ID) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Falha ao carregar Mercado Pago")),
        { once: true },
      );
      if (window.MercadoPago) resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = MP_SDK_ID;
    script.src = MP_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(
        new Error(
          "Falha ao carregar Mercado Pago. Verifique sua conexão ou bloqueador de anúncios.",
        ),
      );
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
