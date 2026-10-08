import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/products";
import { CATEGORIES } from "@/lib/categories";
import { BRAND_SLUGS } from "@/lib/brands";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();
  const { items } = await listProducts({ limit: 5000 });
  const now = new Date();
  return [
    { url: site, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${site}/produk`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...BRAND_SLUGS.filter((b) => b !== "wardrobe").map((b) => ({ url: `${site}/${b}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    { url: `${site}/toko-offline`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...BRAND_SLUGS.map((b) => ({ url: `${site}/produk?brand=${b}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...CATEGORIES.map((c) => ({ url: `${site}/produk?kategori=${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...items.map((p) => ({ url: `${site}/produk/${p.slug}`, lastModified: new Date(p.syncedAt * 1000), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
