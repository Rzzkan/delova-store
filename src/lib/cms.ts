import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { abs } from "./seo";
import { BRAND_SLUGS, BRANDS, isBrand, type BrandSlug } from "./brands";

/** Bentuk data yang dipakai halaman (dipetakan dari koleksi Payload). Gagal baca CMS → daftar kosong, situs tetap jalan. */
export type Media = { url: string; alt: string; width?: number | null; height?: number | null; sizes?: { card?: { url?: string | null }; hero?: { url?: string | null } } };
export type Faq = { q: string; a: string }[];
type Lexical = unknown;

export type Post = {
  id: string | number; title: string; slug: string; type: "blog" | "panduan"; brand: BrandSlug | "semua";
  excerpt: string; heroImage: Media | null; content: Lexical; faq: Faq; publishedAt: string | null; updatedAt: string;
  related: { category?: string; keyword?: string };
  seo: { metaTitle?: string; metaDescription?: string };
};
export type Koleksi = {
  id: string | number; title: string; slug: string; brand: BrandSlug | "semua"; category?: string; keyword?: string; sort: string;
  summary?: string; heroImage: Media | null; intro: Lexical; bottom: Lexical; faq: Faq; updatedAt: string;
  seo: { metaTitle?: string; metaDescription?: string };
};

const media = (m: unknown): Media | null => (m && typeof m === "object" && "url" in m && (m as Media).url ? (m as Media) : null);
const faq = (f: unknown): Faq => (Array.isArray(f) ? f.filter((x) => x?.q && x?.a).map((x) => ({ q: String(x.q), a: String(x.a) })) : []);
const brandOf = (b: unknown): BrandSlug | "semua" => (isBrand(String(b)) ? (b as BrandSlug) : "semua");
const empty = (v: unknown) => (typeof v === "string" ? v || undefined : undefined);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPost = (d: any): Post => ({
  id: d.id, title: d.title, slug: d.slug, type: d.type === "panduan" ? "panduan" : "blog", brand: brandOf(d.brand), excerpt: d.excerpt ?? "",
  heroImage: media(d.heroImage), content: d.content, faq: faq(d.faq), publishedAt: d.publishedAt ?? null, updatedAt: d.updatedAt,
  related: { category: empty(d.related?.category), keyword: empty(d.related?.keyword) },
  seo: { metaTitle: empty(d.seo?.metaTitle), metaDescription: empty(d.seo?.metaDescription) },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toKoleksi = (d: any): Koleksi => ({
  id: d.id, title: d.title, slug: d.slug, brand: brandOf(d.brand), category: empty(d.category), keyword: empty(d.keyword), sort: d.sort ?? "terlaris",
  summary: empty(d.summary), heroImage: media(d.heroImage), intro: d.intro, bottom: d.bottom, faq: faq(d.faq), updatedAt: d.updatedAt,
  seo: { metaTitle: empty(d.seo?.metaTitle), metaDescription: empty(d.seo?.metaDescription) },
});

const published = { _status: { equals: "published" } };

export async function listPosts(o: { type?: string; brand?: string; limit?: number; page?: number; exceptSlug?: string } = {}): Promise<{ items: Post[]; total: number }> {
  try {
    const payload = await getPayload({ config });
    const and: Where[] = [published];
    if (o.type === "blog" || o.type === "panduan") and.push({ type: { equals: o.type } });
    // artikel "Semua toko" tampil di setiap toko
    if (o.brand && isBrand(o.brand)) and.push({ brand: { in: [o.brand, "semua"] } });
    if (o.exceptSlug) and.push({ slug: { not_equals: o.exceptSlug } });
    const r = await payload.find({ collection: "posts", where: { and }, sort: "-publishedAt", limit: o.limit ?? 12, page: o.page ?? 1, depth: 1 });
    return { items: r.docs.map(toPost), total: r.totalDocs };
  } catch (e) {
    console.error("[cms] listPosts gagal", e);
    return { items: [], total: 0 };
  }
}

export async function getPost(slug: string): Promise<Post | null> {
  try {
    const payload = await getPayload({ config });
    const r = await payload.find({ collection: "posts", where: { and: [published, { slug: { equals: slug } }] }, limit: 1, depth: 2 });
    return r.docs[0] ? toPost(r.docs[0]) : null;
  } catch (e) {
    console.error("[cms] getPost gagal", e);
    return null;
  }
}

export async function listKoleksi(): Promise<Koleksi[]> {
  try {
    const payload = await getPayload({ config });
    const r = await payload.find({ collection: "koleksi", where: published, sort: "title", limit: 200, depth: 1 });
    return r.docs.map(toKoleksi);
  } catch (e) {
    console.error("[cms] listKoleksi gagal", e);
    return [];
  }
}

export async function getKoleksi(slug: string): Promise<Koleksi | null> {
  try {
    const payload = await getPayload({ config });
    const r = await payload.find({ collection: "koleksi", where: { and: [published, { slug: { equals: slug } }] }, limit: 1, depth: 2 });
    return r.docs[0] ? toKoleksi(r.docs[0]) : null;
  } catch (e) {
    console.error("[cms] getKoleksi gagal", e);
    return null;
  }
}

export const mediaUrl = (m: Media | null, size: "card" | "hero" = "hero") => (m ? m.sizes?.[size]?.url || m.url : undefined);
export const mediaAbs = (m: Media | null) => (m ? abs(mediaUrl(m, "hero")!) : undefined);

/** Toko yang temanya dipakai untuk sebuah kategori (kebaya → wardrobe, hijab → scarf, dst.). */
export const brandForCategory = (cat?: string): BrandSlug => BRAND_SLUGS.find((b) => cat && BRANDS[b].categories.includes(cat)) ?? "wardrobe";
export const brandForDoc = (brand: BrandSlug | "semua", cat?: string): BrandSlug => (brand !== "semua" ? brand : brandForCategory(cat));
