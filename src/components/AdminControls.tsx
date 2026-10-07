"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

export function SyncButton({ shopId, label = "Sinkron sekarang" }: { shopId?: number; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function run() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`/api/shopee/sync${shopId ? `?shop=${shopId}` : ""}`, { method: "POST" });
      const d = await r.json();
      if (d.mock) setMsg(d.message);
      else if (d.results) setMsg(d.results.map((x: { name: string; upserted: number; removed: number; error?: string }) => x.error ? `${x.name}: ${x.error}` : `${x.name}: ${x.upserted} diperbarui, ${x.removed} dihapus`).join(" · "));
      else setMsg(d.error || "Gagal");
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Gagal"); }
    setBusy(false);
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button onClick={run} disabled={busy} className="btn-primary !px-4 !py-2">{busy ? "Menyinkronkan…" : label}</button>
      {msg && <span className="max-w-md text-xs text-ink/60">{msg}</span>}
    </span>
  );
}

export function ProductRow({ p }: { p: { id: string; name: string; shop: string; price: number; stock: number; category: string; hidden: boolean; featured: boolean } }) {
  const [s, setS] = useState(p);
  async function save(patch: Record<string, unknown>) {
    const prev = s;
    setS({ ...s, ...patch } as typeof s);
    const r = await fetch("/api/admin/product", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, ...patch }) });
    if (!r.ok) setS(prev);
  }
  return (
    <tr className="border-t border-sand align-middle text-sm">
      <td className="max-w-xs py-2 pr-3"><span className="line-clamp-2">{s.name}</span><span className="text-xs text-ink/40">{s.shop}</span></td>
      <td className="pr-3">Rp{s.price.toLocaleString("id-ID")}</td>
      <td className={`pr-3 ${s.stock <= 0 ? "text-maroon" : ""}`}>{s.stock}</td>
      <td className="pr-3">
        <select className="rounded-lg border border-sand bg-white px-2 py-1" value={s.category} onChange={(e) => save({ category_override: e.target.value })} aria-label="Kategori">
          {CATEGORIES.map((c) => (<option key={c.slug} value={c.slug}>{c.label}</option>))}
          <option value="lainnya">Lainnya</option>
        </select>
      </td>
      <td className="pr-3"><input type="checkbox" checked={s.featured} onChange={(e) => save({ featured: e.target.checked })} aria-label="Unggulan" /></td>
      <td><input type="checkbox" checked={s.hidden} onChange={(e) => save({ hidden: e.target.checked })} aria-label="Sembunyikan" /></td>
    </tr>
  );
}
