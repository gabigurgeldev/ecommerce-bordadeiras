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
} from "lucide-react";

export const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/confianca", label: "Barra de confiança", icon: ShieldCheck },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/cupons", label: "Cupons", icon: Ticket },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/admin/auditoria", label: "Auditoria", icon: ScrollText },
] as const;
