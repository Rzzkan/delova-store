import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { listProducts, listShops } from "@/lib/products";

export const dynamic = "force-dynamic";
type SP = Promise<{ [k: string]: string | string[] | undefined }>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const LIMIT = 24;
const SORTS = [["terbaru", "Terbaru"], ["terlaris", "Terlaris"], ["termurah", "Harga Terendah"], ["termahal", "Harga Tertinggi"]];

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const k = one((await searchParams).kategori);
  return { title: k ? categoryLabel(k) : "Semua Produk" };
}

export default async function Catalog({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const kategori = one(sp.kategori);
  const q = one(sp.q)?.trim();
  const urut = one(sp.urut) ?? "terbaru";
  const toko = Number(one(sp.toko)) || undefined;
  const page = Math.max(1, Number(one(sp.hal)) || 1);

  const [{ items, total }, shops] = await Promise.all([
    listProducts({ category: kategori, q, sort: urut, shop: toko, page, limit: LIMIT }),
    listShops(),
  ]);
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const href = (o: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { kategori, q, urut, toko, hal: undefined as number | undefined, ...o };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "") p.set(k, String(v));
    const s = p.toString();
    return s ? `/produk?${s}` : "/produk";
  };

  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <p className="eyebrow">Katalog</p>
        <h1 className="mt-2 text-5xl font-semibold">{q ? `Hasil “${q}”` : kategori ? categoryLabel(kategori) : "Semua Produk"}</h1>
        <p className="mt-2 text-sm text-ink/60">{total} produk</p>
      </div>

      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link href={href({ kategori: undefined })} className={`chip ${!kategori ? "chip-on" : ""}`}>Semua</Link>
          {CATEGORIES.map((c) => (<Link key={c.slug} href={href({ kategori: c.slug })} className={`chip ${kategori === c.slug ? "chip-on" : ""}`}>{c.label}</Link>))}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2"><span className="text-ink/50">Urutkan:</span>
            {SORTS.map(([v, l]) => (<Link key={v} href={href({ urut: v })} className={`chip !py-1 ${urut === v ? "chip-on" : ""}`}>{l}</Link>))}
          </div>
          {shops.length > 1 && (
            <div className="flex flex-wrap items-center gap-2"><span className="text-ink/50">Toko:</span>
              <Link href={href({ toko: undefined })} className={`chip !py-1 ${!toko ? "chip-on" : ""}`}>Semua</Link>
              {shops.map((s) => (<Link key={s.shopId} href={href({ toko: s.shopId })} className={`chip !py-1 ${toko === s.shopId ? "chip-on" : ""}`}>{s.name}</Link>))}
            </div>
          )}
        </div>
      </div>

      {items.length ? <ProductGrid items={items} /> : (
        <div className="py-24 text-center"><p className="font-display text-3xl">Belum ada produk yang cocok</p><Link href="/produk" className="btn-outline mt-6">Reset filter</Link></div>
      )}

      {pages > 1 && (
        <nav className="mt-12 flex justify-center gap-2" aria-label="Halaman">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={href({ hal: n })} className={`chip !px-4 ${n === page ? "chip-on" : ""}`} aria-current={n === page ? "page" : undefined}>{n}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
