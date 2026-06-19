import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

const defaultShareImage = `${siteConfig.url}/brand/og-whatsapp.png`;

type PageMeta = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  rssPath?: string;
};

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "",
  image,
  noIndex,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  rssPath,
}: PageMeta): Metadata {
  const url = `${siteConfig.url}${path}`;
  const ogImage = image ?? defaultShareImage;

  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
      ...(rssPath ? { types: { "application/rss+xml": `${siteConfig.url}${rssPath}` } } : {}),
    },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url,
      title,
      description,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
      ...(type === "article" && authors?.length ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
