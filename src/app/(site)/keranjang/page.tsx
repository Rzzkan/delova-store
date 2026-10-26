import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { CartView } from "@/components/CartView";
export const metadata: Metadata = { title: "Keranjang", robots: { index: false } };
export default function CartPage() {
  return (<Shell><div className="container-x py-10"><h1 className="mb-8 text-4xl">Keranjang</h1><CartView /></div></Shell>);
}
