import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
export const metadata: Metadata = { title: "Keranjang", robots: { index: false } };
export default function CartPage() {
  return (<div className="container-x py-10"><h1 className="mb-8 text-5xl font-semibold">Keranjang</h1><CartView /></div>);
}
