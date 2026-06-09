import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  FileText,
  Ticket,
  Settings,
  MessageCircle,
  ScrollText,
  Image,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const adminNavTop: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
];

export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "catalogo",
    label: "Catálogo",
    items: [
      { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
      { href: "/admin/produtos", label: "Produtos", icon: Package },
    ],
  },
  {
    id: "vitrine",
    label: "Vitrine",
    items: [
      { href: "/admin/banners", label: "Banners", icon: Image },
      { href: "/admin/confianca", label: "Barra de confiança", icon: ShieldCheck },
    ],
  },
  {
    id: "vendas",
    label: "Vendas",
    items: [
      { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
      { href: "/admin/clientes", label: "Clientes", icon: Users },
      { href: "/admin/cupons", label: "Cupons", icon: Ticket },
    ],
  },
  {
    id: "conteudo",
    label: "Conteúdo",
    items: [{ href: "/admin/blog", label: "Blog", icon: FileText }],
  },
  {
    id: "sistema",
    label: "Sistema",
    items: [
      { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
      { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
    ],
  },
];

export const adminNavFooter: AdminNavItem[] = [
  { href: "/admin/auditoria", label: "Auditoria", icon: ScrollText },
];

/** @deprecated Use adminNavGroups — kept for any legacy imports */
export const adminNav = [
  ...adminNavTop,
  ...adminNavGroups.flatMap((g) => g.items),
  ...adminNavFooter,
] as const;
