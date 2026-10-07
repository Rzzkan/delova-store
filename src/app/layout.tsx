import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Pixels } from "@/components/Pixels";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Delova Wardrobe — Kebaya, Batik & Hijab Modern", template: "%s | Delova Wardrobe" },
  description: "Busana wastra Indonesia modern: kebaya, batik, gamis, hijab, dan Delova Kids. Stok & harga tersinkron dengan toko Shopee resmi.",
  openGraph: { type: "website", siteName: "Delova Wardrobe", locale: "id_ID" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fredoka:wght@500;600;700&family=Caveat:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
        <Pixels />
      </body>
    </html>
  );
}
