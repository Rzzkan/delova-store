import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PurchasePanel } from "@/components/PurchasePanel";
import { ProductGrid } from "@/components/ProductCard";
import { categoryLabel } from "@/lib/categories";
import { getProduct, listProducts } from "@/lib/products";
import { timeAgo } from "@/lib/format";
import { productReviews } from "@/lib/reviews";
import { ReviewCard } from "@/components/ReviewCard";

export const dynamic = "force-dynamic";
type P = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const r = await getProduct((await params).slug);
  if (!r) return {};
  return {
    title: r.product.name,
    description: r.product.description.slice(0, 155) || `${r.product.name} — Delova Wardrobe`,
    openGraph: { images: r.product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: P }) {
  const r = await getProduct((await params).slug);
  if (!r) notFound();
  const { product, variants } = r;
  const related = await listProducts({ category: product.category, limit: 4, excludeId: product.id, sort: "terlaris" });
  const reviews = await productReviews(product.id, 3);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    sku: String(product.itemId),
    brand: { "@type": "Brand", name: "Delova" },
    ...(product.rating && product.sold ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: Math.max(1, Math.round(product.sold / 10)) } } : {}),
    offers: {
      "@type": "Offer",
      url: `${site}/produk/${product.slug}`,
      priceCurrency: "IDR",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <nav className="mb-6 text-xs text-ink/50" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-maroon">Beranda</Link> / <Link href="/produk" className="hover:text-maroon">Produk</Link> /{" "}
        <Link href={`/produk?kategori=${product.category}`} className="hover:text-maroon">{categoryLabel(product.category)}</Link>
      </nav>
      <PurchasePanel product={product} variants={variants} />
      <p className="mt-8 text-xs text-ink/40">Data disinkronkan dari Shopee {timeAgo(product.syncedAt)}.</p>
      {reviews.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-3xl font-semibold">Ulasan Pembeli</h2>
          <div className="grid gap-4 md:grid-cols-3">{reviews.map((r) => (<ReviewCard key={r.id} r={r} />))}</div>
        </section>
      )}
      {related.items.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-3xl font-semibold">Mungkin kamu suka</h2>
          <ProductGrid items={related.items} />
        </section>
      )}
    </div>
  );
}
