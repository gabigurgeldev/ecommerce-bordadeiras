export type WhatsappLogLevel = "info" | "success" | "warn" | "error";
export type WhatsappLogSource = "service" | "app";
export type WhatsappLogCategory =
  | "connection"
  | "session"
  | "send"
  | "notify"
  | "system";

export type WhatsappLogEntry = {
  id: string;
  ts: string;
  level: WhatsappLogLevel;
  source: WhatsappLogSource;
  category: WhatsappLogCategory;
  message: string;
  meta?: Record<string, string | number | boolean | null>;
};

export type WhatsappLogInput = {
  level: WhatsappLogLevel;
  category: WhatsappLogCategory;
  message: string;
  meta?: Record<string, string | number | boolean | null>;
};
