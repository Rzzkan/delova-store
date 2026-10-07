import type { Client, InStatement } from "@libsql/client";
import { getDb } from "../db";
import { detectCategory, defaultCategoryForShop } from "../categories";
import { brandForShop } from "../brands";
import { slugify } from "../format";
import { maskBuyer } from "../reviews";
import { isMock } from "./config";
import { shopGet, type J, type ShopAuth } from "./client";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nowSec = () => Math.floor(Date.now() / 1000);
const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

type ShopRow = ShopAuth & { name: string; default_category: string | null; shopee_url: string | null; brand: string };

export type SyncResult = { shopId: number; name: string; upserted: number; removed: number; error?: string };

async function loadShop(db: Client, shopId: number): Promise<ShopRow | null> {
  const r = await db.execute({ sql: "SELECT * FROM shops WHERE shop_id = ?", args: [shopId] });
  if (!r.rows.length) return null;
  const x = r.rows[0];
  return {
    shop_id: Number(x.shop_id),
    name: String(x.name),
    default_category: (x.default_category as string) ?? null,
    brand: String(x.brand ?? "wardrobe"),
    shopee_url: (x.shopee_url as string) ?? null,
    access_token: (x.access_token as string) ?? null,
    refresh_token: (x.refresh_token as string) ?? null,
    expires_at: x.expires_at == null ? null : Number(x.expires_at),
  };
}

/** Lengkapi nama toko + slug + URL toko dari Shopee setelah otorisasi pertama. */
export async function refreshShopProfile(shopId: number): Promise<void> {
  const db = await getDb();
  const shop = await loadShop(db, shopId);
  if (!shop) return;
  const info = await shopGet(shop, "/api/v2/shop/get_shop_info");
  const name: string = info.shop_name || shop.name;
  const slug = slugify(name) || `shop-${shopId}`;
  await db.execute({
    sql: "UPDATE shops SET name=?, slug=?, brand=?, default_category=COALESCE(default_category, ?), shopee_url=COALESCE(shopee_url, ?) WHERE shop_id=?",
    args: [name, slug, brandForShop(name), defaultCategoryForShop(name), `https://shopee.co.id/${slug.replace(/-/g, "")}`, shopId],
  });
}

async function listItemIds(shop: ShopRow): Promise<number[]> {
  const ids: number[] = [];
  let offset = 0;
  for (let guard = 0; guard < 200; guard++) {
    const r = await shopGet(shop, "/api/v2/product/get_item_list", { offset, page_size: 100, item_status: "NORMAL" });
    for (const it of r.item ?? []) ids.push(Number(it.item_id));
    if (!r.has_next_page) break;
    offset = r.next_offset;
  }
  return ids;
}

function descriptionOf(item: J): string {
  const fields: J[] = item.description_info?.extended_description?.field_list ?? [];
  const txt = fields.filter((f) => f.field_type === "text" && f.text).map((f) => String(f.text).trim());
  return (txt.length ? txt.join("\n\n") : String(item.description ?? "")).slice(0, 8000);
}

type Built = { product: InStatement[]; variantCount: number };

async function buildItem(shop: ShopRow, item: J, extra: J | undefined): Promise<Built> {
  const itemId = Number(item.item_id);
  const id = `${shop.shop_id}-${itemId}`;
  const images: string[] = (item.image?.image_url_list ?? []).slice(0, 9);
  const hasModel = !!item.has_model;
  const stmts: InStatement[] = [];

  let price = Math.round(Number(item.price_info?.[0]?.current_price ?? 0));
  let original: number | null = item.price_info?.[0]?.original_price ? Math.round(Number(item.price_info[0].original_price)) : null;
  let stock = Number(item.stock_info_v2?.summary_info?.total_available_stock ?? 0);

  const variants: { modelId: number; name: string; sku: string | null; price: number; original: number | null; stock: number; image: string | null }[] = [];
  if (hasModel) {
    const m = await shopGet(shop, "/api/v2/product/get_model_list", { item_id: itemId });
    const tiers: J[] = m.tier_variation ?? [];
    for (const mod of m.model ?? []) {
      const idx: number[] = mod.tier_index ?? [];
      const name =
        mod.model_name || idx.map((i, t) => tiers[t]?.option_list?.[i]?.option).filter(Boolean).join(" / ") || `Varian ${mod.model_id}`;
      const p = mod.price_info?.[0];
      variants.push({
        modelId: Number(mod.model_id),
        name,
        sku: mod.model_sku || null,
        price: Math.round(Number(p?.current_price ?? 0)),
        original: p?.original_price ? Math.round(Number(p.original_price)) : null,
        stock: Number(mod.stock_info_v2?.summary_info?.total_available_stock ?? 0),
        image: tiers[0]?.option_list?.[idx[0]]?.image?.image_url ?? null,
      });
    }
    if (variants.length) {
      const live = variants.filter((v) => v.price > 0);
      const cheapest = live.sort((a, b) => a.price - b.price)[0];
      price = cheapest?.price ?? price;
      original = cheapest?.original ?? original;
      stock = variants.reduce((s, v) => s + v.stock, 0);
    }
  }
  if (original !== null && original <= price) original = null;

  const name = String(item.item_name);
  const category = detectCategory(name, shop.default_category, shop.brand);
  const url = `https://shopee.co.id/product/${shop.shop_id}/${itemId}`;

  // UPSERT: kolom hasil sinkron diperbarui, kolom kurasi admin (hidden, featured, category_override, slug) dipertahankan.
  stmts.push({
    sql: `INSERT INTO products (id, shop_id, item_id, slug, name, description, price, original_price, stock, sold, rating, review_count, images, status, has_model, category, shopee_url, shopee_created_at, shopee_updated_at, synced_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, price=excluded.price,
            original_price=excluded.original_price, stock=excluded.stock, sold=excluded.sold, rating=excluded.rating, review_count=excluded.review_count,
            images=excluded.images, status=excluded.status, has_model=excluded.has_model, category=excluded.category,
            shopee_url=excluded.shopee_url, shopee_updated_at=excluded.shopee_updated_at, synced_at=excluded.synced_at`,
    args: [
      id, shop.shop_id, itemId, `${slugify(name)}-${itemId}`, name, descriptionOf(item), price, original, stock,
      Number(extra?.sale ?? 0), extra?.rating_star ? Number(extra.rating_star) : null, extra?.comment_count != null ? Number(extra.comment_count) : null, JSON.stringify(images),
      String(item.item_status ?? "NORMAL"), hasModel ? 1 : 0, category, url,
      item.create_time ?? null, item.update_time ?? null, nowSec(),
    ],
  });
  stmts.push({ sql: "DELETE FROM variants WHERE product_id = ?", args: [id] });
  for (const v of variants) {
    stmts.push({
      sql: "INSERT INTO variants (id, product_id, model_id, name, sku, price, original_price, stock, image) VALUES (?,?,?,?,?,?,?,?,?)",
      args: [`${id}-${v.modelId}`, id, v.modelId, v.name, v.sku, v.price, v.original, v.stock, v.image],
    });
  }
  return { product: stmts, variantCount: variants.length };
}

async function fetchAndStore(db: Client, shop: ShopRow, itemIds: number[]): Promise<number> {
  let n = 0;
  for (const ids of chunk(itemIds, 50)) {
    const list = ids.join(",");
    const base = await shopGet(shop, "/api/v2/product/get_item_base_info", { item_id_list: list });
    let extraMap = new Map<number, J>();
    try {
      const ex = await shopGet(shop, "/api/v2/product/get_item_extra_info", { item_id_list: list });
      extraMap = new Map((ex.item_list ?? []).map((e: J) => [Number(e.item_id), e]));
    } catch {
      /* data penjualan/rating opsional — jangan gagalkan sinkron */
    }
    for (const item of base.item_list ?? []) {
      const built = await buildItem(shop, item, extraMap.get(Number(item.item_id)));
      await db.batch(built.product, "write");
      n++;
      if (item.has_model) await sleep(120); // sopan terhadap rate limit
    }
  }
  return n;
}

/** Ambil ulasan terbaru toko (bintang 4–5 yang berkomentar). Kurasi admin (unggulan/sembunyi) dipertahankan. */
export async function syncReviews(db: Client, shop: ShopRow): Promise<number> {
  let cursor = "";
  let n = 0;
  for (let page = 0; page < 5; page++) {
    const params: Record<string, string | number> = { page_size: 50 };
    if (cursor) params.cursor = cursor;
    const r = await shopGet(shop, "/api/v2/product/get_comment", params);
    for (const c of (r.item_comment_list ?? []) as J[]) {
      const comment = String(c.comment ?? "").trim();
      const rating = Number(c.rating_star);
      if (c.hidden || rating < 4 || comment.length < 10) continue;
      const buyer = String(c.buyer_username ?? "pembeli");
      await db.execute({
        sql: `INSERT INTO reviews (id, shop_id, item_id, product_id, buyer, rating, comment, images, reply, created_at, source, synced_at)
              VALUES (?,?,?,?,?,?,?,?,?,?, 'shopee', ?)
              ON CONFLICT(id) DO UPDATE SET comment=excluded.comment, rating=excluded.rating, images=excluded.images,
                reply=excluded.reply, synced_at=excluded.synced_at`,
        args: [
          `${shop.shop_id}-${c.comment_id}`, shop.shop_id, Number(c.item_id) || null,
          c.item_id ? `${shop.shop_id}-${c.item_id}` : null, maskBuyer(buyer), rating, comment.slice(0, 1200),
          JSON.stringify((c.media?.image_url_list ?? []).slice(0, 4)), c.comment_reply?.reply ? String(c.comment_reply.reply).slice(0, 600) : null,
          c.create_time ?? null, nowSec(),
        ],
      });
      n++;
    }
    if (!r.more || !r.next_cursor) break;
    cursor = String(r.next_cursor);
  }
  return n;
}

async function purgeMockData(db: Client) {
  await db.batch(
    [
      "DELETE FROM reviews WHERE source = 'mock'",
      "DELETE FROM variants WHERE product_id IN (SELECT id FROM products WHERE shop_id IN (SELECT shop_id FROM shops WHERE is_mock = 1))",
      "DELETE FROM products WHERE shop_id IN (SELECT shop_id FROM shops WHERE is_mock = 1)",
      "DELETE FROM shops WHERE is_mock = 1",
    ],
    "write",
  );
}

export async function syncShop(shopId: number): Promise<SyncResult> {
  const db = await getDb();
  const shop = await loadShop(db, shopId);
  if (!shop) return { shopId, name: "?", upserted: 0, removed: 0, error: "Toko tidak ditemukan" };
  const started = nowSec();
  try {
    if ((shop.name.startsWith("Shop ") || !shop.default_category) && shop.access_token) await refreshShopProfile(shopId);
    const fresh = (await loadShop(db, shopId)) ?? shop;
    const ids = await listItemIds(fresh);
    const upserted = await fetchAndStore(db, fresh, ids);

    // Hapus produk yang sudah tidak aktif/dihapus di Shopee
    let removed = 0;
    const existing = await db.execute({ sql: "SELECT item_id FROM products WHERE shop_id = ?", args: [shopId] });
    const gone = existing.rows.map((r) => Number(r.item_id)).filter((i) => !ids.includes(i));
    for (const g of gone) {
      const pid = `${shopId}-${g}`;
      await db.batch(
        [
          { sql: "DELETE FROM variants WHERE product_id = ?", args: [pid] },
          { sql: "DELETE FROM products WHERE id = ?", args: [pid] },
        ],
        "write",
      );
      removed++;
    }
    // Ulasan bersifat tambahan: kegagalannya tidak boleh menggagalkan sinkron produk.
    let note: string | null = null;
    try {
      const nr = await syncReviews(db, fresh);
      note = `${nr} ulasan`;
    } catch (e) {
      note = `Ulasan gagal: ${(e instanceof Error ? e.message : String(e)).slice(0, 200)}`;
    }
    await db.execute({ sql: "UPDATE shops SET last_sync_at = ? WHERE shop_id = ?", args: [nowSec(), shopId] });
    await db.execute({
      sql: "INSERT INTO sync_logs (shop_id, started_at, finished_at, status, upserted, removed, message) VALUES (?,?,?,?,?,?,?)",
      args: [shopId, started, nowSec(), "ok", upserted, removed, note],
    });
    return { shopId, name: fresh.name, upserted, removed };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.execute({
      sql: "INSERT INTO sync_logs (shop_id, started_at, finished_at, status, upserted, removed, message) VALUES (?,?,?,?,?,?,?)",
      args: [shopId, started, nowSec(), "error", 0, 0, msg.slice(0, 500)],
    });
    return { shopId, name: shop.name, upserted: 0, removed: 0, error: msg };
  }
}

/** Sinkron satu produk (dipanggil dari webhook Live Push → stok & harga hampir real-time). */
export async function syncItem(shopId: number, itemId: number): Promise<void> {
  const db = await getDb();
  const shop = await loadShop(db, shopId);
  if (!shop?.access_token) return;
  await fetchAndStore(db, shop, [itemId]);
}

export async function syncAll(): Promise<{ mock: boolean; results: SyncResult[] }> {
  if (isMock()) return { mock: true, results: [] };
  const db = await getDb();
  await purgeMockData(db);
  const r = await db.execute("SELECT shop_id FROM shops WHERE access_token IS NOT NULL ORDER BY shop_id");
  const results: SyncResult[] = [];
  for (const row of r.rows) results.push(await syncShop(Number(row.shop_id)));
  return { mock: false, results };
}
