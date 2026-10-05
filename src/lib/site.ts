export const siteConfig = {
  name: "Bordadeiras",
  tagline: "de Serra Pelada",
  legalName: "Associação das Bordadeiras de Serra Pelada",
  cnpj: "69.177.300/0001-47",
  description:
    "Máquinas de bordado, insumos e acessórios premium para ateliês e indústria têxtil.",
  newsletter:
    "Receba novidades do ateliê, lançamentos e dicas de bordado no seu e-mail.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "pt_BR",
  contact: {
    email: "contato@bordadeiras.com.br",
    phone: "+55 94 9199-8912",
    whatsapp: "5594999012596",
    address:
      "Av. Nova República, 672 — Centrovila Serra Pelada, Curionópolis/PA, 68523-000",
    postalAddress: {
      streetAddress: "Av. Nova República, 672 — Centrovila Serra Pelada",
      addressLocality: "Curionópolis",
      addressRegion: "PA",
      postalCode: "68523-000",
      addressCountry: "BR",
    },
  },
  social: {
    instagram: "https://instagram.com/bordadeiras",
    youtube: "https://youtube.com/@bordadeiras",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/loja", label: "Loja" },
    { href: "/blog", label: "Blog" },
    { href: "/videos", label: "Vídeos" },
    { href: "/sobre", label: "Sobre" },
    { href: "/contato", label: "Contato" },
  ] as const,
  installmentMax: 12,
  promo: {
    message: "Frete grátis em compras acima de R$ 199 — confira as condições na loja",
    code: "BORDADO199",
    href: "/loja",
  },
};

export type NavItem = (typeof siteConfig.nav)[number];
