import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductCard";
import { Shell } from "@/components/Shell";
import { RichContent } from "@/components/RichContent";
import { FaqList } from "@/components/FaqList";
import { BRANDS } from "@/lib/brands";
import { CATEGORIES } from "@/lib/categories";
import { listProducts } from "@/lib/products";
import { CATEGORY_SEO, breadcrumbLd, faqLd, itemListLd, ldScript } from "@/lib/seo";
import { brandForDoc, getKoleksi, listKoleksi, mediaAbs, mediaUrl, type Koleksi } from "@/lib/cms";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

/** Halaman dari CMS; bila belum ada, kategori bawaan tetap punya halaman bersih dengan teks standar. */
async function resolve(slug: string): Promise<Koleksi | null> {
  const doc = await getKoleksi(slug);
  if (doc) return doc;
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return null;
  const s = CATEGORY_SEO[slug];
  return { id: slug, title: s?.h1 ?? cat.label, slug, brand: "semua", category: slug, sort: "terlaris", summary: s?.copy ?? cat.blurb, heroImage: null, intro: null, bottom: null, faq: [], updatedAt: new Date().toISOString(), seo: {} };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const k = await resolve(slug);
  if (!k) return { title: "Koleksi tidak ditemukan", robots: { index: false } };
  const bn = k.brand !== "semua" ? BRANDS[k.brand].name : "Delova";
  const title = k.seo.metaTitle || `${k.title} — ${bn}`;
  const description = (k.seo.metaDescription || k.summary || `Belanja ${k.title} di ${bn}. Stok & harga tersinkron dengan toko resmi Shopee.`).slice(0, 160);
  const img = mediaAbs(k.heroImage);
  return {
    title: { absolute: title }, description, alternates: { canonical: `/koleksi/${k.slug}` },
    openGraph: { title, description, url: `/koleksi/${k.slug}`, images: img ? [img] : undefined },
  };
}

export default async function KoleksiPage({ params }: P) {
  const { slug } = await params;
  const k = await resolve(slug);
  if (!k) notFound();
  const brand = k.brand !== "semua" ? k.brand : undefined;
  const [{ items, total }, others] = await Promise.all([
    listProducts({ brand, category: k.category, q: k.keyword, sort: k.sort, limit: 24 }),
    listKoleksi(),
  ]);
  const more = others.filter((o) => o.slug !== k.slug).slice(0, 8);
  const catalog = `/produk?${new URLSearchParams({ ...(brand ? { brand } : {}), ...(k.category ? { kategori: k.category } : {}), ...(k.keyword ? { q: k.keyword } : {}) })}`;
  const img = mediaUrl(k.heroImage, "hero");
  const ld = [
    breadcrumbLd([{ name: "Beranda", url: "/" }, { name: "Koleksi", url: "/koleksi" }, { name: k.title, url: `/koleksi/${k.slug}` }]),
    itemListLd(k.title, items.map((p) => ({ name: p.name, url: `/produk/${p.slug}` }))),
    ...(k.faq.length ? [faqLd(k.faq)] : []),
  ];

  return (
    <Shell brand={brandForDoc(k.brand, k.category)}>
      <div className="container-x py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-ink/60">
          <Link href="/" className="hover:text-brand">Beranda</Link> / <Link href="/koleksi" className="hover:text-brand">Koleksi</Link> / <span className="text-ink">{k.title}</span>
        </nav>
        {ld.map((l, i) => (<script key={i} type="application/ld+json" dangerouslySetInnerHTML={ldScript(l)} />))}

        <div className={`mt-6 grid gap-8 ${img ? "md:grid-cols-[1.2fr_1fr] md:items-center" : ""}`}>
          <div>
            <p className="eyebrow">Koleksi</p>
            <h1 className="mt-2 text-4xl font-semibold md:text-5xl">{k.title}</h1>
            {k.summary && <p className="mt-4 max-w-2xl text-ink/70">{k.summary}</p>}
            <RichContent data={k.intro} className="mt-5 max-w-2xl" />
          </div>
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={k.heroImage?.alt ?? k.title} className="aspect-[4/3] w-full rounded-2xl object-cover" />
          )}
        </div>

        <section className="mt-10" aria-label={`Produk ${k.title}`}>
          <p className="mb-4 text-sm text-ink/60">{total} produk</p>
          {items.length ? <ProductGrid items={items} /> : <p className="text-sm text-ink/60">Produk akan tampil setelah toko Shopee disinkronkan.</p>}
          {total > items.length && <div className="mt-8 text-center"><Link href={catalog} className="btn-outline">Lihat semua {total} produk</Link></div>}
        </section>

        {k.bottom ? <RichContent data={k.bottom} className="mx-auto mt-16 max-w-3xl" /> : null}
        <div className="mx-auto max-w-3xl"><FaqList faq={k.faq} /></div>

        {more.length > 0 && (
          <section className="mt-16" aria-label="Koleksi lainnya">
            <h2 className="text-xl">Koleksi Lainnya</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {more.map((o) => (<li key={o.slug}><Link href={`/koleksi/${o.slug}`} className="chip">{o.title}</Link></li>))}
            </ul>
          </section>
        )}
      </div>
    </Shell>
  );
}
