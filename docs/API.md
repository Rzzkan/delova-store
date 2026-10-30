# Delova Store API v1

API **read-only** untuk mengambil data produk dan **stok terbaru** dari delova.id.
Base URL: `https://delova.id/api/v1` · Spesifikasi OpenAPI: `https://delova.id/api/v1/openapi.json` (publik, tanpa kunci).

## 1. Mengaktifkan di VPS
Buat satu kunci per pemakai (mis. gudang, marketplace lain, aplikasi internal):
```bash
cd ~/delova
echo "API_KEYS=gudang=$(openssl rand -hex 24),aplikasi=$(openssl rand -hex 24)" >> .env
cp docker-compose.yml docker-compose.yml.bak
grep -q API_KEYS docker-compose.yml || sed -i 's|^\(\s*\)SESSION_SECRET:.*|&\n\1API_KEYS: ${API_KEYS:-}\n\1API_RATE_LIMIT: ${API_RATE_LIMIT:-60}|' docker-compose.yml
docker compose config -q && docker compose pull && docker compose up -d
```
Format `API_KEYS`: `nama=kunci,nama2=kunci2` (kunci minimal 32 karakter; nama hanya huruf/angka/`.-_`).
Mencabut akses: hapus pasangan itu dari `API_KEYS`, lalu `docker compose up -d`. Menambah pemakai: tambahkan pasangan baru.
Tanpa `API_KEYS` semua endpoint membalas `503 api_disabled`.

## 2. Autentikasi
Kirim kunci lewat header (pilih salah satu):
```
Authorization: Bearer <kunci>
X-API-Key: <kunci>
```
Kunci di query string (`?api_key=`) **ditolak** (400) agar tidak bocor di log/riwayat browser.

## 3. Endpoint
| Method | Path | Fungsi |
|---|---|---|
| GET | `/products` | Daftar produk (filter, urut, paginasi) |
| GET | `/products/{slug-atau-id}` | Detail produk lengkap + varian (SKU, harga, stok) |
| GET | `/stock` | Stok ringan per produk & varian (untuk sinkronisasi berkala) |
| GET | `/shops` | Daftar toko, jumlah produk, waktu sinkron terakhir |

### Filter bersama (`/products`, `/stock`)
`brand` (wardrobe\|kids\|scarf\|daily) · `category` (slug, mis. `kebaya`) · `shop_id` · `q` (cari nama) · `in_stock` (true/false)

### `/products`
`sort`: `terbaru` (default) \| `terlaris` \| `termurah` \| `termahal` \| `nama` · `page` (≥1) · `limit` (1–100, default 24)

### `/stock`
`ids` = id/slug produk dipisah koma (maks 100) · `skus` = SKU varian dipisah koma (maks 100) · `page` · `limit` (1–200, default 100)

## 4. Contoh
```bash
# Stok semua produk yang masih tersedia, brand Scarf
curl -H "Authorization: Bearer $DELOVA_KEY" "https://delova.id/api/v1/stock?brand=scarf&in_stock=true"

# Stok berdasarkan SKU
curl -H "X-API-Key: $DELOVA_KEY" "https://delova.id/api/v1/stock?skus=07LVPRMNVY,07LVPRBLK"

# Detail produk
curl -H "X-API-Key: $DELOVA_KEY" "https://delova.id/api/v1/products/<slug>"
```
Python:
```python
import requests
r = requests.get("https://delova.id/api/v1/stock", headers={"X-API-Key": KEY}, params={"limit": 200}, timeout=20)
r.raise_for_status()
for p in r.json()["data"]:
    print(p["slug"], p["stock"], [(v["sku"], v["stock"]) for v in p["variants"]])
```
Node: `const r = await fetch(url, { headers: { "X-API-Key": KEY } }); const { data, meta } = await r.json();`

## 5. Bentuk respons
```jsonc
// GET /stock
{ "data": [ { "id": "198876985-13199766027", "slug": "…", "name": "…", "stock": 4, "in_stock": true,
              "synced_at": "2026-10-22T17:54:38.000Z",
              "variants": [ { "id": "…", "sku": "07LVPRMNVY", "name": "Long Premium Navy / All Size", "stock": 0, "in_stock": false } ] } ],
  "meta": { "page": 1, "limit": 100, "total": 153, "total_pages": 2, "last_sync_at": "2026-10-22T17:54:38.000Z" } }
```
`/products` menambah: `brand`, `shop{id,name}`, `category`, `price`, `original_price`, `discount_pct`, `sold`, `rating`, `review_count`, `image`, `url`, `shopee_url`, `created_at`, `variant_count`. Detail produk menambah `description`, `images[]`, `variants[]` (dengan harga & gambar). Harga dalam Rupiah (bilangan bulat), waktu ISO-8601 UTC.

### Kesegaran data
Stok disalin dari Shopee oleh sinkronisasi terjadwal (bukan realtime). Gunakan `synced_at` (per produk) / `meta.last_sync_at` untuk menilai usia data. Anggap stok sebagai perkiraan; Shopee tetap sumber kebenaran saat pesanan masuk.

## 6. Galat
Semua galat berbentuk `{ "error": { "code", "message", "request_id" } }` (sertakan `request_id` saat melapor).
| Status | code | Arti |
|---|---|---|
| 400 | `invalid_param` / `key_in_query` | Parameter salah / kunci di URL |
| 401 | `unauthorized` | Kunci tidak ada/salah |
| 404 | `not_found` | Produk tidak ada atau disembunyikan |
| 405 | `method_not_allowed` | Hanya GET/HEAD |
| 429 | `rate_limited` / `locked` | Kena batas laju / IP dikunci sementara (lihat `Retry-After`) |
| 503 | `api_disabled` | `API_KEYS` belum diisi |

## 7. Keamanan
- **Read-only**; hanya GET/HEAD. Tidak ada endpoint tulis, tidak ada data pelanggan, pesanan, token Shopee, atau produk yang disembunyikan di admin.
- **Kunci per pemakai**, dibandingkan *constant-time* (hash SHA-256), tidak pernah dicatat di log (log hanya memuat nama kunci, path, status).
- **Rate limit** 60 permintaan/menit/kunci (ubah lewat `API_RATE_LIMIT`, min. 10); header `X-RateLimit-*` di tiap respons.
- **Penguncian IP** 10 menit setelah 10 kunci salah dari IP yang sama.
- Hanya lewat **HTTPS** (Caddy). Tanpa CORS: dirancang untuk server-ke-server; jangan menaruh kunci di JavaScript browser/aplikasi mobile publik.
- Parameter divalidasi ketat (rentang angka, enum), query SQL memakai parameter terikat; `Cache-Control: private, no-store`.
- Catatan: pembatas laju berada di memori satu proses (reset saat restart). Cukup untuk satu container; jika ditambah replika, pindahkan ke Caddy/Redis.
- Praktik baik: simpan kunci di secret manager/env pemakai, rotasi berkala, dan pakai satu kunci per sistem agar mudah dicabut.
