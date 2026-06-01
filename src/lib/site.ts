export const siteConfig = {
  name: "Bordadeiras",
  legalName: "Ecommerce Bordadeiras",
  description:
    "Máquinas de bordado, insumos e acessórios premium para ateliês e indústria têxtil.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "pt_BR",
  contact: {
    email: "contato@bordadeiras.com.br",
    phone: "+55 11 99999-0000",
    whatsapp: "5511999990000",
    address: "São Paulo, SP — Brasil",
  },
  social: {
    instagram: "https://instagram.com/bordadeiras",
    youtube: "https://youtube.com/@bordadeiras",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/loja", label: "Loja" },
    { href: "/blog", label: "Blog" },
    { href: "/sobre", label: "Sobre" },
    { href: "/contato", label: "Contato" },
  ] as const,
  installmentMax: 12,
};

export type NavItem = (typeof siteConfig.nav)[number];
