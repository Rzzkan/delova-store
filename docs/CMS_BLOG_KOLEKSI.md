# CMS Blog, Panduan & Halaman Koleksi (Payload)

CMS ini dipakai untuk **artikel blog/panduan** dan **halaman koleksi** (URL bersih untuk SEO). Panel toko lama tetap di `/admin`; CMS ada di **`/cms`**.

## Login ## Login tema
Pilihan terang/gelap dipakai bersama oleh `/admin` dan `/cms` (cookie `payload-theme`); tombol ganti tema ada di header panel toko dan di menu atas sidebar CMS.

CMS **tidak punya password sendiri**. Masuk ke `/admin` dengan `ADMIN_PASSWORD`, lalu buka menu **CMS Blog & Koleksi** (atau langsung `/cms`) — sesi yang sama dipakai. Membuka `/cms` saat belum login akan diarahkan ke halaman masuk `/admin`, lalu kembali ke CMS. Tombol *Keluar* di CMS sama dengan keluar dari panel toko.

## Pertama kali (VPS)
1. Tidak perlu env tambahan. (Opsional: `PAYLOAD_SECRET=` string acak panjang; bila kosong memakai `SESSION_SECRET`.)
2. `cd ~/delova && docker compose pull && docker compose up -d`
3. Tabel CMS dan satu akun bersama dibuat otomatis saat server start (migrasi di `src/migrations`). Tidak ada layar "daftar pengguna pertama" yang bisa dipakai orang lain. Data ada di volume `delova_data` (`cms.db`, foto di `cms-media/`).

## Isi menu CMS
- **Halaman Koleksi** → tampil di `/koleksi/<slug>`. Pilih toko, kategori, dan/atau kata kunci nama produk; produk diambil otomatis dari Shopee-sync. Isi judul (H1), ringkasan, teks pengantar, teks SEO di bawah produk, FAQ, dan judul/deskripsi Google.
  - Contoh: judul "Hijab Pashmina Viscose", toko Delova Scarf, kategori Hijab, kata kunci `pashmina`, slug `pashmina`.
  - Kategori bawaan (`/koleksi/kebaya`, `/koleksi/hijab`, dst.) sudah punya halaman otomatis; buat halaman koleksi dengan slug yang sama untuk menimpa teksnya.
- **Blog & Panduan** → `/blog/<slug>`. Jenis Blog/Panduan, untuk toko tertentu atau semua, foto utama, isi, FAQ, produk terkait (kategori/kata kunci), judul/deskripsi Google. Simpan sebagai *Draft* agar belum tampil; *Publish* untuk menayangkan.
- **Foto** → unggahan gambar (otomatis dibuat ukuran 800 & 1600 px). Isi teks alternatif.

## Otomatis untuk SEO
- Canonical, Open Graph, JSON-LD (BreadcrumbList, CollectionPage/ItemList, Article, FAQPage).
- Masuk `sitemap.xml` otomatis (koleksi, blog, tiap artikel).
- `robots.txt` menutup `/cms/` dan `/cms-api/` tapi tetap membuka `/cms-api/media/file/` agar foto bisa diindeks.
- `/produk?kategori=x` kini ber-canonical ke `/koleksi/x`.
- Beranda tiap toko menampilkan 3 artikel terbaru; footer memuat tautan Koleksi & Blog.

## Mengubah struktur koleksi (untuk developer)
Bila menambah/mengubah field di `src/collections/*`, buat migrasi baru agar produksi ikut berubah:
`npx payload migrate:create nama_perubahan` lalu commit folder `src/migrations`. (Pada Node 22.22 CLI ini error `Illegal constructor` dari undici; jalankan di Node versi lain, atau panggil `payload.db.createMigration(...)` lewat route sementara saat `next dev`.)
Setelah menambah komponen custom di admin Payload, jalankan ulang pembuatan import map (`payload generate:importmap`; `src/app/(payload)/cms/importMap.js`).

## Versi
Payload 3.91.0 (semua paket `@payloadcms/*` harus versi sama) dan Next.js 15.4.11 — rentang yang didukung Payload; jangan naikkan Next ke 15.5 sebelum Payload mendukungnya.
