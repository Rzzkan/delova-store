"use client";
import { useRef, useState } from "react";

/** Resize + kompres di browser (maks 1600px, WebP) supaya unggahan kecil & cepat. */
async function shrink(file: File, maxW = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Gagal memproses gambar"))), "image/webp", 0.85));
}

export function ImageField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(f?: File) {
    if (!f) return;
    setErr(""); setBusy(true);
    try {
      const blob = await shrink(f);
      const fd = new FormData();
      fd.append("file", new File([blob], "img.webp", { type: "image/webp" }));
      const r = await fetch("/api/admin/media", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal unggah");
      onChange(d.url);
    } catch (e) { setErr(e instanceof Error ? e.message : "Gagal unggah"); }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-start gap-3">
        <div className="h-24 w-20 flex-none overflow-hidden rounded-xl border border-sand bg-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center px-1 text-center text-[10px] text-ink/40">otomatis</span>}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-outline !px-4 !py-1.5" onClick={() => input.current?.click()} disabled={busy}>{busy ? "Mengunggah…" : "Unggah gambar"}</button>
            {value && <button type="button" className="text-xs text-ink/50 underline" onClick={() => onChange("")}>Hapus (pakai otomatis)</button>}
          </div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <input className="input !py-2 text-xs" placeholder="…atau tempel link gambar https://" value={value.startsWith("/api/media/") ? "" : value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} — link gambar`} />
          {hint && <p className="text-xs text-ink/50">{hint}</p>}
          {err && <p role="alert" className="text-xs text-maroon">{err}</p>}
        </div>
      </div>
    </div>
  );
}
