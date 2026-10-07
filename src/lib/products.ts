import { getDb } from "./db";
import { isBrand, type BrandSlug } from "./brands";

export type Product = {
  id: string;
  shopId: number;
  itemId: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  sold: number;
  rating: number | null;
  images: string[];
  hasModel: boolean;
  category: string;
  featured: boolean;
  hidden: boolean;
  shopeeUrl: string;
  shopeeCreatedAt: number | null;
  syncedAt: number;
  shopName?: string;
  brand: BrandSlug;
};

export type Variant = {
  id: string;
  productId: string;
  modelId: number;
  name: string;
  sku: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  image: string | null;
};

export type Shop = {
  shopId: number;
  name: string;
  slug: string;
  shopeeUrl: string | null;
  authorized: boolean;
  lastSyncAt: number | null;
  isMock: boolean;
  brand: BrandSlug;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const toProduct = (r: Row): Product => ({
  id: r.id,
  shopId: Number(r.shop_id),
  itemId: Number(r.item_id),
  slug: r.slug,
  name: r.name,
  description: r.description ?? "",
  price: Number(r.price),
  originalPrice: r.original_price == null ? null : Number(r.original_price),
  stock: Number(r.stock),
  sold: Number(r.sold ?? 0),
  rating: r.rating == null ? null : Number(r.rating),
  images: JSON.parse(r.images || "[]"),
  hasModel: !!r.has_model,
  category: r.category_override || r.category,
  featured: !!r.featured,
  hidden: !!r.hidden,
  shopeeUrl: r.shopee_url,
  shopeeCreatedAt: r.shopee_created_at == null ? null : Number(r.shopee_created_at),
  syncedAt: Number(r.synced_at),
  shopName: r.shop_name ?? undefined,
  brand: isBrand(r.brand) ? r.brand : "wardrobe",
});

const toVariant = (r: Row): Variant => ({
  id: r.id,
  productId: r.product_id,
  modelId: Number(r.model_id),
  name: r.name,
  sku: r.sku ?? null,
  price: Number(r.price),
  originalPrice: r.original_price == null ? null : Number(r.original_price),
  stock: Number(r.stock),
  image: r.image ?? null,
});

const SELECT = `SELECT p.*, COALESCE(p.category_override, p.category) AS eff_category, s.name AS shop_name, s.brand AS brand
  FROM products p LEFT JOIN shops s ON s.shop_id = p.shop_id`;

export type ListOpts = {
  category?: string;
  shop?: number;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
  includeHidden?: boolean;
  excludeId?: string;
  brand?: BrandSlug;
};

const ORDER: Record<string, string> = {
  terbaru: "p.shopee_created_at DESC, p.synced_at DESC",
  terlaris: "p.sold DESC",
  termurah: "p.price ASC",
  termahal: "p.price DESC",
};

export async function listProducts(o: ListOpts = {}): Promise<{ items: Product[]; total: number }> {
  const db = await getDb();
  const where: string[] = ["p.status = 'NORMAL'"];
  const args: (string | number)[] = [];
  if (!o.includeHidden) where.push("p.hidden = 0");
  if (o.category) {
    where.push("COALESCE(p.category_override, p.category) = ?");
    args.push(o.category);
  }
  if (o.shop) {
    where.push("p.shop_id = ?");
    args.push(o.shop);
  }
  if (o.q) {
    where.push("p.name LIKE ?");
    args.push(`%${o.q}%`);
  }
  if (o.brand) {
    where.push("s.brand = ?");
    args.push(o.brand);
  }
  if (o.featured) where.push("p.featured = 1");
  if (o.excludeId) {
    where.push("p.id <> ?");
    args.push(o.excludeId);
  }
  const w = `WHERE ${where.join(" AND ")}`;
  const limit = o.limit ?? 24;
  const offset = ((o.page ?? 1) - 1) * limit;
  const order = ORDER[o.sort ?? "terbaru"] ?? ORDER.terbaru;

  const [rows, count] = await Promise.all([
    db.execute({ sql: `${SELECT} ${w} ORDER BY (p.stock > 0) DESC, ${order} LIMIT ? OFFSET ?`, args: [...args, limit, offset] }),
    db.execute({ sql: `SELECT COUNT(*) AS n FROM products p LEFT JOIN shops s ON s.shop_id = p.shop_id ${w}`, args }),
  ]);
  return { items: rows.rows.map((r) => toProduct(r as Row)), total: Number(count.rows[0].n) };
}

export async function getProduct(slug: string): Promise<{ product: Product; variants: Variant[] } | null> {
  const db = await getDb();
  const r = await db.execute({ sql: `${SELECT} WHERE p.slug = ? AND p.hidden = 0 AND p.status = 'NORMAL'`, args: [slug] });
  if (!r.rows.length) return null;
  const product = toProduct(r.rows[0] as Row);
  const v = await db.execute({ sql: "SELECT * FROM variants WHERE product_id = ? ORDER BY model_id", args: [product.id] });
  return { product, variants: v.rows.map((x) => toVariant(x as Row)) };
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const db = await getDb();
  const r = await db.execute({
    sql: `${SELECT} WHERE p.id IN (${ids.map(() => "?").join(",")}) AND p.hidden = 0`,
    args: ids,
  });
  return r.rows.map((x) => toProduct(x as Row));
}

export async function getVariantsByIds(ids: string[]): Promise<Variant[]> {
  if (!ids.length) return [];
  const db = await getDb();
  const r = await db.execute({ sql: `SELECT * FROM variants WHERE id IN (${ids.map(() => "?").join(",")})`, args: ids });
  return r.rows.map((x) => toVariant(x as Row));
}

export async function categoryCounts(brand?: BrandSlug): Promise<Record<string, number>> {
  const db = await getDb();
  const r = await db.execute({
    sql: `SELECT COALESCE(p.category_override, p.category) AS c, COUNT(*) AS n FROM products p LEFT JOIN shops s ON s.shop_id = p.shop_id
          WHERE p.hidden = 0 AND p.status = 'NORMAL' ${brand ? "AND s.brand = ?" : ""} GROUP BY c`,
    args: brand ? [brand] : [],
  });
  return Object.fromEntries(r.rows.map((x) => [String(x.c), Number(x.n)]));
}

export async function listShops(): Promise<Shop[]> {
  const db = await getDb();
  const r = await db.execute("SELECT * FROM shops ORDER BY shop_id");
  return r.rows.map((x) => ({
    shopId: Number(x.shop_id),
    name: String(x.name),
    slug: String(x.slug),
    shopeeUrl: (x.shopee_url as string) ?? null,
    authorized: !!x.access_token,
    lastSyncAt: x.last_sync_at == null ? null : Number(x.last_sync_at),
    isMock: !!x.is_mock,
    brand: isBrand(x.brand) ? x.brand : "wardrobe",
  }));
}

export async function lastSyncAt(): Promise<number | null> {
  const db = await getDb();
  const r = await db.execute("SELECT MAX(last_sync_at) AS t FROM shops");
  return r.rows[0].t == null ? null : Number(r.rows[0].t);
}
