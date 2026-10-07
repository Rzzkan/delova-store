"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { discountPct, idr, thumb } from "@/lib/format";
import { track } from "@/lib/track";
import type { Product, Variant } from "@/lib/products";

export function PurchasePanel({ product, variants }: { product: Product; variants: Variant[] }) {
  const { add } = useCart();
  const [vid, setVid] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [gallery, setGallery] = useState(0);

  const variant = variants.find((v) => v.id === vid);
  const price = variant?.price ?? product.price;
  const original = variant ? variant.originalPrice : product.originalPrice;
  const stock = variant ? variant.stock : variants.length ? 0 : product.stock;
  const pct = discountPct(price, original);
  const needVariant = variants.length > 0 && !variant;

  useEffect(() => {
    track("ViewContent", { content_ids: [product.id], content_name: product.name, value: product.price });
  }, [product.id, product.name, product.price]);

  const images = useMemo(() => {
    const list = [...product.images];
    if (variant?.image) list.unshift(variant.image);
    return list;
  }, [product.images, variant?.image]);

  function addToCart() {
    if (needVariant || stock <= 0) return;
    add({
      productId: product.id, variantId: variant?.id, slug: product.slug, name: product.name,
      variantName: variant?.name, image: product.images[0] ?? "", price, qty, stock, shopeeUrl: product.shopeeUrl,
    });
    track("AddToCart", { content_ids: [product.id], content_name: product.name, value: price * qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-sand">
          {images[gallery] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[gallery]} alt={product.name} className="h-full w-full object-cover" />
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button key={src + i} onClick={() => setGallery(i)} aria-label={`Foto ${i + 1}`}
                className={`h-20 w-16 flex-none overflow-hidden rounded-xl border-2 ${i === gallery ? "border-brand" : "border-transparent"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb(src)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lg:py-4">
        <h1 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">{product.name}</h1>
        <p className="mt-3 text-sm text-ink/60">
          {product.rating ? `★ ${product.rating.toFixed(1)} · ` : ""}{product.sold.toLocaleString("id-ID")} terjual
        </p>

        <div className="mt-6 flex items-baseline gap-3">
          <span className="font-display text-3xl font-semibold text-brand">{idr(price)}</span>
          {original && original > price && <span className="text-ink/40 line-through">{idr(original)}</span>}
          {pct > 0 && <span className="rounded-full bg-blush px-2.5 py-0.5 text-xs font-medium text-brand">Hemat {pct}%</span>}
        </div>

        {variants.length > 0 && (
          <fieldset className="mt-8">
            <legend className="text-sm font-medium">Pilih varian {variant && <span className="font-normal text-ink/60">— {variant.name}</span>}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {variants.map((v) => (
                <button key={v.id} type="button" disabled={v.stock <= 0} onClick={() => { setVid(v.id); setQty(1); }}
                  aria-pressed={v.id === vid}
                  className={`rounded-xl border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:text-ink/30 disabled:line-through ${v.id === vid ? "border-brand bg-brand text-cream" : "border-sand bg-white hover:border-brand"}`}>
                  {v.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center rounded-full border border-sand bg-white">
            <button type="button" className="h-10 w-10 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurangi">−</button>
            <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
            <button type="button" className="h-10 w-10 text-lg" onClick={() => setQty((q) => Math.min(Math.max(stock, 1), q + 1))} aria-label="Tambah">+</button>
          </div>
          <p className={`text-sm ${stock <= 0 && !needVariant ? "text-brand" : "text-ink/60"}`}>
            {needVariant ? "Pilih varian untuk melihat stok" : stock <= 0 ? "Stok habis" : stock <= 5 ? `Sisa ${stock} — segera checkout` : `Stok tersedia (${stock})`}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button className="btn-primary" disabled={needVariant || stock <= 0} onClick={addToCart}>
            {added ? "✓ Masuk keranjang" : needVariant ? "Pilih varian dulu" : "Tambah ke Keranjang"}
          </button>
          <a className="btn-shopee" href={product.shopeeUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => track("Contact", { content_name: "shopee_click", content_ids: [product.id] })}>
            Beli di Shopee
          </a>
        </div>
        {added && <p className="mt-3 text-sm text-sage">Berhasil ditambahkan. <Link href="/keranjang" className="underline">Lihat keranjang →</Link></p>}

        <ul className="mt-8 grid gap-2 text-sm text-ink/70">
          <li>✦ Stok & harga mengikuti toko Shopee resmi Delova</li>
          <li>✦ Checkout via WhatsApp admin atau langsung lewat Shopee (garansi & gratis ongkir Shopee)</li>
        </ul>

        {product.description && (
          <div className="mt-10 border-t border-sand pt-8">
            <h2 className="text-xl font-semibold">Detail Produk</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/75">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
