import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/products";
import { CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const { items } = await listProducts({ limit: 1000 });
  return [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/produk`, changeFrequency: "daily", priority: 0.9 },
    ...CATEGORIES.map((c) => ({ url: `${site}/produk?kategori=${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...items.map((p) => ({ url: `${site}/produk/${p.slug}`, lastModified: new Date(p.syncedAt * 1000), changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
