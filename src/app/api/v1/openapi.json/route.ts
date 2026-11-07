import { siteUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";

const prm = (name: string, description: string, schema: object = { type: "string" }) => ({ name, in: "query", required: false, description, schema });
const common = [
  prm("brand", "Filter brand", { type: "string", enum: ["wardrobe", "kids", "scarf", "daily"] }),
  prm("category", "Slug kategori, mis. kebaya"),
  prm("shop_id", "ID toko Shopee", { type: "integer" }),
  prm("q", "Cari di nama produk"),
  prm("in_stock", "true = hanya stok > 0, false = hanya stok habis", { type: "boolean" }),
];
const paging = (def: number, max: number) => [
  prm("page", "Halaman (mulai 1)", { type: "integer", minimum: 1, default: 1 }),
  prm("limit", `Jumlah per halaman (maks ${max})`, { type: "integer", minimum: 1, maximum: max, default: def }),
];
const ok = (ref: string) => ({ "200": { description: "Berhasil", content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } } }, "401": { $ref: "#/components/responses/Err" }, "429": { $ref: "#/components/responses/Err" } });

export function GET() {
  const spec = {
    openapi: "3.0.3",
    info: { title: "Delova Store API", version: "1.0.0", description: "API read-only untuk data produk, stok, foto produk, dan testimoni delova.id. Stok disinkronkan dari Shopee secara berkala; lihat meta.last_sync_at dan synced_at untuk kesegaran data." },
    servers: [{ url: `${siteUrl()}/api/v1` }],
    security: [{ bearer: [] }, { apiKey: [] }],
    paths: {
      "/products": { get: { summary: "Daftar produk", parameters: [...common, prm("sort", "Urutan", { type: "string", enum: ["terbaru", "terlaris", "termurah", "termahal", "nama"], default: "terbaru" }), ...paging(24, 100)], responses: ok("ProductList") } },
      "/products/{ref}": { get: { summary: "Detail produk + varian", parameters: [{ name: "ref", in: "path", required: true, description: "Slug atau id produk", schema: { type: "string" } }], responses: { ...ok("ProductDetail"), "404": { $ref: "#/components/responses/Err" } } } },
      "/stock": { get: { summary: "Stok terbaru (ringan)", parameters: [prm("ids", "Daftar id/slug produk dipisah koma (maks 100)"), prm("skus", "Daftar SKU varian dipisah koma (maks 100)"), ...common, ...paging(100, 200)], responses: ok("StockList") } },
      "/products/{ref}/photos": { get: { summary: "Semua foto satu produk + foto per varian", parameters: [{ name: "ref", in: "path", required: true, description: "Slug atau id produk", schema: { type: "string" } }], responses: { ...ok("ProductPhotos"), "404": { $ref: "#/components/responses/Err" } } } },
      "/photos": { get: { summary: "Foto banyak produk sekaligus", parameters: [prm("ids", "Daftar id/slug produk dipisah koma (maks 100)"), ...common, ...paging(50, 100)], responses: ok("PhotoList") } },
      "/reviews": { get: { summary: "Testimoni / ulasan pembeli", parameters: [prm("product", "Id atau slug produk"), prm("brand", "Filter brand", { type: "string", enum: ["wardrobe", "kids", "scarf", "daily"] }), prm("shop_id", "ID toko Shopee", { type: "integer" }), prm("min_rating", "Bintang minimal (1–5)", { type: "integer", minimum: 1, maximum: 5 }), prm("has_images", "true = hanya yang punya foto", { type: "boolean" }), prm("featured", "true = hanya unggulan", { type: "boolean" }), prm("sort", "Urutan", { type: "string", enum: ["terbaru", "rating", "terpanjang", "unggulan"], default: "terbaru" }), ...paging(20, 100)], responses: ok("ReviewList") } },
      "/shops": { get: { summary: "Daftar toko", responses: ok("ShopList") } },
    },
    components: {
      securitySchemes: { bearer: { type: "http", scheme: "bearer" }, apiKey: { type: "apiKey", in: "header", name: "X-API-Key" } },
      responses: { Err: { description: "Galat", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } } },
      schemas: {
        Error: { type: "object", properties: { error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" }, request_id: { type: "string" } } } } },
        Meta: { type: "object", properties: { page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, total_pages: { type: "integer" }, last_sync_at: { type: "string", format: "date-time", nullable: true } } },
        Product: { type: "object", properties: { id: { type: "string" }, slug: { type: "string" }, name: { type: "string" }, brand: { type: "string" }, shop: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } }, category: { type: "string" }, price: { type: "integer", description: "Harga jual saat ini (Rupiah), sudah memakai harga diskon bila ada" }, original_price: { type: "integer", nullable: true, description: "Harga coret; null bila tidak ada diskon" }, discount_pct: { type: "integer", nullable: true, description: "Persen diskon efektif, dihitung dari price dan original_price" }, on_sale: { type: "boolean" }, discount_source: { type: "string", nullable: true, enum: ["shopee", "admin"], description: "shopee = diskon dari Shopee; admin = diatur di panel delova.id" }, stock: { type: "integer" }, in_stock: { type: "boolean" }, sold: { type: "integer" }, rating: { type: "number", nullable: true }, review_count: { type: "integer", nullable: true }, image: { type: "string", nullable: true }, url: { type: "string" }, shopee_url: { type: "string" }, created_at: { type: "string", format: "date-time", nullable: true }, synced_at: { type: "string", format: "date-time" }, variant_count: { type: "integer" } } },
        Variant: { type: "object", properties: { id: { type: "string" }, sku: { type: "string", nullable: true }, name: { type: "string" }, price: { type: "integer" }, original_price: { type: "integer", nullable: true }, discount_pct: { type: "integer", nullable: true }, on_sale: { type: "boolean" }, discount_source: { type: "string", nullable: true }, stock: { type: "integer" }, in_stock: { type: "boolean" }, image: { type: "string", nullable: true } } },
        ProductList: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Product" } }, meta: { $ref: "#/components/schemas/Meta" } } },
        ProductDetail: { type: "object", properties: { data: { allOf: [{ $ref: "#/components/schemas/Product" }, { type: "object", properties: { description: { type: "string" }, images: { type: "array", items: { type: "string" } }, variants: { type: "array", items: { $ref: "#/components/schemas/Variant" } } } }] } } },
        StockList: { type: "object", properties: { data: { type: "array", items: { type: "object", properties: { id: { type: "string" }, slug: { type: "string" }, name: { type: "string" }, stock: { type: "integer" }, in_stock: { type: "boolean" }, synced_at: { type: "string", format: "date-time" }, variants: { type: "array", items: { type: "object", properties: { id: { type: "string" }, sku: { type: "string", nullable: true }, name: { type: "string" }, stock: { type: "integer" }, in_stock: { type: "boolean" } } } } } } }, meta: { $ref: "#/components/schemas/Meta" } } },
        Photo: { type: "object", properties: { position: { type: "integer" }, url: { type: "string" }, thumbnail_url: { type: "string" } } },
        ProductPhotos: { type: "object", properties: { data: { type: "object", properties: { product: { type: "object", properties: { id: { type: "string" }, slug: { type: "string" }, name: { type: "string" }, url: { type: "string" } } }, photos: { type: "array", items: { $ref: "#/components/schemas/Photo" } }, variants: { type: "array", items: { type: "object", properties: { id: { type: "string" }, sku: { type: "string", nullable: true }, name: { type: "string" }, image: { allOf: [{ $ref: "#/components/schemas/Photo" }], nullable: true } } } } } } } },
        PhotoList: { type: "object", properties: { data: { type: "array", items: { type: "object", properties: { id: { type: "string" }, slug: { type: "string" }, name: { type: "string" }, url: { type: "string" }, photo_count: { type: "integer" }, photos: { type: "array", items: { $ref: "#/components/schemas/Photo" } } } } }, meta: { $ref: "#/components/schemas/Meta" } } },
        ReviewList: { type: "object", properties: { data: { type: "array", items: { type: "object", properties: { id: { type: "string" }, brand: { type: "string", nullable: true }, product: { type: "object", nullable: true, properties: { id: { type: "string" }, slug: { type: "string", nullable: true }, name: { type: "string", nullable: true }, url: { type: "string", nullable: true } } }, buyer: { type: "string", description: "Nama disamarkan" }, rating: { type: "integer" }, comment: { type: "string" }, images: { type: "array", items: { $ref: "#/components/schemas/Photo" } }, reply: { type: "string", nullable: true }, featured: { type: "boolean" }, source: { type: "string" }, created_at: { type: "string", format: "date-time", nullable: true } } } }, meta: { allOf: [{ $ref: "#/components/schemas/Meta" }, { type: "object", properties: { average_rating: { type: "number", nullable: true }, rating_counts: { type: "object", additionalProperties: { type: "integer" } } } }] } } },
        ShopList: { type: "object", properties: { data: { type: "array", items: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, brand: { type: "string" }, shopee_url: { type: "string", nullable: true }, product_count: { type: "integer" }, last_sync_at: { type: "string", format: "date-time", nullable: true } } } } } },
      },
    },
  };
  return new Response(JSON.stringify(spec), { headers: { "content-type": "application/json", "cache-control": "public, max-age=300" } });
}
