"use client";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { BRANDS, BRAND_SLUGS } from "@/lib/brands";
import type { HomeSettings } from "@/lib/settings";
import { ImageField } from "./ImageField";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label className="block space-y-1"><span className="text-sm font-medium">{label}</span>{children}</label>);

export function HomeEditor({ initial }: { initial: HomeSettings }) {
  const [s, setS] = useState<HomeSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const hero = (k: keyof HomeSettings["hero"], v: string) => setS((p) => ({ ...p, hero: { ...p.hero, [k]: v } }));
  const story = (k: keyof HomeSettings["story"], v: string) => setS((p) => ({ ...p, story: { ...p.story, [k]: v } }));

  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/home", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setS(d.settings); setMsg("Tersimpan ✓ — buka beranda untuk melihat hasilnya."); } else setMsg(d.error || "Gagal menyimpan");
    setBusy(false);
  }

  return (
    <div className="space-y-12">
      <section className="space-y-4"><h2 className="text-2xl font-semibold">Hero (bagian paling atas)</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Field label="Teks kecil di atas judul"><input className="input" value={s.hero.eyebrow} onChange={(e) => hero("eyebrow", e.target.value)} /></Field>
            <Field label="Judul (kata di antara *tanda bintang* dicetak emas)"><textarea className="input" rows={2} value={s.hero.title} onChange={(e) => hero("title", e.target.value)} /></Field>
            <Field label="Deskripsi"><textarea className="input" rows={3} value={s.hero.subtitle} onChange={(e) => hero("subtitle", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tombol 1 — teks"><input className="input" value={s.hero.cta1Label} onChange={(e) => hero("cta1Label", e.target.value)} /></Field>
              <Field label="Tombol 1 — tujuan"><input className="input" value={s.hero.cta1Href} onChange={(e) => hero("cta1Href", e.target.value)} /></Field>
              <Field label="Tombol 2 — teks (kosong = sembunyi)"><input className="input" value={s.hero.cta2Label} onChange={(e) => hero("cta2Label", e.target.value)} /></Field>
              <Field label="Tombol 2 — tujuan"><input className="input" value={s.hero.cta2Href} onChange={(e) => hero("cta2Href", e.target.value)} /></Field>
            </div>
          </div>
          <ImageField label="Foto hero" hint="Rasio ideal 4:5 (potret). Kosong = otomatis pakai foto produk unggulan." value={s.hero.image} onChange={(v) => hero("image", v)} />
        </div>
      </section>

      <section className="space-y-4"><h2 className="text-2xl font-semibold">Foto Kategori</h2>
        <p className="text-sm text-ink/60">Kosong = otomatis memakai foto produk terlaris di kategori itu. Rasio ideal 3:4.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.filter((c) => BRANDS.wardrobe.categories.includes(c.slug)).map((c) => (
            <ImageField key={c.slug} label={c.label} value={s.categoryImages[c.slug] ?? ""} onChange={(v) => setS((p) => ({ ...p, categoryImages: { ...p.categoryImages, [c.slug]: v } }))} />
          ))}
        </div>
      </section>

      <section className="space-y-4"><h2 className="text-2xl font-semibold">Banner Cerita Brand</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Field label="Judul"><textarea className="input" rows={2} value={s.story.title} onChange={(e) => story("title", e.target.value)} /></Field>
            <Field label="Isi (satu baris = satu paragraf)"><textarea className="input" rows={5} value={s.story.body} onChange={(e) => story("body", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tombol — teks"><input className="input" value={s.story.ctaLabel} onChange={(e) => story("ctaLabel", e.target.value)} /></Field>
              <Field label="Tombol — tujuan"><input className="input" value={s.story.ctaHref} onChange={(e) => story("ctaHref", e.target.value)} /></Field>
            </div>
          </div>
          <ImageField label="Foto banner (opsional)" hint="Rasio ideal 16:10 (lanskap)." value={s.story.image} onChange={(v) => story("image", v)} />
        </div>
      </section>

      <section className="space-y-6"><h2 className="text-2xl font-semibold">Logo, Foto & Link Toko per Brand</h2>
        <p className="text-sm text-ink/60">Unggah logo tiap toko (PNG dengan latar transparan paling bagus, lebar ≥ 400px). Logo menggantikan wordmark bawaan di header, footer, dan kartu brand. Kosongkan untuk kembali ke bawaan.</p>
        {BRAND_SLUGS.map((b) => (
          <div key={b} className="rounded-3xl border border-sand bg-white p-5">
            <h3 className="mb-4 text-xl">{BRANDS[b].name}</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <ImageField label="Logo" hint="PNG transparan." value={s.logos[b] ?? ""} onChange={(v) => setS((p) => ({ ...p, logos: { ...p.logos, [b]: v } }))} />
              {b !== "wardrobe" && (
                <ImageField label="Foto hero halaman brand" hint="Kosong = otomatis foto produk." value={s.brandHeroes[b] ?? ""} onChange={(v) => setS((p) => ({ ...p, brandHeroes: { ...p.brandHeroes, [b]: v } }))} />
              )}
              <Field label="Link toko Shopee"><input className="input" placeholder={BRANDS[b].shopeeUrl} value={s.shopeeUrls[b] ?? ""} onChange={(e) => setS((p) => ({ ...p, shopeeUrls: { ...p.shopeeUrls, [b]: e.target.value } }))} /></Field>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4"><h2 className="text-2xl font-semibold">Bar Pengumuman & Judul Ulasan</h2>
        <Field label="Pengumuman berjalan Wardrobe (satu baris = satu pesan, maks 8)"><textarea className="input" rows={4} value={s.announcements.join("\n")} onChange={(e) => setS((p) => ({ ...p, announcements: e.target.value.split("\n") }))} /></Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Judul bagian ulasan"><input className="input" value={s.reviews.title} onChange={(e) => setS((p) => ({ ...p, reviews: { ...p.reviews, title: e.target.value } }))} /></Field>
          <Field label="Sub-judul"><input className="input" value={s.reviews.subtitle} onChange={(e) => setS((p) => ({ ...p, reviews: { ...p.reviews, subtitle: e.target.value } }))} /></Field>
        </div>
      </section>

      <div className="sticky bottom-4 flex items-center gap-4 rounded-full border border-sand bg-white/95 p-3 pl-6 shadow-xl backdrop-blur">
        <button className="btn-primary" onClick={save} disabled={busy}>{busy ? "Menyimpan…" : "Simpan perubahan"}</button>
        <span className="text-sm text-ink/60" role="status">{msg}</span>
      </div>
    </div>
  );
}
