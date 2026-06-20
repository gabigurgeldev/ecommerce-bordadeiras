import type { NextConfig } from "next";

function imageRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
    { protocol: "http", hostname: "localhost", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const { protocol, hostname } = new URL(supabaseUrl);
      if (hostname && (protocol === "http:" || protocol === "https:")) {
        patterns.push({
          protocol: protocol.replace(":", "") as "http" | "https",
          hostname,
          pathname: "/storage/v1/object/public/**",
        });
      }
    } catch {
      /* ignore invalid URL */
    }
  }

  return patterns;
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  images: {
    remotePatterns: imageRemotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/((?!embed/).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
