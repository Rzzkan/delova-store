"use client";
import { useRef, useState } from "react";

/** Pangkas ruang kosong (transparan atau latar polos sewarna sudut gambar) di sekeliling logo. */
function trimCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const { width: w, height: h } = src;
  const ctx = src.getContext("2d")!;
  const d = ctx.getImageData(0, 0, w, h).data;
  const px = (x: number, y: number) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };
  const corner = px(0, 0);
  const solidBg = corner[3] > 200; // latar tidak transparan (mis. JPG putih)
  const empty = (x: number, y: number) => {
    const [r, g, b, a] = px(x, y);
    if (a < 14) return true;
    return solidBg && Math.abs(r - corner[0]) + Math.abs(g - corner[1]) + Math.abs(b - corner[2]) < 36;
  };
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!empty(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return src; // gambar kosong: jangan dipangkas
  const pad = Math.max(2, Math.round(Math.max(x1 - x0, y1 - y0) * 0.03));
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/** Resize + kompres di browser (maks 1600px, WebP) supaya unggahan kecil & cepat. trim = pangkas ruang kosong (untuk logo). */
async function shrink(file: Blob, maxW = 1600, trim = false): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width);
  let c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d", { willReadFrequently: trim })!.drawImage(bmp, 0, 0, c.width, c.height);
  if (trim) c = trimCanvas(c);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Gagal memproses gambar"))), "image/webp", trim ? 0.92 : 0.85));
}

export function ImageField({ label, hint, value, onChange, trim = false }: { label: string; hint?: string; value: string; onChange: (v: string) => void; trim?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(f?: Blob) {
    if (!f) return;
    setErr(""); setBusy(true);
    try {
      const blob = await shrink(f, 1600, trim);
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

  /** Pangkas ulang logo yang sudah terunggah (ruang kosongnya membuat logo tampak kecil). */
  async function retrim() {
    setErr("");
    try {
      const r = await fetch(value);
      if (!r.ok) throw new Error("Gambar tidak bisa dibaca. Unggah ulang filenya.");
      await pick(await r.blob());
    } catch (e) { setErr(e instanceof Error ? e.message : "Gagal memangkas"); }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-start gap-3">
        <div className={`flex-none overflow-hidden rounded-xl border border-sand ${trim ? "h-24 w-36 bg-[conic-gradient(#e9e4e0_25%,#fff_0_50%,#e9e4e0_0_75%,#fff_0)] bg-[length:16px_16px]" : "h-24 w-20 bg-sand"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className={`h-full w-full ${trim ? "object-contain" : "object-cover"}`} /> : <span className="flex h-full items-center justify-center px-1 text-center text-[10px] text-ink/40">otomatis</span>}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-outline !px-4 !py-1.5" onClick={() => input.current?.click()} disabled={busy}>{busy ? "Mengunggah…" : "Unggah gambar"}</button>
            {trim && value && <button type="button" className="btn-outline !px-4 !py-1.5" onClick={retrim} disabled={busy}>Pangkas ruang kosong</button>}
            {value && <button type="button" className="text-xs text-ink/50 underline" onClick={() => onChange("")}>Hapus (pakai otomatis)</button>}
          </div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <input className="input !py-2 text-xs" placeholder="…atau tempel link gambar https://" value={value.startsWith("/api/media/") ? "" : value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} — link gambar`} />
          {hint && <p className="text-xs text-ink/50">{hint}</p>}
          {err && <p role="alert" className="text-xs text-brand">{err}</p>}
        </div>
      </div>
    </div>
  );
}
