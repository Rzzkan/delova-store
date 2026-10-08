"use client";
import { useState } from "react";
import type { StoreInfo } from "@/lib/store";
import { ImageField } from "./ImageField";

export function StoreEditor({ initial }: { initial: StoreInfo }) {
  const [s, setS] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof StoreInfo>(k: K, v: StoreInfo[K]) => setS((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/store", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setS(d.settings);
    setMsg(r.ok ? { ok: true, text: "Tersimpan." } : { ok: false, text: d.error || "Gagal menyimpan" });
    setBusy(false);
  }
  const F = ({ id, label, children, help }: { id: string; label: string; children: React.ReactNode; help?: string }) => (
    <div><label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>{children}{help && <p className="mt-1 text-xs text-ink/50">{help}</p>}</div>
  );

  return (
    <form onSubmit={save} className="space-y-5">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.enabled} onChange={(e) => set("enabled", e.target.checked)} /> Tampilkan info toko offline di situs</label>
      <F id="name" label="Nama toko"><input id="name" className="input" value={s.name} onChange={(e) => set("name", e.target.value)} /></F>
      <F id="address" label="Alamat lengkap" help="Isi sama persis dengan di Google Maps (jalan, kelurahan, kecamatan, kota, kode pos)."><textarea id="address" rows={3} className="input" value={s.address} onChange={(e) => set("address", e.target.value)} /></F>
      <F id="phone" label="Telepon / WhatsApp toko" help="Format 08xxxxxxxxxx atau +62…"><input id="phone" className="input" inputMode="tel" value={s.phone} onChange={(e) => set("phone", e.target.value)} /></F>
      <F id="hours" label="Jam buka" help="Satu baris per rentang. Contoh: “Senin–Sabtu: 09.00–20.00”"><textarea id="hours" rows={4} className="input" value={s.hours} onChange={(e) => set("hours", e.target.value)} /></F>
      <F id="mapsUrl" label="Tautan Google Maps" help="Tautan share Google (share.google, maps.app.goo.gl, atau google.com/maps)."><input id="mapsUrl" className="input font-mono" value={s.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} /></F>
      <F id="embedUrl" label="Peta tertanam (opsional)" help="Google Maps → Bagikan → Sematkan peta → salin kode HTML <iframe> dan tempel di sini. Kosong = hanya tombol ke Google Maps."><textarea id="embedUrl" rows={3} className="input font-mono text-xs" value={s.embedUrl} onChange={(e) => set("embedUrl", e.target.value)} /></F>
      <F id="note" label="Kalimat pengantar"><textarea id="note" rows={2} className="input" value={s.note} onChange={(e) => set("note", e.target.value)} /></F>
      <ImageField label="Foto toko" hint="Rasio ideal 16:9 (lanskap)." value={s.image} onChange={(v) => set("image", v)} />
      {msg && <p role="alert" className={`rounded-xl p-3 text-sm ${msg.ok ? "bg-sage/20" : "bg-blush text-brand"}`}>{msg.text}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
    </form>
  );
}
