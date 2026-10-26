import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { PostCard } from "@/components/PostCard";
import { isBrand } from "@/lib/brands";
import { breadcrumbLd, ldScript } from "@/lib/seo";
import { listPosts } from "@/lib/cms";

export const dynamic = "force-dynamic";
type SP = Promise<{ [k: string]: string | string[] | undefined }>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const LIMIT = 12;
const TYPES = [["", "Semua"], ["panduan", "Panduan"], ["blog", "Blog"]] as const;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = !!(one(sp.jenis) || one(sp.brand) || Number(one(sp.hal)) > 1);
  return {
    title: { absolute: "Blog & Panduan Fashion Muslimah — Kebaya, Batik, Hijab | Delova" },
    description: "Panduan memilih kebaya, batik, hijab, dan busana anak, plus inspirasi padu padan dari tim Delova.",
    alternates: { canonical: "/blog" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogIndex({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const jenis = one(sp.jenis) === "panduan" || one(sp.jenis) === "blog" ? one(sp.jenis)! : "";
  const b = one(sp.brand);
  const brand = isBrand(b) ? b : undefined;
  const page = Math.max(1, Number(one(sp.hal)) || 1);
  const { items, total } = await listPosts({ type: jenis, brand, page, limit: LIMIT });
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const href = (o: { jenis?: string; hal?: number }) => {
    const p = new URLSearchParams();
    const m = { jenis, brand, ...o };
    for (const [k, v] of Object.entries(m)) if (v) p.set(k, String(v));
    return p.toString() ? `/blog?${p}` : "/blog";
  };
  return (
    <Shell brand={brand ?? "wardrobe"}>
      <div className="container-x py-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(breadcrumbLd([{ name: "Beranda", url: "/" }, { name: "Blog & Panduan", url: "/blog" }]))} />
        <p className="eyebrow">Delova Journal</p>
        <h1 className="mt-2 text-4xl font-semibold">Blog & Panduan</h1>
        <p className="mt-2 max-w-2xl text-ink/65">Cara memilih bahan, ukuran, dan padu padan kebaya, batik, hijab, serta busana anak.</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {TYPES.map(([v, l]) => (<li key={v}><Link href={href({ jenis: v, hal: undefined })} className={`chip ${jenis === v ? "chip-on" : ""}`}>{l}</Link></li>))}
        </ul>
        {items.length ? (
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{items.map((p) => (<PostCard key={p.slug} p={p} />))}</div>
        ) : (
          <p className="mt-10 text-sm text-ink/60">Belum ada artikel{jenis ? " untuk jenis ini" : ""}.</p>
        )}
        {pages > 1 && (
          <nav aria-label="Halaman" className="mt-10 flex items-center justify-center gap-3 text-sm">
            {page > 1 && <Link className="btn-outline !py-2" href={href({ hal: page - 1 })} rel="prev">← Sebelumnya</Link>}
            <span className="text-ink/60">Halaman {page} dari {pages}</span>
            {page < pages && <Link className="btn-outline !py-2" href={href({ hal: page + 1 })} rel="next">Berikutnya →</Link>}
          </nav>
        )}
      </div>
    </Shell>
  );
}
