# Deploy ke Hostinger VPS (Docker Manager)

## Prasyarat
- VPS Hostinger dengan template **Ubuntu 24.04 with Docker** (Docker Manager aktif di hPanel).
- Domain yang A record-nya mengarah ke **IP VPS** (mis. `delova.id` dan `www`).
- Port 80 & 443 bebas (jangan pakai template Traefik/OpenLiteSpeed bersamaan dengan Caddy di compose ini).

## Langkah di hPanel
1. VPS → **Docker Manager** → **Compose** → **Compose from URL**.
2. Pastikan image sudah dibangun: GitHub → repo → tab **Actions** → workflow "Build & push Docker image" berstatus hijau.
   Lalu GitHub → profil → **Packages** → `delova-store` → Package settings → **Change visibility → Public** (sekali saja).
3. URL: `https://raw.githubusercontent.com/Rzzkan/delova-store/main/docker-compose.yml`
   (repo harus *public*; kalau private, pilih **Create from YAML**, tempel isi `docker-compose.yml`, dan ganti `build.context` dengan `https://<TOKEN>@github.com/Rzzkan/delova-store.git#main` memakai fine-grained token read-only).
4. Nama project: `delova-store`.
5. Di kolom **Environment**, isi:

```
DOMAIN=delova.id
WA_NUMBER=628xxxxxxxxxx
ADMIN_PASSWORD=<password-kuat>
SESSION_SECRET=<string-acak-panjang>
CRON_SECRET=<string-acak-lain>
# opsional
SHOPEE_PARTNER_ID=
SHOPEE_PARTNER_KEY=
META_PIXEL_ID=
TIKTOK_PIXEL_ID=
GA4_ID=
GSC_VERIFICATION=
```
   Buat string acak: `openssl rand -hex 32`.
6. **Deploy**. Menarik image ±1–2 menit. Lalu buka `https://delova.id` dan `/admin`.

## Data & backup
- Database + gambar unggahan ada di volume `delova_data` (SQLite). Backup:
  `docker run --rm -v delova-store_delova_data:/d -v $PWD:/b alpine tar czf /b/delova-data.tgz -C /d .`
- Alternatif: isi `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` agar data di cloud.

## Update versi
Push ke GitHub → tunggu Actions hijau → Docker Manager → project → **Redeploy/Pull** (menarik image terbaru). Volume data tetap aman.

## Shopee Open Platform
Redirect URL: `https://<DOMAIN>/api/shopee/callback`, Live Push: `https://<DOMAIN>/api/shopee/webhook`.
Setelah deploy: `/admin` → Hubungkan toko Shopee → Sinkron semua. Sinkron otomatis tiap 6 jam oleh service `cron`.

## Troubleshooting
- HTTPS gagal terbit → cek DNS sudah mengarah ke IP VPS dan port 80/443 terbuka.
- Login admin tidak bertahan → pastikan `DOMAIN` benar (cookie aman hanya di https).
- Lihat log: Docker Manager → project → container → Logs.
