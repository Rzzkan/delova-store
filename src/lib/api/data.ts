import { getDb } from "@/lib/db";
import { isBrand, BRAND_SLUGS } from "@/lib/brands";
import { markup } from "@/lib/products";
import { siteUrl } from "@/lib/seo";
import { thumb } from "@/lib/format";
import { ApiError, isoSec } from "./guard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const BASE = `FROM products p LEFT JOIN shops s ON s.shop_id = p.shop_id WHERE p.status = 'NORMAL' AND p.hidden = 0`;

export function int(v: string | null, def: number, min: number, max: number, name: string): number {
  if (v == null || v === "") return def;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new ApiError(400, "invalid_param", `Parameter ${name} harus bilangan bulat ${min}–${max}.`);
  return n;
}

/** Filter bersama untuk /products dan /stock. */
function filters(sp: URLSearchParams) {
  const w: string[] = [];
  const a: (string | number)[] = [];
  const brand = sp.get("brand");
  if (brand) {
    if (!isBrand(brand)) throw new ApiError(400, "invalid_param", `brand harus salah satu: ${BRAND_SLUGS.join(", ")}.`);
    w.push("s.brand = ?"); a.push(brand);
  }
  const cat = sp.get("category");
  if (cat) { w.push("COALESCE(p.category_override, p.category) = ?"); a.push(cat.slice(0, 60)); }
  const shop = sp.get("shop_id");
  if (shop) { w.push("p.shop_id = ?"); a.push(int(shop, 0, 1, Number.MAX_SAFE_INTEGER, "shop_id")); }
  const q = sp.get("q");
  if (q) { w.push("p.name LIKE ? ESCAPE '\\'"); a.push(`%${q.slice(0, 80).replace(/[\\%_]/g, (c) => "\\" + c)}%`); }
  const st = sp.get("in_stock");
  if (st === "1" || st === "true") w.push("p.stock > 0");
  else if (st === "0" || st === "false") w.push("p.stock <= 0");
  else if (st) throw new ApiError(400, "invalid_param", "in_stock harus true/false.");
  return { w, a };
}

const variantOut = (v: Row, pct: number | null) => ({
  id: v.id,
  sku: v.sku ?? null,
  name: v.name,
  price: Number(v.price),
  original_price: pct ? markup(Number(v.price), pct) : v.original_price == null ? null : Number(v.original_price),
  stock: Number(v.stock),
  in_stock: Number(v.stock) > 0,
  image: v.image ?? null,
});

async function variantsOf(ids: string[]): Promise<Map<string, Row[]>> {
  const m = new Map<string, Row[]>();
  if (!ids.length) return m;
  const db = await getDb();
  const r = await db.execute({ sql: `SELECT * FROM variants WHERE product_id IN (${ids.map(() => "?").join(",")}) ORDER BY model_id`, args: ids });
  for (const v of r.rows as Row[]) { const l = m.get(v.product_id) ?? []; l.push(v); m.set(v.product_id, l); }
  return m;
}

const productOut = (p: Row, vars?: Row[]) => {
  const pct = p.discount_pct ? Number(p.discount_pct) : null;
  const price = Number(p.price);
  const base = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: isBrand(p.brand) ? p.brand : "wardrobe",
    shop: { id: Number(p.shop_id), name: p.shop_name ?? null },
    category: p.category_override || p.category,
    price,
    original_price: pct ? markup(price, pct) : p.original_price == null ? null : Number(p.original_price),
    discount_pct: pct,
    stock: Number(p.stock),
    in_stock: Number(p.stock) > 0,
    sold: Number(p.sold ?? 0),
    rating: p.rating == null ? null : Number(p.rating),
    review_count: p.review_count == null ? null : Number(p.review_count),
    image: (JSON.parse(p.images || "[]") as string[])[0] ?? null,
    url: `${siteUrl()}/produk/${p.slug}`,
    shopee_url: p.shopee_url,
    created_at: isoSec(p.shopee_created_at),
    synced_at: isoSec(Number(p.synced_at)),
  };
  if (!vars) return { ...base, variant_count: Number(p.variant_count ?? 0) };
  return { ...base, description: p.description ?? "", images: JSON.parse(p.images || "[]") as string[], variants: vars.map((v) => variantOut(v, pct)) };
};

const ORDER: Record<string, string> = { terbaru: "p.shopee_created_at DESC", terlaris: "p.sold DESC", termurah: "p.price ASC", termahal: "p.price DESC", nama: "p.name ASC" };

export async function lastSync(): Promise<string | null> {
  const db = await getDb();
  const r = await db.execute("SELECT MAX(last_sync_at) AS t FROM shops");
  return isoSec(r.rows[0].t == null ? null : Number(r.rows[0].t));
}

export async function apiProducts(sp: URLSearchParams) {
  const db = await getDb();
  const { w, a } = filters(sp);
  const limit = int(sp.get("limit"), 24, 1, 100, "limit");
  const page = int(sp.get("page"), 1, 1, 10000, "page");
  const sortKey = sp.get("sort") ?? "terbaru";
  if (!ORDER[sortKey]) throw new ApiError(400, "invalid_param", `sort harus salah satu: ${Object.keys(ORDER).join(", ")}.`);
  const where = w.length ? ` AND ${w.join(" AND ")}` : "";
  const [rows, cnt] = await Promise.all([
    db.execute({
      sql: `SELECT p.*, s.name AS shop_name, s.brand AS brand, (SELECT COUNT(*) FROM variants v WHERE v.product_id = p.id) AS variant_count ${BASE}${where} ORDER BY ${ORDER[sortKey]}, p.id LIMIT ? OFFSET ?`,
      args: [...a, limit, (page - 1) * limit],
    }),
    db.execute({ sql: `SELECT COUNT(*) AS n ${BASE}${where}`, args: a }),
  ]);
  const total = Number(cnt.rows[0].n);
  return { data: (rows.rows as Row[]).map((r) => productOut(r)), meta: { page, limit, total, total_pages: Math.ceil(total / limit), last_sync_at: await lastSync() } };
}

export async function apiProduct(ref: string) {
  const db = await getDb();
  const r = await db.execute({ sql: `SELECT p.*, s.name AS shop_name, s.brand AS brand ${BASE} AND (p.slug = ? OR p.id = ?) LIMIT 1`, args: [ref.slice(0, 200), ref.slice(0, 200)] });
  if (!r.rows.length) throw new ApiError(404, "not_found", "Produk tidak ditemukan.");
  const p = r.rows[0] as Row;
  const vars = (await variantsOf([p.id])).get(p.id) ?? [];
  return { data: productOut(p, vars), meta: { last_sync_at: await lastSync() } };
}

/** Ringan: hanya stok. Bisa difilter ids (id/slug produk) atau skus (SKU varian), maks 100 nilai. */
export async function apiStock(sp: URLSearchParams) {
  const db = await getDb();
  const { w, a } = filters(sp);
  const list = (k: string) => (sp.get(k) ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const ids = list("ids"), skus = list("skus");
  if (ids.length > 100 || skus.length > 100) throw new ApiError(400, "invalid_param", "Maksimal 100 nilai pada ids/skus.");
  if (ids.length) { w.push(`(p.id IN (${ids.map(() => "?").join(",")}) OR p.slug IN (${ids.map(() => "?").join(",")}))`); a.push(...ids, ...ids); }
  if (skus.length) { w.push(`p.id IN (SELECT product_id FROM variants WHERE sku IN (${skus.map(() => "?").join(",")}))`); a.push(...skus); }
  const limit = int(sp.get("limit"), 100, 1, 200, "limit");
  const page = int(sp.get("page"), 1, 1, 10000, "page");
  const where = w.length ? ` AND ${w.join(" AND ")}` : "";
  const [rows, cnt] = await Promise.all([
    db.execute({ sql: `SELECT p.id, p.slug, p.name, p.stock, p.synced_at ${BASE}${where} ORDER BY p.id LIMIT ? OFFSET ?`, args: [...a, limit, (page - 1) * limit] }),
    db.execute({ sql: `SELECT COUNT(*) AS n ${BASE}${where}`, args: a }),
  ]);
  const prods = rows.rows as Row[];
  const vm = await variantsOf(prods.map((p) => p.id));
  const total = Number(cnt.rows[0].n);
  return {
    data: prods.map((p) => ({
      id: p.id, slug: p.slug, name: p.name, stock: Number(p.stock), in_stock: Number(p.stock) > 0, synced_at: isoSec(Number(p.synced_at)),
      variants: (vm.get(p.id) ?? []).map((v) => ({ id: v.id, sku: v.sku ?? null, name: v.name, stock: Number(v.stock), in_stock: Number(v.stock) > 0 })),
    })),
    meta: { page, limit, total, total_pages: Math.ceil(total / limit), last_sync_at: await lastSync() },
  };
}

export async function apiShops() {
  const db = await getDb();
  const r = await db.execute("SELECT s.shop_id, s.name, s.brand, s.shopee_url, s.last_sync_at, (SELECT COUNT(*) FROM products p WHERE p.shop_id = s.shop_id AND p.status = 'NORMAL' AND p.hidden = 0) AS n FROM shops s ORDER BY s.shop_id");
  return { data: (r.rows as Row[]).map((s) => ({ id: Number(s.shop_id), name: s.name, brand: isBrand(s.brand) ? s.brand : "wardrobe", shopee_url: s.shopee_url ?? null, product_count: Number(s.n), last_sync_at: isoSec(s.last_sync_at == null ? null : Number(s.last_sync_at)) })) };
}

// ---------- Foto produk ----------
const absUrl = (u: string) => (u.startsWith("/") ? `${siteUrl()}${u}` : u);
const photo = (url: string, position?: number) => ({ ...(position == null ? {} : { position }), url: absUrl(url), thumbnail_url: absUrl(thumb(url)) });

/** Semua foto satu produk + foto per varian. */
export async function apiProductPhotos(ref: string) {
  const db = await getDb();
  const r = await db.execute({ sql: `SELECT p.id, p.slug, p.name, p.images ${BASE} AND (p.slug = ? OR p.id = ?) LIMIT 1`, args: [ref.slice(0, 200), ref.slice(0, 200)] });
  if (!r.rows.length) throw new ApiError(404, "not_found", "Produk tidak ditemukan.");
  const p = r.rows[0] as Row;
  const vars = (await variantsOf([p.id])).get(p.id) ?? [];
  const imgs = JSON.parse(p.images || "[]") as string[];
  return {
    data: {
      product: { id: p.id, slug: p.slug, name: p.name, url: `${siteUrl()}/produk/${p.slug}` },
      photos: imgs.map((u, i) => photo(u, i + 1)),
      variants: vars.map((v) => ({ id: v.id, sku: v.sku ?? null, name: v.name, image: v.image ? photo(v.image) : null })),
    },
    meta: { last_sync_at: await lastSync() },
  };
}

/** Daftar foto banyak produk sekaligus (mis. untuk katalog/marketplace lain). */
export async function apiPhotos(sp: URLSearchParams) {
  const db = await getDb();
  const { w, a } = filters(sp);
  const ids = (sp.get("ids") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (ids.length > 100) throw new ApiError(400, "invalid_param", "Maksimal 100 nilai pada ids.");
  if (ids.length) { w.push(`(p.id IN (${ids.map(() => "?").join(",")}) OR p.slug IN (${ids.map(() => "?").join(",")}))`); a.push(...ids, ...ids); }
  const limit = int(sp.get("limit"), 50, 1, 100, "limit");
  const page = int(sp.get("page"), 1, 1, 10000, "page");
  const where = w.length ? ` AND ${w.join(" AND ")}` : "";
  const [rows, cnt] = await Promise.all([
    db.execute({ sql: `SELECT p.id, p.slug, p.name, p.images ${BASE}${where} ORDER BY p.id LIMIT ? OFFSET ?`, args: [...a, limit, (page - 1) * limit] }),
    db.execute({ sql: `SELECT COUNT(*) AS n ${BASE}${where}`, args: a }),
  ]);
  const total = Number(cnt.rows[0].n);
  return {
    data: (rows.rows as Row[]).map((p) => {
      const imgs = JSON.parse(p.images || "[]") as string[];
      return { id: p.id, slug: p.slug, name: p.name, url: `${siteUrl()}/produk/${p.slug}`, photo_count: imgs.length, photos: imgs.map((u, i) => photo(u, i + 1)) };
    }),
    meta: { page, limit, total, total_pages: Math.ceil(total / limit), last_sync_at: await lastSync() },
  };
}

// ---------- Testimoni / ulasan ----------
const RSORT: Record<string, string> = { terbaru: "r.created_at DESC", rating: "r.rating DESC, r.created_at DESC", terpanjang: "length(r.comment) DESC", unggulan: "r.featured DESC, r.created_at DESC" };

export async function apiReviews(sp: URLSearchParams) {
  const db = await getDb();
  const w: string[] = ["r.hidden = 0", "(p.id IS NULL OR (p.hidden = 0 AND p.status = 'NORMAL'))"];
  const a: (string | number)[] = [];
  const brand = sp.get("brand");
  if (brand) {
    if (!isBrand(brand)) throw new ApiError(400, "invalid_param", `brand harus salah satu: ${BRAND_SLUGS.join(", ")}.`);
    w.push("s.brand = ?"); a.push(brand);
  }
  const shop = sp.get("shop_id");
  if (shop) { w.push("r.shop_id = ?"); a.push(int(shop, 0, 1, Number.MAX_SAFE_INTEGER, "shop_id")); }
  const prod = sp.get("product");
  if (prod) { w.push("(r.product_id = ? OR p.slug = ?)"); a.push(prod.slice(0, 200), prod.slice(0, 200)); }
  const min = sp.get("min_rating");
  if (min) { w.push("r.rating >= ?"); a.push(int(min, 1, 1, 5, "min_rating")); }
  for (const [k, col] of [["has_images", "r.images <> '[]'"], ["featured", "r.featured = 1"]] as const) {
    const v = sp.get(k);
    if (v === "1" || v === "true") w.push(col);
    else if (v === "0" || v === "false") w.push(`NOT (${col})`);
    else if (v) throw new ApiError(400, "invalid_param", `${k} harus true/false.`);
  }
  const sortKey = sp.get("sort") ?? "terbaru";
  if (!RSORT[sortKey]) throw new ApiError(400, "invalid_param", `sort harus salah satu: ${Object.keys(RSORT).join(", ")}.`);
  const limit = int(sp.get("limit"), 20, 1, 100, "limit");
  const page = int(sp.get("page"), 1, 1, 10000, "page");
  const FROM = `FROM reviews r LEFT JOIN products p ON p.id = r.product_id LEFT JOIN shops s ON s.shop_id = r.shop_id WHERE ${w.join(" AND ")}`;
  const [rows, dist] = await Promise.all([
    db.execute({ sql: `SELECT r.*, p.name AS product_name, p.slug AS product_slug, s.brand AS brand ${FROM} ORDER BY ${RSORT[sortKey]}, r.id LIMIT ? OFFSET ?`, args: [...a, limit, (page - 1) * limit] }),
    db.execute({ sql: `SELECT r.rating AS rating, COUNT(*) AS n ${FROM} GROUP BY r.rating`, args: a }),
  ]);
  const counts: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  let total = 0, sum = 0;
  for (const d of dist.rows as Row[]) { counts[String(d.rating)] = Number(d.n); total += Number(d.n); sum += Number(d.rating) * Number(d.n); }
  return {
    data: (rows.rows as Row[]).map((r) => ({
      id: r.id,
      brand: isBrand(r.brand) ? r.brand : null,
      product: r.product_id ? { id: r.product_id, slug: r.product_slug ?? null, name: r.product_name ?? null, url: r.product_slug ? `${siteUrl()}/produk/${r.product_slug}` : null } : null,
      buyer: r.buyer, // sudah disamarkan (mis. "b***o")
      rating: Number(r.rating),
      comment: r.comment,
      images: (JSON.parse(r.images || "[]") as string[]).map((u) => photo(u)),
      reply: r.reply ?? null,
      featured: !!r.featured,
      source: r.source,
      created_at: isoSec(r.created_at == null ? null : Number(r.created_at)),
    })),
    meta: { page, limit, total, total_pages: Math.ceil(total / limit), average_rating: total ? Math.round((sum / total) * 100) / 100 : null, rating_counts: counts },
  };
}
