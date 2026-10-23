"use client";
import { useState } from "react";
import type { SeoSettings } from "@/lib/seo-settings";
import { ImageField } from "./ImageField";

const MODES: [SeoSettings["robotsMode"], string, string][] = [
  ["auto", "Otomatis (disarankan)", "Semua halaman toko boleh diindeks; admin, API, keranjang, checkout, dan pesanan ditutup. Sitemap ditambahkan otomatis."],
  ["custom", "Tulis sendiri", "Isi robots.txt penuh dari kolom di bawah. Hati-hati: salah aturan bisa menghilangkan situs dari Google."],
  ["block", "Tutup total (mode uji coba)", "Melarang semua mesin pencari dan menandai halaman noindex. Pakai hanya saat situs belum diluncurkan."],
];

export function SeoEditor({ initial }: { initial: SeoSettings }) {
  const [s, setS] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof SeoSettings>(k: K, v: SeoSettings[K]) => setS((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setS(d.settings);
    setMsg(r.ok ? { ok: true, text: "Tersimpan. Favicon di tab browser bisa butuh beberapa menit / refresh keras untuk berubah." } : { ok: false, text: d.error || "Gagal menyimpan" });
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Favicon</h2>
        <ImageField label="Ikon situs" hint="Gambar persegi (1:1), minimal 192×192 — ideal 512×512 PNG/WebP. Muncul di tab browser, hasil pencarian Google, dan layar utama ponsel. Kosong = ikon “D” bawaan." value={s.favicon} onChange={(v) => set("favicon", v)} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Robots.txt</h2>
        <p className="text-xs text-ink/50">Baris <code>Sitemap: …/sitemap.xml</code> selalu otomatis disertakan di semua mode.</p>
        <div className="space-y-2" role="radiogroup" aria-label="Mode robots.txt">
          {MODES.map(([v, label, help]) => (
            <label key={v} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${s.robotsMode === v ? "border-brand bg-blush/40" : "border-sand bg-white"}`}>
              <input type="radio" name="mode" checked={s.robotsMode === v} onChange={() => set("robotsMode", v)} className="mt-1" />
              <span><strong>{label}</strong><span className="block text-xs text-ink/60">{help}</span></span>
            </label>
          ))}
        </div>

        {s.robotsMode === "auto" && (
          <>
            <div>
              <label htmlFor="extra" className="mb-1 block text-sm font-medium">Path tambahan yang ditutup (opsional)</label>
              <textarea id="extra" rows={4} className="input font-mono text-xs" placeholder={"/produk?urut=\n/produk?q="} value={s.extraDisallow} onChange={(e) => set("extraDisallow", e.target.value)} />
              <p className="mt-1 text-xs text-ink/50">Satu path per baris, harus diawali “/”. Bawaan yang sudah ditutup: /admin, /api, /keranjang, /checkout, /pesanan.</p>
            </div>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={s.blockAi} onChange={(e) => set("blockAi", e.target.checked)} />
              <span>Tolak bot pelatih AI (GPTBot, CCBot, ClaudeBot, Google-Extended, dll.)<span className="block text-xs text-ink/50">Tidak memengaruhi peringkat Google biasa.</span></span></label>
          </>
        )}

        {s.robotsMode === "custom" && (
          <div>
            <label htmlFor="custom" className="mb-1 block text-sm font-medium">Isi robots.txt</label>
            <textarea id="custom" rows={10} className="input font-mono text-xs" placeholder={"User-agent: *\nAllow: /\nDisallow: /admin"} value={s.custom} onChange={(e) => set("custom", e.target.value)} />
            <p className="mt-1 text-xs text-ink/50">Baris “Sitemap:” ditambahkan otomatis bila belum ada. Kolom kosong = kembali ke mode otomatis.</p>
          </div>
        )}
        {s.robotsMode === "block" && <p role="alert" className="rounded-xl bg-blush p-3 text-sm text-brand">Peringatan: situs tidak akan muncul di Google selama mode ini aktif.</p>}
      </section>

      {msg && <p role="alert" className={`rounded-xl p-3 text-sm ${msg.ok ? "bg-sage/20" : "bg-blush text-brand"}`}>{msg.text}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
    </form>
  );
}
