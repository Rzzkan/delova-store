# Delova Store

Toko online bergaya Delova (kebaya · batik · hijab · kids) dengan **sinkronisasi produk, harga, stok, dan varian dari Shopee**. Terinspirasi alur belanja situs seperti klamby.id: katalog rapi, keranjang, dan checkout cepat.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind 3 · libSQL (file SQLite lokal / Turso di produksi) · Shopee Open Platform API v2.

## Jalankan lokal (mode demo)

```bash
npm install
cp .env.example .env.local     # isi ADMIN_PASSWORD, SESSION_SECRET, NEXT_PUBLIC_WA_NUMBER
npm run dev                    # http://localhost:3000
```

Tanpa kredensial Shopee, situs otomatis memakai **16 produk contoh** (3 toko: Wardrobe, Kids, Scarf) supaya tampilan bisa langsung dicoba. Admin: `/admin`.

## Menyambung ke Shopee

Ikuti **[docs/SHOPEE_SETUP.md](docs/SHOPEE_SETUP.md)**. Ringkasnya:
1. Daftar app di Shopee Open Platform → dapat `Partner ID` + `Partner Key`.
2. Isi `.env.local`, buka `/admin` → **Hubungkan toko Shopee** (ulangi untuk tiap toko).
3. Produk tersinkron otomatis: saat otorisasi, tombol "Sinkron" di admin, `npm run sync`, Vercel Cron (6 jam sekali), dan webhook Live Push (per produk, hampir real-time).

## Cara kerja

| Bagian | Keterangan |
|---|---|
| `src/lib/shopee/client.ts` | Signing HMAC-SHA256, OAuth (`token/get`, auto-refresh token), retry, verifikasi webhook |
| `src/lib/shopee/sync.ts` | `get_item_list` → `get_item_base_info` + `get_item_extra_info` + `get_model_list`; upsert ke DB; hapus produk yang hilang di Shopee |
| Kurasi admin | Sembunyikan, tandai unggulan, override kategori — **tidak ditimpa** saat sinkron |
| Checkout | Keranjang → form → server hitung ulang harga & stok → pesan WhatsApp ke admin. Tiap produk juga punya tombol **Beli di Shopee** |
| 4 brand | **Wardrobe** (`/`), **Kids** (`/kids`), **Scarf** (`/scarf`), **Daily** (`/daily`): tiap brand punya logo, font, dan warna sendiri (`src/lib/brands.ts` + variabel warna di `src/app/globals.css`). Brand toko ditebak dari nama toko Shopee ("kids", "scarf", "daily") dan bisa diubah di `/admin`. Logo tiap brand (PNG) & link toko Shopee diatur di `/admin/tampilan`; filter brand ada di katalog (`/produk?brand=kids`). Wardrobe: taupe + pink dari logo; Kids: warna pelangi logo + plum; **Scarf & Daily: warna sementara** sampai logonya ada |
| Tampilan beranda | `/admin/tampilan`: ganti foto hero, foto tiap kategori, banner cerita, teks & tombol, bar pengumuman. Foto diunggah (otomatis dikecilkan ke WebP) dan disimpan di tabel `media` pada database — tanpa layanan storage tambahan |
| Ulasan unggulan | Ulasan bintang 4–5 diambil dari Shopee (`get_comment`) saat sinkron. `/admin/ulasan`: centang **Unggulan** untuk tampil di beranda, sembunyikan, atau tambah manual. Nama pembeli disamarkan (`b***i`) |
| Pixel | Meta & TikTok Pixel (isi ID di env): ViewContent, AddToCart, InitiateCheckout |
| SEO | Metadata, JSON-LD Product, `sitemap.xml`, `robots.txt` |

### Batasan penting
- **Shopee tidak menyediakan API untuk membuat pesanan dari situs eksternal.** Karena itu checkout di sini lewat WhatsApp (pesanan dicatat di tabel `leads`) atau lewat tombol Beli di Shopee. Stok di Shopee tidak otomatis berkurang saat order WhatsApp — admin perlu mengurangi stok manual di Seller Centre (atau lanjutkan dengan integrasi pesanan manual).
- Produk sinkron **satu arah** (Shopee → situs). Harga/stok diubah di Shopee.

## Deploy ke Vercel
1. Push repo ke GitHub, import di Vercel.
2. Buat database gratis di [Turso](https://turso.tech), isi `TURSO_DATABASE_URL` & `TURSO_AUTH_TOKEN`. (Tanpa Turso data hanya sementara.)
3. Isi semua variabel dari `.env.example` (set `NEXT_PUBLIC_SITE_URL` ke domain `https://…` dan `SHOPEE_REDIRECT_URL` ke `https://domain/api/shopee/callback`).
4. `vercel.json` sudah memuat Cron `/api/shopee/sync` tiap 6 jam (paket Hobby hanya mengizinkan 1×/hari — ubah jadwalnya jika perlu).

## Struktur
```
src/app          halaman (beranda, /produk, /produk/[slug], /keranjang, /checkout, /admin) + route API
src/components   Header, ProductCard, PurchasePanel, CartProvider, dll.
src/lib          db, produk, kategori, WhatsApp, Shopee (client/sync)
scripts/sync.ts  sinkron manual: npm run sync
```
