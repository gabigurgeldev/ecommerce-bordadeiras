export const adminRouteTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/produtos": "Produtos",
  "/admin/produtos/novo": "Novo produto",
  "/admin/categorias": "Categorias",
  "/admin/banners": "Banners",
  "/admin/confianca": "Barra de confiança",
  "/admin/pedidos": "Pedidos",
  "/admin/clientes": "Clientes",
  "/admin/blog": "Blog",
  "/admin/blog/novo": "Novo post",
  "/admin/cupons": "Cupons",
  "/admin/cupons/novo": "Novo cupom",
  "/admin/configuracoes": "Configurações",
  "/admin/whatsapp": "WhatsApp",
  "/admin/auditoria": "Auditoria",
};

export function getAdminBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin" }];

  if (pathname === "/admin") {
    crumbs.push({ label: "Dashboard" });
    return crumbs;
  }

  const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  let acc = "/admin";

  for (let i = 0; i < segments.length; i++) {
    acc += `/${segments[i]}`;
    const isLast = i === segments.length - 1;
    const title = adminRouteTitles[acc];
    if (title) {
      crumbs.push({ label: title, href: isLast ? undefined : acc });
    } else if (segments[i] !== "novo") {
      const parent = segments[i - 1];
      crumbs.push({
        label: parent === "cupons" ? "Editar cupom" : "Detalhe",
        href: isLast ? undefined : acc,
      });
    }
  }

  return crumbs;
}

export function getAdminPageTitle(pathname: string): string {
  if (adminRouteTitles[pathname]) return adminRouteTitles[pathname];
  if (/^\/admin\/cupons\/[^/]+$/.test(pathname) && !pathname.endsWith("/novo")) {
    return "Editar cupom";
  }
  const crumbs = getAdminBreadcrumbs(pathname);
  return crumbs[crumbs.length - 1]?.label ?? "Admin";
}
