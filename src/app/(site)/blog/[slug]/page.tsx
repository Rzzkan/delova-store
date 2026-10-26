import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { ProductGrid } from "@/components/ProductCard";
import { PostCard, fmtDate } from "@/components/PostCard";
import { RichContent } from "@/components/RichContent";
import { FaqList } from "@/components/FaqList";
import { categoryLabel } from "@/lib/categories";
import { listProducts } from "@/lib/products";
import { getSeoSettings } from "@/lib/seo-settings";
import { articleLd, breadcrumbLd, faqLd, ldScript } from "@/lib/seo";
import { brandForDoc, getPost, listPosts, mediaAbs, mediaUrl } from "@/lib/cms";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) return { title: "Artikel tidak ditemukan", robots: { index: false } };
  const title = p.seo.metaTitle || p.title;
  const description = (p.seo.metaDescription || p.excerpt).slice(0, 160);
  const img = mediaAbs(p.heroImage);
  return {
    title, description, alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title, description, url: `/blog/${p.slug}`, images: img ? [img] : undefined, publishedTime: p.publishedAt ?? undefined, modifiedTime: p.updatedAt },
  };
}

export default async function PostPage({ params }: P) {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) notFound();
  const brand = brandForDoc(p.brand, p.related.category);
  const [seo, products, more] = await Promise.all([
    getSeoSettings(),
    listProducts({ brand: p.brand !== "semua" ? p.brand : undefined, category: p.related.category, q: p.related.keyword, sort: "terlaris", limit: 4 }),
    listPosts({ brand: p.brand !== "semua" ? p.brand : undefined, limit: 3, exceptSlug: p.slug }),
  ]);
  const img = mediaUrl(p.heroImage, "hero");
  const ld = [
    breadcrumbLd([{ name: "Beranda", url: "/" }, { name: "Blog & Panduan", url: "/blog" }, { name: p.title, url: `/blog/${p.slug}` }]),
    articleLd({ title: p.title, description: p.seo.metaDescription || p.excerpt, url: `/blog/${p.slug}`, image: mediaAbs(p.heroImage), published: p.publishedAt, modified: p.updatedAt, legalName: seo.legalName }),
    ...(p.faq.length ? [faqLd(p.faq)] : []),
  ];
  return (
    <Shell brand={brand}>
      <article className="container-x py-10">
        {ld.map((l, i) => (<script key={i} type="application/ld+json" dangerouslySetInnerHTML={ldScript(l)} />))}
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-xs text-ink/60">
            <Link href="/" className="hover:text-brand">Beranda</Link> / <Link href="/blog" className="hover:text-brand">Blog & Panduan</Link>
          </nav>
          <p className="eyebrow mt-6">{p.type === "panduan" ? "Panduan" : "Blog"}</p>
          <h1 className="mt-2 text-3xl leading-tight md:text-5xl">{p.title}</h1>
          <p className="mt-4 text-lg text-ink/70">{p.excerpt}</p>
          <p className="mt-4 text-xs text-ink/50">
            Oleh tim {seo.legalName} · <time dateTime={p.publishedAt ?? p.updatedAt}>{fmtDate(p.publishedAt ?? p.updatedAt)}</time>
            {p.updatedAt.slice(0, 10) !== (p.publishedAt ?? p.updatedAt).slice(0, 10) && <> · diperbarui {fmtDate(p.updatedAt)}</>}
          </p>
        </div>
        {img && (
          <div className="mx-auto mt-8 max-w-4xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={p.heroImage?.alt ?? p.title} className="aspect-[16/9] w-full rounded-2xl object-cover" />
          </div>
        )}
        <RichContent data={p.content} className="mx-auto mt-10 max-w-3xl" />
        <div className="mx-auto max-w-3xl"><FaqList faq={p.faq} /></div>

        {products.items.length > 0 && (
          <section className="mt-16" aria-label="Produk terkait">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-2xl">Produk Pilihan{p.related.category ? ` — ${categoryLabel(p.related.category)}` : ""}</h2>
              {p.related.category && <Link href={`/koleksi/${p.related.category}`} className="text-sm font-medium text-brand underline underline-offset-4">Lihat koleksi</Link>}
            </div>
            <ProductGrid items={products.items} />
          </section>
        )}
        {more.items.length > 0 && (
          <section className="mt-16" aria-label="Artikel lainnya">
            <h2 className="mb-6 text-2xl">Baca Juga</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{more.items.map((m) => (<PostCard key={m.slug} p={m} />))}</div>
          </section>
        )}
      </article>
    </Shell>
  );
}
