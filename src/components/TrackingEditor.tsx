"use client";
import { useState } from "react";
import type { TrackingSettings } from "@/lib/tracking";

const FIELDS: { key: keyof TrackingSettings; label: string; ph: string; help: string }[] = [
  { key: "metaPixelId", label: "Meta Pixel ID", ph: "1234567890123456", help: "Meta Events Manager → Sumber Data → Pixel → ID (15–16 angka)." },
  { key: "tiktokPixelId", label: "TikTok Pixel ID", ph: "C1A2B3D4E5F6G7H8I9J0", help: "TikTok Ads Manager → Assets → Events → Web Events → Pixel ID." },
  { key: "ga4Id", label: "Google Analytics 4 Measurement ID", ph: "G-XXXXXXXXXX", help: "GA4 → Admin → Data Streams → Web → Measurement ID (diawali G-)." },
  { key: "verifyDomain", label: "Kode verifikasi domain Meta (opsional)", ph: "abcdefghijklmnopqrstuvwxyz012345", help: "Business Settings → Brand Safety → Domains → metode meta-tag; ambil isi content=\"…\"." },
];

export function TrackingEditor({ initial, active }: { initial: TrackingSettings; active: TrackingSettings }) {
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/tracking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? { ok: true, text: "Tersimpan. Pixel aktif di seluruh situs." } : { ok: false, text: d.error || "Gagal menyimpan" });
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label htmlFor={f.key} className="mb-1 block text-sm font-medium">
            {f.label}{" "}
            {f.key !== "verifyDomain" && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active[f.key] ? "bg-sage/30" : "bg-sand"}`}>{active[f.key] ? "aktif" : "nonaktif"}</span>
            )}
          </label>
          <input id={f.key} className="input font-mono" value={v[f.key]} placeholder={f.ph} autoComplete="off" spellCheck={false}
            onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
          <p className="mt-1 text-xs text-ink/50">{f.help}</p>
        </div>
      ))}
      {msg && <p role="alert" className={`rounded-xl p-3 text-sm ${msg.ok ? "bg-sage/20" : "bg-blush text-brand"}`}>{msg.text}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>

      <section className="rounded-2xl border border-sand bg-white p-5 text-sm">
        <h2 className="font-semibold">Event yang dikirim otomatis</h2>
        <table className="mt-3 w-full text-left text-xs">
          <thead className="text-ink/50"><tr><th className="py-1">Aksi pengunjung</th><th>Meta</th><th>TikTok</th><th>GA4</th></tr></thead>
          <tbody className="[&_td]:border-t [&_td]:border-sand [&_td]:py-1.5">
            <tr><td>Buka halaman / pindah halaman</td><td>PageView</td><td>page</td><td>page_view</td></tr>
            <tr><td>Lihat produk</td><td>ViewContent</td><td>ViewContent</td><td>view_item</td></tr>
            <tr><td>Tambah ke keranjang</td><td>AddToCart</td><td>AddToCart</td><td>add_to_cart</td></tr>
            <tr><td>Kirim pesanan ke WhatsApp</td><td>InitiateCheckout + Lead</td><td>InitiateCheckout + SubmitForm</td><td>begin_checkout + generate_lead</td></tr>
            <tr><td>Klik “Beli di Shopee”</td><td>ShopeeClick (custom)</td><td>ClickButton</td><td>click_shopee</td></tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-ink/50">Pesanan WhatsApp dihitung sebagai <em>Lead</em>, bukan Purchase, karena pembayaran terjadi di luar situs. Pembelian di Shopee tidak bisa dilacak dari sini.</p>
      </section>
    </form>
  );
}
