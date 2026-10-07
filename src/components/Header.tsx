"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { CATEGORIES } from "@/lib/categories";

const BagIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 7h12l1 13H5L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" />
  </svg>
);

export function Header() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-cream/95 backdrop-blur">
      <div className="container-x flex h-16 items-center gap-4">
        <details className="relative lg:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full hover:bg-sand" aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </summary>
          <nav className="absolute left-0 top-12 w-60 rounded-2xl border border-sand bg-white p-3 shadow-xl">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/produk?kategori=${c.slug}`} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-cream">{c.label}</Link>
            ))}
            <Link href="/produk" className="mt-1 block rounded-lg px-3 py-2.5 text-sm font-medium text-maroon hover:bg-cream">Semua Produk</Link>
          </nav>
        </details>

        <Link href="/" className="leading-none" aria-label="Delova Wardrobe — beranda">
          <span className="font-display text-3xl font-semibold tracking-[.18em] text-maroon">DELOVA</span>
          <span className="block text-[9px] uppercase tracking-[.5em] text-gold">wardrobe</span>
        </Link>

        <nav className="ml-8 hidden items-center gap-7 text-sm lg:flex">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/produk?kategori=${c.slug}`} className="text-ink/75 transition hover:text-maroon">{c.label}</Link>
          ))}
          <Link href="/produk" className="font-medium text-maroon">Semua</Link>
        </nav>

        <form action="/produk" className="ml-auto hidden max-w-xs flex-1 md:block">
          <input name="q" placeholder="Cari kebaya, batik, hijab…" className="input !rounded-full !py-2" aria-label="Cari produk" />
        </form>

        <Link href="/keranjang" className="relative ml-auto flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand md:ml-0" aria-label={`Keranjang, ${count} barang`}>
          <BagIcon />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon px-1 text-[11px] font-medium text-cream">{count}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
