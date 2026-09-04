import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, Spline_Sans_Mono } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
import { Providers } from "@/app/providers";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
});
const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Gampangin FNB",
  description: "POS, produksi, stok, dan keuangan untuk dapur UMKM — dari struk sampai laba.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <ThemeScript />
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
