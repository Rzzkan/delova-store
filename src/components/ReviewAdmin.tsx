"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "@/lib/reviews";
import { ImageField } from "./ImageField";

async function call(body: Record<string, unknown>) {
  const r = await fetch("/api/admin/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, data: await r.json().catch(() => ({})) };
}

export function ReviewRow({ r }: { r: Review }) {
  const router = useRouter();
  const [s, setS] = useState({ featured: r.featured, hidden: r.hidden });
  async function set(patch: Partial<typeof s>) {
    const prev = s; setS({ ...s, ...patch });
    const { ok } = await call({ op: "update", id: r.id, ...patch });
    if (!ok) setS(prev);
  }
  return (
    <tr className="border-t border-sand align-top text-sm">
      <td className="py-3 pr-3 text-gold">{"★".repeat(r.rating)}</td>
      <td className="max-w-lg py-3 pr-3"><p className="line-clamp-3">{r.comment}</p><p className="mt-1 text-xs text-ink/40">{r.buyer} · {r.productName ?? "—"} · {r.source}</p></td>
      <td className="pr-3"><input type="checkbox" checked={s.featured} onChange={(e) => set({ featured: e.target.checked })} aria-label="Unggulan" /></td>
      <td className="pr-3"><input type="checkbox" checked={s.hidden} onChange={(e) => set({ hidden: e.target.checked })} aria-label="Sembunyikan" /></td>
      <td>{r.source === "manual" && <button className="text-xs text-maroon underline" onClick={async () => { await call({ op: "delete", id: r.id }); router.refresh(); }}>Hapus</button>}</td>
    </tr>
  );
}

export function AddReview({ products }: { products: { id: string; name: string }[] }) {
  const router = useRouter();
  const [img, setImg] = useState("");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr("");
    const f = new FormData(e.currentTarget);
    const { ok, data } = await call({ op: "create", buyer: f.get("buyer"), rating: f.get("rating"), comment: f.get("comment"), reply: f.get("reply"), productId: f.get("productId"), image: img });
    if (!ok) return setErr(data.error || "Gagal");
    (e.target as HTMLFormElement).reset(); setImg(""); router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl border border-sand bg-white p-6">
      <h3 className="text-2xl font-semibold">Tambah ulasan manual</h3>
      <p className="text-xs text-ink/50">Untuk ulasan yang belum terambil otomatis (mis. salin dari Shopee/WhatsApp). Pastikan pembeli setuju ulasannya ditampilkan.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <input name="buyer" required placeholder="Nama pembeli (otomatis disamarkan)" className="input" />
        <select name="rating" className="input" defaultValue="5">{[5, 4].map((n) => (<option key={n} value={n}>{n} bintang</option>))}</select>
        <select name="productId" className="input" defaultValue=""><option value="">Produk (opsional)</option>{products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
      </div>
      <textarea name="comment" required minLength={10} rows={3} placeholder="Isi ulasan" className="input" />
      <input name="reply" placeholder="Balasan penjual (opsional)" className="input" />
      <ImageField label="Foto dari pembeli (opsional)" value={img} onChange={setImg} />
      {err && <p role="alert" className="text-sm text-maroon">{err}</p>}
      <button className="btn-primary">Tambah & jadikan unggulan</button>
    </form>
  );
}
