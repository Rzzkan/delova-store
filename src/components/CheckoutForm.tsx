"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { idr } from "@/lib/format";
import { track } from "@/lib/track";

export function CheckoutForm() {
  const { items, total, clear, ready } = useCart();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!ready) return null;
  if (!items.length)
    return (<div className="py-20 text-center"><p className="font-display text-2xl">Belum ada barang</p><Link href="/produk" className="btn-primary mt-6">Belanja dulu</Link></div>);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"), phone: f.get("phone"), address: f.get("address"), note: f.get("note"),
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses pesanan");
      track("InitiateCheckout", { value: data.total, num_items: items.length });
      clear();
      window.location.href = data.waUrl;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Terjadi kesalahan");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="mb-1 block text-sm font-medium" htmlFor="name">Nama penerima</label><input id="name" name="name" required minLength={2} className="input" autoComplete="name" /></div>
        <div><label className="mb-1 block text-sm font-medium" htmlFor="phone">No. WhatsApp</label><input id="phone" name="phone" required inputMode="tel" pattern="[0-9+ ]{9,16}" placeholder="08xxxxxxxxxx" className="input" autoComplete="tel" /></div>
        <div><label className="mb-1 block text-sm font-medium" htmlFor="address">Alamat lengkap</label><textarea id="address" name="address" required minLength={10} rows={3} className="input" autoComplete="street-address" /></div>
        <div><label className="mb-1 block text-sm font-medium" htmlFor="note">Catatan (opsional)</label><input id="note" name="note" className="input" /></div>
        {err && <p role="alert" className="text-sm text-brand">{err}</p>}
        <button className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? "Memproses…" : "Kirim Pesanan ke WhatsApp"}</button>
        <p className="text-xs text-ink/50">Pesananmu dikirim ke admin Delova lewat WhatsApp untuk konfirmasi stok, ongkir, dan pembayaran.</p>
      </form>
      <aside className="h-fit rounded-3xl border border-sand bg-white p-6">
        <h2 className="text-xl font-semibold">Pesanan</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.key} className="flex justify-between gap-3"><span>{i.name}{i.variantName ? ` (${i.variantName})` : ""} <span className="text-ink/50">×{i.qty}</span></span><span>{idr(i.price * i.qty)}</span></li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-sand pt-4 font-medium"><span>Subtotal</span><span className="text-brand">{idr(total)}</span></div>
      </aside>
    </div>
  );
}
