"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { idr, thumb } from "@/lib/format";

export function CartView() {
  const { items, total, setQty, remove, ready } = useCart();
  if (!ready) return <p className="py-20 text-center text-ink/50">Memuat keranjang…</p>;
  if (!items.length)
    return (
      <div className="py-24 text-center">
        <p className="font-display text-2xl">Keranjangmu masih kosong</p>
        <p className="mt-2 text-ink/60">Yuk, pilih kebaya, batik, atau hijab favoritmu.</p>
        <Link href="/produk" className="btn-primary mt-8">Mulai Belanja</Link>
      </div>
    );
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y divide-sand">
        {items.map((i) => (
          <li key={i.key} className="flex gap-4 py-5">
            <Link href={`/produk/${i.slug}`} className="h-28 w-24 flex-none overflow-hidden rounded-xl bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {i.image && <img src={thumb(i.image)} alt={i.name} className="h-full w-full object-cover" />}
            </Link>
            <div className="flex flex-1 flex-col">
              <Link href={`/produk/${i.slug}`} className="text-sm font-medium hover:text-brand">{i.name}</Link>
              {i.variantName && <p className="text-xs text-ink/55">Varian: {i.variantName}</p>}
              <p className="mt-1 text-sm text-brand">{idr(i.price)}</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center rounded-full border border-sand bg-white text-sm">
                  <button className="h-8 w-8" onClick={() => setQty(i.key, i.qty - 1)} aria-label="Kurangi">−</button>
                  <span className="w-6 text-center">{i.qty}</span>
                  <button className="h-8 w-8" onClick={() => setQty(i.key, i.qty + 1)} aria-label="Tambah">+</button>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <a href={i.shopeeUrl} target="_blank" rel="noopener noreferrer" className="text-[#EE4D2D] hover:underline">Beli di Shopee</a>
                  <button onClick={() => remove(i.key)} className="text-ink/50 hover:text-brand">Hapus</button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-3xl border border-sand bg-white p-6">
        <h2 className="text-xl font-semibold">Ringkasan</h2>
        <div className="mt-4 flex justify-between text-sm"><span className="text-ink/60">Subtotal</span><span className="font-medium">{idr(total)}</span></div>
        <p className="mt-1 text-xs text-ink/50">Ongkir dihitung admin saat konfirmasi.</p>
        <Link href="/checkout" className="btn-primary mt-6 w-full">Checkout via WhatsApp</Link>
        <p className="mt-4 text-center text-xs text-ink/50">Atau beli langsung per produk di Shopee untuk gratis ongkir & garansi Shopee.</p>
      </aside>
    </div>
  );
}
