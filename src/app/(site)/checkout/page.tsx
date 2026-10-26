import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { CheckoutForm } from "@/components/CheckoutForm";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export default function CheckoutPage() {
  return (<Shell><div className="container-x py-10"><h1 className="mb-8 text-4xl">Checkout</h1><CheckoutForm /></div></Shell>);
}
