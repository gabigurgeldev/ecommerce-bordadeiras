import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/blog/rss.xml"],
        disallow: [
          "/admin/",
          "/api/",
          "/checkout/",
          "/conta/",
          "/login",
          "/cadastro",
          "/esqueci-senha",
          "/reset-password",
          "/verificar-email",
          "/sacola",
          "/blog/busca",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
