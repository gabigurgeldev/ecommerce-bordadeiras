import { IconElo } from "@/components/shop/elo-icon";
import type { IconType } from "react-icons";
import { LuReceipt } from "react-icons/lu";
import {
  SiAmericanexpress,
  SiMastercard,
  SiMercadopago,
  SiPix,
  SiVisa,
} from "react-icons/si";

export type PaymentMethodId =
  | "pix"
  | "visa"
  | "mastercard"
  | "elo"
  | "amex"
  | "boleto"
  | "mercadopago";

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  Icon: IconType;
  /** Cor da marca no ícone (quando aplicável) */
  brandColor?: string;
};

export const paymentMethods: PaymentMethod[] = [
  { id: "pix", label: "Pix", Icon: SiPix, brandColor: "#32BCAD" },
  { id: "visa", label: "Visa", Icon: SiVisa, brandColor: "#1A1F71" },
  { id: "mastercard", label: "Mastercard", Icon: SiMastercard, brandColor: "#EB001B" },
  { id: "elo", label: "Elo", Icon: IconElo as IconType, brandColor: "#FFCB05" },
  { id: "amex", label: "American Express", Icon: SiAmericanexpress, brandColor: "#006FCF" },
  { id: "boleto", label: "Boleto", Icon: LuReceipt, brandColor: "#5c4332" },
  { id: "mercadopago", label: "Mercado Pago", Icon: SiMercadopago, brandColor: "#009EE3" },
];

/** Bandeiras exibidas na vitrine (sem processador, para faixas compactas) */
export const storefrontPaymentMethods = paymentMethods.filter(
  (m) => m.id !== "mercadopago",
);

/** Métodos no checkout (Pix, cartão, boleto) */
export const checkoutPaymentMethods: PaymentMethod[] = [
  paymentMethods.find((m) => m.id === "pix")!,
  paymentMethods.find((m) => m.id === "visa")!,
  paymentMethods.find((m) => m.id === "mastercard")!,
  paymentMethods.find((m) => m.id === "boleto")!,
];
