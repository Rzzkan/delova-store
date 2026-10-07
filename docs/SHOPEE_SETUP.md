# Panduan Integrasi Shopee Open Platform

## 1. Daftar & buat aplikasi
1. Daftar sebagai developer di https://open.shopee.com (pilih pasar **Indonesia**).
2. Buat **App** (tipe: Seller In-house System / ERP sesuai kebutuhan). Isi data bisnis dan ajukan; setelah *Go Live* kamu mendapat **Partner ID** dan **Partner Key**. Selama review, gunakan mode test: `SHOPEE_ENV=test` (sandbox, butuh toko test).
3. Di pengaturan app, daftarkan:
   - **Redirect URL**: `https://DOMAIN-KAMU/api/shopee/callback` (lokal: `http://localhost:3000/api/shopee/callback` untuk sandbox).
   - **Live Push URL** (opsional, untuk stok real-time): `https://DOMAIN-KAMU/api/shopee/webhook`, aktifkan push produk. Salin *Push Key* ke `SHOPEE_PUSH_KEY` bila berbeda dari Partner Key.
4. Pastikan app punya izin modul **Product** (`get_item_list`, `get_item_base_info`, `get_item_extra_info`, `get_model_list`) dan **Shop** (`get_shop_info`).

## 2. Isi environment
```
SHOPEE_PARTNER_ID=...
SHOPEE_PARTNER_KEY=...
SHOPEE_ENV=live
SHOPEE_REDIRECT_URL=https://DOMAIN-KAMU/api/shopee/callback   # harus identik dengan yang didaftarkan
```
Restart server. Banner "Mode demo" di admin akan hilang.

## 3. Hubungkan 3 toko
Login `/admin` → **+ Hubungkan toko Shopee** → login Seller Centre toko tersebut → setujui. Kamu kembali ke admin dan sinkron awal berjalan otomatis. **Ulangi untuk Delova Wardrobe, Delova Kids, dan Delova Scarf** (masing-masing otorisasi sendiri). Data contoh dihapus otomatis pada sinkron pertama.

> Otorisasi via *Main Account* belum didukung — pilih otorisasi per toko (shop).

## 4. Yang disinkronkan
Nama, deskripsi, foto, harga & harga coret, stok, varian (ukuran/warna) beserta stok per varian, jumlah terjual, rating. Kategori ditebak dari nama produk (mis. "kebaya" → Kebaya), bisa diubah di admin. Produk non-aktif/dihapus di Shopee ikut hilang dari situs.

## 5. Catatan teknis
- Access token berlaku ±4 jam & di-refresh otomatis; refresh token berlaku 30 hari dan diperbarui tiap refresh. Jika situs tidak pernah sinkron >30 hari, otorisasi ulang.
- Rate limit Shopee dihormati lewat retry bertahap (backoff).
- Webhook diverifikasi dengan HMAC-SHA256 atas `URL|body`. Jika verifikasi gagal terus, cek `SHOPEE_WEBHOOK_URL` (harus sama persis dengan URL di dashboard Shopee).
- Fitur ini diuji terhadap server Shopee tiruan yang memverifikasi signature; belum diuji pada akun Shopee sungguhan. Respons Live Push bisa berbeda per jenis event — periksa log bila ada yang tidak tersinkron.
