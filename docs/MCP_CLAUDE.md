# Koneksi Claude (MCP)

Server MCP di `https://delova.id/api/mcp/<MCP_TOKEN>` (atau `/api/mcp` + header `Authorization: Bearer <MCP_TOKEN>`)
memungkinkan Claude mengelola blog, halaman koleksi, dan teks beranda lewat chat.

## Aktivasi di VPS
```bash
cd ~/delova
echo "MCP_TOKEN=$(openssl rand -hex 24)" >> .env
cp docker-compose.yml docker-compose.yml.bak
grep -q MCP_TOKEN docker-compose.yml || sed -i 's|^\(\s*\)SESSION_SECRET:.*|&\n\1MCP_TOKEN: ${MCP_TOKEN:-}|' docker-compose.yml
docker compose config -q && docker compose pull && docker compose up -d
```
Lalu buka `/admin/mcp` untuk menyalin URL konektor.

## Menyambungkan
- **claude.ai**: Settings → Connectors → Add custom connector → URL konektor (tanpa OAuth).
- **Claude Code**: `claude mcp add --transport http delova https://delova.id/api/mcp --header "Authorization: Bearer <token>"`

## Tool
| Tool | Fungsi |
|---|---|
| `blog_list`, `blog_get` | Daftar & baca artikel (Markdown) |
| `blog_create`, `blog_update` | Tulis (default draft) / ubah / terbitkan |
| `blog_delete` | Hapus (wajib `confirm: true`) |
| `koleksi_list/get/save/delete` | Halaman `/koleksi/<slug>` |
| `media_list` | Foto yang sudah diunggah di CMS |
| `web_content_get/update` | Bar pengumuman, hero & cerita beranda, judul ulasan, strip keunggulan per toko, link Shopee, toko offline |

## Batasan
- Token ada di URL: perlakukan sebagai password. Cabut dengan mengganti `MCP_TOKEN` lalu `docker compose up -d`.
- Tidak ada unggah gambar lewat chat (unggah di `/cms`, lalu pilih via `media_list`).
- Produk/harga/stok tetap dari Shopee; robots, tracking, favicon tidak bisa diubah lewat MCP.
- Teks hero hanya untuk Wardrobe (toko lain memakai teks bawaan kode).
