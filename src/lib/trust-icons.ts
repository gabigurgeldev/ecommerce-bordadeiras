import type { LucideIcon } from "lucide-react";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  Headphones,
  HeartHandshake,
  Lock,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

export const TRUST_ICON_KEYS = [
  "badge-check",
  "shield",
  "shield-check",
  "lock",
  "credit-card",
  "package",
  "truck",
  "refresh-cw",
  "rotate-ccw",
  "message-circle",
  "headphones",
  "phone",
  "heart-handshake",
  "award",
  "star",
  "check-circle",
  "clock",
  "map-pin",
  "gift",
] as const;

export type TrustIconKey = (typeof TRUST_ICON_KEYS)[number];

export const TRUST_ICON_LABELS: Record<TrustIconKey, string> = {
  "badge-check": "Selo de confiança",
  shield: "Escudo",
  "shield-check": "Escudo verificado",
  lock: "Cadeado",
  "credit-card": "Cartão",
  package: "Pacote",
  truck: "Caminhão / frete",
  "refresh-cw": "Atualizar",
  "rotate-ccw": "Troca / devolução",
  "message-circle": "Mensagem",
  headphones: "Suporte / atendimento",
  phone: "Telefone",
  "heart-handshake": "Compromisso",
  award: "Prêmio",
  star: "Estrela",
  "check-circle": "Confirmado",
  clock: "Relógio",
  "map-pin": "Localização",
  gift: "Presente",
};

const ICON_MAP: Record<TrustIconKey, LucideIcon> = {
  "badge-check": BadgeCheck,
  shield: Shield,
  "shield-check": ShieldCheck,
  lock: Lock,
  "credit-card": CreditCard,
  package: Package,
  truck: Truck,
  "refresh-cw": RefreshCw,
  "rotate-ccw": RotateCcw,
  "message-circle": MessageCircle,
  headphones: Headphones,
  phone: Phone,
  "heart-handshake": HeartHandshake,
  award: Award,
  star: Star,
  "check-circle": CheckCircle2,
  clock: Clock,
  "map-pin": MapPin,
  gift: Gift,
};

const DEFAULT_ICON: TrustIconKey = "badge-check";

export function isTrustIconKey(value: string): value is TrustIconKey {
  return (TRUST_ICON_KEYS as readonly string[]).includes(value);
}

export function getTrustIcon(key: string): LucideIcon {
  if (isTrustIconKey(key)) return ICON_MAP[key];
  return ICON_MAP[DEFAULT_ICON];
}
