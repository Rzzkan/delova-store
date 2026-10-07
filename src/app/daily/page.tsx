import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { BrandHome } from "@/components/BrandHome";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Delova Daily", description: "Koleksi Delova Daily — stok & harga tersinkron dengan toko Shopee resmi." };

export default function DailyPage() {
  return (<Shell brand="daily"><BrandHome brand="daily" /></Shell>);
}
