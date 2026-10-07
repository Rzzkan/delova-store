import { getDb } from "./db";

export type Review = {
  id: string;
  productId: string | null;
  productName: string | null;
  productSlug: string | null;
  buyer: string;
  rating: number;
  comment: string;
  images: string[];
  reply: string | null;
  createdAt: number | null;
  featured: boolean;
  hidden: boolean;
  source: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toReview = (r: Record<string, any>): Review => ({
  id: r.id,
  productId: r.product_id ?? null,
  productName: r.product_name ?? null,
  productSlug: r.product_slug ?? null,
  buyer: r.buyer,
  rating: Number(r.rating),
  comment: r.comment,
  images: JSON.parse(r.images || "[]"),
  reply: r.reply ?? null,
  createdAt: r.created_at == null ? null : Number(r.created_at),
  featured: !!r.featured,
  hidden: !!r.hidden,
  source: r.source,
});

const SELECT = `SELECT r.*, p.name AS product_name, p.slug AS product_slug
  FROM reviews r LEFT JOIN products p ON p.id = r.product_id`;

/** "budi_santoso" → "b***o" — nama pembeli tidak ditampilkan utuh. */
export function maskBuyer(name: string): string {
  const n = (name || "").trim();
  if (n.length <= 2) return `${n[0] ?? "p"}***`;
  return `${n[0]}***${n[n.length - 1]}`;
}

/**
 * Ulasan beranda: yang ditandai "unggulan" oleh admin tampil dulu.
 * Jika belum cukup, diisi otomatis ulasan bintang 5 dengan komentar paling informatif.
 */
export async function homeReviews(limit = 6): Promise<Review[]> {
  const db = await getDb();
  const r = await db.execute({
    sql: `${SELECT} WHERE r.hidden = 0 AND r.rating >= 4 AND length(r.comment) >= 20
          ORDER BY r.featured DESC, (r.rating = 5) DESC, length(r.comment) DESC, r.created_at DESC LIMIT ?`,
    args: [limit],
  });
  return r.rows.map((x) => toReview(x as never));
}

export async function productReviews(productId: string, limit = 3): Promise<Review[]> {
  const db = await getDb();
  const r = await db.execute({
    sql: `${SELECT} WHERE r.product_id = ? AND r.hidden = 0 AND r.rating >= 4 AND length(r.comment) >= 10
          ORDER BY r.featured DESC, length(r.comment) DESC LIMIT ?`,
    args: [productId, limit],
  });
  return r.rows.map((x) => toReview(x as never));
}

export async function allReviews(limit = 100): Promise<Review[]> {
  const db = await getDb();
  const r = await db.execute({ sql: `${SELECT} ORDER BY r.featured DESC, r.created_at DESC LIMIT ?`, args: [limit] });
  return r.rows.map((x) => toReview(x as never));
}

/** Skor rata-rata tertimbang jumlah terjual, dari data produk Shopee. */
export async function ratingSummary(): Promise<{ avg: number; sold: number } | null> {
  const db = await getDb();
  const r = await db.execute(
    "SELECT SUM(rating * sold) AS w, SUM(CASE WHEN rating IS NOT NULL THEN sold ELSE 0 END) AS s, SUM(sold) AS total FROM products WHERE hidden = 0 AND status = 'NORMAL'",
  );
  const w = Number(r.rows[0].w ?? 0), s = Number(r.rows[0].s ?? 0), total = Number(r.rows[0].total ?? 0);
  return s > 0 ? { avg: w / s, sold: total } : null;
}
