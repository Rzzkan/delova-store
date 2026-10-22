# Impor Excel Shopee (cadangan bila API belum terhubung)

Admin → **Impor Excel Shopee** (`/admin/impor`).

1. Seller Centre → pilih toko (Toko Saat Ini) → Produk Saya → Mass Update → tab Download.
2. Buat & unduh 3 template: **Informasi Dasar**, **Informasi Penjualan**, **Informasi Media** (filter sama).
3. Unggah ketiganya sekaligus, pilih brand, klik **Cek dulu**, lalu **Impor**.

Ulangi per toko (Wardrobe, Kids, Scarf, Daily) dengan brand yang sesuai. Impor ulang aman (idempoten).
Catatan: terjual, rating, dan ulasan tidak ada di file, jadi tidak diubah. Harga/stok adalah snapshot saat unduh.
