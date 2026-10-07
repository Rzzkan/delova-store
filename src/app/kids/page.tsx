import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { BrandHome } from "@/components/BrandHome";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Delova Kids", description: "Koleksi Delova Kids — stok & harga tersinkron dengan toko Shopee resmi." };

export default function KidsPage() {
  return (<Shell brand="kids"><BrandHome brand="kids" /></Shell>);
}
