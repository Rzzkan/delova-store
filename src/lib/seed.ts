import type { Client, InStatement } from "@libsql/client";
import { detectCategory } from "./categories";
import { slugify } from "./format";

/** Data contoh untuk MODE DEMO (saat kredensial Shopee belum diisi). */
const SHOPS = [
  { id: 1, name: "Delova Wardrobe", slug: "delovawardrobe", cat: "gamis" },
  { id: 2, name: "Delova Kids", slug: "delovakids", cat: "anak" },
  { id: 3, name: "Delova Scarf", slug: "delovascarf", cat: "hijab" },
];

type Def = {
  shop: number; name: string; price: number; orig?: number; sold: number; rating: number;
  color: string; variants: string[]; featured?: boolean; stock?: number; desc: string;
};

const SIZES = ["S", "M", "L", "XL"];
const DEFS: Def[] = [
  { shop: 1, name: "Kebaya Brokat Modern Rosewood", price: 289000, orig: 349000, sold: 1240, rating: 4.9, color: "9E4A5A", variants: SIZES, featured: true, desc: "Kebaya brokat dengan potongan modern, nyaman untuk wisuda dan acara keluarga.\n\nBahan: brokat premium + furing adem.\nTersedia size S–XL." },
  { shop: 1, name: "Kebaya Tulle Sage Green", price: 259000, sold: 860, rating: 4.8, color: "7C8B6F", variants: SIZES, featured: true, desc: "Kebaya tulle lembut warna sage, ringan dan elegan." },
  { shop: 1, name: "Kebaya Kutubaru Sogan Klasik", price: 235000, orig: 275000, sold: 640, rating: 4.9, color: "7B5A3C", variants: SIZES, desc: "Kutubaru klasik warna sogan, cocok dipadukan dengan jarik atau rok batik." },
  { shop: 1, name: "Outer Batik Tulis Parang Kontemporer", price: 319000, sold: 310, rating: 4.8, color: "3E4A6B", variants: ["M", "L", "XL"], desc: "Outer batik motif parang dengan siluet longgar." },
  { shop: 1, name: "Dress Batik Kawung A-Line", price: 275000, orig: 325000, sold: 980, rating: 4.9, color: "B8893B", variants: SIZES, featured: true, desc: "Dress batik kawung potongan A-line, resleting depan busui friendly." },
  { shop: 1, name: "Gamis Lurik Tenun Harian", price: 249000, sold: 520, rating: 4.7, color: "5E6B52", variants: SIZES, desc: "Gamis lurik tenun adem untuk aktivitas harian." },
  { shop: 1, name: "Rok Lilit Batik Cap Motif Sidomukti", price: 149000, sold: 1480, rating: 4.9, color: "6B2330", variants: ["All Size"], desc: "Rok lilit praktis, all size, tanpa kancing." },
  { shop: 1, name: "Set Couple Batik Ayah & Bunda", price: 459000, orig: 529000, sold: 270, rating: 4.9, color: "4E1722", variants: ["S", "M", "L", "XL", "XXL"], desc: "Set batik couple seragam keluarga, bahan katun primisima." },
  { shop: 2, name: "Kebaya Anak Pink Dusty", price: 169000, orig: 199000, sold: 910, rating: 4.9, color: "D9A5A0", variants: ["2-3 th", "4-5 th", "6-7 th", "8-9 th"], featured: true, desc: "Kebaya anak lembut, bahan nyaman dan tidak gatal." },
  { shop: 2, name: "Dress Batik Anak Kawung Mini", price: 139000, sold: 760, rating: 4.9, color: "C79B4B", variants: ["2-3 th", "4-5 th", "6-7 th", "8-9 th"], desc: "Dress batik anak, pas untuk foto keluarga & hari Kartini." },
  { shop: 2, name: "Set Kutubaru + Rok Anak Sogan", price: 179000, sold: 430, rating: 4.8, color: "8B6A4A", variants: ["4-5 th", "6-7 th", "8-9 th"], desc: "Set kutubaru dan rok batik anak." },
  { shop: 2, name: "Gamis Anak Polos Sage", price: 159000, sold: 350, rating: 4.8, color: "8FA182", variants: ["4-5 th", "6-7 th", "8-9 th"], desc: "Gamis anak polos, adem dan mudah dipadukan." },
  { shop: 3, name: "Hijab Segi Empat Viscose Printed Kawung", price: 59000, orig: 79000, sold: 5230, rating: 4.9, color: "B8893B", variants: ["Maroon", "Sage", "Navy", "Mocca"], featured: true, desc: "Segi empat viscose printed motif kawung, jatuh dan mudah dibentuk." },
  { shop: 3, name: "Pashmina Voal Ultrafine Motif Parang", price: 69000, sold: 3180, rating: 4.9, color: "4B5A7A", variants: ["Navy", "Dusty Pink", "Sage"], desc: "Pashmina voal ultrafine, tidak menerawang." },
  { shop: 3, name: "Bergo Instan Jersey Premium", price: 49000, sold: 2740, rating: 4.8, color: "6B6258", variants: ["Black", "Mocca", "Cream", "Maroon"], desc: "Hijab instan bergo jersey, tinggal pakai." },
  { shop: 3, name: "Hijab Segi Empat Satin Silk Mega Mendung", price: 65000, sold: 1620, rating: 4.8, color: "5B7BA0", variants: ["Biru", "Rose", "Emerald"], stock: 0, desc: "Satin silk motif mega mendung — stok sedang habis." },
];

const ph = (t: string, c: string, v: number) => `/api/ph?t=${encodeURIComponent(t)}&c=${c}&v=${v}`;

export async function seedMock(db: Client): Promise<void> {
  const ts = Math.floor(Date.now() / 1000);
  const stmts: InStatement[] = [];
  for (const s of SHOPS) {
    stmts.push({
      sql: "INSERT OR IGNORE INTO shops (shop_id, name, slug, default_category, shopee_url, last_sync_at, is_mock) VALUES (?,?,?,?,?,?,1)",
      args: [s.id, s.name, s.slug, s.cat, `https://shopee.co.id/${s.slug}`, ts],
    });
  }
  DEFS.forEach((d, i) => {
    const shop = SHOPS.find((s) => s.id === d.shop)!;
    const itemId = 1000 + i;
    const id = `${d.shop}-${itemId}`;
    const stock = d.stock ?? 40 + ((i * 7) % 60);
    stmts.push({
      sql: `INSERT OR IGNORE INTO products (id, shop_id, item_id, slug, name, description, price, original_price, stock, sold, rating, images, status, has_model, category, featured, shopee_url, shopee_created_at, shopee_updated_at, synced_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'NORMAL',1,?,?,?,?,?,?)`,
      args: [
        id, d.shop, itemId, `${slugify(d.name)}-${itemId}`, d.name, d.desc, d.price, d.orig ?? null, stock * d.variants.length,
        d.sold, d.rating, JSON.stringify([ph(d.name, d.color, 1), ph(d.name, d.color, 2), ph(d.name, d.color, 3)]),
        detectCategory(d.name, shop.cat), d.featured ? 1 : 0, shop.slug ? `https://shopee.co.id/${shop.slug}` : "https://shopee.co.id",
        ts - (DEFS.length - i) * 86400 * 3, ts, ts,
      ],
    });
    d.variants.forEach((vn, vi) => {
      stmts.push({
        sql: "INSERT OR IGNORE INTO variants (id, product_id, model_id, name, sku, price, original_price, stock, image) VALUES (?,?,?,?,?,?,?,?,?)",
        args: [`${id}-${vi + 1}`, id, vi + 1, vn, `DLV-${itemId}-${vi + 1}`, d.price, d.orig ?? null, d.stock === 0 ? 0 : stock - ((vi * 5) % 15), null],
      });
    });
  });
  await db.batch(stmts, "write");
}
