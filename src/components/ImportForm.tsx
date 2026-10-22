"use client";
import { useRef, useState } from "react";
import { BRAND_SLUGS, BRANDS } from "@/lib/brands";
import type { Summary } from "@/lib/import";

const rp = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

export function ImportForm() {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [brand, setBrand] = useState<string>("wardrobe");
  const [shopName, setShopName] = useState("");
  const [removeMissing, setRemoveMissing] = useState(true);
  const [sum, setSum] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(mode: "preview" | "apply") {
    setBusy(true); setMsg(null);
    const fd = new FormData();
    fd.set("mode", mode); fd.set("brand", brand); fd.set("shopName", shopName); fd.set("removeMissing", removeMissing ? "1" : "0");
    files.forEach((f) => fd.append("files", f));
    try {
      const r = await fetch("/api/admin/import", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Gagal memproses file");
      if (mode === "preview") { setSum(d.summary); if (!shopName && d.summary.shopName) setShopName(d.summary.shopName); }
      else { setSum(null); setFiles([]); setMsg({ ok: true, text: `Selesai: ${d.upserted} produk diimpor${d.removed ? `, ${d.removed} dihapus` : ""} untuk toko “${d.name}”.` }); }
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Gagal" }); }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-sand bg-white p-5">
        <input ref={input} type="file" accept=".xlsx" multiple hidden onChange={(e) => { setFiles(Array.from(e.target.files ?? []).slice(0, 3)); setSum(null); setMsg(null); }} />
        <button type="button" className="btn-outline" onClick={() => input.current?.click()}>Pilih 3 file .xlsx</button>
        {files.length > 0 && <ul className="mt-3 space-y-1 text-xs text-ink/70">{files.map((f) => (<li key={f.name}>📄 {f.name} <span className="text-ink/40">({(f.size / 1024).toFixed(0)} KB)</span></li>))}</ul>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="brand" className="mb-1 block text-sm font-medium">Brand toko ini</label>
          <select id="brand" className="input" value={brand} onChange={(e) => setBrand(e.target.value)}>{BRAND_SLUGS.map((b) => (<option key={b} value={b}>{BRANDS[b].name}</option>))}</select></div>
        <div><label htmlFor="sn" className="mb-1 block text-sm font-medium">Nama toko (opsional)</label>
          <input id="sn" className="input" value={shopName} placeholder="mis. delovawardrobe" onChange={(e) => setShopName(e.target.value)} /></div>
      </div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={removeMissing} onChange={(e) => setRemoveMissing(e.target.checked)} />
        <span>Hapus produk toko ini yang <b>tidak ada</b> di file (agar produk yang sudah dihapus di Shopee ikut hilang). Matikan bila file hanya sebagian produk.</span></label>

      <div className="flex gap-3">
        <button className="btn-outline" disabled={busy || files.length === 0} onClick={() => call("preview")}>{busy && !sum ? "Memeriksa…" : "Cek dulu"}</button>
        {sum && <button className="btn-primary" disabled={busy} onClick={() => call("apply")}>{busy ? "Mengimpor…" : `Impor ${sum.total} produk`}</button>}
      </div>

      {msg && <p role="alert" className={`rounded-xl p-3 text-sm ${msg.ok ? "bg-sage/20" : "bg-blush text-brand"}`}>{msg.text}</p>}

      {sum && (
        <section className="space-y-3 rounded-2xl border border-sand bg-white p-5 text-sm">
          <h2 className="text-lg font-semibold">Hasil pemeriksaan</h2>
          <p>Toko ID <b>{sum.shopId}</b> · {sum.total} produk · {sum.variants} varian</p>
          <p>Baru: <b>{sum.created}</b> · Diperbarui: <b>{sum.updated}</b> · Akan dihapus: <b>{sum.toRemove}</b>{sum.mockToPurge > 0 && <> · Data contoh dibuang: <b>{sum.mockToPurge}</b></>}</p>
          {sum.warnings.length > 0 && <ul className="list-disc space-y-1 pl-5 text-brand">{sum.warnings.slice(0, 6).map((w) => (<li key={w}>{w}</li>))}</ul>}
          <ul className="divide-y divide-sand">{sum.sample.map((p) => (
            <li key={p.name} className="flex items-center gap-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image ? <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="h-12 w-12 rounded-lg bg-sand" />}
              <span className="flex-1 truncate">{p.name}</span><span className="text-ink/60">{rp(p.price)} · stok {p.stock} · {p.variants} varian</span>
            </li>))}</ul>
          <p className="text-xs text-ink/50">Terjual, rating, dan ulasan tidak ada di file Shopee ini, jadi tidak diubah.</p>
        </section>
      )}
    </div>
  );
}
