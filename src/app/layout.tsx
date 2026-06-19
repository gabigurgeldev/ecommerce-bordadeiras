import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import {
  Cormorant_Garamond,
  Inter,
  Playfair_Display,
  Poppins,
} from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bordadeiras — E-commerce de Bordado",
    template: "%s | Bordadeiras",
  },
  description:
    "Máquinas de bordado, linhas, acessórios e conteúdo para quem vive o bordado computadorizado.",
  icons: {
    icon: [{ url: "/brand/logo-icon.png", type: "image/png" }],
    shortcut: [{ url: "/brand/logo-icon.png", type: "image/png" }],
    apple: [{ url: "/brand/logo-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistMono.variable} ${inter.variable} ${poppins.variable} ${playfair.variable} ${cormorant.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-body antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
