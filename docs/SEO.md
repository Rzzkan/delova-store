# Checklist SEO Delova

1. Pasang domain sendiri (mis. delova.id), set `NEXT_PUBLIC_SITE_URL=https://domain-kamu`.
2. Daftar di https://search.google.com/search-console → tambah properti → isi `NEXT_PUBLIC_GSC_VERIFICATION` → submit `https://domain-kamu/sitemap.xml`. Lakukan juga di Bing Webmaster Tools.
3. Pakai nama brand yang sama persis di Instagram/TikTok/Shopee bio dan beri link ke situs (backlink + sinyal brand).
4. Isi deskripsi produk di Shopee dengan kalimat lengkap (disinkronkan ke halaman produk).
5. Tambahkan Google Business Profile bila ada lokasi fisik, dan minta ulasan pembeli.
6. Cek Search Console mingguan: halaman terindeks, kueri, CTR.

## Pixel & Analytics
Atur di `/admin/pelacakan` (Meta Pixel, TikTok Pixel, GA4, verifikasi domain Meta). Pengaturan admin diutamakan; env `NEXT_PUBLIC_*_ID` jadi cadangan.
Uji: Meta Pixel Helper (Chrome), TikTok Pixel Helper, GA4 → Reports → Realtime.
