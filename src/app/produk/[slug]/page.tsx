import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { PurchasePanel } from "@/components/PurchasePanel";
import { ProductGrid } from "@/components/ProductCard";
import { categoryLabel } from "@/lib/categories";
import { getProduct, listProducts } from "@/lib/products";
import { timeAgo } from "@/lib/format";
import { productReviews } from "@/lib/reviews";
import { ReviewCard } from "@/components/ReviewCard";
import { BRANDS } from "@/lib/brands";
import { abs, breadcrumbLd, ldScript, productLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
type P = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const r = await getProduct((await params).slug);
  if (!r) return {};
  const p = r.product;
  const title = `${p.name} — ${BRANDS[p.brand].name}`;
  const desc = (p.description.replace(/\s+/g, " ").trim().slice(0, 150) || `${p.name} dari ${BRANDS[p.brand].name}`) + ` Harga mulai Rp${p.price.toLocaleString("id-ID")}. Beli lewat WhatsApp atau Shopee.`;
  return {
    title: { absolute: title.length > 62 ? `${p.name.slice(0, 55)}… | Delova` : title },
    description: desc.slice(0, 160),
    alternates: { canonical: `/produk/${p.slug}` },
    openGraph: { type: "website", title, description: desc.slice(0, 160), url: `/produk/${p.slug}`, images: p.images.slice(0, 1).map((u) => ({ url: abs(u), alt: p.name })) },
    twitter: { card: "summary_large_image", title, images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: P }) {
  const r = await getProduct((await params).slug);
  if (!r) notFound();
  const { product, variants } = r;
  const related = await listProducts({ brand: product.brand, category: product.category, limit: 4, excludeId: product.id, sort: "terlaris" });
  const reviews = await productReviews(product.id, 3);
  const ld = productLd(product);
  const crumbs = breadcrumbLd([
    { name: "Beranda", url: "/" },
    { name: "Produk", url: "/produk" },
    { name: categoryLabel(product.category), url: `/produk?kategori=${product.category}` },
    { name: product.name, url: `/produk/${product.slug}` },
  ]);

  return (
    <Shell brand={product.brand}>
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(ld)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(crumbs)} />
      <nav className="mb-6 text-xs text-ink/50" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand">Beranda</Link> / <Link href="/produk" className="hover:text-brand">Produk</Link> /{" "}
        <Link href={`/produk?kategori=${product.category}`} className="hover:text-brand">{categoryLabel(product.category)}</Link>
      </nav>
      <PurchasePanel product={product} variants={variants} />
      <p className="mt-8 text-xs text-ink/40">Data disinkronkan dari Shopee {timeAgo(product.syncedAt)}.</p>
      {reviews.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold">Ulasan Pembeli</h2>
          <div className="grid gap-4 md:grid-cols-3">{reviews.map((r) => (<ReviewCard key={r.id} r={r} />))}</div>
        </section>
      )}
      {related.items.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold">Mungkin kamu suka</h2>
          <ProductGrid items={related.items} />
        </section>
      )}
    </div>
    </Shell>
  );
}
