import { Shell } from "@/components/Shell";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isMock } from "@/lib/shopee/config";
import { listProducts, listShops } from "@/lib/products";
import { timeAgo } from "@/lib/format";
import { ProductRow, ShopBrandSelect, SyncButton } from "@/components/AdminControls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function Admin({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; hal?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.hal) || 1);
  const db = await getDb();
  const [shops, { items, total }, logs, leads] = await Promise.all([
    listShops(),
    listProducts({ includeHidden: true, limit: 50, page, sort: "terbaru" }),
    db.execute("SELECT l.*, s.name AS shop_name FROM sync_logs l LEFT JOIN shops s ON s.shop_id = l.shop_id ORDER BY l.id DESC LIMIT 8"),
    db.execute("SELECT id, created_at, name, total, token FROM leads ORDER BY id DESC LIMIT 10"),
  ]);
  const mock = isMock();

  return (
    <Shell>
    <div className="container-x space-y-10 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold">Admin</h1>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/tampilan" className="btn-primary !py-2">Tampilan Beranda</a>
          <a href="/admin/ulasan" className="btn-primary !py-2">Ulasan Unggulan</a>
          <a href="/admin/pelacakan" className="btn-primary !py-2">Pixel & Analytics</a>
          <form action="/api/admin/logout" method="post"><button className="btn-outline !py-2">Keluar</button></form>
        </div>
      </div>

      {sp.ok && <p className="rounded-xl bg-sage/20 p-3 text-sm">{sp.ok}</p>}
      {sp.err && <p role="alert" className="rounded-xl bg-blush p-3 text-sm text-brand">{sp.err}</p>}
      {mock && (
        <p className="rounded-xl border border-accent bg-accent/10 p-4 text-sm">
          <strong>Mode demo.</strong> Produk di bawah adalah data contoh. Isi <code>SHOPEE_PARTNER_ID</code> & <code>SHOPEE_PARTNER_KEY</code> di <code>.env.local</code>, lalu hubungkan toko Shopee — lihat <code>docs/SHOPEE_SETUP.md</code>.
        </p>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Toko Shopee</h2>
          <div className="flex items-start gap-3">
            <a href="/api/shopee/auth" className="btn-outline !px-4 !py-2">+ Hubungkan toko Shopee</a>
            <SyncButton label="Sinkron semua" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {shops.map((s) => (
            <div key={s.shopId} className="rounded-2xl border border-sand bg-white p-5">
              <p className="font-display text-xl">{s.name}</p>
              <p className="text-xs text-ink/50">ID {s.shopId} · {s.isMock ? "data contoh" : s.authorized ? "terhubung" : "belum diotorisasi"}</p>
              <ShopBrandSelect shopId={s.shopId} brand={s.brand} />
              <p className="mt-2 text-sm">Sinkron terakhir: {timeAgo(s.lastSyncAt)}</p>
              {!s.isMock && s.authorized && <div className="mt-3"><SyncButton shopId={s.shopId} label="Sinkron toko ini" /></div>}
            </div>
          ))}
        </div>
        
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Pesanan WhatsApp Terbaru</h2>
        {leads.rows.length ? (
          <ul className="divide-y divide-sand rounded-2xl border border-sand bg-white text-sm">
            {leads.rows.map((l) => (
              <li key={String(l.id)} className="flex items-center justify-between gap-3 p-3">
                <span>#{String(l.id)} · {String(l.name)} · Rp{Number(l.total).toLocaleString("id-ID")} <span className="text-ink/40">· {timeAgo(Number(l.created_at))}</span></span>
                {l.token ? <a className="text-brand underline" href={`/pesanan/${String(l.token)}`}>Lihat foto & detail</a> : null}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-ink/50">Belum ada pesanan.</p>}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Riwayat Sinkron</h2>
        {logs.rows.length ? (
          <table className="w-full text-left text-sm"><thead className="text-xs uppercase tracking-wider text-ink/50"><tr><th className="py-2">Waktu</th><th>Toko</th><th>Status</th><th>Diperbarui</th><th>Dihapus</th><th>Pesan</th></tr></thead>
            <tbody>{logs.rows.map((l) => (
              <tr key={String(l.id)} className="border-t border-sand"><td className="py-2">{timeAgo(Number(l.finished_at))}</td><td>{String(l.shop_name ?? l.shop_id)}</td>
                <td className={l.status === "ok" ? "text-sage" : "text-brand"}>{String(l.status)}</td><td>{Number(l.upserted)}</td><td>{Number(l.removed)}</td><td className="max-w-xs truncate">{String(l.message ?? "")}</td></tr>
            ))}</tbody></table>
        ) : <p className="text-sm text-ink/50">Belum ada sinkron.</p>}
      </section>

      <section>
        <h2 className="mb-1 text-2xl font-semibold">Produk ({total})</h2>
        <p className="mb-4 text-xs text-ink/50">Harga & stok hanya bisa diubah di Shopee. Di sini kamu mengatur tampilan: kategori, unggulan, sembunyikan.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left"><thead className="text-xs uppercase tracking-wider text-ink/50"><tr><th className="py-2">Produk</th><th>Harga</th><th>Stok</th><th>Kategori</th><th>Unggulan</th><th>Sembunyi</th></tr></thead>
            <tbody>{items.map((p) => (<ProductRow key={p.id} p={{ id: p.id, name: p.name, shop: p.shopName ?? "", price: p.price, stock: p.stock, category: p.category, hidden: p.hidden, featured: p.featured }} />))}</tbody></table>
        </div>
        {total > 50 && (
          <div className="mt-4 flex gap-2 text-sm">
            {page > 1 && <a className="chip" href={`/admin?hal=${page - 1}`}>← Sebelumnya</a>}
            {page * 50 < total && <a className="chip" href={`/admin?hal=${page + 1}`}>Berikutnya →</a>}
          </div>
        )}
      </section>
    </div>
    </Shell>
  );
}
