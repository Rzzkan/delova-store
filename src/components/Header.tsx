"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCart } from "./CartProvider";
import type { BrandSlug } from "@/lib/brands";

const BagIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 7h12l1 13H5L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" />
  </svg>
);

export function Header({ brand, nav, logo }: { brand: BrandSlug; nav: { label: string; href: string }[]; logo: ReactNode }) {
  const { count } = useCart();
  const home = brand === "wardrobe" ? "/" : `/${brand}`;
  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-cream/95 backdrop-blur">
      <div className="container-x flex h-[72px] items-center gap-4">
        <details className="relative lg:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full hover:bg-sand" aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </summary>
          <nav className="absolute left-0 top-12 w-60 rounded-2xl border border-sand bg-white p-3 shadow-xl">
            {nav.map((n) => (<Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-cream">{n.label}</Link>))}
          </nav>
        </details>

        <Link href={home} className="flex-none" aria-label="Delova — beranda">{logo}</Link>

        <nav className="ml-8 hidden items-center gap-7 text-sm font-medium lg:flex">
          {nav.map((n) => (<Link key={n.href} href={n.href} className="text-ink/75 transition hover:text-brand">{n.label}</Link>))}
        </nav>

        <form action="/produk" className="ml-auto hidden max-w-xs flex-1 md:block">
          {brand !== "wardrobe" && <input type="hidden" name="brand" value={brand} />}
          <input name="q" placeholder="Cari produk…" className="input !rounded-full !py-2" aria-label="Cari produk" />
        </form>

        <Link href="/keranjang" className="relative ml-auto flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand md:ml-0" aria-label={`Keranjang, ${count} barang`}>
          <BagIcon />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-cream">{count}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
