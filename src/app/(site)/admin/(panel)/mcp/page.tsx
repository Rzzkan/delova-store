import { McpConnect } from "@/components/McpConnect";
import { PageHeader, Card } from "@/components/AdminFrame";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Koneksi Claude (MCP)", robots: { index: false } };

const TOOLS: [string, string][] = [
  ["blog_list · blog_get", "Lihat daftar & baca isi artikel (dalam Markdown)"],
  ["blog_create · blog_update", "Tulis artikel baru (draft) atau ubah; terbitkan / turunkan ke draft"],
  ["blog_delete", "Hapus artikel (butuh konfirmasi)"],
  ["koleksi_list · koleksi_get · koleksi_save · koleksi_delete", "Kelola halaman koleksi /koleksi/<slug>"],
  ["media_list", "Pilih foto yang sudah ada sebagai foto utama"],
  ["web_content_get · web_content_update", "Bar pengumuman, hero & cerita beranda, judul ulasan, strip keunggulan per toko, link Shopee, info toko offline"],
];

export default function McpPage() {
  const token = process.env.MCP_TOKEN ?? "";
  const ready = token.length >= 24;
  const base = siteUrl();
  return (
    <>
      <PageHeader title="Koneksi Claude (MCP)" desc="Hubungkan Claude agar bisa menulis blog dan mengubah konten situs lewat chat." />
      {!ready ? (
        <Card title="MCP belum aktif">
          <p className="text-sm">Isi <code>MCP_TOKEN</code> di server (string acak minimal 24 karakter), lalu jalankan ulang aplikasi:</p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-cream p-3 text-xs">{`cd ~/delova
echo "MCP_TOKEN=$(openssl rand -hex 24)" >> .env
docker compose up -d`}</pre>
          <p className="mt-3 text-xs text-ink/60">Pastikan baris <code>MCP_TOKEN</code> juga ada pada layanan app di <code>docker-compose.yml</code> (lihat docs/MCP_CLAUDE.md).</p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card title="Sambungkan">
            <McpConnect url={`${base}/api/mcp/${token}`} bearerCmd={`claude mcp add --transport http delova ${base}/api/mcp --header "Authorization: Bearer ${token}"`} />
            <ol className="mt-6 list-decimal space-y-1.5 pl-5 text-sm text-ink/80">
              <li>Buka claude.ai → <b>Settings → Connectors → Add custom connector</b>.</li>
              <li>Nama: <b>Delova Store</b>, URL: tempel URL konektor di atas, lalu simpan (tanpa OAuth/Client ID).</li>
              <li>Di chat, aktifkan konektor <b>Delova Store</b>. Coba: <i>“Tulis draft panduan memilih pashmina untuk Delova Scarf”</i>.</li>
            </ol>
          </Card>
          <Card title="Yang bisa dilakukan Claude">
            <ul className="divide-y divide-sand text-sm">
              {TOOLS.map(([n, d]) => (<li key={n} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4"><code className="shrink-0 text-xs text-brand sm:w-72">{n}</code><span className="text-ink/75">{d}</span></li>))}
            </ul>
            <p className="mt-3 text-xs text-ink/60">Artikel baru selalu berstatus <b>draft</b> sampai kamu meminta Claude menerbitkannya. Harga, stok, dan produk tetap berasal dari Shopee, tidak diubah lewat konektor ini.</p>
          </Card>
          <Card title="Keamanan">
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink/75">
              <li>Untuk mencabut akses: ganti <code>MCP_TOKEN</code> di server lalu <code>docker compose up -d</code>; URL lama langsung mati.</li>
              <li>Setiap perubahan konten mengembalikan nilai sebelumnya, jadi Claude bisa membatalkannya bila diminta.</li>
              <li>Hapus artikel hanya jalan bila Claude mengirim konfirmasi eksplisit.</li>
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
