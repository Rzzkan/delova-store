import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Pixels } from "@/components/Pixels";
import { getTracking } from "@/lib/tracking";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Delova Wardrobe — Kebaya, Batik & Hijab Modern", template: "%s | Delova" },
  description: "Busana wastra Indonesia modern: kebaya, batik, gamis, hijab, dan Delova Kids. Stok & harga tersinkron dengan toko Shopee resmi.",
  openGraph: { type: "website", siteName: "Delova", locale: "id_ID" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { verifyDomain } = await getTracking();
  return (
    <html lang="id">
      <head>
        {verifyDomain && <meta name="facebook-domain-verification" content={verifyDomain} />}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fredoka:wght@500;600;700&family=Poppins:wght@600;700;800&family=Caveat:wght@700&display=swap" rel="stylesheet" />
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
