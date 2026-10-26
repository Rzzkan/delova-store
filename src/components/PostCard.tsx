import Link from "next/link";
import { mediaUrl, type Post } from "@/lib/cms";

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }) : "";

export function PostCard({ p }: { p: Post }) {
  const img = mediaUrl(p.heroImage, "card");
  return (
    <Link href={`/blog/${p.slug}`} className="group block">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-sand">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={p.heroImage?.alt ?? p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
      </div>
      <p className="eyebrow mt-4">{p.type === "panduan" ? "Panduan" : "Blog"}{p.publishedAt ? ` · ${fmtDate(p.publishedAt)}` : ""}</p>
      <h3 className="mt-1.5 text-lg leading-snug group-hover:text-brand">{p.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-ink/65">{p.excerpt}</p>
    </Link>
  );
}
