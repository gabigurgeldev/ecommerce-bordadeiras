"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useForm, useFieldArray, useWatch, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Palette,
  LayoutTemplate,
  Zap,
  ShieldCheck,
  Monitor,
  Smartphone,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  CreditCard,
  AlertCircle,
  Home,
  Tablet,
  SlidersHorizontal,
} from "lucide-react";
import {
  saveCheckoutThemeSettings,
  resetCheckoutThemeToDefaults,
} from "@/actions/admin/checkout-theme";
import type { CheckoutTheme } from "@/lib/checkout-theme";
import { DEFAULT_CHECKOUT_THEME } from "@/lib/checkout-theme";
import { checkoutThemeSchema } from "@/lib/validations/checkout-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Types ────────────────────────────────────────────────────────────────────

type ThemeFormValues = CheckoutTheme;
type SectionId = "identidade" | "layout" | "conteudo" | "confianca" | "pagamento";

// ─── Nav Config ───────────────────────────────────────────────────────────────

interface NavSection {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  keywords: string[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "identidade",
    label: "Identidade Visual",
    icon: Palette,
    description: "Cores e tipografia",
    keywords: [
      "cores", "cor", "paleta", "tipografia", "fonte", "fundo", "texto",
      "botão", "primária", "secundária", "acento", "borda", "sucesso", "erro",
      "background", "button",
    ],
  },
  {
    id: "layout",
    label: "Layout",
    icon: LayoutTemplate,
    description: "Bordas e espaçamento",
    keywords: [
      "layout", "bordas", "borda", "sombra", "espaçamento", "raio",
      "card", "arredondado", "shadow", "border radius",
    ],
  },
  {
    id: "conteudo",
    label: "Conteúdo & CTA",
    icon: Zap,
    description: "Textos e urgência",
    keywords: [
      "texto", "botão", "urgência", "cta", "label", "finalizar",
      "pedido", "banner", "continuar", "rótulo",
    ],
  },
  {
    id: "confianca",
    label: "Confiança",
    icon: ShieldCheck,
    description: "Selos e mensagens",
    keywords: [
      "selos", "badge", "confiança", "mensagem", "ssl",
      "garantia", "suporte", "seguro", "entrega", "trust",
    ],
  },
  {
    id: "pagamento",
    label: "Pagamento",
    icon: CreditCard,
    description: "Ícones de pagamento",
    keywords: [
      "pagamento", "ícones", "icons", "pix", "cartão",
      "colorido", "monocromático", "payment",
    ],
  },
];

// ─── Color Picker Field ───────────────────────────────────────────────────────

function ColorField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-md border border-input p-0.5 touch-manipulation"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs uppercase"
          placeholder="#RRGGBB"
          maxLength={7}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  forceOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 bg-muted/20 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="space-y-4 bg-background/50 p-3">{children}</div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <h2 className="text-sm font-bold text-foreground">{label}</h2>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        — {description}
      </span>
    </div>
  );
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────

function SidebarNav({
  active,
  onSelect,
  searchQuery,
  onSearchChange,
  visibleIds,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  visibleIds: SectionId[];
}) {
  const itemRefs = useRef<Map<SectionId, HTMLButtonElement>>(new Map());

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, id: SectionId) {
    const visible = NAV_SECTIONS.filter((s) => visibleIds.includes(s.id));
    const idx = visible.findIndex((s) => s.id === id);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = visible[(idx + 1) % visible.length];
      if (next) {
        onSelect(next.id);
        itemRefs.current.get(next.id)?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = visible[(idx - 1 + visible.length) % visible.length];
      if (prev) {
        onSelect(prev.id);
        itemRefs.current.get(prev.id)?.focus();
      }
    }
  }

  return (
    <div className="hidden md:flex h-full w-44 shrink-0 flex-col border-r border-border bg-card">
      {/* Search */}
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar configurações…"
            aria-label="Filtrar seções"
            className="h-8 w-full rounded-md border border-input bg-background pl-7 pr-6 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Label */}
      <div className="px-3 pb-1 pt-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Seções
        </span>
      </div>

      {/* Nav Items */}
      <nav
        className="flex-1 space-y-0.5 overflow-y-auto px-1.5 pb-2"
        aria-label="Seções do editor de tema"
        role="tablist"
        aria-orientation="vertical"
      >
        {NAV_SECTIONS.map((section) => {
          if (!visibleIds.includes(section.id)) return null;
          const Icon = section.icon;
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              ref={(el) => {
                if (el) itemRefs.current.set(section.id, el);
                else itemRefs.current.delete(section.id);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(section.id)}
              onKeyDown={(e) => handleKeyDown(e, section.id)}
              className={cn(
                "flex min-h-[44px] w-full flex-col justify-center rounded-md px-2.5 py-2 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring touch-manipulation",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-1.5">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive && "text-primary")} />
                <span className="text-xs font-medium leading-snug">{section.label}</span>
              </span>
              <span className="mt-0.5 pl-5 text-[10px] leading-tight opacity-60">
                {section.description}
              </span>
            </button>
          );
        })}

        {visibleIds.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            Nenhum resultado para &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </nav>
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

function CheckoutPreview({
  theme,
  viewport,
}: {
  theme: ThemeFormValues;
  viewport: "desktop" | "tablet" | "mobile";
}) {
  const { colors, typography, layout, cta, icons } = theme;

  const containerStyle: React.CSSProperties = {
    fontFamily: typography.bodyFont,
    fontSize: typography.baseFontSize,
    backgroundColor: colors.background,
    color: colors.text,
    minHeight: "100%",
    padding: `${layout.spacingUnit}px`,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    border: `1px solid ${colors.border}`,
    borderRadius: layout.borderRadius,
    boxShadow: layout.cardShadow,
    padding: `${layout.spacingUnit}px`,
    marginBottom: `${layout.spacingUnit * 0.75}px`,
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: typography.headingFont,
    color: colors.text,
    fontWeight: 600,
    fontSize: "1.05rem",
    marginBottom: "0.75rem",
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: colors.buttonBg,
    color: colors.buttonText,
    borderRadius: layout.borderRadius,
    padding: "0.65rem 1.25rem",
    fontWeight: 600,
    border: "none",
    width: "100%",
    cursor: "pointer",
    fontSize: "0.95rem",
    display: "block",
    textAlign: "center",
  };

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${colors.border}`,
    borderRadius: layout.borderRadius,
    padding: "0.4rem 0.65rem",
    width: "100%",
    fontSize: "0.82rem",
    color: colors.text,
  };

  const activeBadges = [
    icons.trustBadges.securePayment && { icon: "🔒", label: "Pagamento seguro" },
    icons.trustBadges.sslCertificate && { icon: "🛡️", label: "SSL" },
    icons.trustBadges.moneyBackGuarantee && { icon: "↩️", label: "Garantia" },
    icons.trustBadges.fastShipping && { icon: "🚚", label: "Envio rápido" },
    icons.trustBadges.customerSupport && { icon: "💬", label: "Suporte" },
  ].filter(Boolean) as { icon: string; label: string }[];

  return (
    <div
      style={containerStyle}
      className={cn(
        "overflow-y-auto transition-all",
        viewport === "mobile" ? "mx-auto max-w-[375px]" : viewport === "tablet" ? "mx-auto max-w-[768px]" : "w-full",
      )}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: `${layout.spacingUnit}px`,
          paddingBottom: `${layout.spacingUnit * 0.5}px`,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: layout.borderRadius,
            background: colors.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.buttonText,
            fontWeight: 700,
            fontSize: "0.75rem",
          }}
        >
          B
        </div>
        <span style={{ fontFamily: typography.headingFont, fontWeight: 600, fontSize: "0.95rem" }}>
          Bordadeiras
        </span>
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: colors.primary }}>
          🔒 Compra segura
        </span>
      </div>

      {/* Urgency Banner */}
      {cta.urgencyText && (
        <div
          style={{
            backgroundColor: colors.accent,
            color: "#fff",
            padding: "0.4rem 0.75rem",
            borderRadius: layout.borderRadius,
            fontSize: "0.78rem",
            fontWeight: 500,
            marginBottom: `${layout.spacingUnit * 0.5}px`,
            textAlign: "center",
          }}
        >
          {cta.urgencyText}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: viewport !== "mobile" ? "1fr 300px" : "1fr",
          gap: `${layout.spacingUnit}px`,
        }}
      >
        {/* Left Column */}
        <div>
          <div style={cardStyle}>
            <p style={headingStyle}>1. Dados pessoais</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", color: colors.text, display: "block", marginBottom: "0.2rem" }}>Nome</label>
                <input style={inputStyle} disabled placeholder="Maria Silva" />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", color: colors.text, display: "block", marginBottom: "0.2rem" }}>E-mail</label>
                <input style={inputStyle} disabled placeholder="maria@email.com" />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <p style={headingStyle}>2. Endereço de entrega</p>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <input style={inputStyle} disabled placeholder="01310-100" />
              <input style={inputStyle} disabled placeholder="Av. Paulista, 1578" />
            </div>
          </div>

          <div style={cardStyle}>
            <p style={headingStyle}>3. Pagamento</p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {["PIX", "Cartão", "Boleto"].map((m) => (
                <span
                  key={m}
                  style={{
                    padding: "0.25rem 0.6rem",
                    borderRadius: layout.borderRadius,
                    border: `1.5px solid ${m === "PIX" ? colors.primary : colors.border}`,
                    fontSize: "0.75rem",
                    color: m === "PIX" ? colors.primary : colors.text,
                    cursor: "pointer",
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
            <div
              style={{
                background: colors.secondary,
                borderRadius: layout.borderRadius,
                padding: "0.65rem",
                marginBottom: "0.5rem",
              }}
            >
              <p style={{ fontSize: "0.78rem", color: colors.text, margin: 0 }}>
                Pague via PIX e receba 5% de desconto
              </p>
              <p style={{ fontSize: "0.95rem", fontWeight: 700, color: colors.primary, margin: "0.15rem 0 0" }}>
                R$ 142,45
              </p>
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <button style={buttonStyle}>{cta.placeOrderLabel}</button>
            </div>
          </div>
        </div>

        {/* Right Column — Order Summary */}
        {viewport !== "mobile" && (
          <div>
            <div style={cardStyle}>
              <p style={headingStyle}>Resumo do pedido</p>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.65rem" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: layout.borderRadius,
                    background: colors.secondary,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p style={{ fontSize: "0.82rem", fontWeight: 500, margin: 0 }}>Kit Bordado Floral Premium</p>
                  <p style={{ fontSize: "0.75rem", color: colors.text, opacity: 0.65, margin: "0.1rem 0 0" }}>Tam. Único · Qtd 1</p>
                </div>
                <span style={{ marginLeft: "auto", fontSize: "0.82rem", fontWeight: 600 }}>R$ 149,90</span>
              </div>
              <div
                style={{
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: "0.5rem",
                  fontSize: "0.8rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: colors.text, opacity: 0.65 }}>Subtotal</span>
                  <span>R$ 149,90</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: colors.success }}>Frete grátis</span>
                  <span style={{ color: colors.success }}>— R$ 0,00</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    borderTop: `1px solid ${colors.border}`,
                    paddingTop: "0.4rem",
                    marginTop: "0.15rem",
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: colors.primary }}>R$ 149,90</span>
                </div>
              </div>
            </div>

            {activeBadges.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.35rem",
                  justifyContent: "center",
                  marginTop: "0.5rem",
                }}
              >
                {activeBadges.map((b) => (
                  <span
                    key={b.label}
                    style={{
                      fontSize: "0.68rem",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "999px",
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                      opacity: 0.65,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.2rem",
                    }}
                  >
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
            )}

            {cta.trustMessages.length > 0 && (
              <p
                style={{
                  fontSize: "0.72rem",
                  color: colors.text,
                  opacity: 0.65,
                  textAlign: "center",
                  marginTop: "0.5rem",
                  fontStyle: "italic",
                }}
              >
                {cta.trustMessages[0]}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function CheckoutThemeEditor({
  initialTheme,
}: {
  initialTheme: CheckoutTheme;
}) {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewVisible, setPreviewVisible] = useState(true);
  const [activePanel, setActivePanel] = useState<"editor" | "preview">("editor");
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("identidade");
  const [searchQuery, setSearchQuery] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<SectionId, HTMLDivElement>>(new Map());

  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(checkoutThemeSchema),
    defaultValues: initialTheme,
    mode: "onChange",
  });

  const { isDirty } = useFormState({ control: form.control });

  const trustMessages = useFieldArray({
    control: form.control,
    name: "cta.trustMessages" as never,
  });

  const watch = useWatch({ control: form.control }) as ThemeFormValues;

  const setColor = useCallback(
    (path: `colors.${keyof CheckoutTheme["colors"]}`, value: string) => {
      form.setValue(path, value, { shouldValidate: true, shouldDirty: true });
    },
    [form],
  );

  // Compute which sections match the current search query
  const visibleIds = NAV_SECTIONS.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.keywords.some((k) => k.includes(q))
    );
  }).map((s) => s.id);

  // Scroll to section when nav item is clicked
  function handleNavSelect(id: SectionId) {
    setActiveSection(id);
    const el = sectionRefs.current.get(id);
    const container = contentRef.current;
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
    }
  }

  // Track active section on scroll
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const onScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      let best: SectionId | null = null;
      let bestTop = -Infinity;

      sectionRefs.current.forEach((el, id) => {
        const top = el.getBoundingClientRect().top - containerTop;
        if (top < 50 && top > bestTop) {
          bestTop = top;
          best = id;
        }
      });

      if (best) setActiveSection(best);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSave() {
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Corrija os erros antes de salvar");
      return;
    }
    setSaving(true);
    const res = await saveCheckoutThemeSettings(form.getValues());
    setSaving(false);
    if (res.success) {
      toast.success("Tema do checkout salvo com sucesso!");
      form.reset(form.getValues()); // clear isDirty
    } else {
      toast.error(res.error ?? "Erro ao salvar");
    }
  }

  async function handleReset() {
    if (!confirm("Restaurar o tema padrão? As alterações não salvas serão perdidas.")) return;
    setResetting(true);
    const res = await resetCheckoutThemeToDefaults();
    setResetting(false);
    if (res.success && res.data) {
      form.reset(res.data);
      toast.success("Tema restaurado para o padrão");
    } else {
      toast.error((res as { error?: string }).error ?? "Erro ao restaurar");
    }
  }

  function makeSectionRef(id: SectionId) {
    return (el: HTMLDivElement | null) => {
      if (el) sectionRefs.current.set(id, el);
      else sectionRefs.current.delete(id);
    };
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden bg-background">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 md:gap-3 md:px-4 md:py-2.5">
        {/* Breadcrumb */}
        <nav aria-label="Navega&#231;&#227;o em breadcrumb" className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          <Link href="/admin" className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label="Painel">
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/50 md:block" aria-hidden />
          <Link href="/admin/configuracoes" className="hidden truncate text-xs text-muted-foreground transition-colors hover:text-foreground md:inline">
            Configura&#231;&#245;es
          </Link>
          <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/50 md:block" aria-hidden />
          <span className="truncate text-xs font-semibold text-foreground">
            Personaliza&#231;&#227;o
            <span className="hidden md:inline"> do Checkout</span>
          </span>
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Viewport toggle — visible on all breakpoints */}
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5" role="group" aria-label="Largura de visualização">
            <Button type="button" variant={viewport === "desktop" ? "secondary" : "ghost"} size="sm" className="h-9 w-9 p-0 touch-manipulation" onClick={() => setViewport("desktop")} title="Desktop"><Monitor className="h-4 w-4" /></Button>
            <Button type="button" variant={viewport === "tablet" ? "secondary" : "ghost"} size="sm" className="h-9 w-9 p-0 touch-manipulation" onClick={() => setViewport("tablet")} title="Tablet"><Tablet className="h-4 w-4" /></Button>
            <Button type="button" variant={viewport === "mobile" ? "secondary" : "ghost"} size="sm" className="h-9 w-9 p-0 touch-manipulation" onClick={() => setViewport("mobile")} title="Mobile"><Smartphone className="h-4 w-4" /></Button>
          </div>

          {/* Preview toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-9 px-2.5 md:flex touch-manipulation"
            onClick={() => setPreviewVisible((v) => !v)}
          >
            {previewVisible ? (
              <EyeOff className="mr-1.5 h-4 w-4" />
            ) : (
              <Eye className="mr-1.5 h-4 w-4" />
            )}
            {previewVisible ? "Ocultar prévia" : "Mostrar prévia"}
          </Button>          {/* Mobile preview button — opens bottom sheet */}
          <Button type="button" variant="outline" size="sm" className="flex h-9 touch-manipulation md:hidden" onClick={() => setPreviewSheetOpen(true)}><Eye className="mr-1.5 h-4 w-4" />Preview</Button>

          <div className="hidden h-4 w-px bg-border sm:block" />

          <Button type="button" variant="outline" size="sm" className="h-9 touch-manipulation" onClick={handleReset}
            disabled={resetting || saving}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {resetting ? "Restaurando…" : "Padrão"}
          </Button>

          <Button type="button" size="sm" className="h-9 touch-manipulation" onClick={handleSave}
            disabled={saving || resetting}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>
        {/* Tablet Panel Toggle (md to lg only) */}
        <div className="hidden shrink-0 items-center gap-1 border-b border-border bg-card/80 px-3 py-1.5 md:flex lg:hidden">
          <Button type="button" variant={activePanel === "editor" ? "secondary" : "ghost"} size="sm" className="h-8 touch-manipulation" onClick={() => setActivePanel("editor")}>
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />Editor
          </Button>
          <Button type="button" variant={activePanel === "preview" ? "secondary" : "ghost"} size="sm" className="h-8 touch-manipulation" onClick={() => setActivePanel("preview")}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />Preview
          </Button>
          {activePanel === "preview" && (
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              {viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"}
            </span>
          )}
        </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Controls Panel */}
        <div
          className={cn(
            // Base: full width, flex row, no right border on mobile
            "flex w-full flex-row overflow-hidden",
            // Desktop: fixed sidebar width + right border
            previewVisible
              ? "lg:w-[420px] xl:w-[480px] lg:shrink-0 lg:border-r lg:border-border"
              : "lg:border-r lg:border-border",
            // Tablet only: hide when preview panel is active; lg:flex restores it on desktop
            activePanel === "preview" && "md:hidden lg:flex",
          )}
        >
          {/* Sidebar Nav */}
          <SidebarNav
            active={activeSection}
            onSelect={handleNavSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            visibleIds={visibleIds}
          />

          {/* Controls Content */}
          <div
            ref={contentRef}
            className="flex-1 space-y-5 overflow-y-auto p-4"
          >
            {/* ── Identidade Visual ──────────────────────────────────────── */}
            {visibleIds.includes("identidade") && (
              <div
                ref={makeSectionRef("identidade")}
                id="identidade"
                className="space-y-3"
              >
                <SectionHeader
                  icon={Palette}
                  label="Identidade Visual"
                  description="Cores e tipografia do checkout"
                />

                <CollapsibleSection title="Paleta principal" forceOpen={!!searchQuery}>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField
                      label="Cor primária"
                      value={watch.colors?.primary ?? DEFAULT_CHECKOUT_THEME.colors.primary}
                      onChange={(v) => setColor("colors.primary", v)}
                      hint="Links, destaques"
                    />
                    <ColorField
                      label="Secundária"
                      value={watch.colors?.secondary ?? DEFAULT_CHECKOUT_THEME.colors.secondary}
                      onChange={(v) => setColor("colors.secondary", v)}
                      hint="Fundo de destaques"
                    />
                    <ColorField
                      label="Fundo"
                      value={watch.colors?.background ?? DEFAULT_CHECKOUT_THEME.colors.background}
                      onChange={(v) => setColor("colors.background", v)}
                    />
                    <ColorField
                      label="Texto"
                      value={watch.colors?.text ?? DEFAULT_CHECKOUT_THEME.colors.text}
                      onChange={(v) => setColor("colors.text", v)}
                    />
                    <ColorField
                      label="Borda"
                      value={watch.colors?.border ?? DEFAULT_CHECKOUT_THEME.colors.border}
                      onChange={(v) => setColor("colors.border", v)}
                    />
                    <ColorField
                      label="Acento"
                      value={watch.colors?.accent ?? DEFAULT_CHECKOUT_THEME.colors.accent}
                      onChange={(v) => setColor("colors.accent", v)}
                      hint="Urgência, badges"
                    />
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Botão de ação (CTA)" forceOpen={!!searchQuery}>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField
                      label="Fundo do botão"
                      value={watch.colors?.buttonBg ?? DEFAULT_CHECKOUT_THEME.colors.buttonBg}
                      onChange={(v) => setColor("colors.buttonBg", v)}
                    />
                    <ColorField
                      label="Texto do botão"
                      value={watch.colors?.buttonText ?? DEFAULT_CHECKOUT_THEME.colors.buttonText}
                      onChange={(v) => setColor("colors.buttonText", v)}
                    />
                  </div>
                  {/* Live button preview */}
                  <div
                    className="mt-1 rounded-md py-2.5 px-4 text-center text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: watch.colors?.buttonBg,
                      color: watch.colors?.buttonText,
                      borderRadius: watch.layout?.borderRadius,
                    }}
                  >
                    {watch.cta?.placeOrderLabel || "Finalizar pedido"}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Estados (sucesso e erro)"
                  defaultOpen={false}
                  forceOpen={!!searchQuery}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField
                      label="Cor de sucesso"
                      value={watch.colors?.success ?? DEFAULT_CHECKOUT_THEME.colors.success}
                      onChange={(v) => setColor("colors.success", v)}
                    />
                    <ColorField
                      label="Cor de erro"
                      value={watch.colors?.error ?? DEFAULT_CHECKOUT_THEME.colors.error}
                      onChange={(v) => setColor("colors.error", v)}
                    />
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Tipografia" forceOpen={!!searchQuery}>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Fonte de títulos</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={watch.typography?.headingFont ?? DEFAULT_CHECKOUT_THEME.typography.headingFont}
                        onChange={(e) =>
                          form.setValue("typography.headingFont", e.target.value, { shouldDirty: true })
                        }
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Fonte do corpo</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={watch.typography?.bodyFont ?? DEFAULT_CHECKOUT_THEME.typography.bodyFont}
                        onChange={(e) =>
                          form.setValue("typography.bodyFont", e.target.value, { shouldDirty: true })
                        }
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Tamanho base</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={watch.typography?.baseFontSize ?? DEFAULT_CHECKOUT_THEME.typography.baseFontSize}
                        onChange={(e) =>
                          form.setValue("typography.baseFontSize", e.target.value, { shouldDirty: true })
                        }
                      >
                        {FONT_SIZE_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>

                    {/* Font preview */}
                    <div
                      className="rounded-md border p-3 text-sm"
                      style={{
                        fontFamily: watch.typography?.bodyFont,
                        fontSize: watch.typography?.baseFontSize,
                        color: watch.colors?.text,
                        backgroundColor: watch.colors?.background,
                        border: `1px solid ${watch.colors?.border}`,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: watch.typography?.headingFont,
                          fontWeight: 600,
                          fontSize: "1.05em",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Finalizar compra
                      </p>
                      <p style={{ opacity: 0.65 }}>
                        Revise seu pedido e escolha o pagamento.
                      </p>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* ── Layout ────────────────────────────────────────────────── */}
            {visibleIds.includes("layout") && (
              <div
                ref={makeSectionRef("layout")}
                id="layout"
                className="space-y-3"
              >
                <SectionHeader
                  icon={LayoutTemplate}
                  label="Layout"
                  description="Bordas, espaçamento e sombras"
                />

                <CollapsibleSection title="Bordas e arredondamento" forceOpen={!!searchQuery}>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Raio de borda — <span className="font-mono">{watch.layout?.borderRadius}</span>
                      </Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={watch.layout?.borderRadius ?? DEFAULT_CHECKOUT_THEME.layout.borderRadius}
                        onChange={(e) =>
                          form.setValue("layout.borderRadius", e.target.value, { shouldDirty: true })
                        }
                      >
                        {BORDER_RADIUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {/* Border radius preview */}
                      <div
                        className="mt-1 h-8 w-full border-2"
                        style={{
                          borderRadius: watch.layout?.borderRadius,
                          borderColor: watch.colors?.primary,
                          backgroundColor: watch.colors?.secondary,
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Espaçamento base (px)
                      </Label>
                      <Input
                        type="number"
                        min={4}
                        max={64}
                        step={4}
                        {...form.register("layout.spacingUnit", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Sombra dos cards" forceOpen={!!searchQuery}>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={watch.layout?.cardShadow ?? DEFAULT_CHECKOUT_THEME.layout.cardShadow}
                    onChange={(e) =>
                      form.setValue("layout.cardShadow", e.target.value, { shouldDirty: true })
                    }
                  >
                    {SHADOW_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {/* Shadow preview */}
                  <div
                    className="mt-2 flex h-12 w-full items-center justify-center rounded-md border text-xs text-muted-foreground"
                    style={{
                      boxShadow: watch.layout?.cardShadow,
                      borderRadius: watch.layout?.borderRadius,
                      borderColor: watch.colors?.border,
                    }}
                  >
                    exemplo de card
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* ── Conteúdo & CTA ────────────────────────────────────────── */}
            {visibleIds.includes("conteudo") && (
              <div
                ref={makeSectionRef("conteudo")}
                id="conteudo"
                className="space-y-3"
              >
                <SectionHeader
                  icon={Zap}
                  label="Conteúdo & CTA"
                  description="Textos e gatilhos de conversão"
                />

                <CollapsibleSection title="Rótulos dos botões" forceOpen={!!searchQuery}>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Botão &ldquo;Finalizar pedido&rdquo;
                      </Label>
                      <Input
                        {...form.register("cta.placeOrderLabel")}
                        placeholder="Finalizar pedido"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Botão &ldquo;Continuar para pagamento&rdquo;
                      </Label>
                      <Input
                        {...form.register("cta.continueToPaymentLabel")}
                        placeholder="Ir para pagamento"
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Banner de urgência" forceOpen={!!searchQuery}>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Texto do banner (deixe vazio para ocultar)
                    </Label>
                    <Input
                      {...form.register("cta.urgencyText")}
                      placeholder="⚡ Oferta por tempo limitado"
                    />
                  </div>
                  {watch.cta?.urgencyText && (
                    <div
                      className="mt-1 rounded-md px-3 py-2 text-center text-sm font-medium"
                      style={{
                        backgroundColor: watch.colors?.accent,
                        color: "#fff",
                        borderRadius: watch.layout?.borderRadius,
                      }}
                    >
                      {watch.cta.urgencyText}
                    </div>
                  )}
                </CollapsibleSection>
              </div>
            )}

            {/* ── Confiança ─────────────────────────────────────────────── */}
            {visibleIds.includes("confianca") && (
              <div
                ref={makeSectionRef("confianca")}
                id="confianca"
                className="space-y-3"
              >
                <SectionHeader
                  icon={ShieldCheck}
                  label="Confiança"
                  description="Selos e mensagens de credibilidade"
                />

                <CollapsibleSection title="Selos de confiança" forceOpen={!!searchQuery}>
                  <div className="space-y-3">
                    {TRUST_BADGE_CONFIG.map(({ key, label, icon }) => (
                      <div key={key} className="flex min-h-[44px] items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{icon}</span>
                          <Label className="cursor-pointer text-sm">{label}</Label>
                        </div>
                        <Switch
                          checked={
                            watch.icons?.trustBadges?.[
                              key as keyof CheckoutTheme["icons"]["trustBadges"]
                            ] ?? true
                          }
                          onCheckedChange={(v) =>
                            form.setValue(
                              `icons.trustBadges.${key}` as Parameters<typeof form.setValue>[0],
                              v,
                              { shouldDirty: true },
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                  {/* Badge preview */}
                  <div className="flex flex-wrap gap-1.5 border-t border-border/50 pt-3">
                    {TRUST_BADGE_CONFIG.filter(
                      ({ key }) =>
                        watch.icons?.trustBadges?.[
                          key as keyof CheckoutTheme["icons"]["trustBadges"]
                        ],
                    ).map(({ label, icon }) => (
                      <Badge key={label} variant="outline" className="gap-1 text-xs">
                        {icon} {label}
                      </Badge>
                    ))}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Mensagens de confiança" forceOpen={!!searchQuery}>
                  <p className="text-xs text-muted-foreground">
                    Exibidas em rotação abaixo do resumo do pedido.
                  </p>
                  <div className="space-y-2">
                    {(trustMessages.fields as { id: string }[]).map((field, idx) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          {...form.register(`cta.trustMessages.${idx}` as const)}
                          className="text-xs"
                          placeholder="Ex: Compra 100% segura e protegida"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0 px-2 text-destructive hover:text-destructive"
                          onClick={() => trustMessages.remove(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => trustMessages.append("" as never)}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Adicionar mensagem
                    </Button>
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* ── Pagamento ─────────────────────────────────────────────── */}
            {visibleIds.includes("pagamento") && (
              <div
                ref={makeSectionRef("pagamento")}
                id="pagamento"
                className="space-y-3 pb-4"
              >
                <SectionHeader
                  icon={CreditCard}
                  label="Pagamento"
                  description="Aparência dos ícones de pagamento"
                />

                <CollapsibleSection title="Estilo dos ícones de pagamento" forceOpen={!!searchQuery}>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Estilo visual</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["color", "mono"] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          className={cn(
                            "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            watch.icons?.paymentIconStyle === style
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted/40",
                          )}
                          onClick={() =>
                            form.setValue("icons.paymentIconStyle", style, { shouldDirty: true })
                          }
                        >
                          {style === "color" ? "🎨 Colorido" : "⬛ Monocromático"}
                        </button>
                      ))}
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            )}
          </div>
        </div>
        {/* Right Panel - Live Preview */}
        {/* Desktop (lg+): visible when previewVisible | Tablet (md-lg): visible when activePanel==="preview" | Mobile: hidden inline */}
        {(previewVisible || activePanel === "preview") && (
          <div className={cn(
            "relative min-w-0 flex-1 flex-col bg-muted/30",
            "hidden",
            activePanel === "preview" && "md:flex lg:hidden",
            previewVisible && "lg:flex",
          )}>
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/70 px-4 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-medium text-muted-foreground">
                Pr\u00e9-visualiza\u00e7\u00e3o ao vivo
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="text-xs text-muted-foreground">
                  {viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet (768px)" : "Mobile (375px)"}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1 overflow-auto p-4">
              <div
                className={cn(
                  "mx-auto h-full overflow-hidden rounded-lg border border-border shadow-sm",
                  viewport === "mobile" ? "max-w-[375px]" : viewport === "tablet" ? "max-w-[768px]" : "max-w-full",
                )}
              >
                <CheckoutPreview theme={watch as ThemeFormValues} viewport={viewport} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Save Bar — appears when there are unsaved changes ────────── */}
      {isDirty && (
        <div
          className="flex shrink-0 items-center justify-between gap-3 border-t-2 border-amber-400/70 bg-amber-50 px-4 py-2.5 dark:bg-amber-950/40"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-sm font-medium">Há alterações não salvas</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50"
              onClick={handleReset}
              disabled={resetting || saving}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {resetting ? "Restaurando…" : "Restaurar padrão"}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500"
              onClick={handleSave}
              disabled={saving || resetting}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
          </div>
        </div>
      )}

      {/* Mobile: Floating Save Button */}
      <div className="fixed bottom-5 right-4 z-50 md:hidden">
        <Button type="button" size="default" className="h-12 rounded-full px-5 shadow-lg touch-manipulation" onClick={handleSave} disabled={saving || resetting}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando\u2026" : "Salvar"}
        </Button>
      </div>

      {/* Mobile: Preview Bottom Sheet */}
      <Sheet open={previewSheetOpen} onOpenChange={setPreviewSheetOpen}>
        <SheetContent side="bottom" className="flex flex-col p-0 md:hidden">
          <SheetHeader className="shrink-0 border-b border-border px-4 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm font-semibold">Pr\u00e9-visualiza\u00e7\u00e3o</SheetTitle>
              <div className="flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
                <Button type="button" variant={viewport === "desktop" ? "secondary" : "ghost"} size="sm" className="h-9 w-9 p-0 touch-manipulation" onClick={() => setViewport("desktop")} title="Desktop"><Monitor className="h-4 w-4" /></Button>
                <Button type="button" variant={viewport === "tablet" ? "secondary" : "ghost"} size="sm" className="h-9 w-9 p-0 touch-manipulation" onClick={() => setViewport("tablet")} title="Tablet"><Tablet className="h-4 w-4" /></Button>
                <Button type="button" variant={viewport === "mobile" ? "secondary" : "ghost"} size="sm" className="h-9 w-9 p-0 touch-manipulation" onClick={() => setViewport("mobile")} title="Mobile"><Smartphone className="h-4 w-4" /></Button>
              </div>
            </div>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <div className={cn("mx-auto overflow-hidden rounded-lg border border-border shadow-sm", viewport === "mobile" ? "max-w-[375px]" : "max-w-full")}>
              <CheckoutPreview theme={watch as ThemeFormValues} viewport={viewport} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { label: "Inter (padrão)", value: "Inter, system-ui, sans-serif" },
  { label: "Roboto", value: "Roboto, Arial, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Nunito", value: "Nunito, sans-serif" },
  { label: "Playfair Display (serif)", value: "'Playfair Display', Georgia, serif" },
  { label: "Merriweather (serif)", value: "Merriweather, Georgia, serif" },
  { label: "Georgia (serif)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Courier New (mono)", value: "'Courier New', Courier, monospace" },
  { label: "System UI", value: "system-ui, sans-serif" },
];

const FONT_SIZE_OPTIONS = ["13px", "14px", "15px", "16px", "17px", "18px"];

const BORDER_RADIUS_OPTIONS = [
  { label: "Nenhum (0)", value: "0px" },
  { label: "Leve (4px)", value: "4px" },
  { label: "Médio (8px)", value: "8px" },
  { label: "Arredondado (12px)", value: "12px" },
  { label: "Grande (16px)", value: "16px" },
  { label: "Oval (24px)", value: "24px" },
  { label: "Pílula (9999px)", value: "9999px" },
];

const SHADOW_OPTIONS = [
  { label: "Sem sombra", value: "none" },
  { label: "Sutil", value: "0 1px 3px rgba(0,0,0,0.06)" },
  { label: "Leve", value: "0 1px 4px rgba(0,0,0,0.08)" },
  { label: "Médio", value: "0 2px 8px rgba(0,0,0,0.1)" },
  { label: "Pronunciado", value: "0 4px 16px rgba(0,0,0,0.12)" },
  { label: "Forte", value: "0 8px 24px rgba(0,0,0,0.15)" },
];

const TRUST_BADGE_CONFIG = [
  { key: "securePayment", label: "Pagamento seguro", icon: "🔒" },
  { key: "sslCertificate", label: "Certificado SSL", icon: "🛡️" },
  { key: "moneyBackGuarantee", label: "Garantia de devolução", icon: "↩️" },
  { key: "fastShipping", label: "Entrega rápida", icon: "🚚" },
  { key: "customerSupport", label: "Suporte ao cliente", icon: "💬" },
] as const;
