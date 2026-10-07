import Link from "next/link";
import type { Product } from "@/lib/products";
import { compact, discountPct, idr, thumb } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";

export function ProductCard({ p }: { p: Product }) {
  const pct = discountPct(p.price, p.originalPrice);
  const soldOut = p.stock <= 0;
  const [a, b] = p.images;
  return (
    <Link href={`/produk/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
        {a && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb(a)} alt={p.name} loading="lazy" className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${b ? "group-hover:opacity-0" : "group-hover:scale-105"} ${soldOut ? "grayscale" : ""}`} />
        )}
        {b && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb(b)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />
        )}
        {pct > 0 && !soldOut && <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-cream">-{pct}%</span>}
        {soldOut && <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-2 text-center text-xs tracking-widest text-cream">STOK HABIS</span>}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-[11px] uppercase tracking-[.2em] text-accent-ink">{categoryLabel(p.category)}</p>
        <h3 className="line-clamp-2 font-sans text-sm leading-snug text-ink group-hover:text-brand">{p.name}</h3>
        <p className="flex items-baseline gap-2">
          <span className="font-medium text-brand">{idr(p.price)}</span>
          {p.originalPrice && p.originalPrice > p.price && <span className="text-xs text-ink/40 line-through">{idr(p.originalPrice)}</span>}
        </p>
        {p.sold > 0 && <p className="text-xs text-ink/50">{p.rating ? `★ ${p.rating.toFixed(1)} · ` : ""}{compact(p.sold)} terjual</p>}
      </div>
    </Link>
  );
}

export function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (<ProductCard key={p.id} p={p} />))}
    </div>
  );
}
