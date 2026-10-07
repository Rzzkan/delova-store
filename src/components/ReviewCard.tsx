import Link from "next/link";
import type { Review } from "@/lib/reviews";
import { thumb } from "@/lib/format";

const Stars = ({ n }: { n: number }) => (
  <span className="text-accent-ink" aria-label={`${n} dari 5 bintang`} role="img">{"★".repeat(n)}<span className="text-sand">{"★".repeat(5 - n)}</span></span>
);

const date = (t: number | null) => (t ? new Date(t * 1000).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "");

export function ReviewCard({ r }: { r: Review }) {
  return (
    <figure className="flex h-full flex-col rounded-3xl border border-sand bg-white p-6">
      <div className="flex items-center justify-between text-sm"><Stars n={r.rating} /><span className="text-xs text-ink/40">{date(r.createdAt)}</span></div>
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">“{r.comment}”</blockquote>
      {r.images.length > 0 && (
        <div className="mt-4 flex gap-2">
          {r.images.slice(0, 3).map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={thumb(src)} alt="Foto dari pembeli" loading="lazy" className="h-16 w-16 rounded-xl object-cover" />
          ))}
        </div>
      )}
      {r.reply && (
        <p className="mt-4 rounded-xl bg-cream p-3 text-xs leading-relaxed text-ink/70"><span className="font-medium text-brand">Balasan Delova:</span> {r.reply}</p>
      )}
      <figcaption className="mt-4 flex items-center justify-between gap-3 border-t border-sand pt-3 text-xs text-ink/60">
        <span>{r.buyer}{r.source === "shopee" && <span className="ml-2 rounded-full bg-[#EE4D2D]/10 px-2 py-0.5 text-[10px] text-[#EE4D2D]">Ulasan Shopee</span>}</span>
        {r.productSlug && r.productName && <Link href={`/produk/${r.productSlug}`} className="line-clamp-1 max-w-[50%] text-right hover:text-brand">{r.productName}</Link>}
      </figcaption>
    </figure>
  );
}
