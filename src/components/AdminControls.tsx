"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { BRANDS, BRAND_SLUGS } from "@/lib/brands";

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

export function ShopBrandSelect({ shopId, brand }: { shopId: number; brand: string }) {
  const [v, setV] = useState(brand);
  return (
    <label className="mt-2 flex items-center gap-2 text-xs text-ink/60">Brand:
      <select className="rounded-lg border border-sand bg-white px-2 py-1 text-sm text-ink" value={v}
        onChange={async (e) => { const prev = v; setV(e.target.value); const r = await fetch("/api/admin/shop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shopId, brand: e.target.value }) }); if (!r.ok) setV(prev); }}>
        {BRAND_SLUGS.map((b) => (<option key={b} value={b}>{BRANDS[b].name}</option>))}
      </select>
    </label>
  );
}
