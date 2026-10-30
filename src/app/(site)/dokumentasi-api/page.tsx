import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Dokumentasi API — Delova Store" },
  description: "Dokumentasi API publik Delova Store v1: data produk dan stok terbaru, autentikasi kunci API, batas penggunaan, contoh kode.",
  alternates: { canonical: "/dokumentasi-api" },
  robots: { index: false, follow: true }, // dokumentasi untuk mitra; tidak perlu muncul di pencarian toko
};

const Code = ({ children }: { children: string }) => (
  <pre className="mt-3 overflow-x-auto rounded-xl border border-sand bg-white p-4 text-xs leading-relaxed"><code>{children}</code></pre>
);
const H2 = ({ id, children }: { id: string; children: string }) => <h2 id={id} className="mt-12 scroll-mt-24 text-2xl font-semibold">{children}</h2>;
const H3 = ({ children }: { children: React.ReactNode }) => <h3 className="mt-7 text-base font-semibold">{children}</h3>;
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-sm leading-relaxed text-ink/75">{children}</p>;
const C = ({ children }: { children: React.ReactNode }) => <code className="rounded bg-sand/60 px-1.5 py-0.5 text-[0.8em]">{children}</code>;

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-sand bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-cream text-xs uppercase tracking-wide text-ink/55"><tr>{head.map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-sand">{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="px-4 py-2.5 align-top text-ink/80">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

const TOC: [string, string][] = [["mulai", "Mulai cepat"], ["auth", "Autentikasi"], ["batas", "Batas penggunaan"], ["endpoint", "Endpoint"], ["data", "Konvensi data"], ["galat", "Kode galat"], ["contoh", "Contoh kode"], ["tips", "Rekomendasi integrasi"], ["aman", "Keamanan"]];

export default function ApiDocs() {
  const base = `${siteUrl()}/api/v1`;
  return (
    <Shell>
      <div className="container-x max-w-4xl py-12">
        <p className="eyebrow">Developer</p>
        <h1 className="mt-2 text-4xl font-semibold">Dokumentasi Delova Store API <span className="text-ink/40">v1</span></h1>
        <P>API <b>read-only</b> untuk mengambil data produk dan <b>stok terbaru</b> dari delova.id. Format JSON, hanya <C>GET</C>/<C>HEAD</C>. Untuk mendapatkan kunci API, hubungi admin Delova.</P>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-sand bg-white p-3"><dt className="text-xs text-ink/50">Base URL</dt><dd className="mt-0.5 break-all font-mono text-xs">{base}</dd></div>
          <div className="rounded-xl border border-sand bg-white p-3"><dt className="text-xs text-ink/50">Spesifikasi OpenAPI</dt><dd className="mt-0.5 break-all font-mono text-xs"><a className="text-brand underline" href="/api/v1/openapi.json">{base}/openapi.json</a></dd></div>
        </dl>
        <nav aria-label="Daftar isi" className="mt-6 flex flex-wrap gap-2 text-xs">
          {TOC.map(([id, l]) => <a key={id} href={`#${id}`} className="rounded-full border border-sand bg-white px-3 py-1.5 hover:border-brand hover:text-brand">{l}</a>)}
        </nav>

        <H2 id="mulai">Mulai cepat</H2>
        <Code>{`curl -H "X-API-Key: $DELOVA_KEY" "${base}/stock?in_stock=true&limit=5"`}</Code>

        <H2 id="auth">Autentikasi</H2>
        <P>Kirim kunci lewat salah satu header berikut. Kunci di query string (<C>?api_key=</C>) ditolak dengan status 400.</P>
        <Code>{`Authorization: Bearer <kunci>
X-API-Key: <kunci>`}</Code>
        <P>Setiap mitra mendapat kunci sendiri sehingga bisa dicabut tanpa memengaruhi yang lain. Simpan kunci di sisi server (env/secret manager); jangan taruh di JavaScript browser atau aplikasi mobile publik.</P>

        <H2 id="batas">Batas penggunaan</H2>
        <Table head={["Aturan", "Nilai"]} rows={[
          ["Rate limit", "60 permintaan per menit per kunci"],
          ["Penguncian IP", "10 menit setelah 10 kunci salah dari IP yang sama"],
          ["Item per halaman", "maks. 100 (/products), 200 (/stock)"],
          ["Nilai ids / skus", "maks. 100 per permintaan"],
        ]} />
        <P>Header respons: <C>X-RateLimit-Limit</C>, <C>X-RateLimit-Remaining</C>, <C>X-RateLimit-Reset</C>, <C>X-Request-Id</C>. Saat 429, tunggu sesuai header <C>Retry-After</C>.</P>

        <H2 id="endpoint">Endpoint</H2>
        <H3>GET /products — daftar produk</H3>
        <Table head={["Parameter", "Keterangan"]} rows={[
          [<C key="a">brand</C>, "wardrobe, kids, scarf, atau daily"],
          [<C key="b">category</C>, "slug kategori, mis. kebaya"],
          [<C key="c">shop_id</C>, "ID toko Shopee"],
          [<C key="d">q</C>, "cari di nama produk (maks. 80 karakter)"],
          [<C key="e">in_stock</C>, "true = stok > 0, false = stok habis"],
          [<C key="f">sort</C>, "terbaru (default), terlaris, termurah, termahal, nama"],
          [<><C>page</C> · <C>limit</C></>, "halaman mulai 1 · 1–100, default 24"],
        ]} />
        <Code>{`{
  "data": [{
    "id": "198876985-13199766027",
    "slug": "delova-wardrobe-long-vest-batik-...",
    "name": "Delova Wardrobe - LONG VEST BATIK ...",
    "brand": "wardrobe",
    "shop": { "id": 198876985, "name": "delovawardrobe" },
    "category": "outer",
    "price": 72000, "original_price": null, "discount_pct": null,
    "stock": 4, "in_stock": true, "sold": 120,
    "rating": 4.9, "review_count": 58,
    "image": "https://cf.shopee.co.id/file/...",
    "url": "${siteUrl()}/produk/delova-wardrobe-long-vest-...",
    "shopee_url": "https://shopee.co.id/...",
    "created_at": "2026-03-02T05:11:00.000Z",
    "synced_at": "2026-10-22T17:54:38.000Z",
    "variant_count": 5
  }],
  "meta": { "page": 1, "limit": 24, "total": 153, "total_pages": 7, "last_sync_at": "2026-10-22T17:54:38.000Z" }
}`}</Code>

        <H3>GET /products/{"{ref}"} — detail produk</H3>
        <P><C>ref</C> = slug atau id produk. Berisi semua field di atas ditambah <C>description</C>, <C>images[]</C>, dan <C>variants[]</C>:</P>
        <Code>{`{ "id": "…-147013855678", "sku": "07LVPRMNVY", "name": "Long Premium Navy / All Size",
  "price": 72000, "original_price": null, "stock": 0, "in_stock": false, "image": "https://…" }`}</Code>

        <H3>GET /stock — stok terbaru (ringan)</H3>
        <P>Untuk sinkronisasi berkala: hanya stok, tanpa harga atau deskripsi.</P>
        <Table head={["Parameter", "Keterangan"]} rows={[
          [<C key="a">ids</C>, "id atau slug produk, dipisah koma (maks. 100)"],
          [<C key="b">skus</C>, "SKU varian, dipisah koma (maks. 100)"],
          [<C key="c">brand, category, shop_id, q, in_stock</C>, "sama seperti /products"],
          [<><C>page</C> · <C>limit</C></>, "limit 1–200, default 100"],
        ]} />
        <Code>{`{
  "data": [{
    "id": "198876985-13199766027", "slug": "delova-wardrobe-long-vest-...", "name": "…",
    "stock": 4, "in_stock": true, "synced_at": "2026-10-22T17:54:38.000Z",
    "variants": [{ "id": "…", "sku": "07LVPRMNVY", "name": "Long Premium Navy / All Size", "stock": 0, "in_stock": false }]
  }],
  "meta": { "page": 1, "limit": 100, "total": 153, "total_pages": 2, "last_sync_at": "2026-10-22T17:54:38.000Z" }
}`}</Code>

        <H3>GET /shops — daftar toko</H3>
        <Code>{`{ "data": [{ "id": 198876985, "name": "delovawardrobe", "brand": "wardrobe",
  "shopee_url": "https://shopee.co.id/delovawardrobe", "product_count": 153, "last_sync_at": "2026-10-22T17:54:38.000Z" }] }`}</Code>

        <H2 id="data">Konvensi data</H2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink/75">
          <li>Harga: bilangan bulat dalam Rupiah. Waktu: ISO-8601 UTC.</li>
          <li><C>original_price</C> adalah harga coret; <C>null</C> bila tidak ada diskon.</li>
          <li>Hanya produk berstatus normal dan tidak disembunyikan yang ditampilkan. Tidak ada data pelanggan atau pesanan.</li>
          <li><b>Kesegaran stok:</b> stok disalin dari Shopee oleh sinkronisasi terjadwal, bukan realtime. Gunakan <C>synced_at</C> dan <C>meta.last_sync_at</C> untuk menilai usia data, dan anggap stok sebagai perkiraan.</li>
        </ul>

        <H2 id="galat">Kode galat</H2>
        <P>Bentuk: <C>{`{ "error": { "code", "message", "request_id" } }`}</C>. Sertakan <C>request_id</C> saat melapor.</P>
        <Table head={["Status", "code", "Arti"]} rows={[
          ["400", "invalid_param / key_in_query", "Parameter tidak valid / kunci dikirim lewat URL"],
          ["401", "unauthorized", "Kunci tidak ada atau salah"],
          ["404", "not_found", "Produk tidak ditemukan atau disembunyikan"],
          ["405", "method_not_allowed", "Hanya GET dan HEAD"],
          ["429", "rate_limited / locked", "Melebihi batas / IP dikunci sementara (lihat Retry-After)"],
          ["500", "internal_error", "Kesalahan server"],
          ["503", "api_disabled", "API belum diaktifkan di server"],
        ]} />

        <H2 id="contoh">Contoh kode</H2>
        <H3>curl</H3>
        <Code>{`# Stok produk Scarf yang tersedia
curl -H "Authorization: Bearer $DELOVA_KEY" "${base}/stock?brand=scarf&in_stock=true"

# Stok berdasarkan SKU
curl -H "X-API-Key: $DELOVA_KEY" "${base}/stock?skus=07LVPRMNVY,07LVPRBLK"

# Cari batik, termurah dulu
curl -H "X-API-Key: $DELOVA_KEY" "${base}/products?q=batik&sort=termurah&limit=10"`}</Code>
        <H3>Python</H3>
        <Code>{`import os, time, requests

BASE = "${base}"
H = {"X-API-Key": os.environ["DELOVA_KEY"]}

def semua_stok():
    page = 1
    while True:
        r = requests.get(f"{BASE}/stock", headers=H, params={"page": page, "limit": 200}, timeout=20)
        if r.status_code == 429:
            time.sleep(int(r.headers.get("Retry-After", "30"))); continue
        r.raise_for_status()
        j = r.json()
        yield from j["data"]
        if page >= j["meta"]["total_pages"]: break
        page += 1

for p in semua_stok():
    for v in p["variants"]:
        print(v["sku"], v["stock"])`}</Code>
        <H3>Node.js</H3>
        <Code>{`const res = await fetch("${base}/stock?in_stock=true&limit=200", {
  headers: { "X-API-Key": process.env.DELOVA_KEY },
});
if (!res.ok) throw new Error((await res.json()).error.message);
const { data, meta } = await res.json();
console.log(meta.total, "produk tersedia");`}</Code>

        <H2 id="tips">Rekomendasi integrasi</H2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink/75">
          <li>Sinkron stok: telusuri semua halaman <C>/stock?limit=200</C> tiap 15–30 menit.</li>
          <li>Cocokkan antar sistem dengan <C>sku</C> varian atau <C>id</C> produk; slug bisa berubah bila judul dioptimasi.</li>
          <li>Pakai <C>/stock</C> untuk memantau stok, dan <C>/products</C> hanya saat butuh harga atau deskripsi.</li>
        </ul>

        <H2 id="aman">Keamanan</H2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink/75">
          <li>Read-only; tidak ada endpoint tulis dan tidak ada kredensial atau data pelanggan.</li>
          <li>Kunci dibandingkan constant-time dan tidak pernah dicatat di log.</li>
          <li>Rate limit per kunci, penguncian IP, validasi parameter ketat, dan query terparameter.</li>
          <li>Hanya HTTPS; tanpa CORS (server-ke-server).</li>
        </ul>
        <p className="mt-10 text-xs text-ink/50">Versi API: v1.0.0. Perubahan yang tidak kompatibel akan dirilis sebagai /v2.</p>
      </div>
    </Shell>
  );
}
