"use client";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";

export type AdminProduct = {
  id: string; shopId: number; name: string; price: number; stock: number; sold: number;
  category: string; hidden: boolean; featured: boolean;
};
export type AdminShop = { shopId: number; name: string; dot: string };

type Key = "name" | "category" | "price" | "stock" | "sold" | "featured" | "hidden";
const COLS: { key: Key; label: string }[] = [
  { key: "name", label: "Produk" }, { key: "price", label: "Harga" }, { key: "stock", label: "Stok" },
  { key: "sold", label: "Terjual" }, { key: "category", label: "Kategori" },
  { key: "featured", label: "Unggulan" }, { key: "hidden", label: "Sembunyi" },
];
const PER = 25;

export function AdminProducts({ shops, products }: { shops: AdminShop[]; products: AdminProduct[] }) {
  const [rows, setRows] = useState(products);
  const [shop, setShop] = useState(shops.find((s) => products.some((p) => p.shopId === s.shopId))?.shopId ?? shops[0]?.shopId);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [flag, setFlag] = useState("");
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of rows) m.set(p.shopId, (m.get(p.shopId) ?? 0) + 1);
    return m;
  }, [rows]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = rows.filter((p) =>
      p.shopId === shop &&
      (!term || p.name.toLowerCase().includes(term)) &&
      (!cat || p.category === cat) &&
      (!flag || (flag === "habis" ? p.stock <= 0 : flag === "unggulan" ? p.featured : flag === "sembunyi" ? p.hidden : !p.hidden)));
    const { key, dir } = sort;
    out.sort((a, b) => {
      const x = a[key], y = b[key];
      const c = typeof x === "string" ? x.localeCompare(y as string, "id") : Number(x) - Number(y as number);
      return c * dir || a.name.localeCompare(b.name, "id");
    });
    return out;
  }, [rows, shop, q, cat, flag, sort]);

  const pages = Math.max(1, Math.ceil(list.length / PER));
  const cur = Math.min(page, pages);
  const view = list.slice((cur - 1) * PER, cur * PER);
  const reset = () => setPage(1);

  async function save(id: string, patch: Partial<AdminProduct>, body: Record<string, unknown>) {
    const prev = rows;
    setRows((r) => r.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const r = await fetch("/api/admin/product", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    if (!r.ok) setRows(prev);
  }
  const sel = "rounded-lg border border-sand bg-white px-3 py-2 text-sm";

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Pilih toko">
        {shops.map((s) => (
          <button key={s.shopId} role="tab" aria-selected={shop === s.shopId} onClick={() => { setShop(s.shopId); setCat(""); setFlag(""); reset(); }}
            className={`chip flex items-center gap-2 ${shop === s.shopId ? "chip-on" : ""}`}>
            <span className="h-2 w-2 rounded-full" style={{ background: s.dot }} aria-hidden />{s.name} <span className="opacity-60">{counts.get(s.shopId) ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="Cari nama produk…" aria-label="Cari produk" className={`${sel} min-w-[16rem] flex-1`} />
        <select className={sel} value={cat} onChange={(e) => { setCat(e.target.value); reset(); }} aria-label="Filter kategori">
          <option value="">Semua kategori</option>
          {CATEGORIES.map((c) => (<option key={c.slug} value={c.slug}>{c.label}</option>))}
          <option value="lainnya">Lainnya</option>
        </select>
        <select className={sel} value={flag} onChange={(e) => { setFlag(e.target.value); reset(); }} aria-label="Filter status">
          <option value="">Semua status</option><option value="tampil">Tampil</option><option value="sembunyi">Disembunyikan</option>
          <option value="unggulan">Unggulan</option><option value="habis">Stok habis</option>
        </select>
        <span className="text-xs text-ink/50">{list.length} produk</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-xs uppercase tracking-wider text-ink/50">
            <tr>{COLS.map((c) => (
              <th key={c.key} className="py-2 pr-3" aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                <button onClick={() => { setSort((s) => ({ key: c.key, dir: s.key === c.key ? (s.dir === 1 ? -1 : 1) : 1 })); reset(); }} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-ink">
                  {c.label}<span aria-hidden>{sort.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : "↕"}</span>
                </button>
              </th>))}
            </tr>
          </thead>
          <tbody>
            {view.map((p) => (
              <tr key={p.id} className="border-t border-sand align-middle text-sm">
                <td className="max-w-xs py-2 pr-3"><span className="line-clamp-2">{p.name}</span></td>
                <td className="pr-3 whitespace-nowrap">Rp{p.price.toLocaleString("id-ID")}</td>
                <td className={`pr-3 ${p.stock <= 0 ? "text-brand" : ""}`}>{p.stock}</td>
                <td className="pr-3">{p.sold}</td>
                <td className="pr-3">
                  <select className="rounded-lg border border-sand bg-white px-2 py-1" value={p.category} onChange={(e) => save(p.id, { category: e.target.value }, { category_override: e.target.value })} aria-label="Kategori">
                    {CATEGORIES.map((c) => (<option key={c.slug} value={c.slug}>{c.label}</option>))}
                    <option value="lainnya">Lainnya</option>
                  </select>
                </td>
                <td className="pr-3"><input type="checkbox" checked={p.featured} onChange={(e) => save(p.id, { featured: e.target.checked }, { featured: e.target.checked })} aria-label="Unggulan" /></td>
                <td><input type="checkbox" checked={p.hidden} onChange={(e) => save(p.id, { hidden: e.target.checked }, { hidden: e.target.checked })} aria-label="Sembunyikan" /></td>
              </tr>
            ))}
            {!view.length && <tr><td colSpan={7} className="py-8 text-center text-sm text-ink/50">Tidak ada produk yang cocok.</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button className="chip" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>← Sebelumnya</button>
          <span className="text-ink/60">Hal {cur} / {pages}</span>
          <button className="chip" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Berikutnya →</button>
        </div>
      )}
    </div>
  );
}
