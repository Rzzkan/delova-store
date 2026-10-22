import type { Client, InStatement } from "@libsql/client";
import { getDb } from "./db";
import { BRANDS, isBrand, type BrandSlug } from "./brands";
import { defaultCategoryForShop, detectCategory } from "./categories";
import { slugify } from "./format";
import { readXlsx, type Row } from "./xlsx";

/**
 * Impor produk dari template "Mass Update" Shopee Seller Centre (cadangan bila API Shopee belum terhubung).
 * Tiga file digabung lewat Kode Produk: Informasi Dasar + Informasi Penjualan + Informasi Media.
 */
type Kind = "basic" | "sales" | "media";
type Table = { kind: Kind; shopId: number; keys: Map<string, number>; rows: Row[] };

const nowSec = () => Math.floor(Date.now() / 1000);

function parseTable(name: string, buf: Uint8Array): Table {
  const all = readXlsx(buf);
  const head = all.find((r) => r.n === 1);
  const meta = all.find((r) => r.n === 2);
  if (!head) throw new Error(`${name}: baris judul tidak ditemukan`);
  const keys = new Map<string, number>();
  head.cells.forEach((v, i) => keys.set(v, i));
  const tag = meta?.cells.get(0) ?? "";
  const kind: Kind | null =
    tag === "basic_info" || keys.has("et_title_product_description") ? "basic"
    : tag === "sales_info" || keys.has("et_title_variation_price") ? "sales"
    : tag === "media_info" || keys.has("ps_item_cover_image") ? "media" : null;
  if (!kind) throw new Error(`${name}: bukan file Mass Update Shopee (Informasi Dasar / Penjualan / Media)`);
  const idCol = keys.get("et_title_product_id") ?? 0;
  const rows = all.filter((r) => r.n > 3 && /^\d{5,}$/.test(r.cells.get(idCol) ?? ""));
  const shopId = Number(meta?.cells.get(3) ?? 0);
  return { kind, shopId, keys, rows };
}

export type PlannedProduct = {
  itemId: number; name: string; description: string; price: number; stock: number; images: string[];
  variants: { modelId: number; name: string; sku: string | null; price: number; stock: number; image: string | null }[];
};

export type Plan = {
  shopId: number; products: PlannedProduct[]; warnings: string[];
  files: Partial<Record<Kind, string>>;
};

export function buildPlan(files: { name: string; data: Uint8Array }[]): Plan {
  const t: Partial<Record<Kind, Table>> = {};
  const fileNames: Partial<Record<Kind, string>> = {};
  for (const f of files) {
    const tb = parseTable(f.name, f.data);
    if (t[tb.kind]) throw new Error(`Ada dua file "${tb.kind}". Unggah masing-masing satu: Dasar, Penjualan, Media.`);
    t[tb.kind] = tb; fileNames[tb.kind] = f.name;
  }
  if (!t.basic || !t.sales) throw new Error("Wajib unggah minimal file Informasi Dasar dan Informasi Penjualan (Informasi Media untuk foto).");
  const shopIds = new Set(Object.values(t).map((x) => x!.shopId).filter(Boolean));
  if (shopIds.size > 1) throw new Error("File berasal dari toko yang berbeda. Impor satu toko per proses.");
  const shopId = [...shopIds][0];
  if (!shopId) throw new Error("ID toko tidak terbaca dari file. Unduh ulang template dari Seller Centre.");

  const warnings: string[] = [];
  const get = (tb: Table, r: Row, key: string) => r.cells.get(tb.keys.get(key) ?? -1)?.trim() ?? "";
  const idKey = "et_title_product_id";

  const media = new Map<number, Row>();
  if (t.media) for (const r of t.media.rows) media.set(Number(get(t.media, r, idKey)), r);
  else warnings.push("File Informasi Media tidak ada — produk tanpa foto.");

  const sales = new Map<number, Row[]>();
  for (const r of t.sales.rows) { const id = Number(get(t.sales, r, idKey)); (sales.get(id) ?? sales.set(id, []).get(id)!).push(r); }

  const products: PlannedProduct[] = [];
  let noSales = 0, noPhoto = 0;
  for (const r of t.basic.rows) {
    const itemId = Number(get(t.basic, r, idKey));
    const srows = sales.get(itemId);
    if (!srows) { noSales++; continue; }

    const mr = media.get(itemId);
    const images: string[] = [];
    const optionImage = new Map<string, string>();
    if (t.media && mr) {
      const cover = get(t.media, mr, "ps_item_cover_image");
      if (cover) images.push(cover);
      for (let i = 1; i <= 8; i++) { const u = get(t.media, mr, `ps_item_image.${i}`); if (u) images.push(u); }
      for (let i = 1; i <= 91; i++) {
        const n = get(t.media, mr, `et_title_option_${i}_for_variation_1`), u = get(t.media, mr, `et_title_option_image_${i}_for_variation_1`);
        if (n && u) optionImage.set(n, u);
      }
    }
    if (!images.length) noPhoto++;

    const variants: PlannedProduct["variants"] = [];
    let single: { price: number; stock: number } | null = null;
    for (const s of srows) {
      const price = Math.round(Number(get(t.sales, s, "et_title_variation_price")) || 0);
      const stock = Math.max(0, Math.round(Number(get(t.sales, s, "et_title_variation_stock")) || 0));
      const vname = get(t.sales, s, "et_title_variation_name");
      if (!vname) { single = { price, stock }; continue; } // produk tanpa varian
      const first = vname.split(",")[0].trim();
      variants.push({
        modelId: Number(get(t.sales, s, "et_title_variation_id")) || variants.length + 1,
        name: vname.split(",").map((x) => x.trim()).filter(Boolean).join(" / "),
        sku: get(t.sales, s, "et_title_variation_sku") || null,
        price, stock, image: optionImage.get(first) ?? optionImage.get(vname) ?? null,
      });
    }
    const live = variants.filter((v) => v.price > 0).sort((a, b) => a.price - b.price);
    const price = variants.length ? (live[0]?.price ?? 0) : (single?.price ?? 0);
    const stock = variants.length ? variants.reduce((a, v) => a + v.stock, 0) : (single?.stock ?? 0);
    if (price <= 0) { warnings.push(`Dilewati (harga kosong): ${get(t.basic, r, "et_title_product_name").slice(0, 60)}`); continue; }
    products.push({
      itemId, name: get(t.basic, r, "et_title_product_name").slice(0, 300),
      description: (r.cells.get(t.basic.keys.get("et_title_product_description") ?? -1) ?? "").trim().slice(0, 8000),
      price, stock, images: images.slice(0, 9), variants,
    });
  }
  if (noSales) warnings.push(`${noSales} produk ada di file Dasar tapi tidak ada di file Penjualan (dilewati). Unduh keduanya dengan filter yang sama.`);
  if (noPhoto && t.media) warnings.push(`${noPhoto} produk tanpa foto.`);
  if (!products.length) throw new Error("Tidak ada produk yang bisa diimpor dari file ini.");
  return { shopId, products, warnings, files: fileNames };
}

export type Summary = {
  shopId: number; shopExists: boolean; shopName: string; total: number; variants: number; created: number; updated: number;
  toRemove: number; mockToPurge: number; warnings: string[]; sample: { name: string; price: number; stock: number; variants: number; image: string | null }[];
};

export async function summarize(plan: Plan, opts: { removeMissing: boolean }): Promise<Summary> {
  const db = await getDb();
  const shop = await db.execute({ sql: "SELECT name FROM shops WHERE shop_id = ?", args: [plan.shopId] });
  const ex = await db.execute({ sql: "SELECT item_id FROM products WHERE shop_id = ?", args: [plan.shopId] });
  const have = new Set(ex.rows.map((r) => Number(r.item_id)));
  const inFile = new Set(plan.products.map((p) => p.itemId));
  const mock = await db.execute("SELECT COUNT(*) AS n FROM products WHERE shop_id IN (SELECT shop_id FROM shops WHERE is_mock = 1)");
  return {
    shopId: plan.shopId, shopExists: shop.rows.length > 0, shopName: shop.rows[0] ? String(shop.rows[0].name) : "",
    total: plan.products.length, variants: plan.products.reduce((a, p) => a + p.variants.length, 0),
    created: plan.products.filter((p) => !have.has(p.itemId)).length,
    updated: plan.products.filter((p) => have.has(p.itemId)).length,
    toRemove: opts.removeMissing ? [...have].filter((i) => !inFile.has(i)).length : 0,
    mockToPurge: Number(mock.rows[0].n),
    warnings: plan.warnings,
    sample: plan.products.slice(0, 5).map((p) => ({ name: p.name, price: p.price, stock: p.stock, variants: p.variants.length, image: p.images[0] ?? null })),
  };
}

async function purgeMock(db: Client) {
  await db.batch([
    "DELETE FROM reviews WHERE source = 'mock'",
    "DELETE FROM variants WHERE product_id IN (SELECT id FROM products WHERE shop_id IN (SELECT shop_id FROM shops WHERE is_mock = 1))",
    "DELETE FROM products WHERE shop_id IN (SELECT shop_id FROM shops WHERE is_mock = 1)",
    "DELETE FROM shops WHERE is_mock = 1",
  ], "write");
}

export async function applyPlan(plan: Plan, opts: { brand: string; shopName: string; removeMissing: boolean }) {
  if (!isBrand(opts.brand)) throw new Error("Brand tidak valid");
  const brand: BrandSlug = opts.brand;
  const db = await getDb();
  const started = nowSec();
  await purgeMock(db); // data contoh dibuang begitu ada data asli

  const existing = await db.execute({ sql: "SELECT name, brand, default_category FROM shops WHERE shop_id = ?", args: [plan.shopId] });
  const name = (opts.shopName.trim() || (existing.rows[0] ? String(existing.rows[0].name) : BRANDS[brand].name)).slice(0, 80);
  const defCat = (existing.rows[0]?.default_category as string) || defaultCategoryForShop(name);
  await db.execute({
    sql: `INSERT INTO shops (shop_id, name, slug, default_category, brand, shopee_url, is_mock) VALUES (?,?,?,?,?,?,0)
          ON CONFLICT(shop_id) DO UPDATE SET name=excluded.name, brand=excluded.brand, default_category=COALESCE(shops.default_category, excluded.default_category), is_mock=0`,
    args: [plan.shopId, name, slugify(name) || `shop-${plan.shopId}`, defCat, brand, BRANDS[brand].shopeeUrl],
  });

  const ts = nowSec();
  for (const p of plan.products) {
    const id = `${plan.shopId}-${p.itemId}`;
    const stmts: InStatement[] = [
      {
        // Kolom kurasi admin (hidden, featured, category_override, slug) dipertahankan; sold/rating/ulasan tidak ada di file → dipertahankan juga.
        sql: `INSERT INTO products (id, shop_id, item_id, slug, name, description, price, original_price, stock, sold, images, status, has_model, category, shopee_url, synced_at)
              VALUES (?,?,?,?,?,?,?,NULL,?,0,?,'NORMAL',?,?,?,?)
              ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, price=excluded.price, original_price=NULL,
                stock=excluded.stock, images=CASE WHEN excluded.images = '[]' THEN products.images ELSE excluded.images END,
                status='NORMAL', has_model=excluded.has_model, category=excluded.category, shopee_url=excluded.shopee_url, synced_at=excluded.synced_at`,
        args: [id, plan.shopId, p.itemId, `${slugify(p.name)}-${p.itemId}`, p.name, p.description, p.price, p.stock, JSON.stringify(p.images),
          p.variants.length ? 1 : 0, detectCategory(p.name, defCat, brand), `https://shopee.co.id/product/${plan.shopId}/${p.itemId}`, ts],
      },
      { sql: "DELETE FROM variants WHERE product_id = ?", args: [id] },
      ...p.variants.map((v): InStatement => ({
        sql: "INSERT INTO variants (id, product_id, model_id, name, sku, price, original_price, stock, image) VALUES (?,?,?,?,?,?,NULL,?,?)",
        args: [`${id}-${v.modelId}`, id, v.modelId, v.name, v.sku, v.price, v.stock, v.image],
      })),
    ];
    await db.batch(stmts, "write");
  }

  let removed = 0;
  if (opts.removeMissing) {
    const keep = new Set(plan.products.map((p) => p.itemId));
    const ex = await db.execute({ sql: "SELECT item_id FROM products WHERE shop_id = ?", args: [plan.shopId] });
    for (const r of ex.rows) {
      const i = Number(r.item_id);
      if (keep.has(i)) continue;
      const pid = `${plan.shopId}-${i}`;
      await db.batch([{ sql: "DELETE FROM variants WHERE product_id = ?", args: [pid] }, { sql: "DELETE FROM products WHERE id = ?", args: [pid] }], "write");
      removed++;
    }
  }
  await db.execute({ sql: "UPDATE shops SET last_sync_at = ? WHERE shop_id = ?", args: [nowSec(), plan.shopId] });
  await db.execute({
    sql: "INSERT INTO sync_logs (shop_id, started_at, finished_at, status, upserted, removed, message) VALUES (?,?,?,?,?,?,?)",
    args: [plan.shopId, started, nowSec(), "ok", plan.products.length, removed, "Impor Excel Mass Update"],
  });
  return { shopId: plan.shopId, name, upserted: plan.products.length, removed };
}
