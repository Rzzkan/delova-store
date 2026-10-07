import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { BrandHome } from "@/components/BrandHome";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Delova Scarf", description: "Koleksi Delova Scarf — stok & harga tersinkron dengan toko Shopee resmi." };

export default function ScarfPage() {
  return (<Shell brand="scarf"><BrandHome brand="scarf" /></Shell>);
}
